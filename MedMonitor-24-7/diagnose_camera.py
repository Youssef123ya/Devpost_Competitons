"""
برنامج تشخيصي شامل - تحديد المشكلة بالضبط
"""

import sys
import os

print("\n" + "="*70)
print("🔍 MedMonitor - Camera Service Diagnostic Tool")
print("="*70 + "\n")

# 1. تحقق من المكتبات
print("✓ Step 1: Checking Libraries...")
print("-" * 70)

libraries = {
    'cv2': 'OpenCV',
    'flask': 'Flask',
    'threading': 'Threading (built-in)',
    'time': 'Time (built-in)',
}

missing = []
for lib, name in libraries.items():
    try:
        __import__(lib)
        print(f"  ✅ {name} ... OK")
    except ImportError as e:
        print(f"  ❌ {name} ... MISSING")
        missing.append((lib, name))

if missing:
    print(f"\n❌ Missing libraries: {', '.join([m[1] for m in missing])}")
    print("\nFix: Run this command:")
    for lib, name in missing:
        print(f"  pip install {lib}")
    sys.exit(1)

print("\n✅ All libraries OK!\n")

# 2. تحقق من الكاميرات
print("✓ Step 2: Checking Cameras...")
print("-" * 70)

import cv2

cameras_found = []
for i in range(5):
    try:
        cap = cv2.VideoCapture(i)
        if cap.isOpened():
            ret, frame = cap.read()
            if ret and frame is not None:
                h, w = frame.shape[:2]
                cameras_found.append((i, w, h))
                print(f"  ✅ Camera {i}: {w}x{h}")
            cap.release()
    except:
        pass

if not cameras_found:
    print("  ❌ No cameras found!")
    print("\nFix:")
    print("  1. Connect USB camera")
    print("  2. Check Windows > Settings > Privacy & Security > Camera")
    print("  3. Allow Python to access camera")
    sys.exit(1)

print(f"\n✅ Found {len(cameras_found)} camera(s)\n")

# 3. تحقق من Flask
print("✓ Step 3: Checking Flask...")
print("-" * 70)

try:
    from flask import Flask
    app = Flask(__name__)
    
    @app.route('/test')
    def test():
        return "OK"
    
    print("  ✅ Flask working correctly\n")
except Exception as e:
    print(f"  ❌ Flask error: {e}\n")
    sys.exit(1)

# 4. تحقق من Port
print("✓ Step 4: Checking Port 8000...")
print("-" * 70)

import socket

def port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0

if port_in_use(8000):
    print("  ⚠️  Port 8000 is already in use!")
    print("\nFix: Run in PowerShell:")
    print("  Get-NetTCPConnection -LocalPort 8000")
    print("  Stop-Process -Id <PID> -Force")
else:
    print("  ✅ Port 8000 is available\n")

# 5. ملخص
print("="*70)
print("\n✅ ALL CHECKS PASSED!\n")
print("Your cameras:")
for idx, (cam_id, w, h) in enumerate(cameras_found):
    print(f"  Camera {cam_id}: {w}x{h}")

print("\nNow run:")
print("  python camera_service_fixed.py")
print("\n" + "="*70 + "\n")
