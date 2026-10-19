"""
Complete System - Camera + OCR (ENHANCED)
Flask server with live video stream and OCR results
OPTIMIZED: Enhanced frame preprocessing + color-specific masking + EasyOCR
Integration with .NET Backend for VitalSign database
"""

import cv2
import easyocr
import numpy as np
from flask import Flask, Response, jsonify
import threading
import time
import os
import json
import re
from datetime import datetime
from backend_integration import BackendIntegration

# Initialize EasyOCR reader
try:
    reader = easyocr.Reader(['en'], gpu=False)
    has_easyocr = True
except:
    reader = None
    has_easyocr = False

app = Flask(__name__)

latest_frame = None
vital_signs = {}
frame_lock = threading.Lock()
vital_lock = threading.Lock()

# Initialize Backend Integration
backend_integration = BackendIntegration(
    backend_api_url="http://localhost:5140"
)

# Input stream and OCR service configuration
INPUT_STREAM_URL = os.environ.get("INPUT_STREAM_URL", "http://localhost:8000/stream")
OCR_SERVICE_PORT = int(os.environ.get("OCR_SERVICE_PORT", "8001"))

# ═══════════════════════════════════════════════════════════════
# TWO-LEVEL RECORDING SYSTEM
# ═══════════════════════════════════════════════════════════════
# JOB 1: Every 5 seconds → AI Alert (continuous)
# JOB 2: Every hour (at exact hour) → Database (once per hour per patient)

# Global hourly gate (simple): track last saved hour for the whole service
last_db_hour_global = -1
last_db_date_global = None  # tracks the current date for hourly persistence gating

# Per-patient hourly gate: map patientId -> last saved hour (0-23)
# and optionally date if multi-day runs are expected
last_db_hour_per_patient = {}
last_db_date_per_patient = {}

camera_debug_info = {
    'status': 'initializing',
    'frame_count': 0,
    'resolution': '1920x1080',
    'fps': 30,
    'camera_index': None,
    'last_seen': None,
    'ocr_engine': 'EasyOCR' if has_easyocr else 'Not Available'
}


def should_record_this_hour():
    """Simple service-level gate: return True once when hour ticks over."""
    global last_db_hour_global, last_db_date_global
    now = datetime.now()
    current_hour = now.hour
    current_date = now.date()

    if current_date != last_db_date_global:
        last_db_hour_global = -1
        last_db_date_global = current_date

    if current_hour != last_db_hour_global:
        last_db_hour_global = current_hour
        return True
    return False


def load_roi_config(w, h):
    config_path = 'roi_config.json'
    if not os.path.exists(config_path):
        return None

    try:
        with open(config_path, 'r') as f:
            data = json.load(f)

        def to_pixels(value, dim):
            if isinstance(value, str) and value.endswith('%'):
                return int(dim * float(value[:-1]) / 100.0)
            return int(value)

        roi_map = {}
        for name, coords in data.items():
            x1 = to_pixels(coords.get('x1'), w)
            y1 = to_pixels(coords.get('y1'), h)
            x2 = to_pixels(coords.get('x2'), w)
            y2 = to_pixels(coords.get('y2'), h)
            roi_map[name] = (x1, y1, x2, y2)

        return roi_map
    except Exception as exc:
        print(f"[-] Failed to load roi_config.json: {exc}")
        return None


def get_default_roi_map(w, h):
    return {
        'HR':    (int(w * 0.72), int(h * 0.05), int(w * 0.86), int(h * 0.28)),
        'Pulse': (int(w * 0.87), int(h * 0.08), int(w * 0.99), int(h * 0.28)),
        'SpO2':  (int(w * 0.62), int(h * 0.26), int(w * 0.78), int(h * 0.44)),
        'Temp':  (int(w * 0.84), int(h * 0.30), int(w * 0.99), int(h * 0.53)),
        'RR':    (int(w * 0.70), int(h * 0.48), int(w * 0.84), int(h * 0.70)),
        'NBP':   (int(w * 0.12), int(h * 0.67), int(w * 0.38), int(h * 0.87)),
        'MAP':   (int(w * 0.40), int(h * 0.66), int(w * 0.60), int(h * 0.88)),
    }


