import cv2
import requests
import numpy as np
import camera_ocr_complete as mod

# Try using the local camera stream directly
cap = cv2.VideoCapture('http://localhost:8000/stream')
if not cap.isOpened():
    raise SystemExit('Could not open stream on http://localhost:8000/stream')

frames = 0
while frames < 5:
    ret, frame = cap.read()
    if not ret or frame is None:
        raise SystemExit('Failed to read frame from stream')
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
cap.release()
