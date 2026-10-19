"""
Quick USB Camera Detection
"""
import cv2

print("\n" + "="*60)
print("🔍 USB Camera Detection")
print("="*60 + "\n")

for i in range(5):
    try:
        cap = cv2.VideoCapture(i, cv2.CAP_DSHOW)
        if cap.isOpened():
            ret, frame = cap.read()
            if ret:
                print(f"✅ Camera {i}: WORKING")
                print(f"   Resolution: {frame.shape[1]}x{frame.shape[0]}")
            cap.release()
    except:
        pass

print("\n" + "="*60)
print("Done!")
print("="*60 + "\n")
