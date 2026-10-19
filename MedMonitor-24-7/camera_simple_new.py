"""
Camera Service - SIMPLE (بدون معالجة زائدة)
الصورة الأصلية الخام أفضل بكثير!
"""

import cv2
from flask import Flask, Response, jsonify
import threading
import time

app = Flask(__name__)

latest_frame = None
frame_lock = threading.Lock()

def capture_camera():
    """اقرأ الـ frames من الكاميرا"""
    global latest_frame
    
    print("📹 فتح الكاميرا 1...")
    cap = cv2.VideoCapture(1)
    
    if not cap.isOpened():
        print("❌ فشل! محاولة الكاميرا 0...")
        cap = cv2.VideoCapture(0)
        
        if not cap.isOpened():
            print("❌ لا توجد كاميرات!")
            return
    
    # إعدادات الكاميرا البسيطة
    print("🔧 تطبيق إعدادات الكاميرا...")
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)
    cap.set(cv2.CAP_PROP_FPS, 30)
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
    
    # تدفئة الكاميرا
    print("⏳ تدفئة الكاميرا (30 إطار)...")
    for _ in range(30):
        cap.read()
        time.sleep(0.033)
    
    print("✅ الكاميرا جاهزة!")
    
    frame_count = 0
    while True:
        ret, frame = cap.read()
        if ret:
            with frame_lock:
                latest_frame = frame.copy()
            
            frame_count += 1
            if frame_count % 30 == 0:
                print(f"✅ {frame_count} frames captured")
        
        time.sleep(0.01)

@app.route('/')
def index():
    return jsonify({"status": "OK", "message": "Camera Service Running"})

@app.route('/stream')
def stream():
    """بث الكاميرا الخام"""
    def gen():
        while True:
            with frame_lock:
                if latest_frame is not None:
                    frame = latest_frame.copy()
                else:
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
    """صورة واحدة"""
    with frame_lock:
        if latest_frame is None:
            return "No frame available", 404
        frame = latest_frame.copy()
    
    try:
        ret, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 95])
        if ret:
            return Response(buffer.tobytes(), mimetype='image/jpeg')
    except:
        pass
    
    return "Error encoding frame", 500

@app.route('/stream-enhanced')
def stream_enhanced():
    """نفس البث الخام (لا توجد معالجة)"""
    return stream()

@app.route('/snapshot-enhanced')
def snapshot_enhanced():
    """نفس الصورة الخام (لا توجد معالجة)"""
    return snapshot()

if __name__ == '__main__':
    print("\n" + "="*70)
    print("🎥 Camera Service - SIMPLE & RAW")
    print("="*70 + "\n")
    
    # بدء الكاميرا
    t = threading.Thread(target=capture_camera, daemon=True)
    t.start()
    
    time.sleep(5)
    
    print("\n🚀 Flask running!\n")
    print("📺 STREAM:")
    print("  http://localhost:8000/stream")
    print("\n📸 SNAPSHOT:")
    print("  http://localhost:8000/snapshot")
    print("\n" + "="*70 + "\n")
    
    app.run(host='0.0.0.0', port=8000, debug=False)
