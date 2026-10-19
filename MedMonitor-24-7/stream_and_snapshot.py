"""
🎥 Simple Stream + Snapshot Script
تشغيل الكاميرا والـ snapshot كل 5 ثواني
"""

import argparse
import os
import cv2
import threading
import time
from flask import Flask, Response, jsonify
import numpy as np
from datetime import datetime

app = Flask(__name__)

# Global variables
latest_frame = None
frame_lock = threading.Lock()
snapshot_count = 0
camera_debug_info = {
    'status': 'initializing',
    'resolution': '1280x720',
    'fps': 30,
    'snapshots_saved': 0,
    'frames_captured': 0,
    'last_seen': None,
    'camera_index': None
}

class SimpleCamera:
    def __init__(self, camera_index=None):
        self.cap = None
        self.is_running = False
        self.requested_index = camera_index
        self.selected_backend = None
        
    def try_open_capture(self, idx):
        """Try opening a capture index with multiple Windows backends."""
        # Try default backend first (most reliable)
        try:
            cap = cv2.VideoCapture(idx)
            if cap.isOpened():
                return cap, None
        except:
            pass

        # Then try other backends
        backends = [cv2.CAP_DSHOW, cv2.CAP_MSMF, cv2.CAP_VFW]
        for backend in backends:
            try:
                cap = cv2.VideoCapture(idx, backend)
            except Exception:
                continue

            if cap.isOpened():
                return cap, backend
            cap.release()
        return None, None

    def init_camera(self):
        """Initialize camera"""
        print("📹 Opening camera...")
        self.cap = None
        selected_index = None

        if self.requested_index is not None:
            camera_indices = [self.requested_index]
            print(f"🔧 Requesting camera index: {self.requested_index}")
        else:
            camera_indices = [0, 1]  # Try 0 first, then 1

        for idx in camera_indices:
            cap, backend = self.try_open_capture(idx)
            if cap is not None:
                self.cap = cap
                selected_index = idx
                self.selected_backend = backend
                break

        if self.cap is None and self.requested_index is not None:
            print(f"⚠️ Requested index {self.requested_index} failed, scanning all indices 0..6...")
            for idx in range(7):
                cap, backend = self.try_open_capture(idx)
                if cap is not None:
                    self.cap = cap
                    selected_index = idx
                    self.selected_backend = backend
                    break

        if self.cap is None or not self.cap.isOpened():
            print("❌ No camera found for requested indices:", camera_indices)
            available = list_available_cameras(max_index=6)
            print("Detected open camera indices:", available)
            return False

        # Set to 1280x720 (more stable than 1920x1080)
        self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
        self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
        self.cap.set(cv2.CAP_PROP_FPS, 30)
        
        print("✅ Camera ready!")
        width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = int(self.cap.get(cv2.CAP_PROP_FPS)) or 30
        print(f"   Camera index: {selected_index}")
        print(f"   Backend: {self.selected_backend if self.selected_backend is not None else 'default'}")
        print(f"   Resolution: {width}x{height}")
        print(f"   FPS: {fps}")
        with frame_lock:
            camera_debug_info['camera_index'] = selected_index
            camera_debug_info['resolution'] = f"{width}x{height}"
            camera_debug_info['fps'] = fps
            camera_debug_info['status'] = 'initialized'
        
        return True

    def read_frame(self):
        """قراءة frame"""
        if not self.cap or not self.cap.isOpened():
            return None
        ret, frame = self.cap.read()
        return frame if ret else None

    def release(self):
        """إطلاق الكاميرا"""
        if self.cap:
            self.cap.release()


def list_available_cameras(max_index=5):
    """Probe and print available camera indices."""
    available = []
    for idx in range(max_index + 1):
        try:
            cap = cv2.VideoCapture(idx, cv2.CAP_DSHOW)
        except Exception:
            cap = cv2.VideoCapture(idx)

        if cap.isOpened():
            available.append(idx)
            cap.release()
    return available

camera_index = None
if 'CAMERA_INDEX' in os.environ:
    try:
        camera_index = int(os.environ['CAMERA_INDEX'])
    except ValueError:
        print("⚠️ Invalid CAMERA_INDEX environment variable. It must be an integer.")

camera = SimpleCamera(camera_index=camera_index)

def capture_and_snapshot():
    """
    Thread: قراءة الكاميرا وأخذ snapshot كل 5 ثواني
    """
    global latest_frame, snapshot_count
    
    if not camera.init_camera():
        return
    
    camera.is_running = True
    last_snapshot_time = time.time()
    frame_count = 0
    
    print("\n📹 Starting capture loop...")
    print("💾 Snapshots will be saved every 5 seconds\n")
    
    while camera.is_running:
        try:
            frame = camera.read_frame()
            
            if frame is None:
                continue
            
            # Update latest frame
            with frame_lock:
                latest_frame = frame.copy()
                camera_debug_info['frames_captured'] += 1
                camera_debug_info['last_seen'] = datetime.now().isoformat()
            
            # Take snapshot every 5 seconds
            current_time = time.time()
            if current_time - last_snapshot_time >= 5:
                snapshot_count += 1
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                filename = f"snapshot_{timestamp}_{snapshot_count}.jpg"
                
                cv2.imwrite(filename, frame)
                print(f"✅ [{timestamp}] Snapshot saved: {filename}")
                with frame_lock:
                    camera_debug_info['snapshots_saved'] = snapshot_count
                last_snapshot_time = current_time
            
            frame_count += 1
            
            if frame_count % 30 == 0:
                print(f"📊 {frame_count} frames captured")
            
            time.sleep(0.01)
            
        except Exception as e:
            print(f"❌ Error: {e}")
            time.sleep(0.1)

