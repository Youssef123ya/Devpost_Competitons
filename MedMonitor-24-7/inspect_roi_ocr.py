import cv2
import numpy as np
import requests
from pathlib import Path
import camera_ocr_complete as mod

url = 'http://localhost:8000/snapshot'
r = requests.get(url, timeout=10)
r.raise_for_status()
frame = cv2.imdecode(np.frombuffer(r.content, np.uint8), cv2.IMREAD_COLOR)
if frame is None:
    raise RuntimeError('Failed to load snapshot')

h, w = frame.shape[:2]
print('frame', w, h)
roi_map = mod.get_roi_map(w, h)

for vital, rect in roi_map.items():
    x1, y1, x2, y2 = rect
    print(f'{vital}: {rect} -> {x1/w:.2f},{y1/h:.2f} to {x2/w:.2f},{y2/h:.2f}')
    roi = frame[y1:y2, x1:x2].copy()
    cv2.imwrite(f'roi_{vital}.jpg', roi)
    processed = mod.preprocess_roi(roi, vital)
    if processed is not None:
        cv2.imwrite(f'roi_{vital}_processed.jpg', processed)
    text, conf = mod.extract_ocr_from_roi(roi, vital)
    val, raw_text, conf2 = mod.extract_value_for_vital(roi, vital)
    print(' raw', text, conf, 'value', val, raw_text, conf2)
    print('---')
