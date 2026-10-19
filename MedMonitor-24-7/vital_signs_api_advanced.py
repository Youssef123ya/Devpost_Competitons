"""
🏥 Vital Signs API - Flask Backend
يقدم API endpoint للـ Flutter app
"""

from flask import Flask, jsonify, request
import json
from pathlib import Path
import threading
import time
from datetime import datetime
from copy import deepcopy

app = Flask(__name__)

# Global state
latest_vitals = {
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
    }
}

# Mapping from OCR keys to API keys
OCR_TO_API_MAP = {
    'HR': 'heart_rate',
    'SpO2': 'spo2',
    'NBP': 'blood_pressure',
    'RR': 'respiratory_rate',
    'Temp': 'temperature',
    'Pulse': 'pulse',
    'etCO2': 'etco2'
}


def load_latest_vitals():
    """Load latest vitals from file"""
    global latest_vitals

    vitals_file = Path("vital_signs_latest.json")
    if vitals_file.exists():
        try:
            with open(vitals_file, 'r') as f:
                data = json.load(f)

            # Create fresh copy from template
            api_vitals = {
                "timestamp": data.get('timestamp'),
                "vitals": {k: None for k in latest_vitals['vitals'].keys()},
                "confidence": {k: 0.0 for k in latest_vitals['confidence'].keys()}
            }

            # Map OCR data to API format
            for ocr_key, api_key in OCR_TO_API_MAP.items():
                if ocr_key in data.get('vitals', {}):
                    api_vitals['vitals'][api_key] = data['vitals'][ocr_key]
                if ocr_key in data.get('confidence', {}):
                    api_vitals['confidence'][api_key] = data['confidence'][ocr_key]

            latest_vitals = api_vitals
            return True
        except:
            return False
    return False


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "OK",
        "timestamp": datetime.now().isoformat(),
        "service": "Vital Signs API"
    }), 200


@app.route('/vital-signs/latest', methods=['GET'])
def get_vital_signs_latest():
    """Get latest vital signs"""
    load_latest_vitals()
    
    return jsonify({
        "success": any(v is not None for v in latest_vitals['vitals'].values()),
        "timestamp": latest_vitals['timestamp'],
        "vitals": latest_vitals['vitals'],
        "confidence": latest_vitals['confidence']
    }), 200


@app.route('/vital-signs/hr', methods=['GET'])
def get_heart_rate():
    """Get heart rate only"""
    load_latest_vitals()
    return jsonify({
        "heart_rate": latest_vitals['vitals']['heart_rate'],
        "confidence": latest_vitals['confidence']['heart_rate'],
        "timestamp": latest_vitals['timestamp']
    }), 200


@app.route('/vital-signs/spo2', methods=['GET'])
def get_spo2():
    """Get SpO2 only"""
    load_latest_vitals()
    return jsonify({
        "spo2": latest_vitals['vitals']['spo2'],
        "confidence": latest_vitals['confidence']['spo2'],
        "timestamp": latest_vitals['timestamp']
    }), 200


@app.route('/vital-signs/etco2', methods=['GET'])
def get_etco2():
    """Get EtCO2 only"""
    load_latest_vitals()
    return jsonify({
        "etco2": latest_vitals['vitals']['etco2'],
        "confidence": latest_vitals['confidence']['etco2'],
        "timestamp": latest_vitals['timestamp']
    }), 200


@app.route('/vital-signs/rr', methods=['GET'])
def get_respiratory_rate():
    """Get respiratory rate only"""
    load_latest_vitals()
    return jsonify({
        "respiratory_rate": latest_vitals['vitals']['respiratory_rate'],
        "confidence": latest_vitals['confidence']['respiratory_rate'],
        "timestamp": latest_vitals['timestamp']
    }), 200


@app.route('/vital-signs/bp', methods=['GET'])
def get_blood_pressure():
    """Get blood pressure only"""
    load_latest_vitals()
    return jsonify({
        "blood_pressure": latest_vitals['vitals']['blood_pressure'],
        "confidence": latest_vitals['confidence']['blood_pressure'],
        "timestamp": latest_vitals['timestamp']
    }), 200


@app.route('/vital-signs/temp', methods=['GET'])
def get_temperature():
    """Get temperature only"""
    load_latest_vitals()
    return jsonify({
        "temperature": latest_vitals['vitals']['temperature'],
        "confidence": latest_vitals['confidence']['temperature'],
        "timestamp": latest_vitals['timestamp']
    }), 200


@app.route('/vital-signs/pulse', methods=['GET'])
def get_pulse():
    """Get pulse only"""
    load_latest_vitals()
    return jsonify({
        "pulse": latest_vitals['vitals']['pulse'],
        "confidence": latest_vitals['confidence']['pulse'],
        "timestamp": latest_vitals['timestamp']
    }), 200


@app.route('/vital-signs/all', methods=['GET'])
def get_all_vital_signs():
    """Get all vital signs with metadata"""
    load_latest_vitals()
    
    return jsonify({
        "success": True,
        "timestamp": latest_vitals['timestamp'],
        "data": {
            "heart_rate": {
                "value": latest_vitals['vitals']['heart_rate'],
                "unit": "bpm",
                "confidence": latest_vitals['confidence']['heart_rate'],
                "normal_range": "60-100"
            },
            "pulse": {
                "value": latest_vitals['vitals']['pulse'],
                "unit": "bpm",
                "confidence": latest_vitals['confidence']['pulse'],
                "normal_range": "60-100"
            },
            "spo2": {
                "value": latest_vitals['vitals']['spo2'],
                "unit": "%",
                "confidence": latest_vitals['confidence']['spo2'],
                "normal_range": "95-100"
            },
            "blood_pressure": {
                "value": latest_vitals['vitals']['blood_pressure'],
                "unit": "mmHg",
                "confidence": latest_vitals['confidence']['blood_pressure'],
                "normal_range": "120/80"
            },
            "respiratory_rate": {
                "value": latest_vitals['vitals']['respiratory_rate'],
                "unit": "/min",
                "confidence": latest_vitals['confidence']['respiratory_rate'],
                "normal_range": "12-20"
            },
            "temperature": {
                "value": latest_vitals['vitals']['temperature'],
                "unit": "°C",
                "confidence": latest_vitals['confidence']['temperature'],
                "normal_range": "36.5-37.5"
            },
            "etco2": {
                "value": latest_vitals['vitals']['etco2'],
                "unit": "mmHg",
                "confidence": latest_vitals['confidence']['etco2'],
                "normal_range": "35-45"
            }
        }
    }), 200


if __name__ == '__main__':
    print("\n" + "="*70)
    print("🏥 Vital Signs API - Starting")
    print("="*70)
    print("\nEndpoints:")
    print("  GET /health                    → Health check")
    print("  GET /vital-signs/latest        → All vital signs")
    print("  GET /vital-signs/all           → All vitals + metadata")
    print("  GET /vital-signs/hr            → Heart rate only")
    print("  GET /vital-signs/spo2          → SpO2 only")
    print("  GET /vital-signs/etco2         → EtCO2 only")
    print("  GET /vital-signs/rr            → Respiratory rate only")
    print("  GET /vital-signs/bp            → Blood pressure only")
    print("  GET /vital-signs/temp          → Temperature only")
    print("  GET /vital-signs/pulse         → Pulse only")
    print("\n" + "="*70 + "\n")
    
    app.run(host='0.0.0.0', port=5000, debug=False)
