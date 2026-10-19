import cv2
import requests
import numpy as np

url = 'http://localhost:8001/snapshot'
response = requests.get(url, timeout=10)
response.raise_for_status()

frame = cv2.imdecode(np.frombuffer(response.content, np.uint8), cv2.IMREAD_COLOR)
if frame is None:
    raise RuntimeError('Failed to decode image from snapshot')

h, w = frame.shape[:2]
print(f'Resolution: {w}x{h}')

for i in range(20):
    x = int(w * i / 20)
    y = int(h * i / 20)
    cv2.line(frame, (x, 0), (x, h), (100, 100, 100), 1)
    cv2.line(frame, (0, y), (w, y), (100, 100, 100), 1)
    if i % 2 == 0:
        cv2.putText(frame, f'{i*5}%', (x+2, 15), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (0,255,255), 1)
        cv2.putText(frame, f'{i*5}%', (2, y+12), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (0,255,255), 1)

output = 'calibration_grid.jpg'
cv2.imwrite(output, frame)
print('Saved calibration_grid.jpg')
print(f'Frame size: {w}x{h}')