def get_roi_map(w, h):
    roi_map = load_roi_config(w, h)
    if roi_map:
        return roi_map
    return get_default_roi_map(w, h)

VALID_RANGES = {
    'HR':    (30, 250),
    'SpO2':  (50, 100),
    'etCO2': (0, 80),
    'Pulse': (30, 250),
    'RR':    (4, 60),
    'Temp':  (35.0, 43.0),
    'NBP':   (60, 250),
    'MAP':   (40, 180),
}


def apply_frame_preprocessing(frame):
    """Enhanced frame preprocessing for medical monitor"""
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


def preprocess_roi(roi, vital_name):
    """Color-specific ROI preprocessing with relaxed thresholds"""
    if roi is None or roi.size == 0:
        return None

    try:
        hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
        h, s, v = cv2.split(hsv)

        # Color-specific masking and stronger fallback for low-brightness digits
        if vital_name == 'HR':
            mask = cv2.inRange(hsv, np.array([40, 90, 90]), np.array([100, 255, 255]))
            mask_white = cv2.inRange(hsv, np.array([0, 0, 200]), np.array([180, 40, 255]))
            mask = cv2.bitwise_or(mask, mask_white)
        elif vital_name == 'SpO2':
            mask = cv2.inRange(hsv, np.array([80, 90, 90]), np.array([130, 255, 255]))
            mask_white = cv2.inRange(hsv, np.array([0, 0, 200]), np.array([180, 40, 255]))
            mask = cv2.bitwise_or(mask, mask_white)
        elif vital_name == 'Temp':
            mask = cv2.inRange(hsv, np.array([35, 90, 90]), np.array([90, 255, 255]))
            gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
            _, mask_gray = cv2.threshold(gray, 120, 255, cv2.THRESH_BINARY)
            mask = cv2.bitwise_or(mask, mask_gray)
        elif vital_name == 'NBP':
            mask1 = cv2.inRange(hsv, np.array([0, 120, 120]), np.array([20, 255, 255]))
            mask2 = cv2.inRange(hsv, np.array([160, 120, 120]), np.array([180, 255, 255]))
            mask_gray = cv2.inRange(hsv, np.array([0, 0, 200]), np.array([180, 40, 255]))
            mask = cv2.bitwise_or(mask_gray, cv2.bitwise_or(mask1, mask2))
        elif vital_name == 'Pulse':
            mask_green = cv2.inRange(hsv, np.array([35, 90, 90]), np.array([95, 255, 255]))
            mask_white = cv2.inRange(hsv, np.array([0, 0, 200]), np.array([180, 40, 255]))
            gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
            _, mask_gray = cv2.threshold(gray, 120, 255, cv2.THRESH_BINARY)
            mask = cv2.bitwise_or(mask_green, cv2.bitwise_or(mask_white, mask_gray))
        elif vital_name == 'RR':
            mask_yellow = cv2.inRange(hsv, np.array([15, 80, 90]), np.array([45, 255, 255]))
            gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
            _, mask_gray = cv2.threshold(gray, 120, 255, cv2.THRESH_BINARY)
            mask = cv2.bitwise_or(mask_yellow, mask_gray)
        elif vital_name == 'MAP':
            mask1 = cv2.inRange(hsv, np.array([0, 120, 120]), np.array([20, 255, 255]))
            mask2 = cv2.inRange(hsv, np.array([160, 120, 120]), np.array([180, 255, 255]))
            gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
            _, mask_gray = cv2.threshold(gray, 120, 255, cv2.THRESH_BINARY)
            mask = cv2.bitwise_or(mask_gray, cv2.bitwise_or(mask1, mask2))
        else:
            gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
            _, mask = cv2.threshold(gray, 100, 255, cv2.THRESH_BINARY)

        # Invert: white on black -> black on white
        inverted = cv2.bitwise_not(mask)

        # Upscale 3x with cubic interpolation
        upscaled = cv2.resize(inverted, None, fx=3, fy=3, interpolation=cv2.INTER_CUBIC)

        # Morphological closing (2x2 kernel)
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (2, 2))
        processed = cv2.morphologyEx(upscaled, cv2.MORPH_CLOSE, kernel)

        # Dilation to strengthen characters
        kernel_dilate = cv2.getStructuringElement(cv2.MORPH_RECT, (1, 1))
        processed = cv2.dilate(processed, kernel_dilate, iterations=1)

        return processed
    except:
        return None


