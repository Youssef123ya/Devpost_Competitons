import time
import requests
import cv2
import numpy as np
import camera_ocr_complete as mod

print('Checking /health and /vitals on port 8001')
for i in range(5):
    try:
        h = requests.get('http://127.0.0.1:8001/health', timeout=5).json()
        v = requests.get('http://127.0.0.1:8001/vitals', timeout=5).json()
        print(f'[{i}] health:', h)
        print(f'[{i}] vitals:', v)
    except Exception as e:
        print('error', e)
    time.sleep(2)

print('\nTesting OCR directly on live snapshot from port 8001')
for i in range(5):
    try:
        r = requests.get('http://127.0.0.1:8001/snapshot', timeout=10)
        if r.status_code != 200:
            print('snapshot failed', r.status_code)
            continue
        frame = cv2.imdecode(np.frombuffer(r.content, np.uint8), cv2.IMREAD_COLOR)
        if frame is None:
            print('snapshot decode failed')
            continue
        results = mod.ocr_frame(frame)
        print(f'Frame {i} results:')
        for name in ['HR', 'Pulse', 'SpO2', 'Temp', 'RR', 'NBP', 'MAP']:
            d = results.get(name, {})
            print(f'  {name:5} = {d.get("value")} conf={d.get("confidence",0):.2f} raw={d.get("raw_text","")}')
    except Exception as e:
        print('snapshot exception', e)
    time.sleep(1)
