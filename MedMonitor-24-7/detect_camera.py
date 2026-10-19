"""
كشف الكاميرات المتاحة والتوصية بـ USB Camera
"""

import cv2
import sys

print("\n" + "="*60)
print("🔍 جاري البحث عن الكاميرات المتاحة...")
print("="*60 + "\n")

cameras_found = []

for i in range(10):
    try:
        cap = cv2.VideoCapture(i)
        if cap.isOpened():
            ret, frame = cap.read()
            if ret and frame is not None:
                h, w = frame.shape[:2]
                cameras_found.append({
                    'index': i,
                    'resolution': f"{w}x{h}",
                    'status': 'OK'
                })
                print(f"✅ Camera {i}: متصلة - Resolution: {w}x{h}")
            else:
                print(f"⚠️  Camera {i}: تم العثور عليها لكن لا تقرأ frames")
            cap.release()
    except Exception as e:
        pass

print()

if not cameras_found:
    print("❌ لم يتم العثور على أي كاميرا!")
    sys.exit(1)

print("="*60)

# الآن ندعم المستخدم لاختيار الكاميرا الصحيحة
if len(cameras_found) == 1:
    print(f"\n✅ تم العثور على كاميرا واحدة فقط: Camera {cameras_found[0]['index']}")
    choice = cameras_found[0]['index']
else:
    print(f"\n✅ تم العثور على {len(cameras_found)} كاميرا:")
    for cam in cameras_found:
        print(f"   - Camera {cam['index']}: {cam['resolution']}")
    
    print("\n")
    choice_input = input("اختر رقم الكاميرا (أكتب الرقم): ").strip()
    
    try:
        choice = int(choice_input)
        if choice not in [c['index'] for c in cameras_found]:
            print(f"❌ رقم غير صحيح! اختر من: {[c['index'] for c in cameras_found]}")
            sys.exit(1)
    except ValueError:
        print("❌ رقم غير صحيح!")
        sys.exit(1)

print(f"\n{'='*60}")
print(f"✅ الكاميرا المختارة: Camera {choice}")
print(f"{'='*60}\n")

# احفظ الرقم في ملف
with open('camera_index.txt', 'w') as f:
    f.write(str(choice))

print(f"✅ تم حفظ الكاميرا. الآن شغّل:")
print(f"\n   python camera_service.py\n")
