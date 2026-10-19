import cv2
import numpy as np
import requests
import camera_ocr_complete as mod

r = requests.get('http://localhost:8000/snapshot', timeout=10)
r.raise_for_status()
frame = cv2.imdecode(np.frombuffer(r.content, np.uint8), cv2.IMREAD_COLOR)
if frame is None:
    raise SystemExit('No frame')
w,h = frame.shape[1], frame.shape[0]
roi_map = mod.get_roi_map(w,h)
for vital, rect in roi_map.items():
    x1,y1,x2,y2 = rect
    roi = frame[y1:y2, x1:x2]
    raw_text, raw_conf = mod.extract_digits_from_image(roi, vital)
    proc = mod.preprocess_roi(roi, vital)
    proc_text, proc_conf = ('',0)
    if proc is not None:
        proc_text, proc_conf = mod.extract_digits_from_image(proc, vital)
    preprocessed = mod.apply_frame_preprocessing(frame)
    pre_roi = preprocessed[y1:y2, x1:x2]
    pre_val, pre_text, pre_conf = mod.extract_value_for_vital(pre_roi, vital)
    val, raw_text2, conf2 = mod.extract_value_for_vital(roi, vital)
    print(vital, 'raw_text', raw_text, raw_conf, 'proc_text', proc_text, proc_conf, 'extract', val, raw_text2, conf2, 'preprocessed', pre_val, pre_text, pre_conf)
