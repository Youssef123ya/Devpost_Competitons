"""
Simple Camera Service - نسخة مبسطة وموثوقة
"""

import cv2
import threading
import time
from flask import Flask, Response, jsonify
import sys

app = Flask(__name__)

# Global state
latest_frame = None
frame_lock = threading.Lock()
is_running = True
camera_ready = False

def capture_frames():
    """قراءة الـ frames من الكاميرا"""
    global latest_frame, is_running, camera_ready
    
    camera_index = 1  # USB Camera - 1920x1080
    
    try:
        print(f"📹 محاولة فتح الكاميرا #{camera_index}...")
        cap = cv2.VideoCapture(camera_index)
        
        if not cap.isOpened():
            print(f"❌ فشل: الكاميرا #{camera_index} لا تستجيب")
            print("جرّب Camera 0 بدلاً من ذلك...")
            
            # حاول Camera 0 كبديل
            print(f"📹 محاولة الكاميرا 0...")
            cap = cv2.VideoCapture(0)
            
            if not cap.isOpened():
                print("❌ جميع الكاميرات فشلت!")
                return
        
        print(f"✅ تم فتح الكاميرا بنجاح!")
        
        # تحسين الخصائص البسيطة
        cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
        cap.set(cv2.CAP_PROP_FPS, 30)
        
        # دع الكاميرا تستقر
        print("⏳ تهيئة الكاميرا...")
        for _ in range(10):
            cap.read()
            time.sleep(0.033)
        
        camera_ready = True
        print("✅ الكاميرا جاهزة! بدء البث...\n")
        
        # قراءة الـ frames
        while is_running:
            ret, frame = cap.read()
            
            if ret and frame is not None:
                with frame_lock:
                    latest_frame = frame.copy()
            else:
                print("⚠️ خطأ في قراءة frame")
                time.sleep(0.5)
            
            time.sleep(0.01)
        
        cap.release()
        print("🛑 الكاميرا أُغلقت")
        
    except Exception as e:
        print(f"❌ خطأ في الكاميرا: {e}")
        import traceback
        traceback.print_exc()

def generate_mjpeg():
    """بث MJPEG"""
    while is_running:
        with frame_lock:
            if latest_frame is None:
                time.sleep(0.033)
                continue
            frame = latest_frame.copy()
        
        try:
            ret, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
            if ret:
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n'
                       b'Content-Length: ' + str(len(buffer)).encode() + b'\r\n\r\n'
                       + buffer.tobytes() + b'\r\n')
        except:
            pass
        
        time.sleep(0.033)

@app.route('/stream')
def stream():
    """بث MJPEG المباشر"""
    if not camera_ready:
        return "Camera not ready", 503
    return Response(
        generate_mjpeg(),
        mimetype='multipart/x-mixed-replace; boundary=frame'
    )

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

@app.route('/health')
def health():
    """فحص صحة الخدمة"""
    return jsonify({
        "status": "running",
        "camera_ready": camera_ready,
        "frame_available": latest_frame is not None
    })

@app.route('/')
def index():
    """صفحة رئيسية"""
    return jsonify({
        "service": "MedMonitor Camera Service",
        "version": "1.0",
        "endpoints": {
            "stream": "http://localhost:8000/stream",
            "snapshot": "http://localhost:8000/snapshot",
            "health": "http://localhost:8000/health"
        }
    })

if __name__ == '__main__':
    print("\n" + "="*60)
    print("🏥 MedMonitor - Camera Service (Fixed)")
    print("="*60 + "\n")
    
    # بدء قراءة الكاميرا
    camera_thread = threading.Thread(target=capture_frames, daemon=True)
    camera_thread.start()
    
    # انتظر قليلاً لتهيئة الكاميرا
    time.sleep(2)
    
    print("\n[✓] Starting Flask Server on http://localhost:8000\n")
    print("Endpoints:")
    print("  🎥 Stream:   http://localhost:8000/stream")
    print("  📸 Snapshot: http://localhost:8000/snapshot")
    print("  ❤️  Health:   http://localhost:8000/health")
    print("\n" + "="*60 + "\n")
    
    try:
        app.run(host='0.0.0.0', port=8000, debug=False, threaded=True, use_reloader=False)
    except KeyboardInterrupt:
        print("\n\n🛑 Shutting down...")
        is_running = False
        print("✅ Stopped")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