def run_ocr(roi, vital_name=None):
    return extract_ocr_from_roi(roi, vital_name=vital_name)


def extract_integer_from_text(text, valid_range):
    if not text:
        return 0

    numbers = re.findall(r'\d+', text)
    for num in numbers:
        try:
            val = int(num)
            if valid_range[0] <= val <= valid_range[1]:
                return val
        except ValueError:
            continue
    return 0


def extract_decimal_from_text(text):
    if not text:
        return 0.0

    match = re.search(r'(\d{2,3}(?:\.\d)?)', text)
    if match:
        try:
            val = float(match.group())
            if VALID_RANGES['Temp'][0] <= val <= VALID_RANGES['Temp'][1]:
                return val
        except ValueError:
            pass
    return 0.0


def extract_nbp_from_text(text):
    if not text:
        return 0

    match = re.search(r'(\d{2,3})/(\d{2,3})', text)
    if match:
        try:
            systolic = int(match.group(1))
            if VALID_RANGES['NBP'][0] <= systolic <= VALID_RANGES['NBP'][1]:
                return systolic
        except ValueError:
            pass
    return 0


def extract_map_from_text(text):
    if not text:
        return 0

    match = re.search(r'\((\d{2,3})\)', text)
    if match:
        try:
            val = int(match.group(1))
            if VALID_RANGES['MAP'][0] <= val <= VALID_RANGES['MAP'][1]:
                return val
        except ValueError:
            pass

    numbers = re.findall(r'\d{2,3}', text)
    for num in numbers:
        try:
            val = int(num)
            if VALID_RANGES['MAP'][0] <= val <= VALID_RANGES['MAP'][1]:
                return val
        except ValueError:
            continue

    return 0


def best_vital_value(raw_text, raw_conf, proc_text, proc_conf, vital_name):
    raw_value = 0
    proc_value = 0

    if vital_name in ['HR', 'Pulse', 'SpO2', 'RR']:
        raw_value = extract_integer_from_text(raw_text, VALID_RANGES[vital_name])
        proc_value = extract_integer_from_text(proc_text, VALID_RANGES[vital_name])
    elif vital_name == 'Temp':
        raw_value = extract_decimal_from_text(raw_text)
        proc_value = extract_decimal_from_text(proc_text)
    elif vital_name == 'NBP':
        raw_value = extract_nbp_from_text(raw_text)
        proc_value = extract_nbp_from_text(proc_text)
    elif vital_name == 'MAP':
        raw_value = extract_map_from_text(raw_text)
        proc_value = extract_map_from_text(proc_text)

    raw_valid = raw_value and validate_value(vital_name, raw_value)
    proc_valid = proc_value and validate_value(vital_name, proc_value)

    if vital_name == 'NBP':
        if proc_valid and '/' in proc_text and not raw_valid:
            return proc_value, proc_text, proc_conf
        if raw_valid and not proc_valid:
            return raw_value, raw_text, raw_conf
        if raw_valid and proc_valid:
            return (proc_value, proc_text, proc_conf) if proc_conf >= raw_conf else (raw_value, raw_text, raw_conf)
    elif vital_name == 'Temp':
        if proc_valid and not raw_valid:
            return proc_value, proc_text, proc_conf
        if raw_valid and not proc_valid:
            return raw_value, raw_text, raw_conf
        if raw_valid and proc_valid:
            return (proc_value, proc_text, proc_conf) if proc_conf >= raw_conf else (raw_value, raw_text, raw_conf)
    else:
        if proc_valid and not raw_valid:
            return proc_value, proc_text, proc_conf
        if raw_valid and not proc_valid:
            return raw_value, raw_text, raw_conf
        if raw_valid and proc_valid:
            return (proc_value, proc_text, proc_conf) if proc_conf >= raw_conf else (raw_value, raw_text, raw_conf)

    if raw_valid:
        return raw_value, raw_text, raw_conf
    if proc_valid:
        return proc_value, proc_text, proc_conf
    return 0, raw_text or proc_text, max(raw_conf, proc_conf)


