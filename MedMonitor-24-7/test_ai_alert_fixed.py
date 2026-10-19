#!/usr/bin/env python3
"""
Test script to verify AI Alert fix with correct patient data
"""
import sys
sys.path.insert(0, 'c:\\PROJECTFINAL-NUB\\fiels project')

from backend_integration import BackendIntegration
import json

# Initialize backend integration
backend = BackendIntegration(
    backend_api_url="http://localhost:5140",
    username="superadmin",
    password="Admin@123456",
    config_file="c:\\PROJECTFINAL-NUB\\fiels project\\ocr_config.json"
)

# Login first
print("[*] Logging in...")
if not backend.login():
    print("[!] Login failed")
    sys.exit(1)

print("[+] Login successful")

# Test vital signs payload similar to OCR
vital_signs = {
    'patientId': '18543ebe-5751-4fe1-8fd6-a9c76425d4fa',
    'patientName': 'Maro Isaac',
    'heartRate': 125,
    'spO2': 85,
    'bloodPressure': '165/105',
    'temperature': 39.0,
    'pulse': 125,
    'respiratoryRate': 24,
    'fallDetected': False
}

print("\n[*] Sending AI Alert test...")
print(f"   Patient: {vital_signs.get('patientName')} (ID: {vital_signs.get('patientId')})")
print(f"   HR: {vital_signs.get('heartRate')}, SpO2: {vital_signs.get('spO2')}")

result = backend.send_to_ai_alert(vital_signs)
print(f"[+] Result: {result}")

print("\n[*] Checking database for latest notification...")
import subprocess
result = subprocess.run(
    [
        'sqlcmd', '-S', '.', '-d', 'MedMonitorDb',
        '-Q', 'SELECT TOP 1 Id, PatientName, PatientId, AlertLevel, CreatedAt FROM Notifications ORDER BY CreatedAt DESC'
    ],
    capture_output=True,
    text=True
)

print(result.stdout)
if result.returncode != 0:
    print(f"Error: {result.stderr}")
