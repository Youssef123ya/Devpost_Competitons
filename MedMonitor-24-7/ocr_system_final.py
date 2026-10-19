#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Final OCR System with EasyOCR
Optimized for medical monitor colored text on dark background
"""

import cv2
import numpy as np
import easyocr
from pathlib import Path
import json
from datetime import datetime
import threading
import time

# Initialize EasyOCR reader (English only for speed)
reader = easyocr.Reader(['en'], gpu=False)

# ROI Coordinates
ROI_MAP = {
    'HR': (1340, 100, 1660, 280),
    'SpO2': (1340, 285, 1660, 470),
    'etCO2': (1340, 470, 1535, 610),
    'Pulse': (980, 640, 1085, 710),
    'RR': (1340, 640, 1580, 820),
    'Temp': (1620, 650, 1870, 830),
}

class MedicalOCRSystem:
    def __init__(self):
        self.latest_results = {
            'HR': None,
            'SpO2': None,
            'etCO2': None,
            'Pulse': None,
            'RR': None,
            'Temp': None,
        }
        self.confidence = {vital: 0.0 for vital in self.latest_results}
        self.timestamp = None
        self.results_lock = threading.Lock()

    def preprocess_frame(self, frame):
        """Enhanced frame preprocessing"""
        if frame is None:
            return frame

        try:
            # Step 1: Unsharp mask (5x5 kernel, strength 1.5)
            gaussian_kernel = cv2.getGaussianKernel(5, 1.0)
            gaussian_kernel = gaussian_kernel @ gaussian_kernel.T
            blurred = cv2.filter2D(frame, -1, gaussian_kernel)
            sharpened = cv2.addWeighted(frame, 2.5, blurred, -1.5, 0)

            # Step 2: CLAHE contrast (clipLimit=3.0, tileGridSize=8x8)
            lab = cv2.cvtColor(sharpened, cv2.COLOR_BGR2LAB)
            l, a, b = cv2.split(lab)
            clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
            l_enhanced = clahe.apply(l)
            lab_enhanced = cv2.merge([l_enhanced, a, b])
            frame_contrast = cv2.cvtColor(lab_enhanced, cv2.COLOR_LAB2BGR)

            # Step 3: Saturation boost by 30% (HSV S channel)
            hsv = cv2.cvtColor(frame_contrast, cv2.COLOR_BGR2HSV).astype(np.float32)
            h, s, v = cv2.split(hsv)
            s = np.clip(s * 1.3, 0, 255)
            hsv = cv2.merge([h, s, v])
            frame_saturated = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)

            # Step 4: Gamma correction (gamma=0.85)
            gamma = 0.85
            inv_gamma = 1.0 / gamma
            lut = np.array([((i / 255.0) ** inv_gamma) * 255 for i in np.arange(0, 256)]).astype(np.uint8)
            frame_gamma = cv2.LUT(frame_saturated, lut)

            return np.clip(frame_gamma, 0, 255).astype(np.uint8)
        except:
            return frame

    def preprocess_roi(self, roi, vital_name):
        """Color-specific ROI preprocessing"""
        if roi is None or roi.size == 0:
            return None

        try:
            hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
            h, s, v = cv2.split(hsv)

            # Color-specific masking with relaxed thresholds
            if vital_name == 'HR':
                # Green: H=30-90, S=50-255, V=50-255
                mask = cv2.inRange(hsv, np.array([30, 50, 50]), np.array([90, 255, 255]))
            elif vital_name == 'etCO2':
                # Cyan: H=80-110, S=50-255
                mask = cv2.inRange(hsv, np.array([80, 50, 50]), np.array([110, 255, 255]))
            elif vital_name in ['SpO2', 'Pulse']:
                # White/Cyan: V>100 (bright colors)
                mask = cv2.inRange(v, 100, 255)
            elif vital_name in ['RR', 'Temp']:
                # White/Bright: V>100
                mask = cv2.inRange(v, 100, 255)
            else:
                # Fallback: Any non-black pixel
                gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
                _, mask = cv2.threshold(gray, 30, 255, cv2.THRESH_BINARY)

            # Invert: white on black -> black on white
            inverted = cv2.bitwise_not(mask)

            # Upscale 3x with cubic interpolation (was 4x, now 3x)
            upscaled = cv2.resize(inverted, None, fx=3, fy=3, interpolation=cv2.INTER_CUBIC)

            # Morphological closing (2x2 kernel)
            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
            processed = cv2.morphologyEx(upscaled, cv2.MORPH_CLOSE, kernel)

            # Additional dilation to strengthen characters
            kernel_dilate = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 1))
            processed = cv2.dilate(processed, kernel_dilate, iterations=1)

            return processed
        except:
            return None

    def normalize_vital_text(self, text, vital_name):
        if not text:
            return None

        text = text.replace('O', '0').replace('o', '0')
        text = text.replace('l', '1').replace('I', '1').replace('i', '1')
        text = text.replace(' ', '').replace(',', '.')

        cleaned = ''.join(c for c in text if c.isdigit() or c == '.')
        if not cleaned:
            return None

        if cleaned.count('.') > 1:
            parts = cleaned.split('.')
            cleaned = parts[0] + '.' + ''.join(parts[1:])

        if vital_name in ['HR', 'SpO2', 'etCO2', 'Pulse', 'RR']:
            cleaned = cleaned.split('.')[0]
        elif vital_name == 'Temp':
            if '.' in cleaned:
                cleaned = cleaned[: cleaned.find('.') + 2]

        return cleaned

    def extract_digits_from_image(self, image, vital_name=None):
        """Extract digits from image using EasyOCR"""
        if image is None:
            return None, 0.0

        try:
            results = reader.readtext(image, detail=1)
            if not results:
                return None, 0.0

            best_value = None
            best_conf = 0.0

            for _, text, conf in results:
                normalized = self.normalize_vital_text(text, vital_name) if vital_name else ''.join(c for c in text if c.isdigit() or c == '.')
                if not normalized:
                    continue
                if float(conf) > best_conf:
                    best_value = normalized
                    best_conf = float(conf)

            return best_value, best_conf
        except:
            return None, 0.0

    def process_frame(self, frame):
        """Process frame and extract all vitals"""
        if frame is None:
            return None

        # Step 1: Preprocess entire frame
        preprocessed_frame = self.preprocess_frame(frame)

        # Step 2: Extract ROIs and process each
        results = {}
        confidence = {}

        for vital_name, (x1, y1, x2, y2) in ROI_MAP.items():
            # Extract ROI from preprocessed frame
            roi = preprocessed_frame[y1:y2, x1:x2].copy()

            # Try raw ROI first, then fallback to color-specific masking
            value, conf = self.extract_digits_from_image(roi, vital_name=vital_name)
            if value is None:
                processed_roi = self.preprocess_roi(roi, vital_name)
                if processed_roi is not None:
                    value, conf = self.extract_digits_from_image(processed_roi, vital_name=vital_name)

            results[vital_name] = value
            confidence[vital_name] = conf

        # Update latest results
        with self.results_lock:
            self.latest_results = results
            self.confidence = confidence
            self.timestamp = datetime.now().isoformat()

        return {
            'timestamp': self.timestamp,
            'vitals': results,
            'confidence': confidence
        }

    def get_latest_results(self):
        """Get latest extraction results"""
        with self.results_lock:
            return {
                'timestamp': self.timestamp,
                'vitals': self.latest_results.copy(),
                'confidence': self.confidence.copy()
            }

    def save_results(self):
        """Save results to JSON file"""
        results = self.get_latest_results()
        output_file = Path('vital_signs_latest.json')

        try:
            with open(output_file, 'w') as f:
                json.dump(results, f, indent=2)
            return True
        except:
            return False


# Global system instance
ocr_system = MedicalOCRSystem()


def test_with_sample_image():
    """Test system with sample images"""
    print("\n" + "="*70)
    print("[*] Testing Medical OCR System with Sample Images")
    print("="*70)

    # Create test image
    img = np.zeros((1080, 1920, 3), dtype=np.uint8)
    font = cv2.FONT_HERSHEY_SIMPLEX
    font_scale = 3
    thickness = 3

    test_data = {
        'HR': ((1520, 140), (0, 255, 0), '126'),      # Green
        'SpO2': ((1520, 310), (255, 255, 255), '100'), # White
        'etCO2': ((1520, 480), (255, 255, 0), '56'),   # Cyan
        'Pulse': ((1520, 650), (255, 255, 255), '126'),# White
        'RR': ((1520, 820), (255, 255, 255), '16'),    # White
        'Temp': ((1520, 990), (255, 255, 0), '36.5'),  # Cyan
    }

    for vital, (pos, color, text) in test_data.items():
        cv2.putText(img, text, pos, font, font_scale, color, thickness)

    cv2.imwrite('sample_monitor.jpg', img)

    # Process image
    print("[*] Processing sample image...")
    results = ocr_system.process_frame(img)

    # Display results
    print("\n[*] OCR Results:")
    print("="*70)
    for vital, value in results['vitals'].items():
        conf = results['confidence'].get(vital, 0.0)
        status = "[+]" if value else "[-]"
        print("{} {}: {} (Confidence: {:.2f})".format(status, vital.ljust(8),
                                                      str(value).ljust(10), conf))

    # Save results
    ocr_system.save_results()
    print("\n[+] Results saved to: vital_signs_latest.json")

    print("\n" + "="*70)


if __name__ == "__main__":
    test_with_sample_image()
