#!/usr/bin/env python3
"""
Medical Monitor OCR System - Processes snapshots from stream_and_snapshot.py
Watches for new snapshots and extracts vital signs using EasyOCR
"""

import cv2
import easyocr
import numpy as np
import json
import threading
import time
from pathlib import Path
from datetime import datetime
import glob
import os

# Initialize EasyOCR reader
try:
    reader = easyocr.Reader(['en'], gpu=False)
    print("[+] EasyOCR initialized")
except Exception as e:
    print(f"[-] EasyOCR initialization failed: {e}")
    reader = None

# ROI Coordinates for vital signs (from roi_config.json)
try:
    with open('roi_config.json', 'r') as f:
        roi_data = json.load(f)
    ROI_MAP = {
        'HR': (roi_data['HR']['x1'], roi_data['HR']['y1'], roi_data['HR']['x2'], roi_data['HR']['y2']),
        'SpO2': (roi_data['SpO2']['x1'], roi_data['SpO2']['y1'], roi_data['SpO2']['x2'], roi_data['SpO2']['y2']),
        'etCO2': (roi_data['etCO2']['x1'], roi_data['etCO2']['y1'], roi_data['etCO2']['x2'], roi_data['etCO2']['y2']),
        'Pulse': (roi_data['Pulse']['x1'], roi_data['Pulse']['y1'], roi_data['Pulse']['x2'], roi_data['Pulse']['y2']),
        'RR': (roi_data['RR']['x1'], roi_data['RR']['y1'], roi_data['RR']['x2'], roi_data['RR']['y2']),
        'Temp': (roi_data['Temp']['x1'], roi_data['Temp']['y1'], roi_data['Temp']['x2'], roi_data['Temp']['y2']),
    }
    print("[+] ROI configuration loaded from roi_config.json")
except:
    print("[-] roi_config.json not found, using hardcoded ROI")
    ROI_MAP = {
        'HR': (1340, 100, 1660, 280),
        'SpO2': (1340, 285, 1660, 470),
        'etCO2': (1340, 470, 1535, 610),
        'Pulse': (980, 640, 1085, 710),
        'RR': (1340, 640, 1580, 820),
        'Temp': (1620, 650, 1870, 830),
    }

processed_files = set()
output_file = Path('vital_signs_latest.json')


def preprocess_frame(frame):
    """Enhanced frame preprocessing"""
    if frame is None:
        return frame

    try:
        # Unsharp mask
        gaussian_kernel = cv2.getGaussianKernel(5, 1.0)
        gaussian_kernel = gaussian_kernel @ gaussian_kernel.T
        blurred = cv2.filter2D(frame, -1, gaussian_kernel)
        sharpened = cv2.addWeighted(frame, 2.5, blurred, -1.5, 0)

        # CLAHE contrast
        lab = cv2.cvtColor(sharpened, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        l_enhanced = clahe.apply(l)
        lab_enhanced = cv2.merge([l_enhanced, a, b])
        frame_contrast = cv2.cvtColor(lab_enhanced, cv2.COLOR_LAB2BGR)

        # Saturation boost
        hsv = cv2.cvtColor(frame_contrast, cv2.COLOR_BGR2HSV).astype(np.float32)
        h, s, v = cv2.split(hsv)
        s = np.clip(s * 1.3, 0, 255)
        hsv = cv2.merge([h, s, v])
        frame_saturated = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)

        # Gamma correction
        gamma = 0.85
        inv_gamma = 1.0 / gamma
        lut = np.array([((i / 255.0) ** inv_gamma) * 255 for i in np.arange(0, 256)]).astype(np.uint8)
        frame_gamma = cv2.LUT(frame_saturated, lut)

        return np.clip(frame_gamma, 0, 255).astype(np.uint8)
    except:
        return frame


