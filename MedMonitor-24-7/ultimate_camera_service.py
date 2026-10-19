"""
ULTIMATE CAMERA SERVICE - High Quality USB Webcam for Medical Monitor OCR
Built for: 1920x1080 @ 30fps USB camera capturing medical monitor screen

Key improvements:
- DirectShow backend (Windows)
- MJPG codec (better USB streaming)
- Manual exposure & white balance
- Light CLAHE (not aggressive)
- Light sharpen kernel only
- High JPEG quality (98%)
- OCR-optimized pipeline
"""

import cv2
import numpy as np
from flask import Flask, Response, jsonify, render_template_string
import threading
import time
import json
from datetime import datetime

app = Flask(__name__)

latest_frame = None
latest_processed = None
frame_lock = threading.Lock()

# ROI Definitions for Vital Signs (medical monitor layout)
ROI_MAP = {
    'HR': (1340, 100, 1660, 280),           # Heart Rate
    'SpO2': (1340, 285, 1660, 470),        # Oxygen Saturation
    'etCO2': (1340, 470, 1535, 610),       # End Tidal CO2
    'Pulse': (980, 640, 1085, 710),        # Pulse
    'RR': (1340, 640, 1580, 820),          # Respiratory Rate
    'Temp': (1620, 650, 1870, 830),        # Temperature
}

# Debug info
debug_info = {
    'resolution': 'N/A',
    'fps': 'N/A',
    'codec': 'N/A',
    'autofocus': 'N/A',
    'exposure': 'N/A',
    'frame_count': 0,
    'status': 'Starting...'
}

def apply_light_processing(frame):
    """
    Apply LIGHT processing only:
    1. Light CLAHE on L channel
    2. Light sharpen
    No aggressive filters!
    """
    if frame is None:
        return frame
    
    # 1. Convert to LAB
    lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    
    # 2. Apply LIGHT CLAHE (clipLimit=2.0, not 8.0!)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l = clahe.apply(l)
    
    # 3. Merge back
    lab = cv2.merge([l, a, b])
    frame = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
    
    # 4. Light sharpen ONLY
    kernel = np.array([
        [0, -1, 0],
        [-1, 5, -1],
        [0, -1, 0]
    ], dtype=np.float32) / 5.0
    
    frame = cv2.filter2D(frame, -1, kernel)
    
    # Ensure no overflow
    frame = np.clip(frame, 0, 255).astype(np.uint8)
    
    return frame

def preprocess_roi_for_ocr(roi):
    """
    Prepare ROI for OCR:
    1. Grayscale
    2. Upscale 3x
    3. Adaptive threshold
    """
    if roi is None or roi.size == 0:
        return None
    
    try:
        # 1. Grayscale
        gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
        
        # 2. Upscale 3x
        roi_upscaled = cv2.resize(gray, None, fx=3, fy=3, interpolation=cv2.INTER_CUBIC)
        
        # 3. Adaptive threshold
        thresh = cv2.adaptiveThreshold(
            roi_upscaled, 255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY, 11, 2
        )
        
        return thresh
    except:
        return None

