import cv2
import time
import numpy as np

print("[*] Testing cameras with longer warmup...")

for camera_idx in [0, 1, 2]:
    print(f"\n[*] Camera {camera_idx}...")
    cap = cv2.VideoCapture(camera_idx)

    if not cap.isOpened():
        print(f"   [-] Cannot open Camera {camera_idx}")
        continue

    print(f"   [+] Camera {camera_idx} opened")
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

    # Wait 15 seconds for warmup
    print(f"   [*] Warmup in progress (15 seconds)...")
    for i in range(15):
        ret, frame = cap.read()
        if ret and frame is not None:
            mean_val = np.mean(frame)
            if mean_val > 10:
                print(f"      [+] Frame {i+1}: Not black! Mean={mean_val:.2f}")
                print(f"      Resolution: {frame.shape}")
                cv2.imwrite(f'camera_{camera_idx}_test.jpg', frame)
                print(f"      [+] Saved: camera_{camera_idx}_test.jpg")
                break
        if i % 5 == 0:
            print(f"      Wait {i+1}s...")
        time.sleep(1)

    cap.release()

print("\n[+] Test complete")
