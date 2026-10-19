"""
Quick Camera Tuning Tool
Adjust camera settings in real-time
"""

import cv2
import numpy as np

def tune_camera():
    """Interactive camera tuning"""
    
    print("\n" + "="*70)
    print("🎚️ CAMERA TUNING TOOL - Real-time Adjustment")
    print("="*70 + "\n")
    
    # Open camera
    cap = cv2.VideoCapture(1, cv2.CAP_DSHOW)
    if not cap.isOpened():
        cap = cv2.VideoCapture(0)
    
    if not cap.isOpened():
        print("❌ No camera available!")
        return
    
    # Set initial resolution
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1920)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 1080)
    cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
    
    # Initial settings
    brightness = 45
    contrast = 110
    saturation = 80
    exposure = -8
    focus = 50
    
    print("📋 Press keys to adjust:")
    print("  B/b - Brightness: +/−")
    print("  C/c - Contrast: +/−")
    print("  S/s - Saturation: +/−")
    print("  E/e - Exposure: +/−")
    print("  F/f - Focus: +/−")
    print("  G/g - Gaussian Blur: +/−")
    print("  P/p - Print current values")
    print("  R/r - Reset to defaults")
    print("  Q/q - Quit")
    print("\nPress in the window and then use keys\n")
    
    blur_strength = 0
    
    while True:
        ret, frame = cap.read()
        if not ret:
            continue
        
        # Apply settings
        cap.set(cv2.CAP_PROP_BRIGHTNESS, brightness)
        cap.set(cv2.CAP_PROP_CONTRAST, contrast)
        cap.set(cv2.CAP_PROP_SATURATION, saturation)
        cap.set(cv2.CAP_PROP_EXPOSURE, exposure)
        cap.set(cv2.CAP_PROP_FOCUS, focus)
        
        # Apply gaussian blur for testing
        if blur_strength > 0:
            frame = cv2.GaussianBlur(frame, (blur_strength*2-1, blur_strength*2-1), 0)
        
        # Show settings on frame
        h, w = frame.shape[:2]
        y_pos = 30
        settings_text = [
            f"Brightness: {brightness}",
            f"Contrast: {contrast}",
            f"Saturation: {saturation}",
            f"Exposure: {exposure}",
            f"Focus: {focus}",
            f"Blur: {blur_strength}",
        ]
        
        for text in settings_text:
            cv2.putText(frame, text, (10, y_pos), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2)
            y_pos += 30
        
        cv2.imshow("Camera Tuning - Press keys to adjust", frame)
        
        key = cv2.waitKey(1) & 0xFF
        
        if key == ord('q') or key == ord('Q'):
            break
        
        # Brightness
        if key == ord('B'):
            brightness = min(100, brightness + 5)
        elif key == ord('b'):
            brightness = max(0, brightness - 5)
        
        # Contrast
        if key == ord('C'):
            contrast = min(150, contrast + 5)
        elif key == ord('c'):
            contrast = max(50, contrast - 5)
        
        # Saturation
        if key == ord('S'):
            saturation = min(100, saturation + 5)
        elif key == ord('s'):
            saturation = max(0, saturation - 5)
        
        # Exposure
        if key == ord('E'):
            exposure = min(0, exposure + 1)
        elif key == ord('e'):
            exposure = max(-15, exposure - 1)
        
        # Focus
        if key == ord('F'):
            focus = min(100, focus + 5)
        elif key == ord('f'):
            focus = max(0, focus - 5)
        
        # Blur
        if key == ord('G'):
            blur_strength = min(10, blur_strength + 1)
        elif key == ord('g'):
            blur_strength = max(0, blur_strength - 1)
        
        # Print values
        if key == ord('P') or key == ord('p'):
            print(f"\n✅ Current Settings:")
            print(f"   Brightness: {brightness}")
            print(f"   Contrast: {contrast}")
            print(f"   Saturation: {saturation}")
            print(f"   Exposure: {exposure}")
            print(f"   Focus: {focus}")
            print()
        
        # Reset
        if key == ord('R') or key == ord('r'):
            brightness = 45
            contrast = 110
            saturation = 80
            exposure = -8
            focus = 50
            blur_strength = 0
            print("\n🔄 Reset to defaults\n")
    
    cap.release()
    cv2.destroyAllWindows()
    
    print("\n✅ Tuning complete!")
    print("\nNow update camera_hd.py with these values:")
    print(f"cap.set(cv2.CAP_PROP_BRIGHTNESS, {brightness})")
    print(f"cap.set(cv2.CAP_PROP_CONTRAST, {contrast})")
    print(f"cap.set(cv2.CAP_PROP_SATURATION, {saturation})")
    print(f"cap.set(cv2.CAP_PROP_EXPOSURE, {exposure})")
    print(f"cap.set(cv2.CAP_PROP_FOCUS, {focus})")

if __name__ == "__main__":
    tune_camera()
