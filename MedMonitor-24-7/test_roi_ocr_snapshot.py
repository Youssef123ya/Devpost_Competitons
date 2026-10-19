import cv2
import requests
import numpy as np
import camera_ocr_complete as mod

url = 'http://localhost:8000/snapshot'
for i in range(5):
    response = requests.get(url, timeout=10)
    if response.status_code != 200:
        raise SystemExit(f'Failed snapshot {i}: {response.status_code}')
    frame = cv2.imdecode(np.frombuffer(response.content, np.uint8), cv2.IMREAD_COLOR)
    if frame is None:
        raise SystemExit(f'Failed decode snapshot {i}')
    results = mod.ocr_frame(frame)
    print(f'[*] Frame {i}:')
    for vital_name in ['HR', 'Pulse', 'SpO2', 'Temp', 'RR', 'NBP', 'MAP']:
        data = results.get(vital_name, {})
        print('   {}: {} (Conf: {:.2f}) raw={}'.format(
            vital_name.ljust(5),
            str(data.get('value', 'None')).ljust(6),
            data.get('confidence', 0.0),
            data.get('raw_text', '')
        ))
