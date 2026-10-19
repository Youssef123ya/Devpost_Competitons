"""
High-Quality Camera Capture + Advanced Image Processing
Optimized for Medical Monitor OCR
"""

import cv2
import numpy as np
from flask import Flask, Response, jsonify
import threading
import time

app = Flask(__name__)

latest_frame = None
latest_frame_processed = None
frame_lock = threading.Lock()

def enhance_image(frame):
    """ADVANCED image enhancement for medical monitor - ULTRA AGGRESSIVE"""
    
    # ============================================================
    # STAGE 1: AGGRESSIVE DENOISING
    # ============================================================
    frame = cv2.fastNlMeansDenoisingColored(
        frame, None, 
        h=10,  # Increased from 8
        hForColorComponents=10,  # Increased from 8
        templateWindowSize=7, 
        searchWindowSize=21
    )
    
    # ============================================================
    # STAGE 2: CONVERT TO LAB FOR BETTER CONTROL
    # ============================================================
    lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    
    # ============================================================
    # STAGE 3: AGGRESSIVE CLAHE (increase clip limit)
    # ============================================================
    clahe = cv2.createCLAHE(clipLimit=5.0, tileGridSize=(4, 4))  # More aggressive
    l = clahe.apply(l)
    
    # Merge back
    lab = cv2.merge([l, a, b])
    frame = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
    
    # ============================================================
    # STAGE 4: UNSHARP MASK (better sharpening)
    # ============================================================
    gaussian = cv2.GaussianBlur(frame, (0, 0), 2.0)
    frame_sharpened = cv2.addWeighted(frame, 1.8, gaussian, -0.8, 0)
    
    # ============================================================
    # STAGE 5: MORPHOLOGICAL OPERATIONS
    # ============================================================
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    frame_sharpened = cv2.morphologyEx(frame_sharpened, cv2.MORPH_CLOSE, kernel, iterations=1)
    frame_sharpened = cv2.morphologyEx(frame_sharpened, cv2.MORPH_OPEN, kernel, iterations=1)
    
    # ============================================================
    # STAGE 6: EDGE ENHANCEMENT
    # ============================================================
    gray = cv2.cvtColor(frame_sharpened, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(gray, 50, 150)
    edges_dilated = cv2.dilate(edges, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2, 2)), iterations=1)
    
    # Enhance edges in original image
    for i in range(3):
        frame_sharpened[:, :, i] = cv2.addWeighted(
            frame_sharpened[:, :, i], 1.0,
            edges_dilated, 0.3, 0
        )
    
    # ============================================================
    # STAGE 7: CONTRAST STRETCHING
    # ============================================================
    lab_final = cv2.cvtColor(frame_sharpened, cv2.COLOR_BGR2LAB)
    l_final, a_final, b_final = cv2.split(lab_final)
    
    # Stretch contrast
    l_min, l_max = np.percentile(l_final, (2, 98))
    if l_max > l_min:
        l_final = np.clip((l_final - l_min) / (l_max - l_min) * 255, 0, 255).astype(np.uint8)
    
    lab_final = cv2.merge([l_final, a_final, b_final])
    frame_sharpened = cv2.cvtColor(lab_final, cv2.COLOR_LAB2BGR)
    
    # ============================================================
    # STAGE 8: BILATERAL FILTER (denoise while keeping edges)
    # ============================================================
    frame_sharpened = cv2.bilateralFilter(frame_sharpened, 9, 75, 75)
    
    # ============================================================
    # STAGE 9: LOCAL CONTRAST ENHANCEMENT
    # ============================================================
    frame_sharpened = cv2.convertScaleAbs(frame_sharpened, alpha=1.1, beta=10)
    
    # ============================================================
    # STAGE 10: GAMMA CORRECTION
    # ============================================================
    gamma = 0.95  # Slightly brighten
    inv_gamma = 1.0 / gamma
    table = np.array([((i / 255.0) ** inv_gamma) * 255 for i in range(256)]).astype(np.uint8)
    frame_sharpened = cv2.LUT(frame_sharpened, table)
    
    return frame_sharpened

