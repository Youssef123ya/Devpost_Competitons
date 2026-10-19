"""
ULTRA AGGRESSIVE Camera Quality Enhancement
For Medical Monitor OCR with Very Low Quality Cameras
"""

import cv2
import numpy as np
import requests
import json
from datetime import datetime
from pathlib import Path
import time

class UltraQualityEnhancer:
    """Extreme preprocessing for very low quality cameras"""
    
    def __init__(self, camera_url="http://localhost:8000"):
        self.camera_url = camera_url
        self.debug_dir = Path("ultra_quality_debug")
        self.debug_dir.mkdir(exist_ok=True)
    
    def get_enhanced_snapshot(self):
        """Fetch enhanced snapshot"""
        try:
            response = requests.get(f"{self.camera_url}/snapshot-enhanced", timeout=5)
            if response.status_code == 200:
                nparr = np.frombuffer(response.content, np.uint8)
                return cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        except:
            pass
        return None
    
    def apply_extreme_enhancement(self, frame):
        """Apply EXTREME image enhancement"""
        if frame is None:
            return None
        
        original = frame.copy()
        
        # STAGE 1: DENOISE AGGRESSIVELY
        frame = cv2.fastNlMeansDenoisingColored(frame, None, h=15, hForColorComponents=15, 
                                               templateWindowSize=7, searchWindowSize=21)
        
        # STAGE 2: CONVERT TO LAB
        lab = cv2.cvtColor(frame, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        
        # STAGE 3: SUPER AGGRESSIVE CLAHE
        clahe = cv2.createCLAHE(clipLimit=6.0, tileGridSize=(3, 3))
        l = clahe.apply(l)
        
        # STAGE 4: HISTOGRAM EQUALIZATION
        l = cv2.equalizeHist(l)
        
        # STAGE 5: CONTRAST STRETCHING
        l_min, l_max = np.percentile(l, (1, 99))
        if l_max > l_min:
            l = np.clip((l - l_min) / (l_max - l_min) * 255, 0, 255).astype(np.uint8)
        
        lab = cv2.merge([l, a, b])
        frame = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
        
        # STAGE 6: SUPER SHARP UNSHARP MASK
        gaussian = cv2.GaussianBlur(frame, (0, 0), 3.0)
        frame = cv2.addWeighted(frame, 2.0, gaussian, -1.0, 0)
        
        # STAGE 7: MORPHOLOGY
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        frame = cv2.morphologyEx(frame, cv2.MORPH_CLOSE, kernel, iterations=2)
        frame = cv2.morphologyEx(frame, cv2.MORPH_OPEN, kernel, iterations=1)
        
        # STAGE 8: EDGE DETECTION & ENHANCEMENT
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 40, 120)
        edges = cv2.dilate(edges, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2, 2)), iterations=2)
        
        for i in range(3):
            frame[:, :, i] = cv2.addWeighted(frame[:, :, i], 1.0, edges, 0.5, 0)
        
        # STAGE 9: BILATERAL FILTER
        frame = cv2.bilateralFilter(frame, 9, 75, 75)
        
        # STAGE 10: GAMMA CORRECTION
        gamma = 0.90
        inv_gamma = 1.0 / gamma
        table = np.array([((i / 255.0) ** inv_gamma) * 255 for i in range(256)]).astype(np.uint8)
        frame = cv2.LUT(frame, table)
        
        return frame
    
    def extract_large_digits_roi(self, frame):
        """Extract only regions with large bright digits"""
        if frame is None:
            return []
        
        h, w = frame.shape[:2]
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        # Threshold for bright digits
        _, thresh = cv2.threshold(gray, 180, 255, cv2.THRESH_BINARY)
        
        # Dilate to connect nearby pixels
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
        thresh = cv2.dilate(thresh, kernel, iterations=2)
        
        # Find contours
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        regions = []
        for contour in contours:
            x, y, w_c, h_c = cv2.boundingRect(contour)
            
            # Filter for large digits (at least 40 pixels high)
            if h_c > 40 and w_c > 20:
                # Extract with padding
                pad = 10
                x1 = max(0, x - pad)
                y1 = max(0, y - pad)
                x2 = min(w, x + w_c + pad)
                y2 = min(h, y + h_c + pad)
                
                roi = frame[y1:y2, x1:x2]
                
                regions.append({
                    'roi': roi,
                    'x': x1,
                    'y': y1,
                    'w': x2 - x1,
                    'h': y2 - y1,
                    'area': w_c * h_c
                })
        
        # Sort by area (largest first)
        return sorted(regions, key=lambda r: r['area'], reverse=True)
    
    def save_debug_images(self, frame, enhanced, iteration):
        """Save debug images"""
        ts = int(time.time() * 1000) % 100000
        
        cv2.imwrite(str(self.debug_dir / f"01_original_{iteration}_{ts}.jpg"), frame)
        cv2.imwrite(str(self.debug_dir / f"02_enhanced_{iteration}_{ts}.jpg"), enhanced)
        
        # Save large digit regions
        regions = self.extract_large_digits_roi(enhanced)
        for i, region in enumerate(regions[:5]):  # Top 5 regions
            cv2.imwrite(str(self.debug_dir / f"03_region_{iteration}_{i}_{ts}.jpg"), region['roi'])
    
    def demo(self):
        """Demo mode - show what we're capturing"""
        print("\n" + "="*70)
        print("🔬 ULTRA QUALITY ENHANCEMENT - DEMO MODE")
        print("="*70 + "\n")
        
        print("📸 Fetching frame from camera...")
        frame = self.get_enhanced_snapshot()
        
        if frame is None:
            print("❌ Cannot fetch frame!")
            return
        
        h, w = frame.shape[:2]
        print(f"✅ Frame size: {w}x{h}\n")
        
        print("🔄 Applying extreme enhancement...")
        enhanced = self.apply_extreme_enhancement(frame)
        
        print("📍 Finding large digit regions...")
        regions = self.extract_large_digits_roi(enhanced)
        
        print(f"✅ Found {len(regions)} large digit regions\n")
        
        for i, region in enumerate(regions[:10]):
            print(f"   Region {i+1}: {region['w']}x{region['h']} pixels, "
                  f"area={region['area']} - saved as region_{i}.jpg")
        
        print("\n🔧 Saving all debug images...")
        self.save_debug_images(frame, enhanced, 0)
        
        print(f"✅ Debug images saved to: {self.debug_dir}/")
        
        print("\n" + "="*70)
        print("📊 ANALYSIS:")
        print("="*70)
        print(f"\n✅ Original: {w}x{h}")
        print(f"✅ Large digits found: {len(regions)}")
        print(f"✅ Largest region: {regions[0]['w']}x{regions[0]['h']}" if regions else "❌ None")
        print(f"✅ Debug folder: ultra_quality_debug/")
        
        print("\n💡 Next steps:")
        print("1. Check images in ultra_quality_debug/ folder")
        print("2. If digits are clear, we can extract them!")
        print("3. If still blurry, we need hardware improvements")
        
        return enhanced

def main():
    enhancer = UltraQualityEnhancer(camera_url="http://localhost:8000")
    enhancer.demo()

if __name__ == "__main__":
    main()
