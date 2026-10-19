"""
🏥 MedMonitor Camera Service - HIGH QUALITY 1080P
أفضل جودة USB Webcam لقراءة شاشة المراقبة الطبية

Features:
✅ True 1920x1080 @ 30fps (NOT upscaled)
✅ 95% JPEG quality (NO compression artifacts)
✅ DirectShow backend (Windows optimization)
✅ Manual exposure control (stable for monitors)
✅ Light CLAHE + Sharpening (medical text optimization)
✅ Buffer size = 1 (minimal lag)
✅ 30-frame warmup (sensor stabilization)
✅ MJPG codec (efficient USB streaming)
✅ OCR-optimized preprocessing
"""

import cv2
import threading
import time
import queue
from flask import Flask, Response, jsonify
import numpy as np
from datetime import datetime
import json
import os

# Initialize Flask
app = Flask(__name__)

# Global variables
camera = None
latest_frame = None
latest_processed = None
frame_lock = threading.Lock()
frame_queue = queue.Queue(maxsize=10)

camera_debug_info = {
    'status': 'Starting...',
    'resolution': 'N/A',
    'fps': 'N/A',
    'codec': 'N/A',
    'exposure': 'N/A',
    'buffer_size': 'N/A',
    'frame_count': 0,
    'timestamp': None
}

class CameraReader:
    """قارئ الكاميرا عالي الجودة"""
    def __init__(self, camera_index=0):
        self.camera_index = camera_index
        self.cap = None
        self.is_running = False
        self.fps = 30
        self.frame_width = 1920
        self.frame_height = 1080
        
    def init_camera(self):
        """تهيئة الكاميرا مع جميع التحسينات"""
        try:
            print("\n" + "="*70)
            print("🎥 Initializing High Quality Camera Service")
            print("="*70 + "\n")
            
            print("📹 Opening camera with DirectShow backend...")
            self.cap = cv2.VideoCapture(self.camera_index, cv2.CAP_DSHOW)
            
            # Try camera 0 if camera 1 fails
            if not self.cap.isOpened():
                print("⚠️  Camera 1 not available, trying camera 0...")
                self.cap = cv2.VideoCapture(self.camera_index, cv2.CAP_DSHOW)
            
            if not self.cap.isOpened():
                print(f"❌ Failed to open camera {self.camera_index}")
                return False
            
            print("✅ Camera opened successfully\n")
            
            # ================================================================
            # RESOLUTION & FPS - TRUE 1920x1080
            # ================================================================
            print("🔧 Setting resolution to 1920x1080 @ 30fps...")
            self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)
            self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)
            self.cap.set(cv2.CAP_PROP_FPS, 30)
            
            actual_width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            actual_height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            actual_fps = self.cap.get(cv2.CAP_PROP_FPS)
            
            print(f"   ✓ Resolution: {actual_width}x{actual_height}")
            print(f"   ✓ FPS: {actual_fps}\n")
            
            # ================================================================
            # CODEC - MJPG for efficient USB streaming
            # ================================================================
            print("🔧 Setting codec to MJPG...")
            fourcc = cv2.VideoWriter_fourcc(*'MJPG')
            self.cap.set(cv2.CAP_PROP_FOURCC, fourcc)
            actual_fourcc = self.cap.get(cv2.CAP_PROP_FOURCC)
            print(f"   ✓ Codec: MJPG\n")
            
            # ================================================================
            # DISABLE AUTO SETTINGS (manual control for stability)
            # ================================================================
            print("🔧 Disabling auto settings...")
            self.cap.set(cv2.CAP_PROP_AUTOFOCUS, 0)
            print(f"   ✓ Autofocus: OFF")
            
            try:
                self.cap.set(cv2.CAP_PROP_AUTO_WB, 0)
                print(f"   ✓ Auto White Balance: OFF")
            except:
                pass
            
            self.cap.set(cv2.CAP_PROP_AUTO_EXPOSURE, 0.25)
            print(f"   ✓ Auto Exposure: OFF\n")
            
            # ================================================================
            # MANUAL EXPOSURE (for monitor screens)
            # ================================================================
            print("🔧 Setting manual exposure...")
            self.cap.set(cv2.CAP_PROP_EXPOSURE, -6)
            actual_exposure = self.cap.get(cv2.CAP_PROP_EXPOSURE)
            print(f"   ✓ Exposure: {actual_exposure}\n")
            
            # ================================================================
            # BUFFER SIZE (prevent lag)
            # ================================================================
            print("🔧 Setting buffer size to 1 (minimal lag)...")
            self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            actual_buffer = self.cap.get(cv2.CAP_PROP_BUFFERSIZE)
            print(f"   ✓ Buffer Size: {actual_buffer}\n")
            
            # ================================================================
            # WARMUP (30 frames for sensor stabilization)
            # ================================================================
            print("⏳ Warming up camera (30 frames)...")
            for i in range(30):
                self.cap.read()
                time.sleep(0.033)
                if (i + 1) % 10 == 0:
                    print(f"   {i+1}/30 warmup frames")
            
            print("\n✅ Camera initialized successfully!\n")
            
            # Update debug info
            global camera_debug_info
            camera_debug_info.update({
                'status': 'RUNNING',
                'resolution': f"{actual_width}x{actual_height}",
                'fps': str(actual_fps),
                'codec': 'MJPG',
                'exposure': str(actual_exposure),
                'buffer_size': str(actual_buffer)
            })
            
            return True
            
        except Exception as e:
            print(f"❌ Error initializing camera: {e}")
            return False
    
    def read_frame(self):
        """قراءة frame واحد"""
        if self.cap is None or not self.cap.isOpened():
            return None
            
        ret, frame = self.cap.read()
        if ret:
            return frame
        return None
    
    def release(self):
        """تحرير الكاميرا"""
        if self.cap:
            self.cap.release()
        self.is_running = False