def capture_high_quality():
    """Capture high-quality frames with optimized settings"""
    global latest_frame, latest_frame_processed
    
    print("📹 Opening camera with HIGH QUALITY settings...")
    
    # Try Camera 1 first (USB camera)
    cap = cv2.VideoCapture(1, cv2.CAP_DSHOW)
    
    if not cap.isOpened():
        print("❌ Camera 1 failed, trying Camera 0...")
        cap = cv2.VideoCapture(0)
        
        if not cap.isOpened():
            print("❌ No camera available!")
            return
    
    print("✅ Camera opened!\n")
    
    # ============================================================
    # 1. FORCE FULL HD RESOLUTION
    # ============================================================
    print("🔧 Setting resolution to 1920x1080...")
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)
    
    actual_w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    actual_h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    print(f"   Resolution: {actual_w}x{actual_h}")
    
    # ============================================================
    # 2. FORCE MJPEG CODEC
    # ============================================================
    print("🔧 Setting MJPEG codec...")
    fourcc = cv2.VideoWriter_fourcc(*'MJPG')
    cap.set(cv2.CAP_PROP_FOURCC, fourcc)
    
    # ============================================================
    # 3. REDUCE AUTO EXPOSURE (prevent overexposure)
    # ============================================================
    print("🔧 Optimizing exposure settings...")
    cap.set(cv2.CAP_PROP_AUTO_EXPOSURE, 0.25)  # Manual mode
    cap.set(cv2.CAP_PROP_EXPOSURE, -2)  # MUCH HIGHER (was -8)
    
    # ============================================================
    # 4. OPTIMIZE OTHER SETTINGS
    # ============================================================
    cap.set(cv2.CAP_PROP_AUTOFOCUS, 0)  # Manual focus
    cap.set(cv2.CAP_PROP_FOCUS, 50)  # Stronger focus for screen
    cap.set(cv2.CAP_PROP_FPS, 30)
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)  # Minimize lag
    
    # Brightness, Contrast, Saturation - MUCH MORE AGGRESSIVE
    cap.set(cv2.CAP_PROP_BRIGHTNESS, 100)    # MAXIMUM brightness (was 45)
    cap.set(cv2.CAP_PROP_CONTRAST, 150)      # MAXIMUM contrast (was 110)
    cap.set(cv2.CAP_PROP_SATURATION, 100)    # MAXIMUM saturation (was 80)
    cap.set(cv2.CAP_PROP_SHARPNESS, 100)    # Max sharpness
    cap.set(cv2.CAP_PROP_BACKLIGHT_COMPENSATION, 0)  # Disable backlight
    
    print("\n✅ All camera settings configured!\n")
    
    # Warm up camera
    print("⏳ Warming up camera (reading 30 frames)...")
    for _ in range(30):
        cap.read()
        time.sleep(0.033)
    
    print("✅ Camera ready!\n")
    
    # Capture loop
    frame_count = 0
    while True:
        ret, frame = cap.read()
        
        if not ret or frame is None:
            print("⚠️ Failed to read frame")
            time.sleep(0.1)
            continue
        
        # Enhance
        frame_enhanced = enhance_image(frame.copy())
        
        # Update globals
        with frame_lock:
            latest_frame = frame.copy()
            latest_frame_processed = frame_enhanced.copy()
        
        frame_count += 1
        if frame_count % 30 == 0:
            print(f"✅ Frames captured: {frame_count}")
        
        time.sleep(0.01)
    
    cap.release()

@app.route('/')
def index():
    return jsonify({
        "status": "OK",
        "service": "High-Quality Medical Monitor Camera",
        "resolution": "1920x1080",
        "codec": "MJPEG"
    })

@app.route('/stream')
def stream():
    """MJPEG stream - RAW"""
    def gen():
        while True:
            with frame_lock:
                if latest_frame is not None:
                    frame = latest_frame.copy()
                else:
                    time.sleep(0.01)
                    continue
            
            ret, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 95])
            if ret:
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n'
                       b'Content-Length: ' + str(len(buffer)).encode() + b'\r\n\r\n'
                       + buffer.tobytes() + b'\r\n')
            time.sleep(0.033)
    
    return Response(gen(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/stream-enhanced')
def stream_enhanced():
    """MJPEG stream - ENHANCED & PROCESSED"""
    def gen():
        while True:
            with frame_lock:
                if latest_frame_processed is not None:
                    frame = latest_frame_processed.copy()
                else:
                    time.sleep(0.01)
                    continue
            
            ret, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 95])
            if ret:
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n'
                       b'Content-Length: ' + str(len(buffer)).encode() + b'\r\n\r\n'
                       + buffer.tobytes() + b'\r\n')
            time.sleep(0.033)
    
    return Response(gen(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/snapshot')
def snapshot():
    """RAW snapshot"""
    with frame_lock:
        if latest_frame is None:
            # Return a black frame instead of 404
            frame = np.zeros((480, 640, 3), dtype=np.uint8)
            cv2.putText(frame, "Camera initializing...", (50, 240),
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
        else:
            frame = latest_frame.copy()
    
    ret, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 95])
    if ret:
        return Response(buffer.tobytes(), mimetype='image/jpeg')
    return "Error", 500

@app.route('/snapshot-enhanced')
def snapshot_enhanced():
    """ENHANCED & PROCESSED snapshot"""
    with frame_lock:
        if latest_frame_processed is None:
            return "No frame", 404
        frame = latest_frame_processed.copy()
    
    ret, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 95])
    if ret:
        return Response(buffer.tobytes(), mimetype='image/jpeg')
    return "Error", 500

@app.route('/health')
def health():
    return jsonify({
        "status": "running",
        "camera_ok": latest_frame is not None,
        "enhancement_ok": latest_frame_processed is not None
    })

if __name__ == '__main__':
    print("\n" + "="*70)
    print("🏥 HIGH-QUALITY MEDICAL MONITOR CAMERA SERVICE")
    print("="*70 + "\n")
    
    # Start camera capture thread
    camera_thread = threading.Thread(target=capture_high_quality, daemon=True)
    camera_thread.start()
    
    # Give camera time to initialize
    time.sleep(3)
    
    print("\n" + "="*70)
    print("🚀 Flask Server Ready!")
    print("="*70)
    print("\n📺 STREAMS:")
    print("  🔴 RAW:      http://localhost:8000/stream")
    print("  🟢 ENHANCED: http://localhost:8000/stream-enhanced")
    print("\n📸 SNAPSHOTS:")
    print("  🔴 RAW:      http://localhost:8000/snapshot")
    print("  🟢 ENHANCED: http://localhost:8000/snapshot-enhanced")
    print("\n" + "="*70 + "\n")
    
    app.run(host='0.0.0.0', port=8000, debug=False, threaded=True)
