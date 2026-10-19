import cv2
import requests
import numpy as np
import easyocr

r = requests.get('http://localhost:8000/snapshot', timeout=10)
r.raise_for_status()
frame = cv2.imdecode(np.frombuffer(r.content, np.uint8), cv2.IMREAD_COLOR)
reader = easyocr.Reader(['en'], gpu=False)
results = reader.readtext(frame, detail=1)
for bbox, text, conf in results:
    print(conf, text, bbox)
