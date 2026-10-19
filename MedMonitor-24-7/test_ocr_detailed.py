#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
OCR System Comprehensive Test - No camera required
Tests each part of image processing and OCR
"""

import cv2
import numpy as np
import pytesseract
from pathlib import Path
import json
from datetime import datetime
import sys

# ROI Coordinates from camera_ocr_complete.py
ROI_MAP = {
    'HR': (1340, 100, 1660, 280),
    'SpO2': (1340, 285, 1660, 470),
    'etCO2': (1340, 470, 1535, 610),
    'Pulse': (980, 640, 1085, 710),
    'RR': (1340, 640, 1580, 820),
    'Temp': (1620, 650, 1870, 830),
}

class OCRTester:
    def __init__(self):
        self.results = {}
        self.test_image = None

    def create_test_image(self):
        """Create test image simulating medical monitor screen"""
        print("\n" + "="*70)
        print("[*] Creating test image")
        print("="*70)

        # Create black 1920x1080 image
        img = np.zeros((1080, 1920, 3), dtype=np.uint8)

        # Add colored text simulating medical monitor screen
        font = cv2.FONT_HERSHEY_SIMPLEX
        font_scale = 3
        thickness = 3

        text_positions = {
            'HR': (1520, 140),      # Green text
            'SpO2': (1520, 310),    # White text
            'etCO2': (1520, 480),   # Cyan text
            'Pulse': (1520, 650),   # White text
            'RR': (1520, 820),      # White text
            'Temp': (1520, 990),    # Cyan text
        }

        # Colors (BGR format)
        colors = {
            'HR': (0, 255, 0),      # Green
            'SpO2': (255, 255, 255),# White
            'etCO2': (255, 255, 0), # Cyan
            'Pulse': (255, 255, 255),# White
            'RR': (255, 255, 255),  # White
            'Temp': (255, 255, 0),  # Cyan
        }

        test_values = {
            'HR': '126',
            'SpO2': '100',
            'etCO2': '56',
            'Pulse': '126',
            'RR': '16',
            'Temp': '36.5',
        }

        for vital, (x, y) in text_positions.items():
            color = colors.get(vital, (255, 255, 255))
            text = test_values.get(vital, '0')
            cv2.putText(img, text, (x, y), font, font_scale, color, thickness)

        self.test_image = img
        print("[+] Test image created")
        print("    Size: " + str(img.shape))
        cv2.imwrite("test_monitor.jpg", img)
        print("    Saved: test_monitor.jpg")

        return img

    def test_frame_preprocessing(self):
        """Test frame preprocessing"""
        print("\n" + "="*70)
        print("[*] Testing Frame Preprocessing")
        print("="*70)

        if self.test_image is None:
            print("[-] No test image")
            return None

        frame = self.test_image.copy()

        try:
            # Step 1: Unsharp mask
            gaussian_kernel = cv2.getGaussianKernel(5, 1.0)
            gaussian_kernel = gaussian_kernel @ gaussian_kernel.T
            blurred = cv2.filter2D(frame, -1, gaussian_kernel)
            sharpened = cv2.addWeighted(frame, 2.5, blurred, -1.5, 0)
            print("[+] Step 1: Unsharp mask applied")

            # Step 2: CLAHE
            lab = cv2.cvtColor(sharpened, cv2.COLOR_BGR2LAB)
            l, a, b = cv2.split(lab)
            clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
            l_enhanced = clahe.apply(l)
            lab_enhanced = cv2.merge([l_enhanced, a, b])
            frame_contrast = cv2.cvtColor(lab_enhanced, cv2.COLOR_LAB2BGR)
            print("[+] Step 2: CLAHE contrast applied")

            # Step 3: Saturation boost
            hsv = cv2.cvtColor(frame_contrast, cv2.COLOR_BGR2HSV).astype(np.float32)
            h, s, v = cv2.split(hsv)
            s = np.clip(s * 1.3, 0, 255)
            hsv = cv2.merge([h, s, v])
            frame_saturated = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)
            print("[+] Step 3: Saturation boost applied (+30%)")

            # Step 4: Gamma correction
            gamma = 0.85
            inv_gamma = 1.0 / gamma
            lut = np.array([((i / 255.0) ** inv_gamma) * 255 for i in np.arange(0, 256)]).astype(np.uint8)
            frame_gamma = cv2.LUT(frame_saturated, lut)
            print("[+] Step 4: Gamma correction applied (gamma=0.85)")

            frame_final = np.clip(frame_gamma, 0, 255).astype(np.uint8)

            cv2.imwrite("test_preprocessed.jpg", frame_final)
            print("    Saved: test_preprocessed.jpg")

            return frame_final
        except Exception as e:
            print(f"[-] Error in preprocessing: {e}")
            return None

    def test_roi_extraction(self, frame):
        """Test ROI extraction"""
        print("\n" + "="*70)
        print("[*] Testing ROI Extraction")
        print("="*70)

        if frame is None:
            print("[-] No image")
            return None

        rois = {}
        for vital_name, (x1, y1, x2, y2) in ROI_MAP.items():
            roi = frame[y1:y2, x1:x2].copy()
            rois[vital_name] = roi
            print("[+] {}: {} extracted".format(vital_name, roi.shape))
            cv2.imwrite("roi_{}.jpg".format(vital_name), roi)

        return rois

    def test_color_masking(self, roi, vital_name):
        """Test applying color mask for each vital"""
        print("\n    [*] Color masking for {}:".format(vital_name))

        try:
            hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
            h, s, v = cv2.split(hsv)

            # Apply mask based on vital type
            if vital_name == 'HR':
                # Green: H=40-80, S=100-255, V=150-255
                mask = cv2.inRange(hsv, np.array([40, 100, 150]), np.array([80, 255, 255]))
                print("        Green (HR): H=40-80, S=100-255, V=150-255")
            elif vital_name == 'etCO2':
                # Cyan: H=85-100, S=80-255
                mask = cv2.inRange(hsv, np.array([85, 80, 100]), np.array([100, 255, 255]))
                print("        Cyan (etCO2): H=85-100, S=80-255")
            elif vital_name in ['SpO2', 'Pulse']:
                # White/Cyan: H=80-100 OR V>200
                mask1 = cv2.inRange(hsv, np.array([80, 0, 0]), np.array([100, 255, 255]))
                mask2 = cv2.inRange(v, 200, 255)
                mask = cv2.bitwise_or(mask1, mask2)
                print("        White/Cyan: H=80-100 OR V>200")
            elif vital_name in ['RR', 'Temp']:
                # White mainly
                mask1 = cv2.inRange(hsv, np.array([0, 80, 100]), np.array([10, 255, 255]))
                mask2 = cv2.inRange(hsv, np.array([170, 80, 100]), np.array([180, 255, 255]))
                mask3 = cv2.inRange(v, 150, 255)
                mask = cv2.bitwise_or(cv2.bitwise_or(mask1, mask2), mask3)
                print("        White/Bright: V>150")
            else:
                gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
                _, mask = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
                print("        Fallback: Grayscale + Otsu")

            # Invert: white text on black -> black text on white
            inverted = cv2.bitwise_not(mask)
            print("        [+] Mask inverted")

            # Upscale 4x
            upscaled = cv2.resize(inverted, None, fx=4, fy=4, interpolation=cv2.INTER_CUBIC)
            print("        [+] Upscaled 4x: {}".format(upscaled.shape))

            # Morphological closing
            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
            processed = cv2.morphologyEx(upscaled, cv2.MORPH_CLOSE, kernel)
            print("        [+] Morphological closing applied")

            cv2.imwrite("mask_{}.jpg".format(vital_name), processed)

            return processed
        except Exception as e:
            print("        [-] Error: {}".format(e))
            return None

    def test_ocr_on_roi(self, processed_roi, vital_name):
        """Test text extraction with OCR"""
        print("    [*] OCR for {}:".format(vital_name))

        if processed_roi is None:
            print("        [-] No processed ROI")
            return None

        try:
            # Optimized Tesseract config
            config = '--psm 7 --oem 3 -c tessedit_char_whitelist=0123456789./'
            text = pytesseract.image_to_string(processed_roi, config=config).strip()

            # Extract digits only
            digits = ''.join(c for c in text if c.isdigit() or c == '.')

            print("        Raw OCR: '{}'".format(text))
            print("        Extracted: '{}'".format(digits))

            return digits if digits else None
        except Exception as e:
            print("        [-] OCR Error: {}".format(e))
            return None

    def test_full_ocr_pipeline(self):
        """Test complete OCR pipeline"""
        print("\n" + "="*70)
        print("[*] Testing Complete OCR Pipeline")
        print("="*70)

        results = {}

        # Process frame
        preprocessed_frame = self.test_frame_preprocessing()

        # Extract ROIs
        rois = self.test_roi_extraction(preprocessed_frame)

        # For each ROI: apply color mask, then OCR
        for vital_name, roi in rois.items():
            print("\n[*] Processing {}:".format(vital_name))
            processed = self.test_color_masking(roi, vital_name)
            value = self.test_ocr_on_roi(processed, vital_name)
            results[vital_name] = value

        return results

    def save_results(self, results):
        """Save results to JSON file"""
        print("\n" + "="*70)
        print("[*] Saving Results")
        print("="*70)

        output = {
            'timestamp': datetime.now().isoformat(),
            'vitals': results,
            'confidence': {vital: 0.85 for vital in results}
        }

        with open('ocr_test_results.json', 'w') as f:
            json.dump(output, f, indent=2)

        print("[+] Results saved to: ocr_test_results.json")
        print("\nResults:")
        for vital, value in results.items():
            status = value if value else '(Not detected)'
            print("    {} = {}".format(vital.ljust(10), status))

    def run_all_tests(self):
        """Run all tests"""
        print("\n" + "="*70)
        print("[*] OCR System Comprehensive Test")
        print("="*70)

        # Create test image
        self.create_test_image()

        # Run full pipeline
        results = self.test_full_ocr_pipeline()

        # Save results
        self.save_results(results)

        print("\n" + "="*70)
        print("[+] Tests completed!")
        print("="*70)

if __name__ == "__main__":
    tester = OCRTester()
    tester.run_all_tests()