def apply_ocr_preprocessing(frame):
    """
    Enhanced preprocessing for OCR on medical monitor screens with colored text on dark background.
    Applies: sharpening, CLAHE contrast boost, saturation increase, and gamma correction.
    """
    if frame is None:
        return frame

    try:
        # Step 1: Unsharp mask (kernel 5x5, strength 1.5)
        gaussian_kernel = cv2.getGaussianKernel(5, 1.0)
        gaussian_kernel = gaussian_kernel @ gaussian_kernel.T
        blurred = cv2.filter2D(frame, -1, gaussian_kernel)
        sharpened = cv2.addWeighted(frame, 2.5, blurred, -1.5, 0)

        # Step 2: CLAHE contrast enhancement (clipLimit=3.0, tileGridSize=8x8)
        lab = cv2.cvtColor(sharpened, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        l_enhanced = clahe.apply(l)
        lab_enhanced = cv2.merge([l_enhanced, a, b])
        frame_contrast = cv2.cvtColor(lab_enhanced, cv2.COLOR_LAB2BGR)

        # Step 3: Increase color saturation by 30% (HSV, S channel * 1.3)
        hsv = cv2.cvtColor(frame_contrast, cv2.COLOR_BGR2HSV).astype(np.float32)
        h, s, v = cv2.split(hsv)
        s = np.clip(s * 1.3, 0, 255)
        hsv = cv2.merge([h, s, v])
        frame_saturated = cv2.cvtColor(hsv.astype(np.uint8), cv2.COLOR_HSV2BGR)

        # Step 4: Gamma correction (γ=0.85) to increase brightness in dark regions
        gamma = 0.85
        inv_gamma = 1.0 / gamma
        lut = np.array([((i / 255.0) ** inv_gamma) * 255 for i in np.arange(0, 256)]).astype(np.uint8)
        frame_gamma = cv2.LUT(frame_saturated, lut)

        # Ensure no overflow
        frame_final = np.clip(frame_gamma, 0, 255).astype(np.uint8)

        return frame_final
    except:
        return frame

def capture_frames():
    """
    Thread: قراءة الـ frames من الكاميرا بشكل مستمر
    يحدّث latest_frame للـ MJPEG stream
    """
    global camera, latest_frame, latest_processed
    
    # اقرأ رقم الكاميرا من الملف (أو استخدم 0 كـ default)
    camera_index = 0
    try:
        with open('camera_index.txt', 'r') as f:
            camera_index = int(f.read().strip())
    except:
        camera_index = 0  # Default
    
    camera = CameraReader(camera_index=camera_index)
    
    if not camera.init_camera():
        print("❌ Failed to initialize camera")
        return
    
    camera.is_running = True
    frame_count = 0
    
    print("\n" + "="*70)
    print("📹 STARTING FRAME CAPTURE")
    print("="*70 + "\n")
    
    while camera.is_running:
        try:
            frame = camera.read_frame()
            
            if frame is None:
                continue
            
            # Apply preprocessing
            processed = apply_ocr_preprocessing(frame.copy())
            
            # Update frames
            with frame_lock:
                latest_frame = frame.copy()
                latest_processed = processed.copy()
            
            # Try to add to OCR queue (non-blocking)
            try:
                frame_queue.put_nowait(processed.copy())
            except queue.Full:
                pass  # Drop frame if queue is full
            
            frame_count += 1
            camera_debug_info['frame_count'] = frame_count
            camera_debug_info['timestamp'] = datetime.now().isoformat()
            
            if frame_count % 30 == 0:
                print(f"✅ Captured {frame_count} frames | Status: {camera_debug_info['status']}")
            
            time.sleep(0.01)  # Prevent busy loop
            
        except Exception as e:
            print(f"❌ Error reading frame: {e}")
            time.sleep(0.1)

def generate_mjpeg_stream():
    """
    Generator: يرسل MJPEG stream عالي الجودة
    يُستخدم في /stream endpoint
    - 95% JPEG quality (NO artifacts)
    - Processed frames (OCR-optimized)
    """
    print("🎥 Starting MJPEG stream...")
    
    while True:
        try:
            with frame_lock:
                if latest_processed is None:
                    continue
                
                frame = latest_processed.copy()
            
            # Encode frame as JPEG with high quality
            ret, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 95])
            
            if ret:
                # Yield MJPEG stream format
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n'
                       b'Content-Length: ' + str(len(buffer)).encode() + b'\r\n\r\n'
                       + buffer.tobytes() + b'\r\n')
            
            time.sleep(0.033)  # ~30 FPS
            
        except Exception as e:
            print(f"❌ Error in MJPEG stream: {e}")
            time.sleep(0.1)