def capture_camera_ultimate():
    """
    Ultimate camera capture with all optimizations:
    - DirectShow backend
    - MJPG codec
    - Manual settings
    - Light processing
    """
    global latest_frame, latest_processed, debug_info
    
    print("\n" + "="*70)
    print("🎥 ULTIMATE CAMERA SERVICE - Initializing")
    print("="*70 + "\n")
    
    print("📹 Opening camera with DirectShow backend...")
    cap = cv2.VideoCapture(1, cv2.CAP_DSHOW)
    
    if not cap.isOpened():
        print("❌ Camera 1 failed! Trying camera 0...")
        cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
        
        if not cap.isOpened():
            print("❌ FATAL: No cameras available!")
            debug_info['status'] = 'ERROR: No camera'
            return
    
    print("✅ Camera opened\n")
    
    # ============================================================
    # RESOLUTION & FPS
    # ============================================================
    print("🔧 Setting resolution to 1920x1080 @ 30fps...")
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)
    cap.set(cv2.CAP_PROP_FPS, 30)
    
    actual_width = cap.get(cv2.CAP_PROP_FRAME_WIDTH)
    actual_height = cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
    actual_fps = cap.get(cv2.CAP_PROP_FPS)
    
    print(f"   Resolution: {int(actual_width)}x{int(actual_height)}")
    print(f"   FPS: {actual_fps}\n")
    
    # ============================================================
    # CODEC - FORCE MJPG
    # ============================================================
    print("🔧 Setting codec to MJPG...")
    fourcc = cv2.VideoWriter_fourcc(*'MJPG')
    cap.set(cv2.CAP_PROP_FOURCC, fourcc)
    
    actual_codec_code = cap.get(cv2.CAP_PROP_FOURCC)
    codec_name = ""
    if actual_codec_code == fourcc:
        codec_name = "MJPG ✅"
    else:
        codec_name = f"Unknown ({actual_codec_code})"
    
    print(f"   Codec: {codec_name}\n")
    
    # ============================================================
    # DISABLE AUTO SETTINGS
    # ============================================================
    print("🔧 Disabling auto settings...")
    
    # Auto focus OFF
    cap.set(cv2.CAP_PROP_AUTOFOCUS, 0)
    autofocus_status = cap.get(cv2.CAP_PROP_AUTOFOCUS)
    print(f"   Autofocus: {int(autofocus_status)}")
    
    # Auto white balance OFF
    try:
        cap.set(cv2.CAP_PROP_AUTO_WB, 0)
        print(f"   Auto WB: OFF")
    except:
        print(f"   Auto WB: Not supported")
    
    # Auto exposure OFF
    cap.set(cv2.CAP_PROP_AUTO_EXPOSURE, 0.25)
    auto_exp_status = cap.get(cv2.CAP_PROP_AUTO_EXPOSURE)
    print(f"   Auto Exposure: {auto_exp_status}\n")
    
    # ============================================================
    # MANUAL EXPOSURE
    # ============================================================
    print("🔧 Setting manual exposure...")
    cap.set(cv2.CAP_PROP_EXPOSURE, -6)
    actual_exposure = cap.get(cv2.CAP_PROP_EXPOSURE)
    print(f"   Exposure: {actual_exposure}\n")
    
    # ============================================================
    # BUFFER SIZE (prevent lag)
    # ============================================================
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
    print("🔧 Buffer size: 1 (minimal lag)\n")
    
    # ============================================================
    # WARM UP
    # ============================================================
    print("⏳ Warming up camera (30 frames)...")
    for i in range(30):
        cap.read()
        time.sleep(0.033)
        if (i + 1) % 10 == 0:
            print(f"   {i+1}/30")
    
    print("✅ Camera ready!\n")
    
    # ============================================================
    # UPDATE DEBUG INFO
    # ============================================================
    debug_info.update({
        'resolution': f"{int(actual_width)}x{int(actual_height)}",
        'fps': f"{actual_fps}",
        'codec': codec_name,
        'autofocus': f"{int(autofocus_status)}",
        'exposure': f"{actual_exposure}",
        'status': 'RUNNING'
    })
    
    print("="*70)
    print("🚀 STREAMING STARTED")
    print("="*70)
    print(f"\n📺 Stream Quality:")
    print(f"   Resolution: {debug_info['resolution']}")
    print(f"   FPS: {debug_info['fps']}")
    print(f"   Codec: {debug_info['codec']}")
    print(f"   Exposure: {debug_info['exposure']}")
    print(f"\n📍 Endpoints:")
    print(f"   /stream-clean    - High quality stream")
    print(f"   /snapshot        - Current frame")
    print(f"   /ocr-view        - OCR-optimized ROIs")
    print(f"   /debug           - Debug info\n")
    
    frame_count = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            debug_info['status'] = 'ERROR: Frame read failed'
            continue
        
        # Apply light processing
        processed = apply_light_processing(frame.copy())
        
        with frame_lock:
            latest_frame = frame.copy()
            latest_processed = processed.copy()
        
        frame_count += 1
        debug_info['frame_count'] = frame_count
        
        # Log every 30 frames
        if frame_count % 30 == 0:
            print(f"✅ {frame_count} frames | Status: {debug_info['status']}")
        
        time.sleep(0.01)