def generate_mjpeg_stream():
    """
    Generator: بث MJPEG مباشر
    """
    print("🎥 Starting MJPEG stream...")
    
    while True:
        try:
            with frame_lock:
                if latest_frame is None:
                    continue
                frame = latest_frame.copy()
            
            # Encode to JPEG
            ret, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 95])
            
            if ret:
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n'
                       b'Content-Length: ' + str(len(buffer)).encode() + b'\r\n\r\n'
                       + buffer.tobytes() + b'\r\n')
            
            time.sleep(0.033)  # ~30 FPS
            
        except Exception as e:
            print(f"❌ Stream error: {e}")
            time.sleep(0.1)

@app.route('/stream')
def stream():
    """البث المباشر"""
    return Response(
        generate_mjpeg_stream(),
        mimetype='multipart/x-mixed-replace; boundary=frame'
    )

@app.route('/snapshot')
def snapshot():
    """صورة واحدة"""
    try:
        with frame_lock:
            if latest_frame is None:
                return jsonify({"error": "No frame available"}), 404
            frame = latest_frame.copy()
        
        ret, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 95])
        if ret:
            return Response(buffer.tobytes(), mimetype='image/jpeg')
        else:
            return jsonify({"error": "Encode failed"}), 500
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/')
def index():
    """الرئيسية"""
    return jsonify({
        "status": "🟢 RUNNING",
        "endpoints": {
            "/stream": "Live MJPEG stream (1920x1080, 30fps, 95% quality)",
            "/snapshot": "Current frame JPEG",
            "/vitals": "Current camera vitals/status",
            "/health": "Service health status",
            "/config": "Camera configuration",
            "/debug": "Debug info"
        },
        "info": {
            "resolution": camera_debug_info.get('resolution'),
            "fps": camera_debug_info.get('fps'),
            "quality": "95%",
            "snapshots_saved": snapshot_count,
            "frames_captured": camera_debug_info.get('frames_captured')
        }
    })

@app.route('/vitals')
def vitals():
    """Return current camera status and vitals-like summary"""
    with frame_lock:
        return jsonify({
            "status": "OK" if latest_frame is not None else "waiting",
            "camera_status": camera_debug_info.get('status'),
            "resolution": camera_debug_info.get('resolution'),
            "fps": camera_debug_info.get('fps'),
            "frames_captured": camera_debug_info.get('frames_captured'),
            "snapshots_saved": camera_debug_info.get('snapshots_saved'),
            "last_seen": camera_debug_info.get('last_seen')
        }), 200

@app.route('/health')
def health():
    """Return live health status for the service"""
    with frame_lock:
        frame_available = latest_frame is not None
        status = 'healthy' if frame_available else 'degraded'
    return jsonify({
        "status": status,
        "camera_running": camera.is_running,
        "frame_available": frame_available,
        "timestamp": datetime.now().isoformat()
    }), 200

@app.route('/config')
def config():
    """Return camera configuration details"""
    with frame_lock:
        return jsonify({
            "resolution": camera_debug_info.get('resolution'),
            "fps": camera_debug_info.get('fps'),
            "status": camera_debug_info.get('status'),
            "snapshots_saved": camera_debug_info.get('snapshots_saved'),
            "camera_index": camera_debug_info.get('camera_index')
        }), 200

@app.route('/debug')
def debug():
    """Return detailed debug information"""
    with frame_lock:
        return jsonify(camera_debug_info), 200

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Stream + snapshot service for webcam.')
    parser.add_argument('--camera', type=int, help='Camera index to use (e.g. 0 for built-in, 1 for USB)')
    parser.add_argument('--list-cameras', action='store_true', help='List available camera indices and exit')
    args = parser.parse_args()

    if args.camera is not None:
        camera.requested_index = args.camera
    elif camera.requested_index is None and 'CAMERA_INDEX' in os.environ:
        # already parsed above
        pass

    if args.list_cameras:
        available = list_available_cameras(max_index=6)
        print("Available camera indices:", available)
        if not available:
            print("No cameras detected. تأكد من توصيل الكاميرا و حاول مرة أخرى.")
        else:
            print("جرب استخدام --camera <index> مع أحد هذه الأرقام لالتقاط كاميرا USB.")
        raise SystemExit(0)

    print("\n" + "="*70)
    print("🎥 Simple Stream + Snapshot Service")
    print("="*70 + "\n")
    
    # Start capture thread
    capture_thread = threading.Thread(target=capture_and_snapshot, daemon=True)
    capture_thread.start()
    
    # Wait for camera to initialize
    time.sleep(3)
    
    print("\n" + "="*70)
    print("✅ SERVER STARTING")
    print("="*70)
    print("\n📺 Stream: http://localhost:8000/stream")
    print("📸 Snapshot: http://localhost:8000/snapshot")
    print("ℹ️  Info: http://localhost:8000/")
    print("\n💾 Snapshots saved as: snapshot_YYYYMMDD_HHMMSS_#.jpg")
    print("="*70 + "\n")
    
    try:
        app.run(host='0.0.0.0', port=8000, debug=False, threaded=True)
    except KeyboardInterrupt:
        print("\n🛑 Stopping...")
        camera.is_running = False
        camera.release()
        print("✅ Done")