def extract_value_for_vital(roi, vital_name):
    raw_text, raw_conf = extract_digits_from_image(roi, vital_name)
    processed_text, processed_conf = '', 0.0
    processed = preprocess_roi(roi, vital_name)
    if processed is not None:
        processed_text, processed_conf = extract_digits_from_image(processed, vital_name)

    return best_vital_value(raw_text, raw_conf, processed_text, processed_conf, vital_name)


def normalize_vital_text(text, vital_name):
    if not text:
        return ""

    text = text.replace('O', '0').replace('o', '0')
    text = text.replace('l', '1').replace('I', '1').replace('i', '1')
    text = text.replace(' ', '').replace(',', '.')

    if vital_name == 'NBP':
        cleaned = ''.join(c for c in text if c.isdigit() or c == '/')
        if cleaned.count('/') > 1:
            parts = cleaned.split('/')
            cleaned = parts[0] + '/' + parts[1]
        return cleaned

    cleaned = ''.join(c for c in text if c.isdigit() or c == '.')
    if not cleaned:
        return ""

    if cleaned.count('.') > 1:
        parts = cleaned.split('.')
        cleaned = parts[0] + '.' + ''.join(parts[1:])

    if vital_name in ['HR', 'SpO2', 'etCO2', 'Pulse', 'RR']:
        cleaned = cleaned.split('.')[0]
    elif vital_name == 'Temp':
        if '.' in cleaned:
            cleaned = cleaned[: cleaned.find('.') + 2]

    return cleaned


def extract_nbp_value(text):
    if not text:
        return "0"

    if isinstance(text, bytes):
        text = text.decode('utf-8', errors='ignore')

    text = text.replace(' ', '').replace('\\', '/')
    match = re.search(r'(\d{2,3})/(\d{2,3})', text)
    if match:
        systolic = int(match.group(1))
        if 60 <= systolic <= 250:
            return str(systolic)

    digits = ''.join(c for c in text if c.isdigit())
    if len(digits) >= 3:
        systolic = int(digits[:-2])
        if 60 <= systolic <= 250:
            return str(systolic)

    return "0"


def validate_value(key, value):
    if value is None:
        return 0

    try:
        if key == 'Temp':
            parsed = float(value)
        else:
            parsed = int(float(value))
    except (ValueError, TypeError):
        return 0

    min_val, max_val = VALID_RANGES.get(key, (0, 9999))
    return parsed if min_val <= parsed <= max_val else 0


def extract_digits_from_image_single(image, vital_name=None):
    """Extract digits from image using EasyOCR on a single scale"""
    if image is None or reader is None:
        return "", 0.0

    try:
        results = reader.readtext(image, detail=1)
        if not results:
            return "", 0.0

        best_text = ""
        best_conf = 0.0

        for _, text, conf in results:
            normalized = normalize_vital_text(text, vital_name) if vital_name else ''.join(c for c in text if c.isdigit() or c == '.')
            if not normalized:
                continue
            if float(conf) > best_conf:
                best_text = normalized
                best_conf = float(conf)

        return best_text, best_conf
    except:
        return "", 0.0


