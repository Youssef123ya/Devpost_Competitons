import cv2

cap = cv2.VideoCapture('http://localhost:8000/stream')
print('opened:', cap.isOpened())
if cap.isOpened():
    ret, frame = cap.read()
    print('read:', ret, 'frame shape:', None if frame is None else frame.shape)
    cap.release()
