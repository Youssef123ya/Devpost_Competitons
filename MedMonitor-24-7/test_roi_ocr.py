import cv2
import requests
import numpy as np
import json
import time
import camera_ocr_complete as mod

# Step 1: get snapshot from live camera endpoint
response = requests.get('http://localhost:8000/snapshot', timeout=10)
frame = cv2.imdecode(np.frombuffer(response.content, np.uint8), cv2.IMREAD_COLOR)
if frame is None:
    raise SystemExit('Failed to decode frame from snapshot')

h, w = frame.shape[:2]
print(f'Frame resolution: {w} x {h}')

with open('roi_config.json', 'r') as f:
    roi_config = json.load(f)

colors = {
    'HR': (0, 255, 0),
    'SpO2': (255, 255, 0),
    'Pulse': (0, 255, 128),
    'RR': (0, 165, 255),
    'Temp': (128, 0, 255),
    'NBP': (0, 0, 255),
    'MAP': (0, 128, 255),
}

frame_dbg = frame.copy()
for key, roi in roi_config.items():
    color = colors.get(key, (255, 255, 255))
    cv2.rectangle(frame_dbg, (roi['x1'], roi['y1']), (roi['x2'], roi['y2']), color, 2)
    cv2.putText(frame_dbg, key, (roi['x1'], roi['y1'] - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
cv2.imwrite('debug_roi_applied.jpg', frame_dbg)
print('Saved debug_roi_applied.jpg')

# Step 2: OCR first 5 frames
cap = cv2.VideoCapture('http://localhost:8000/stream')
if not cap.isOpened():
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        raise SystemExit('No camera source available for OCR test')

frames = 0
while frames < 5:
    ret, frame = cap.read()
    if not ret:
        time.sleep(0.1)
        continue
    results = mod.ocr_frame(frame)
    print(f'[*] Frame {frames}:')
    for vital_name in ['HR', 'Pulse', 'SpO2', 'Temp', 'RR', 'NBP', 'MAP']:
        data = results.get(vital_name, {})
        print('   {}: {} (Conf: {:.2f}) raw={}'.format(
            vital_name.ljust(5),
            str(data.get('value', 'None')).ljust(6),
            data.get('confidence', 0.0),
            data.get('raw_text', '')
        ))
    frames += 1
    time.sleep(0.5)
