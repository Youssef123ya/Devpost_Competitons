#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
🔍 تحقق من الـ actual resolution والإعدادات للـ Camera 1
"""

import cv2
import time

def check_camera_specs():
    """تحقق من خصائص الكاميرا الفعلية"""
    print("\n" + "="*60)
    print("🔍 تحقق من خصائص الـ USB Camera (Camera 1)")
    print("="*60 + "\n")
    
    cap = cv2.VideoCapture(1, cv2.CAP_DSHOW)
    
    if not cap.isOpened():
        print("❌ فشل فتح الكاميرا!")
        return
    
    print("✅ تم فتح الكاميرا\n")
    
    # اقرأ الإعدادات الحالية
    print("📊 الإعدادات الحالية:")
    print("-" * 60)
    
    width = cap.get(cv2.CAP_PROP_FRAME_WIDTH)
    height = cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
    fps = cap.get(cv2.CAP_PROP_FPS)
    brightness = cap.get(cv2.CAP_PROP_BRIGHTNESS)
    contrast = cap.get(cv2.CAP_PROP_CONTRAST)
    saturation = cap.get(cv2.CAP_PROP_SATURATION)
    
    print(f"Resolution: {int(width)}x{int(height)}")
    print(f"FPS: {fps}")
    print(f"Brightness: {brightness}")
    print(f"Contrast: {contrast}")
    print(f"Saturation: {saturation}")
    
    print("\n" + "-" * 60)
    print("🔧 جاري تطبيق الإعدادات الجديدة...\n")
    
    # حاول تطبيق إعدادات أفضل
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)
    cap.set(cv2.CAP_PROP_FPS, 30)
    cap.set(cv2.CAP_PROP_BRIGHTNESS, 120)
    cap.set(cv2.CAP_PROP_CONTRAST, 120)
    cap.set(cv2.CAP_PROP_SATURATION, 120)
    
    # انتظر قليلاً
    time.sleep(1)
    
    # اقرأ الإعدادات مجدداً
    print("📊 الإعدادات بعد التطبيق:")
    print("-" * 60)
    
    width = cap.get(cv2.CAP_PROP_FRAME_WIDTH)
    height = cap.get(cv2.CAP_PROP_FRAME_HEIGHT)
    fps = cap.get(cv2.CAP_PROP_FPS)
    brightness = cap.get(cv2.CAP_PROP_BRIGHTNESS)
    contrast = cap.get(cv2.CAP_PROP_CONTRAST)
    saturation = cap.get(cv2.CAP_PROP_SATURATION)
    
    print(f"Resolution: {int(width)}x{int(height)}")
    print(f"FPS: {fps}")
    print(f"Brightness: {brightness}")
    print(f"Contrast: {contrast}")
    print(f"Saturation: {saturation}")
    
    # اقرأ عدة frames وشوف الجودة
    print("\n" + "-" * 60)
    print("📹 اختبار عدة frames...\n")
    
    for i in range(5):
        ret, frame = cap.read()
        if ret:
            print(f"  ✅ Frame {i+1}: Shape={frame.shape}, Mean={frame.mean():.1f}")
        else:
            print(f"  ❌ Frame {i+1}: فشل القراءة")
        time.sleep(0.1)
    
    cap.release()
    
    print("\n" + "="*60)
    print("✅ اختبار انتهى!")
    print("="*60 + "\n")

if __name__ == '__main__':
    check_camera_specs()