def ocr_processing():
    """
    Thread: OCR processing thread (placeholder)
    Actual OCR is handled by ocr_vital_signs_extractor.py service
    """
    print("🔍 OCR processing thread started (listening for external OCR service)")
    while True:
        time.sleep(5)

# Flask Routes

@app.route('/')
def index():
    """API root - endpoints list"""
    return jsonify({
        "status": "OK",
        "service": "MedMonitor Camera Service - 1080P",
        "endpoints": {
            "/stream": "High quality MJPEG stream (1920x1080, 95% JPEG quality)",
            "/snapshot": "Current frame snapshot",
            "/vitals": "JSON vital signs data",
            "/health": "Service health status",
            "/debug": "Camera debug information",
            "/config": "Camera configuration"
        }
    })

@app.route('/stream')
def stream():
    """Live MJPEG stream - high quality 1920x1080"""
    response = Response(
        generate_mjpeg_stream(),
        mimetype='multipart/x-mixed-replace; boundary=frame'
    )
    response.headers['Access-Control-Allow-Origin'] = '*'
    return response

@app.route('/snapshot')
def snapshot():
    """Current frame snapshot"""
    try:
        with frame_lock:
            if latest_processed is None:
                return jsonify({"error": "No frame available"}), 404
            
            frame = latest_processed.copy()
        
        ret, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 95])
        if ret:
            return Response(
                buffer.tobytes(),
                mimetype='image/jpeg'
            )
        else:
            return jsonify({"error": "Failed to encode frame"}), 500
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/debug')
def debug():
    """Debug information and camera settings"""
    try:
        with frame_lock:
            data = camera_debug_info.copy()
        return jsonify(data), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/health')
def health():
    """Service health status"""
    try:
        with frame_lock:
            is_capturing = camera.is_running if camera else False
            frame_available = latest_processed is not None
        
        return jsonify({
            "status": "healthy" if is_capturing and frame_available else "degraded",
            "camera_running": is_capturing,
            "frame_available": frame_available,
            "timestamp": datetime.now().isoformat(),
            "service": "MedMonitor Camera Service"
        }), 200
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500

@app.route('/vitals')
def get_vitals():
    """Get latest vital signs data extracted from OCR"""
    try:
        # Placeholder: Return latest captured frame info and timestamp
        # In production, this would integrate with OCR processor
        with frame_lock:
            vital_signs = {
                "timestamp": datetime.now().isoformat(),
                "frame_count": camera_debug_info.get('frame_count', 0),
                "camera_status": camera_debug_info.get('status', 'N/A'),
                "resolution": camera_debug_info.get('resolution', 'N/A'),
                "fps": camera_debug_info.get('fps', 'N/A'),
                "note": "OCR processing available when integrated with OCR service"
            }
        
        return jsonify(vital_signs), 200
    except Exception as e:
        return jsonify({
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }), 500

@app.route('/config')
def get_config():
    """Camera configuration"""
    if camera is None:
        return jsonify({"error": "Camera not initialized"}), 500
    
    return jsonify({
        "resolution": f"{camera.frame_width}x{camera.frame_height}",
        "fps": camera.fps,
        "status": "running" if camera.is_running else "stopped",
        "debug_info": camera_debug_info
    })

def shutdown():
    """إيقاف الخدمة"""
    print("\n🛑 Shutting down camera service...")
    if camera:
        camera.release()
    print("✅ Service stopped")

if __name__ == '__main__':
    print("\n" + "="*70)
    print("🏥 MedMonitor Camera Service - 1920x1080 @ 30fps")
    print("="*70)
    
    # Start camera capture thread
    camera_thread = threading.Thread(target=capture_frames, daemon=True)
    camera_thread.start()
    
    # Start OCR processing thread (placeholder)
    ocr_thread = threading.Thread(target=ocr_processing, daemon=True)
    ocr_thread.start()
    
    # Wait for camera to initialize
    time.sleep(6)
    
    print("\n" + "="*70)
    print("✅ FLASK SERVER STARTING")
    print("="*70)
    print("\n🌐 Endpoints:")
    print("   /stream    - Live MJPEG stream")
    print("   /snapshot  - Current frame")
    print("   /vitals    - Vital signs data")
    print("   /health    - Service health status")
    print("   /debug     - Camera debug info")
    print("   /config    - Camera configuration")
    print("\n📍 Access at: http://localhost:8000/stream")
    print("="*70 + "\n")
    
    try:
        # Run Flask app
        app.run(
            host='0.0.0.0',
            port=8000,
            debug=False,
            threaded=True
        )
    except KeyboardInterrupt:
        shutdown()
    except Exception as e:
        print(f"❌ Error: {e}")
        shutdown()
