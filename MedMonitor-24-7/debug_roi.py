import cv2
import json
import requests
import numpy as np

response = requests.get('http://localhost:8000/snapshot', timeout=10)
frame = cv2.imdecode(np.frombuffer(response.content, np.uint8), cv2.IMREAD_COLOR)
if frame is None:
    raise SystemExit('Failed to decode frame')

h, w = frame.shape[:2]
print(f'Camera frame resolution: {w} x {h}')

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

debug_frame = frame.copy()
for key, roi in roi_config.items():
    color = colors.get(key, (255, 255, 255))
    cv2.rectangle(debug_frame, (roi['x1'], roi['y1']), (roi['x2'], roi['y2']), color, 2)
    cv2.putText(debug_frame, key, (roi['x1'], roi['y1'] - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
cv2.imwrite('debug_roi_current.jpg', debug_frame)
print('Saved debug_roi_current.jpg')


def pct(w, h, x1pct, y1pct, x2pct, y2pct):
    return {
        'x1': int(w * x1pct / 100),
        'y1': int(h * y1pct / 100),
        'x2': int(w * x2pct / 100),
        'y2': int(h * y2pct / 100),
    }

roi_percentages = {
    'HR': pct(w, h, 60, 14, 78, 36),
    'Pulse': pct(w, h, 80, 14, 96, 32),
    'SpO2': pct(w, h, 60, 36, 78, 58),
    'Temp': pct(w, h, 80, 36, 96, 56),
    'RR': pct(w, h, 54, 54, 80, 76),
    'NBP': pct(w, h, 4, 70, 42, 90),
    'MAP': pct(w, h, 43, 70, 60, 90),
}

with open('roi_config_new.json', 'w') as f:
    json.dump(roi_percentages, f, indent=2)
print('roi_config_new.json updated')
print(json.dumps(roi_percentages, indent=2))

debug_frame2 = frame.copy()
for key, roi in roi_percentages.items():
    color = colors.get(key, (255, 255, 255))
    cv2.rectangle(debug_frame2, (roi['x1'], roi['y1']), (roi['x2'], roi['y2']), color, 2)
    cv2.putText(debug_frame2, key, (roi['x1'], roi['y1'] - 5), cv2.FONT_HERSHEY_SIMPLEX, 0.6, color, 2)
cv2.imwrite('debug_roi_new.jpg', debug_frame2)
print('Saved debug_roi_new.jpg')
