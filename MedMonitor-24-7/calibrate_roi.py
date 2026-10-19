import cv2
import requests
import numpy as np

url = 'http://localhost:8000/snapshot'
response = requests.get(url, timeout=10)
response.raise_for_status()

frame = cv2.imdecode(np.frombuffer(response.content, np.uint8), cv2.IMREAD_COLOR)
if frame is None:
    raise RuntimeError('Failed to decode image from snapshot')

h, w = frame.shape[:2]
print(f'Frame size: {w}x{h}')

for i in range(11):
    x = int(w * i / 10)
    y = int(h * i / 10)
    cv2.line(frame, (x, 0), (x, h), (128, 128, 128), 1)
    cv2.line(frame, (0, y), (w, y), (128, 128, 128), 1)
    cv2.putText(frame, f'{i*10}%', (x+2, 20), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 0), 1)
    cv2.putText(frame, f'{i*10}%', (2, y-2), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 0), 1)

output = 'calibration_grid.jpg'
cv2.imwrite(output, frame)
print(f'Saved: {output}')
