#!/usr/bin/env python3
"""
🧪 Comprehensive OCR System Test Suite
"""

import requests
import json
import time
import subprocess
import sys
from pathlib import Path

class OCRSystemTester:
    def __init__(self):
        self.base_url_stream = "http://localhost:8000"
        self.base_url_api = "http://localhost:5000"
        self.results = []
    
    def test_camera_stream(self):
        """Test camera stream connectivity"""
        print("\n" + "="*70)
        print("TEST 1: Camera Stream (port 8000)")
        print("="*70)
        
        try:
            response = requests.get(f"{self.base_url_stream}/snapshot", timeout=5)
            if response.status_code == 200:
                print("✅ Camera stream OK")
                
                # Save snapshot
                with open("test_snapshot.jpg", "wb") as f:
                    f.write(response.content)
                print("   📸 Saved: test_snapshot.jpg")
                
                self.results.append(("Camera Stream", "PASS"))
                return True
            else:
                print(f"❌ Camera stream returned {response.status_code}")
                self.results.append(("Camera Stream", "FAIL"))
                return False
        except Exception as e:
            print(f"❌ Camera stream FAILED: {e}")
            print("   Make sure: python stream_and_snapshot.py is running")
            self.results.append(("Camera Stream", "FAIL"))
            return False
    
    def test_roi_config(self):
        """Test ROI config file"""
        print("\n" + "="*70)
        print("TEST 2: ROI Configuration")
        print("="*70)
        
        config_file = Path("roi_config.json")
        
        if not config_file.exists():
            print("❌ roi_config.json not found!")
            print("   Run: python roi_calibration_tool.py")
            self.results.append(("ROI Config", "FAIL"))
            return False
        
        try:
            with open(config_file, 'r') as f:
                roi_config = json.load(f)
            
            print("✅ roi_config.json found")
            print("   Configured regions:")
            
            required_vitals = ['HR', 'SpO2', 'etCO2', 'RR', 'Temp', 'Pulse', 'NBP']
            for vital in required_vitals:
                if vital in roi_config:
                    coords = roi_config[vital]
                    print(f"      {vital:10} → {coords}")
                else:
                    print(f"      {vital:10} ⚠️  NOT CONFIGURED")
            
            self.results.append(("ROI Config", "PASS"))
            return True
        except Exception as e:
            print(f"❌ Error reading roi_config.json: {e}")
            self.results.append(("ROI Config", "FAIL"))
            return False
    
    def test_api_health(self):
        """Test API health endpoint"""
        print("\n" + "="*70)
        print("TEST 3: API Health Check")
        print("="*70)
        
        try:
            response = requests.get(f"{self.base_url_api}/health", timeout=5)
            if response.status_code == 200:
                data = response.json()
                print("✅ API server OK (port 5000)")
                print(f"   Status: {data.get('status')}")
                print(f"   Service: {data.get('service')}")
                self.results.append(("API Health", "PASS"))
                return True
            else:
                print(f"❌ API returned {response.status_code}")
                self.results.append(("API Health", "FAIL"))
                return False
        except Exception as e:
            print(f"❌ API not responding: {e}")
            print("   Make sure: python vital_signs_api_advanced.py is running")
            self.results.append(("API Health", "FAIL"))
            return False
    
    def test_api_vital_signs(self):
        """Test vital signs extraction"""
        print("\n" + "="*70)
        print("TEST 4: Vital Signs Extraction")
        print("="*70)
        
        try:
            response = requests.get(f"{self.base_url_api}/vital-signs/latest", timeout=5)
            data = response.json()
            
            print("✅ API responded")
            print(f"   Timestamp: {data.get('timestamp')}")
            print(f"   Success: {data.get('success')}")
            print("\n   Extracted Values:")
            
            vitals = data.get('vitals', {})
            confidence = data.get('confidence', {})
            
            extracted_count = 0
            for vital, value in vitals.items():
                conf = confidence.get(vital, 0.0)
                if value is not None:
                    print(f"      ✅ {vital:20} = {str(value):20} (Confidence: {conf:.2f})")
                    extracted_count += 1
                else:
                    print(f"      ❌ {vital:20} = {'None':20} (Confidence: {conf:.2f})")
            
            print(f"\n   Total Extracted: {extracted_count}/7")
            
            if extracted_count > 0:
                self.results.append(("Vital Signs Extraction", "PASS"))
                return True
            else:
                print("   ⚠️  No vitals extracted yet (OCR may need time)")
                self.results.append(("Vital Signs Extraction", "WARN"))
                return True
        except Exception as e:
            print(f"❌ Error: {e}")
            self.results.append(("Vital Signs Extraction", "FAIL"))
            return False
    
    def test_individual_endpoints(self):
        """Test individual vital sign endpoints"""
        print("\n" + "="*70)
        print("TEST 5: Individual Endpoints")
        print("="*70)
        
        endpoints = {
            'hr': '/vital-signs/hr',
            'spo2': '/vital-signs/spo2',
            'etco2': '/vital-signs/etco2',
            'rr': '/vital-signs/rr',
            'bp': '/vital-signs/bp',
            'temp': '/vital-signs/temp',
            'pulse': '/vital-signs/pulse'
        }
        
        passed = 0
        for name, endpoint in endpoints.items():
            try:
                response = requests.get(f"{self.base_url_api}{endpoint}", timeout=5)
                if response.status_code == 200:
                    print(f"✅ {name:10} → {endpoint}")
                    passed += 1
                else:
                    print(f"❌ {name:10} → {response.status_code}")
            except:
                print(f"❌ {name:10} → Failed")
        
        print(f"\nPassed: {passed}/{len(endpoints)}")
        
        if passed == len(endpoints):
            self.results.append(("Individual Endpoints", "PASS"))
        else:
            self.results.append(("Individual Endpoints", "WARN"))
        
        return True
    
    def test_ocr_output_file(self):
        """Test OCR output file"""
        print("\n" + "="*70)
        print("TEST 6: OCR Output File")
        print("="*70)
        
        output_file = Path("vital_signs_latest.json")
        
        if not output_file.exists():
            print("⚠️  vital_signs_latest.json not found yet")
            print("   OCR service may not have run yet")
            print("   Make sure: python ocr_medical_advanced.py is running")
            self.results.append(("OCR Output File", "WARN"))
            return False
        
        try:
            with open(output_file, 'r') as f:
                data = json.load(f)
            
            print("✅ vital_signs_latest.json found")
            print(f"   Timestamp: {data.get('timestamp')}")
            print(f"   Vitals: {data.get('vitals')}")
            print(f"   Confidence: {data.get('confidence')}")
            
            self.results.append(("OCR Output File", "PASS"))
            return True
        except Exception as e:
            print(f"❌ Error reading file: {e}")
            self.results.append(("OCR Output File", "FAIL"))
            return False
    
    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*70)
        print("TEST SUMMARY")
        print("="*70 + "\n")
        
        for test_name, result in self.results:
            if result == "PASS":
                symbol = "✅"
            elif result == "WARN":
                symbol = "⚠️ "
            else:
                symbol = "❌"
            
            print(f"{symbol} {test_name:30} {result}")
        
        total = len(self.results)
        passed = sum(1 for _, r in self.results if r == "PASS")
        warned = sum(1 for _, r in self.results if r == "WARN")
        failed = sum(1 for _, r in self.results if r == "FAIL")
        
        print(f"\nTotal: {total} | Passed: {passed} | Warned: {warned} | Failed: {failed}")
        
        if failed == 0:
            print("\n✅ All critical systems operational!")
        else:
            print("\n❌ Some tests failed. See details above.")
    
    def run_all_tests(self):
        """Run all tests"""
        print("\n" + "="*70)
        print("🧪 OCR SYSTEM TEST SUITE")
        print("="*70)
        
        print("\nRequired Services:")
        print("  • stream_and_snapshot.py (port 8000)")
        print("  • ocr_medical_advanced.py (terminal)")
        print("  • vital_signs_api_advanced.py (port 5000)")
        
        input("\nPress ENTER to start tests...")
        
        self.test_camera_stream()
        self.test_roi_config()
        self.test_api_health()
        self.test_api_vital_signs()
        self.test_individual_endpoints()
        self.test_ocr_output_file()
        
        self.print_summary()
        
        print("\n" + "="*70)
        print("Next Steps:")
        print("="*70)
        print("\n1. If camera stream failed:")
        print("   → Terminal 1: python stream_and_snapshot.py\n")
        print("2. If API failed:")
        print("   → Terminal 3: python vital_signs_api_advanced.py\n")
        print("3. If ROI config missing:")
        print("   → python roi_calibration_tool.py\n")
        print("4. If no vitals extracted:")
        print("   → Terminal 2: python ocr_medical_advanced.py")
        print("   → Wait 5 seconds for first extraction")
        print("   → Re-run this test\n")


if __name__ == "__main__":
    tester = OCRSystemTester()
    tester.run_all_tests()
    
    print("\nPress ENTER to exit...")
    input()
