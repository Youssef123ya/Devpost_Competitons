import re
from pathlib import Path
import cv2

path = Path('ocr_vital_signs_extractor.py')
text = path.read_text(encoding='utf-8')
match = re.search(r'ROI_PERCENTAGES\s*=\s*\{([^}]+)\}', text, re.S)
if not match:
    raise SystemExit('ROI_PERCENTAGES not found')
block = match.group(1)
lines = [line.strip() for line in block.splitlines() if line.strip() and not line.strip().startswith('#')]
print('ROI definitions:')
for line in lines:
    if ':' not in line:
        continue
    key = line.split(':', 1)[0].strip().strip("'\"")
    nums = [float(x) for x in re.findall(r'([0-9.]+)', line)]
    print(f'{key}: {nums}')

img = cv2.imread('snapshot_20260530_000000_170.jpg')
if img is None:
    raise SystemExit('Failed to load snapshot image')
print('snapshot shape:', img.shape)

for line in lines:
    if ':' not in line:
        continue
    key = line.split(':', 1)[0].strip().strip("'\"")
    nums = [float(x) for x in re.findall(r'([0-9.]+)', line)]
    w = img.shape[1]
    h = img.shape[0]
    x1 = int(w * nums[0])
    y1 = int(h * nums[1])
    x2 = int(w * nums[2])
    y2 = int(h * nums[3])
    print(f'{key}: {x1},{y1},{x2},{y2} width={x2-x1} height={y2-y1}')
    crop = img[y1:y2, x1:x2]
    if crop.size == 0:
        print('  Crop empty!')
    else:
        cv2.imwrite(f'tmp_crop_{key}.jpg', crop)
print('Saved debug crops tmp_crop_<key>.jpg')