@app.route('/')
def index():
    return jsonify({
        "status": "OK",
        "service": "ULTIMATE CAMERA SERVICE",
        "endpoints": {
            "/stream-clean": "High quality stream (RECOMMENDED)",
            "/snapshot": "Current frame",
            "/ocr-view": "OCR-optimized ROI view",
            "/debug": "Debug information"
        }
    })

@app.route('/stream-clean')
def stream_clean():
    """
    HIGH QUALITY STREAM
    - Natural colors
    - Sharp digits
    - OCR optimized
    - 98% JPEG quality
    """
    def gen():
        while True:
            with frame_lock:
                if latest_processed is not None:
                    frame = latest_processed.copy()
                else:
                    continue
            
            ret, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 98])
            if ret:
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n'
                       b'Content-Length: ' + str(len(buffer)).encode() + b'\r\n\r\n'
                       + buffer.tobytes() + b'\r\n')
            time.sleep(0.033)
    
    return Response(gen(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/stream')
def stream():
    """Alias for stream-clean"""
    return stream_clean()

@app.route('/snapshot')
def snapshot():
    """Current processed frame"""
    with frame_lock:
        if latest_processed is None:
            return jsonify({"error": "No frame available"}), 503
        frame = latest_processed.copy()
    
    ret, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 98])
    if ret:
        return Response(buffer.tobytes(), mimetype='image/jpeg')
    
    return jsonify({"error": "Encoding failed"}), 500

@app.route('/ocr-view')
def ocr_view():
    """
    OCR-OPTIMIZED VIEW
    Shows only vital sign ROIs cropped and enlarged
    """
    with frame_lock:
        if latest_processed is None:
            return jsonify({"error": "No frame"}), 503
        frame = latest_processed.copy()
    
    try:
        html = """
        <!DOCTYPE html>
        <html>
        <head>
            <title>OCR View - Vital Signs</title>
            <style>
                body { font-family: monospace; background: #1a1a1a; color: #00ff00; margin: 20px; }
                h1 { color: #00ff00; }
                .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
                .roi-box { background: #2a2a2a; padding: 10px; border: 2px solid #00ff00; }
                .roi-title { font-weight: bold; margin-bottom: 5px; }
                img { max-width: 100%; height: auto; border: 1px solid #00ff00; }
            </style>
        </head>
        <body>
            <h1>🔬 OCR View - Vital Signs ROIs</h1>
            <p>Cropped regions optimized for OCR extraction</p>
            <div class="grid">
        """
        
        import base64
        
        for roi_name, roi_coords in ROI_MAP.items():
            x1, y1, x2, y2 = roi_coords
            x1 = max(0, x1)
            y1 = max(0, y1)
            x2 = min(frame.shape[1], x2)
            y2 = min(frame.shape[0], y2)
            
            roi = frame[y1:y2, x1:x2].copy()
            roi_processed = preprocess_roi_for_ocr(roi)
            
            if roi_processed is not None:
                ret, buffer = cv2.imencode('.jpg', roi_processed)
                if ret:
                    img_b64 = base64.b64encode(buffer).decode()
                    html += f"""
                    <div class="roi-box">
                        <div class="roi-title">{roi_name}</div>
                        <img src="data:image/jpeg;base64,{img_b64}">
                    </div>
                    """
        
        html += """
            </div>
        </body>
        </html>
        """
        return html
    except Exception as e:
        return f"Error: {str(e)}", 500

@app.route('/debug')
def debug():
    """Debug information"""
    return jsonify({
        "status": "OK",
        "debug_info": debug_info,
        "timestamp": datetime.now().isoformat()
    })

