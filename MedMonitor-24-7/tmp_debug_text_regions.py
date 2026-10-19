import cv2
import numpy as np
from pathlib import Path

img_path = Path('snapshot_20260530_000000_170.jpg')
img = cv2.imread(str(img_path))
if img is None:
    raise SystemExit('snapshot image not found')

h, w = img.shape[:2]
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8,8))
enhanced = clahe.apply(gray)
_, thresh = cv2.threshold(enhanced, 100, 255, cv2.THRESH_BINARY)

# Morphological cleanup
kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5,5))
closed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel, iterations=2)

contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
boxes = []
for cnt in contours:
    x,y,ww,hh = cv2.boundingRect(cnt)
    if ww < 50 or hh < 20:
        continue
    if ww*hh < 500:
        continue
    boxes.append((x,y,ww,hh))

# Sort boxes by y then x
boxes = sorted(boxes, key=lambda b: (b[1], b[0]))
output = img.copy()
for i,(x,y,ww,hh) in enumerate(boxes):
    cv2.rectangle(output, (x,y), (x+ww,y+hh), (0,255,0), 2)
    cv2.putText(output, str(i), (x, y-8), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0,255,0), 2)

cv2.imwrite('tmp_text_regions.jpg', output)
print('image shape', img.shape)
print('boxes count', len(boxes))
for i,(x,y,ww,hh) in enumerate(boxes):
    print(i, x, y, x+ww, y+hh, ww, hh, round(x/w,3), round(y/h,3), round((x+ww)/w,3), round((y+hh)/h,3))
