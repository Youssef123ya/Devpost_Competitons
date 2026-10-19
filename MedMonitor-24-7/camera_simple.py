"""
Simple Camera Service - Stream & Snapshot
الكاميرا الخام بدون أي معالجة
"""

import cv2
from flask import Flask, Response, jsonify
import threading
import time

app = Flask(__name__)
latest_frame = None
frame_lock = threading.Lock()

def capture_camera():
    """اقرأ من الكاميرا - بدون معالجة"""
    global latest_frame
    
    print("📹 Opening camera...")
    cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("❌ Camera failed!")
        return
    
    print("✅ Camera opened\n")
    
    frame_count = 0
    while True:
        ret, frame = cap.read()
        if ret:
            with frame_lock:
                latest_frame = frame.copy()
            frame_count += 1
        
        time.sleep(0.01)

@app.route('/')
def index():
    return jsonify({"status": "OK"})

@app.route('/stream')
def stream():
    """البث المباشر"""
    def gen():
        while True:
            with frame_lock:
                if latest_frame is not None:
                    frame = latest_frame.copy()
                else:
                    continue
            
            ret, buffer = cv2.imencode('.jpg', frame)
            if ret:
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n'
                       b'Content-Length: ' + str(len(buffer)).encode() + b'\r\n\r\n'
                       + buffer.tobytes() + b'\r\n')
            time.sleep(0.033)
    
    return Response(gen(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/snapshot')
def snapshot():
    """صورة واحدة"""
    with frame_lock:
        if latest_frame is None:
            return "No frame", 404
        frame = latest_frame.copy()
    
    ret, buffer = cv2.imencode('.jpg', frame)
    if ret:
        return Response(buffer.tobytes(), mimetype='image/jpeg')
    
    return "Error", 500

if __name__ == '__main__':
    print("\n" + "="*50)
    print("📹 Camera Service - Simple")
    print("="*50 + "\n")
    
    t = threading.Thread(target=capture_camera, daemon=True)
    t.start()
    
    time.sleep(2)
    
    print("🚀 Running!\n")
    print("📺 Stream:   http://localhost:8000/stream")
    print("📸 Snapshot: http://localhost:8000/snapshot")
    print("\n" + "="*50 + "\n")
    
    app.run(host='0.0.0.0', port=8000, debug=False)