@app.route('/dashboard')
def dashboard():
    """Web dashboard"""
    html = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>🎥 Ultimate Camera Service</title>
        <style>
            * { margin: 0; padding: 0; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0d1117; color: #c9d1d9; }
            .container { max-width: 1400px; margin: 0 auto; padding: 20px; }
            h1 { color: #58a6ff; margin-bottom: 20px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
            .card { background: #161b22; border: 1px solid #30363d; padding: 20px; border-radius: 6px; }
            .card h2 { color: #79c0ff; margin-bottom: 15px; font-size: 18px; }
            .stream-box { width: 100%; border: 2px solid #58a6ff; border-radius: 4px; overflow: hidden; }
            .stream-box img { width: 100%; height: auto; display: block; }
            .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
            .info-item { background: #0d1117; padding: 10px; border-left: 3px solid #58a6ff; }
            .info-label { font-size: 12px; color: #8b949e; }
            .info-value { font-size: 18px; color: #79c0ff; font-weight: bold; }
            .button-group { display: flex; gap: 10px; flex-wrap: wrap; }
            button { background: #238636; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; }
            button:hover { background: #2ea043; }
            .status-ok { color: #3fb950; }
            .status-error { color: #f85149; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🎥 ULTIMATE CAMERA SERVICE</h1>
            
            <div class="grid">
                <div class="card">
                    <h2>📊 System Status</h2>
                    <div class="info-grid" id="status-grid">
                        <div class="info-item">
                            <div class="info-label">Status</div>
                            <div class="info-value" id="status">Loading...</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Resolution</div>
                            <div class="info-value" id="resolution">-</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">FPS</div>
                            <div class="info-value" id="fps">-</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Frames</div>
                            <div class="info-value" id="frames">0</div>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <h2>🔧 Camera Settings</h2>
                    <div class="info-grid">
                        <div class="info-item">
                            <div class="info-label">Codec</div>
                            <div class="info-value" id="codec">-</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Exposure</div>
                            <div class="info-value" id="exposure">-</div>
                        </div>
                        <div class="info-item">
                            <div class="info-label">Autofocus</div>
                            <div class="info-value" id="autofocus">-</div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="card">
                <h2>📺 Live Stream</h2>
                <div class="stream-box">
                    <img src="/stream-clean" alt="Live Stream">
                </div>
            </div>
            
            <div class="card">
                <h2>🔗 Endpoints</h2>
                <div class="button-group">
                    <button onclick="window.open('/stream-clean', '_blank')">📹 Stream Clean</button>
                    <button onclick="window.open('/snapshot', '_blank')">📸 Snapshot</button>
                    <button onclick="window.open('/ocr-view', '_blank')">🔬 OCR View</button>
                    <button onclick="window.open('/debug', '_blank')">🐛 Debug Info</button>
                </div>
            </div>
        </div>
        
        <script>
            function updateStatus() {
                fetch('/debug')
                    .then(r => r.json())
                    .then(data => {
                        const info = data.debug_info;
                        document.getElementById('status').textContent = info.status;
                        document.getElementById('status').className = 
                            info.status.includes('RUNNING') ? 'status-ok' : 'status-error';
                        document.getElementById('resolution').textContent = info.resolution;
                        document.getElementById('fps').textContent = info.fps;
                        document.getElementById('codec').textContent = info.codec;
                        document.getElementById('exposure').textContent = info.exposure;
                        document.getElementById('autofocus').textContent = info.autofocus;
                        document.getElementById('frames').textContent = info.frame_count;
                    })
                    .catch(e => console.error(e));
            }
            
            updateStatus();
            setInterval(updateStatus, 2000);
        </script>
    </body>
    </html>
    """
    return html

if __name__ == '__main__':
    print("\n" + "="*70)
    print("🚀 ULTIMATE CAMERA SERVICE - Starting")
    print("="*70 + "\n")
    
    # Start camera capture thread
    camera_thread = threading.Thread(target=capture_camera_ultimate, daemon=True)
    camera_thread.start()
    
    # Wait for camera to initialize
    time.sleep(6)
    
    print("\n" + "="*70)
    print("✅ FLASK SERVER STARTING")
    print("="*70)
    print("\n🌐 Open in browser:")
    print("   http://localhost:8000/dashboard  - Web Dashboard")
    print("   http://localhost:8000/stream-clean - Stream")
    print("   http://localhost:8000/ocr-view - OCR ROIs")
    print("\n" + "="*70 + "\n")
    
    app.run(host='0.0.0.0', port=8000, debug=False, threaded=True)