def extract_digits_from_image(image, vital_name=None):
    """Extract digits from image using EasyOCR with multi-scale voting"""
    if image is None or reader is None:
        return "", 0.0

    scales = [1.0, 1.5, 0.75]
    candidates = {}

    for scale in scales:
        if scale == 1.0:
            scaled_image = image
        else:
            scaled_image = cv2.resize(image, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)

        text, conf = extract_digits_from_image_single(scaled_image, vital_name)
        if not text:
            continue

        if text not in candidates:
            candidates[text] = {'count': 0, 'confidence': 0.0}

        candidates[text]['count'] += 1
        candidates[text]['confidence'] = max(candidates[text]['confidence'], conf)

    if not candidates:
        return "", 0.0

    best_text, best_data = max(candidates.items(), key=lambda item: (item[1]['count'], item[1]['confidence']))
    return best_text, best_data['confidence']


def extract_ocr_from_roi(roi, vital_name):
    """Extract text from ROI"""
    if roi is None or roi.size == 0:
        return "", 0.0

    try:
        raw_text, raw_conf = extract_digits_from_image(roi, vital_name=vital_name)
        processed_text, processed_conf = "", 0.0
        processed = preprocess_roi(roi, vital_name)

        if processed is not None:
            processed_text, processed_conf = extract_digits_from_image(processed, vital_name=vital_name)

        if raw_text and raw_conf >= processed_conf:
            return raw_text, raw_conf
        return processed_text, processed_conf
    except:
        return "", 0.0


def ocr_frame(frame):
    """Extract all vital signs from frame"""
    if frame is None:
        return {}

    # Apply frame preprocessing
    preprocessed = apply_frame_preprocessing(frame)
    h, w = frame.shape[:2]
    roi_map = get_roi_map(w, h)

    results = {}

    for vital_name, roi_coords in roi_map.items():
        x1, y1, x2, y2 = roi_coords
        x1 = max(0, x1)
        y1 = max(0, y1)
        x2 = min(w, x2)
        y2 = min(h, y2)

        if x2 <= x1 or y2 <= y1:
            results[vital_name] = {
                'value': None,
                'raw_text': '',
                'confidence': 0.0,
                'timestamp': datetime.now().isoformat()
            }
            continue

        # Use the raw frame ROI and let ROI-specific preprocessing handle enhancement.
        roi = frame[y1:y2, x1:x2].copy()
        value, raw_text, conf = extract_value_for_vital(roi, vital_name)

        results[vital_name] = {
            'value': value,
            'raw_text': raw_text,
            'confidence': conf,
            'timestamp': datetime.now().isoformat()
        }

    return results


def get_latest_vitals():
    """Return the latest extracted vitals, falling back to OCR on the current frame if needed."""
    global vital_signs

    with vital_lock:
        if vital_signs:
            return {k: v.copy() for k, v in vital_signs.items()}

    with frame_lock:
        if latest_frame is None:
            return {}
        frame = latest_frame.copy()

    results = ocr_frame(frame)
    with vital_lock:
        vital_signs = results
    return results


def send_to_ai_alert(ocr_results, patient_id='default'):
    """
    JOB 1: Send current readings to AI Alert system every 5 seconds
    AI checks if patient is in danger → sends alert if needed
    Do NOT save to database
    """
    # Extract values from OCR results
    hr_value = validate_value('HR', ocr_results.get('HR', {}).get('value'))
    spo2_value = validate_value('SpO2', ocr_results.get('SpO2', {}).get('value'))
    pulse_value = validate_value('Pulse', ocr_results.get('Pulse', {}).get('value'))
    rr_value = validate_value('RR', ocr_results.get('RR', {}).get('value'))
    temp_value = validate_value('Temp', ocr_results.get('Temp', {}).get('value'))
    blood_pressure = validate_value('NBP', ocr_results.get('NBP', {}).get('value'))

    # Prepare AI alert payload
    ai_alert_payload = {
        'patientId': patient_id,
        'heartRate': hr_value if hr_value else 0,
        'spO2': spo2_value if spo2_value else 0,
        'bloodPressure': blood_pressure if blood_pressure else 0,
        'temperature': temp_value if temp_value else 0.0,
        'etCO2': 0,
        'pulse': pulse_value if pulse_value else 0,
        'respiratoryRate': rr_value if rr_value else 0,
    }
    
    # Send to AI Alert endpoint
    try:
        response = backend_integration.send_to_ai_alert(ai_alert_payload)
        if response:
            # AI endpoint returns prediction - no need to save
            pass
        return True
    except Exception as e:
        # Don't block if AI alert fails
        return False


