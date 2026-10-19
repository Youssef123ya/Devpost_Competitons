#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
🔍 اختبار الكاميرا بشكل مباشر - تشخيص المشكلة
"""

import cv2
import time
import numpy as np

def test_camera(camera_index):
    """اختبر الكاميرا بشكل مباشر"""
    print(f"\n🔍 اختبار الكاميرا #{camera_index}...")
    print("-" * 50)
    
    # جرّب بـ DirectShow
    cap = cv2.VideoCapture(camera_index, cv2.CAP_DSHOW)
    
    if not cap.isOpened():
        print(f"❌ فشل فتح الكاميرا {camera_index}")
        return False
    
    print(f"✅ تم فتح الكاميرا {camera_index}")
    
    # اضبط الـ properties
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)
    cap.set(cv2.CAP_PROP_FPS, 30)
    cap.set(cv2.CAP_PROP_BRIGHTNESS, 100)
    cap.set(cv2.CAP_PROP_CONTRAST, 100)
    cap.set(cv2.CAP_PROP_SATURATION, 100)
    
    # اقرأ الـ actual properties
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    
    print(f"📊 Resolution: {width}x{height}")
    print(f"🎬 FPS: {fps}")
    
    # اقرأ 10 frames و اختبرها
    print("\n📹 قراءة 10 frames...")
    frame_count = 0
    black_frames = 0
    valid_frames = 0
    
    for i in range(10):
        ret, frame = cap.read()
        
        if not ret:
            print(f"  ❌ Frame {i+1}: فشل في القراءة")
            continue
        
        frame_count += 1
        
        # اختبر إذا كان الـ frame أسود
        if frame is None or frame.size == 0:
            print(f"  ❌ Frame {i+1}: فارغ")
            black_frames += 1
        else:
            # احسب متوسط الـ pixel values
            mean_value = np.mean(frame)
            
            if mean_value < 5:  # تقريباً أسود
                print(f"  ⚫ Frame {i+1}: أسود (mean={mean_value:.1f})")
                black_frames += 1
            else:
                print(f"  ✅ Frame {i+1}: صحيح (mean={mean_value:.1f})")
                valid_frames += 1
        
        time.sleep(0.1)
    
    cap.release()
    
    print("\n" + "=" * 50)
    print(f"النتائج:")
    print(f"  - Frames المقروءة: {frame_count}")
    print(f"  - Frames الصحيحة: {valid_frames}")
    print(f"  - Frames السوداء: {black_frames}")
    print("=" * 50)
    
    return valid_frames > 0

if __name__ == '__main__':
    print("\n" + "=" * 50)
    print("🔍 اختبار الكاميرات - تشخيص المشكلة")
    print("=" * 50)
    
    # ابدأ بـ Camera 2 (الـ USB)
    cameras_to_test = [2, 0, 1]
    
    for cam_idx in cameras_to_test:
        success = test_camera(cam_idx)
        if success:
            print(f"\n✅ الكاميرا {cam_idx} تعمل!")
            break
        time.sleep(1)
    else:
        print("\n❌ لا توجد كاميرا تعمل بشكل صحيح!")
