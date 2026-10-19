"""
🏥 Vital Signs API Service for Flutter Integration
API endpoints for Flutter to consume OCR results

Endpoints:
  /vital-signs/latest  - Get latest vital signs
  /vital-signs/health  - Health check
  /vital-signs/status  - Status information
"""

from flask import Flask, jsonify
from pathlib import Path
import json
from datetime import datetime
import threading
import time

app = Flask(__name__)

# مسار ملف النتائج
RESULTS_FILE = Path("vital_signs_latest.json")

def load_latest_vitals():
    """تحميل آخر نتائج الـ OCR"""
    try:
        if RESULTS_FILE.exists():
            with open(RESULTS_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
    except Exception as e:
        print(f"⚠️ Error loading results: {e}")
    
    return {
        "timestamp": None,
        "vitals": {
            "heart_rate": None,
            "spo2": None,
            "blood_pressure": None,
            "respiratory_rate": None,
            "temperature": None,
            "pulse": None,
            "etco2": None
        },
        "confidence": {
            "heart_rate": 0.0,
            "spo2": 0.0,
            "blood_pressure": 0.0,
            "respiratory_rate": 0.0,
            "temperature": 0.0,
            "pulse": 0.0,
            "etco2": 0.0
        },
        "status": "waiting"
    }

@app.route('/')
def index():
    """Root endpoint - API info"""
    return jsonify({
        "status": "OK",
        "service": "MedMonitor Vital Signs API",
        "version": "2.0",
        "endpoints": {
            "/vital-signs/latest": "Get latest vital signs (JSON)",
            "/vital-signs/health": "Health check",
            "/vital-signs/status": "Service status"
        }
    })

@app.route('/vital-signs/latest', methods=['GET'])
def get_latest_vitals():
    """
    احصل على آخر نتائج الـ OCR المستخرجة
    
    Response:
    {
        "timestamp": "2026-05-26T15:36:00.000Z",
        "vitals": {
            "heart_rate": 82,
            "spo2": 98,
            "blood_pressure": "120/80",
            "respiratory_rate": 16,
            "temperature": 36.5,
            "pulse": 82,
            "etco2": 38
        },
        "confidence": {
            "heart_rate": 0.90,
            "spo2": 0.90,
            "blood_pressure": 0.90,
            "respiratory_rate": 0.90,
            "temperature": 0.90,
            "pulse": 0.90,
            "etco2": 0.90
        },
        "status": "success"
    }
    """
    vitals = load_latest_vitals()
    return jsonify(vitals), 200

@app.route('/vital-signs/health', methods=['GET'])
def health():
    """التحقق من صحة الخدمة"""
    vitals = load_latest_vitals()
    last_update = vitals.get("timestamp")
    
    # التحقق من آخر تحديث (يجب أن تكون آخر 30 ثانية)
    is_fresh = False
    if last_update:
        try:
            last_time = datetime.fromisoformat(last_update)
            time_diff = (datetime.now() - last_time).total_seconds()
            is_fresh = time_diff < 30  # data is fresh if less than 30 seconds
        except:
            pass
    
    return jsonify({
        "status": "ok" if is_fresh else "waiting",
        "last_update": last_update,
        "data_fresh": is_fresh,
        "results_file_exists": RESULTS_FILE.exists()
    }), 200

@app.route('/vital-signs/status', methods=['GET'])
def status():
    """احصل على حالة استخراج الـ OCR"""
    vitals = load_latest_vitals()
    
    status_msg = "⏳ Waiting for first extraction..."
    if vitals["timestamp"]:
        status_msg = f"✅ Last update: {vitals['timestamp']}"
        if vitals["status"] != "success":
            status_msg = f"⚠️ Status: {vitals['status']}"
    
    extracted_count = sum(1 for v in vitals["vitals"].values() if v is not None)
    
    return jsonify({
        "status": vitals.get("status", "waiting"),
        "message": status_msg,
        "last_timestamp": vitals.get("timestamp"),
        "vitals_extracted": extracted_count,
        "total_vitals": 7
    }), 200

if __name__ == '__main__':
    print("\n" + "="*70)
    print("🏥 MedMonitor - Vital Signs API Service")
    print("="*70 + "\n")
    print("Endpoints:")
    print("  - Latest:  http://localhost:5000/vital-signs/latest")
    print("  - Health:  http://localhost:5000/vital-signs/health")
    print("  - Status:  http://localhost:5000/vital-signs/status")
    print("\n" + "="*70 + "\n")
    
    app.run(host='0.0.0.0', port=5000, debug=False, threaded=True)