def send_to_database_at_hour(ocr_results, patient_id='default'):
    """
    JOB 2: Save to database once per hour at exact hour start
    - At 1:00:00 AM → save current reading to DB
    - At 2:00:00 AM → save current reading to DB
    - etc.
    
    Only saves if we haven't already saved this hour
    Backend will prevent duplicates if somehow sent twice
    """
    global last_db_hour_per_patient, last_db_date_per_patient
    now = datetime.now()
    current_hour = now.hour
    current_date = now.date()

    # Basic validation
    if current_hour < 0 or current_hour > 23:
        return False

    # Initialize per-patient records if missing
    if patient_id not in last_db_hour_per_patient:
        last_db_hour_per_patient[patient_id] = -1
        last_db_date_per_patient[patient_id] = current_date

    # If day changed for this patient, reset
    if last_db_date_per_patient.get(patient_id) != current_date:
        last_db_hour_per_patient[patient_id] = -1
        last_db_date_per_patient[patient_id] = current_date

    # If we've already saved for this patient this hour, skip
    if current_hour == last_db_hour_per_patient.get(patient_id):
        return False

    # New hour for this patient → mark and continue
    last_db_hour_per_patient[patient_id] = current_hour
    
    # Extract values from OCR results
    hr_value = validate_value('HR', ocr_results.get('HR', {}).get('value'))
    spo2_value = validate_value('SpO2', ocr_results.get('SpO2', {}).get('value'))
    pulse_value = validate_value('Pulse', ocr_results.get('Pulse', {}).get('value'))
    rr_value = validate_value('RR', ocr_results.get('RR', {}).get('value'))
    temp_value = validate_value('Temp', ocr_results.get('Temp', {}).get('value'))
    blood_pressure = validate_value('NBP', ocr_results.get('NBP', {}).get('value'))

    # Prepare payload for backend database
    vital_signs_payload = {
        'patientId': patient_id,
        'heartRate': hr_value if hr_value else 0,
        'spO2': spo2_value if spo2_value else 0,
        'etCO2': 0,
        'pulse': pulse_value if pulse_value else 0,
        'respiratoryRate': rr_value if rr_value else 0,
        'temperature': temp_value if temp_value else 0.0,
        'bloodPressure': blood_pressure if blood_pressure else 0,
        'recordedAt': datetime.utcnow().isoformat() + 'Z'
    }
    
    # Send to backend database
    try:
        response = backend_integration.send_to_backend(vital_signs_payload)
        if response:
            print("[+] 💾 [{}] Hour {} recording saved to database".format(
                patient_id, current_hour))
            print("    HR={}, SpO2={}, NBP={}, Pulse={}, RR={}, Temp={}".format(
                hr_value, spo2_value, blood_pressure, pulse_value, rr_value, temp_value))
            return True
        else:
            print("[-] Failed to save to database")
            return False
    except Exception as e:
        print("[-] Error saving to database: {}".format(e))
        return False