def preprocess_roi(roi, vital_name):
    """Preprocess ROI for OCR"""
    if roi is None or roi.size == 0:
        return None

    try:
        hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
        h, s, v = cv2.split(hsv)

        # Color-specific masking
        if vital_name == 'HR':
            mask = cv2.inRange(hsv, np.array([30, 50, 50]), np.array([90, 255, 255]))
        elif vital_name == 'etCO2':
            mask = cv2.inRange(hsv, np.array([80, 50, 50]), np.array([110, 255, 255]))
        elif vital_name in ['SpO2', 'Pulse']:
            mask = cv2.inRange(v, 100, 255)
        elif vital_name in ['RR', 'Temp']:
            mask = cv2.inRange(v, 100, 255)
        else:
            gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
            _, mask = cv2.threshold(gray, 30, 255, cv2.THRESH_BINARY)

        inverted = cv2.bitwise_not(mask)
        upscaled = cv2.resize(inverted, None, fx=3, fy=3, interpolation=cv2.INTER_CUBIC)

        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
        processed = cv2.morphologyEx(upscaled, cv2.MORPH_CLOSE, kernel)

        kernel_dilate = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 1))
        processed = cv2.dilate(processed, kernel_dilate, iterations=1)

        return processed
    except:
        return None


def extract_text_from_roi(roi):
    """Extract text using EasyOCR"""
    if roi is None or reader is None:
        return "", 0.0

    try:
        results = reader.readtext(roi, detail=1)
        if not results:
            return "", 0.0

        text = ''.join([detection[1] for detection in results])
        avg_confidence = np.mean([detection[2] for detection in results])

        digits = ''.join(c for c in text if c.isdigit() or c == '.')
        return digits if digits else "", float(avg_confidence)
    except:
        return "", 0.0


def process_snapshot(image_path):
    """Process a snapshot and extract vital signs"""
    try:
        frame = cv2.imread(image_path)
        if frame is None:
            return None

        preprocessed = preprocess_frame(frame)

        vitals = {}
        confidence = {}

        for vital_name, roi_coords in ROI_MAP.items():
            x1, y1, x2, y2 = roi_coords
            x1 = max(0, x1)
            y1 = max(0, y1)
            x2 = min(frame.shape[1], x2)
            y2 = min(frame.shape[0], y2)

            roi = preprocessed[y1:y2, x1:x2].copy()
            text, conf = extract_text_from_roi(roi)

            if not text:
                processed_roi = preprocess_roi(roi, vital_name)
                if processed_roi is not None:
                    text, conf = extract_text_from_roi(processed_roi)

            vitals[vital_name] = text if text else None
            confidence[vital_name] = conf

        return {
            'timestamp': datetime.now().isoformat(),
            'vitals': vitals,
            'confidence': confidence
        }
    except Exception as e:
        print(f"[-] Error processing snapshot: {e}")
        return None


def save_results(data):
    """Save extracted vital signs to JSON"""
    try:
        with open(output_file, 'w') as f:
            json.dump(data, f, indent=2)
        print(f"[+] Saved: {output_file}")
    except Exception as e:
        print(f"[-] Error saving results: {e}")


def monitor_snapshots():
    """Monitor for new snapshots and process them"""
    global processed_files

    print("[*] Monitoring for new snapshots...")
    while True:
        try:
            snapshots = sorted(glob.glob('snapshot_*.jpg'))

            for snapshot_path in snapshots:
                if snapshot_path not in processed_files:
                    print(f"\n[*] Processing: {snapshot_path}")
                    data = process_snapshot(snapshot_path)

                    if data:
                        print(f"[+] Extracted vital signs:")
                        for vital, value in data['vitals'].items():
                            conf = data['confidence'][vital]
                            print(f"    {vital:10} = {str(value):20} (Conf: {conf:.2f})")

                        save_results(data)

                    processed_files.add(snapshot_path)

            time.sleep(1)
        except Exception as e:
            print(f"[-] Error in monitor_snapshots: {e}")
            time.sleep(1)


if __name__ == '__main__':
    print("\n" + "="*70)
    print("[*] Medical Monitor OCR System")
    print("="*70)
    print("\nThis system:")
    print("  • Monitors for new snapshots from stream_and_snapshot.py")
    print("  • Extracts vital signs using EasyOCR")
    print("  • Saves results to vital_signs_latest.json")
    print("\nMake sure stream_and_snapshot.py is running in another terminal!")
    print("="*70 + "\n")

    if reader is None:
        print("[-] EasyOCR not available. Install with: pip install easyocr")
        exit(1)

    try:
        monitor_snapshots()
    except KeyboardInterrupt:
        print("\n[*] Shutting down...")
