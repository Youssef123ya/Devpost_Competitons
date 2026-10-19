#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
🔍 جد الـ USB Camera الصحيح
"""

import cv2
import time

def test_all_cameras():
    """اختبر جميع camera indices"""
    print("\n" + "="*60)
    print("🔍 اختبار جميع الكاميرات...")
    print("="*60 + "\n")
    
    working_cameras = []
    
    # جرب indices من 0 إلى 10
    for idx in range(10):
        print(f"🔌 اختبار Camera {idx}...")
        
        # جرب DirectShow
        cap = cv2.VideoCapture(idx, cv2.CAP_DSHOW)
        
        if not cap.isOpened():
            print(f"   ❌ معطلة\n")
            continue
        
        # اقرأ عدة frames
        good_frames = 0
        black_frames = 0
        
        for i in range(5):
            ret, frame = cap.read()
            if ret and frame is not None and frame.size > 0:
                mean_val = frame.mean()
                if mean_val > 10:
                    good_frames += 1
                else:
                    black_frames += 1
            time.sleep(0.1)
        
        cap.release()
        time.sleep(0.5)
        
        if good_frames > 0:
            print(f"   ✅ تعمل! ({good_frames}/5 frames صحيحة)")
            working_cameras.append(idx)
        elif black_frames > 0:
            print(f"   ⚫ تعطي black frames فقط ({black_frames}/5)")
        else:
            print(f"   ⚠️ معطلة\n")
    
    print("\n" + "="*60)
    print("📊 النتائج النهائية:")
    print("="*60)
    if working_cameras:
        print(f"✅ الكاميرات الشغّالة: {working_cameras}")
        print(f"\n💡 استخدم أكبر index (غالباً يكون الـ USB):")
        print(f"   echo {max(working_cameras)} > camera_index.txt")
    else:
        print("❌ لا توجد كاميرا تعمل!")
    print("="*60 + "\n")

if __name__ == '__main__':
    test_all_cameras()