def capture_and_ocr():
    """Read from camera and perform OCR"""
    global latest_frame, vital_signs, camera_debug_info

    print(f"[*] Opening camera from {INPUT_STREAM_URL}...")
    cap = cv2.VideoCapture(INPUT_STREAM_URL)
    selected_camera = 'http_stream'

    if not cap.isOpened():
        print("[-] USB camera stream failed, trying local cameras...")
        cap = cv2.VideoCapture(1)
        selected_camera = 1

        if not cap.isOpened():
            print("[-] Camera 1 failed, trying camera 0...")
            cap = cv2.VideoCapture(0)
            selected_camera = 0

            if not cap.isOpened():
                print("[-] No cameras available!")
                camera_debug_info['status'] = 'failed'
                return

    print("[+] Camera opened successfully")
    print("[*] Applying camera settings...")
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)
    cap.set(cv2.CAP_PROP_FPS, 30)
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

    with frame_lock:
        camera_debug_info['camera_index'] = selected_camera
        camera_debug_info['resolution'] = '1920x1080'
        camera_debug_info['fps'] = 30
        camera_debug_info['status'] = 'starting'

    print("[*] Warming up camera...")
    for _ in range(30):
        cap.read()
        time.sleep(0.033)

    print("[+] Camera ready!")

    frame_count = 0
    while True:
        ret, frame = cap.read()
        if ret:
            # Save frame
            with frame_lock:
                latest_frame = frame.copy()

            # OCR every 5 frames (for performance)
            if frame_count % 5 == 0:
                try:
                    ocr_results = ocr_frame(frame)
                except Exception as e:
                    print(f"[-] OCR exception: {e}")
                    ocr_results = {}

                if ocr_results:
                    with vital_lock:
                        vital_signs = ocr_results

                # Get patient ID
                patient_id = backend_integration.patient_id

                # ═══════════════════════════════════════════════════════════════
                # JOB 1: Every 5 seconds → AI Alert (always)
                # ═══════════════════════════════════════════════════════════════
                send_to_ai_alert(ocr_results, patient_id=patient_id)

                # ═══════════════════════════════════════════════════════════════
                # JOB 2: Once per hour → Save for all occupied patients
                # ═══════════════════════════════════════════════════════════════
                if should_record_this_hour():
                    saved_count = backend_integration.send_vitals_to_all_patients(ocr_results)
                    print(f"[+] 💾 Hourly save: {saved_count} patients updated")

                # Print results every 50 frames
                if frame_count % 50 == 0:
                    print("\n[*] Frame {}:".format(frame_count))
                    for vital_name, data in ocr_results.items():
                        value_text = str(data['value']) if data.get('value') is not None else 'None'
                        print("   {}: {} (Conf: {:.2f})".format(
                            vital_name.ljust(8),
                            value_text.ljust(8),
                            data['confidence']
                        ))

            frame_count += 1
            with frame_lock:
                camera_debug_info['frame_count'] = frame_count
                camera_debug_info['last_seen'] = datetime.now().isoformat()
                camera_debug_info['status'] = 'running'

        time.sleep(0.01)


@app.route('/')
def index():
    return jsonify({
        "status": "OK",
        "message": "Camera + OCR Service (Enhanced)",
        "ocr_engine": camera_debug_info.get('ocr_engine'),
        "endpoints": {
            "/stream": "Live video stream",
            "/snapshot": "Current frame",
            "/debug_roi": "Snapshot with ROI boxes",
            "/vitals": "Vital signs (OCR results)",
            "/vital-signs": "Vital signs (JSON)",
            "/health": "Service health status",
            "/config": "Camera configuration",
            "/debug": "Camera debug information"
        }
    })


@app.route('/stream')
def stream():
    """Live video stream"""
    def gen():
        while True:
            with frame_lock:
                if latest_frame is not None:
                    frame = latest_frame.copy()
                else:
                    continue

            ret, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 95])
            if ret:
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n'
                       b'Content-Length: ' + str(len(buffer)).encode() + b'\r\n\r\n'
                       + buffer.tobytes() + b'\r\n')
            time.sleep(0.033)

    return Response(gen(), mimetype='multipart/x-mixed-replace; boundary=frame')


@app.route('/snapshot')
def snapshot():
    """Single frame from camera"""
    with frame_lock:
        if latest_frame is None:
            return jsonify({"error": "No frame available yet. Wait a moment..."}), 503
        frame = latest_frame.copy()

    try:
        ret, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 95])
        if ret:
            return Response(buffer.tobytes(), mimetype='image/jpeg')
    except Exception as e:
        print("[-] Snapshot Error: {}".format(e))

    return jsonify({"error": "Error encoding frame"}), 500


@app.route('/debug_roi')
def debug_roi():
    """Show current ROI boxes on the current snapshot."""
    with frame_lock:
        if latest_frame is None:
            return jsonify({"error": "No frame available yet. Wait a moment..."}), 503
        frame = latest_frame.copy()

    debug_frame = frame.copy()
    colors = {
        'HR': (0, 255, 0),      # Green
        'SpO2': (255, 0, 0),    # Blue
        'RR': (255, 255, 255),  # White
        'Pulse': (0, 255, 255), # Yellow
        'Temp': (0, 128, 255),  # Orange
        'NBP': (0, 0, 255),     # Red
        'MAP': (0, 165, 255),   # Orange
    }
    h, w = frame.shape[:2]
    roi_map = get_roi_map(w, h)

    for name, (x1, y1, x2, y2) in roi_map.items():
        color = colors.get(name, (128, 128, 128))
        cv2.rectangle(debug_frame, (x1, y1), (x2, y2), color, 3)
        cv2.putText(debug_frame, name, (x1 + 5, y1 + 30),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, color, 2)

    _, buffer = cv2.imencode('.jpg', debug_frame, [cv2.IMWRITE_JPEG_QUALITY, 95])
    if _:
        return Response(buffer.tobytes(), mimetype='image/jpeg')
    return jsonify({"error": "Error encoding debug frame"}), 500


@app.route('/vital-signs')
def vital_signs_endpoint():
    """OCR extracted vital signs"""
    with vital_lock:
        current_vitals = {k: v.copy() for k, v in vital_signs.items()}

    if not current_vitals:
        with frame_lock:
            frame = latest_frame.copy() if latest_frame is not None else None
        if frame is not None:
            current_vitals = get_latest_vitals()

    extracted = {k: v['value'] for k, v in current_vitals.items()}
    confidence = {k: v.get('confidence', 0.0) for k, v in current_vitals.items()}
    return jsonify({
        "status": "OK",
        "vital_signs": extracted,
        "confidence": confidence,
        "timestamp": datetime.now().isoformat()
    })


@app.route('/vitals')
def vitals_alias():
    """Alias endpoint for vital-signs"""
    return vital_signs_endpoint()


@app.route('/health')
def health():
    """Service health status"""
    with frame_lock:
        frame_ok = latest_frame is not None
        status = 'healthy' if frame_ok else 'degraded'
    return jsonify({
        'status': status,
        'camera_status': camera_debug_info.get('status'),
        'frame_available': frame_ok,
        'ocr_available': has_easyocr,
        'timestamp': datetime.now().isoformat()
    }), 200


@app.route('/debug')
def debug():
    """Camera debug information"""
    with frame_lock:
        return jsonify(camera_debug_info), 200


@app.route('/config')
def config():
    """Camera configuration"""
    with frame_lock:
        return jsonify({
            'resolution': camera_debug_info.get('resolution'),
            'fps': camera_debug_info.get('fps'),
            'status': camera_debug_info.get('status'),
            'frame_count': camera_debug_info.get('frame_count'),
            'last_seen': camera_debug_info.get('last_seen'),
            'ocr_engine': camera_debug_info.get('ocr_engine')
        }), 200


if __name__ == '__main__':
    print("\n" + "="*70)
    print("[*] Camera + OCR Service (ENHANCED)")
    print("="*70)
    print("\n[*] OCR Engine: {}".format(camera_debug_info.get('ocr_engine')))
    print("[*] Starting camera capture thread...")

    # Start camera capture thread
    t = threading.Thread(target=capture_and_ocr, daemon=True)
    t.start()

    time.sleep(5)

    print(f"[+] Flask running on http://localhost:{OCR_SERVICE_PORT}\n")

    app.run(host='0.0.0.0', port=OCR_SERVICE_PORT, debug=False, threaded=True)
