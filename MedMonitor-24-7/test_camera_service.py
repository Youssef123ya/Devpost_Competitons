"""
MedMonitor Camera Service Testing Script
اختبار خدمة الكاميرا والاتصالات
"""

import requests
import cv2
import time
import json
from datetime import datetime
import sys

# Colors for console output
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    BOLD = '\033[1m'
    END = '\033[0m'


def print_header(text):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{text:^60}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}\n")


def print_success(text):
    print(f"{Colors.GREEN}✅ {text}{Colors.END}")


def print_error(text):
    print(f"{Colors.RED}❌ {text}{Colors.END}")


def print_warning(text):
    print(f"{Colors.YELLOW}⚠️  {text}{Colors.END}")


def print_info(text):
    print(f"{Colors.BLUE}ℹ️  {text}{Colors.END}")


def test_service_health(base_url="http://localhost:8000"):
    """اختبار صحة الخدمة"""
    print_header("1. Health Check")

    try:
        response = requests.get(f"{base_url}/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print_success("Service is running")
            print_info(f"Status: {data.get('status')}")
            print_info(f"Camera Running: {data.get('camera_running')}")
            print_info(f"Timestamp: {data.get('timestamp')}")
            return True
        else:
            print_error(f"Service returned status {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print_error("Cannot connect to service at localhost:8000")
        print_warning("Make sure to run START_CAMERA_SERVICE.bat first!")
        return False
    except Exception as e:
        print_error(f"Error: {str(e)}")
        return False


def test_camera_config(base_url="http://localhost:8000"):
    """الحصول على تكوين الكاميرا"""
    print_header("2. Camera Configuration")

    try:
        response = requests.get(f"{base_url}/config", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print_success("Camera configuration retrieved")
            print_info(f"Resolution: {data.get('resolution')}")
            print_info(f"FPS: {data.get('fps')}")
            print_info(f"Status: {data.get('status')}")
            return True
        else:
            print_error(f"Failed to get config: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Error: {str(e)}")
        return False


def test_snapshot(base_url="http://localhost:8000"):
    """اختبار قراءة صورة واحدة"""
    print_header("3. Snapshot Test")

    try:
        response = requests.get(f"{base_url}/snapshot", timeout=5)
        if response.status_code == 200:
            print_success(f"Snapshot retrieved ({len(response.content)} bytes)")
            
            # Save snapshot
            with open("test_snapshot.jpg", "wb") as f:
                f.write(response.content)
            print_info("Saved to: test_snapshot.jpg")
            
            # Try to decode with OpenCV
            nparr = cv2.imdecode(
                cv2.cv2.fromstring(response.content, cv2.CV_8U),
                cv2.IMREAD_COLOR
            )
            if nparr is not None:
                height, width = nparr.shape[:2]
                print_success(f"Image decoded successfully ({width}x{height})")
                return True
            else:
                print_error("Failed to decode image")
                return False
        else:
            print_error(f"Failed to get snapshot: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Error: {str(e)}")
        return False


def test_stream_connection(base_url="http://localhost:8000"):
    """اختبار الاتصال بـ MJPEG Stream"""
    print_header("4. MJPEG Stream Connection Test")

    try:
        print_info("Attempting to connect to MJPEG stream...")
        response = requests.get(
            f"{base_url}/stream",
            stream=True,
            timeout=10
        )
        
        if response.status_code == 200:
            print_success("Connected to MJPEG stream")
            print_info(f"Content-Type: {response.headers.get('Content-Type')}")
            
            # Read a few frames
            frames_received = 0
            bytes_received = 0
            start_time = time.time()
            
            print_info("Reading frames for 3 seconds...")
            
            for chunk in response.iter_content(chunk_size=1024):
                if chunk:
                    bytes_received += len(chunk)
                    if b'\xff\xd8' in chunk:  # JPEG marker
                        frames_received += 1
                    
                    if time.time() - start_time > 3:
                        break
            
            elapsed = time.time() - start_time
            print_success(f"Frames received: {frames_received}")
            print_success(f"Bytes received: {bytes_received}")
            print_info(f"Time elapsed: {elapsed:.2f} seconds")
            print_info(f"Estimated FPS: {frames_received/elapsed:.1f}")
            
            return True
        else:
            print_error(f"Failed to connect: {response.status_code}")
            return False
    except requests.exceptions.Timeout:
        print_error("Connection timeout - stream may be slow")
        return False
    except Exception as e:
        print_error(f"Error: {str(e)}")
        return False


def test_vital_signs(base_url="http://localhost:8000"):
    """اختبار قراءة الـ Vital Signs"""
    print_header("5. Vital Signs Test")

    try:
        response = requests.get(f"{base_url}/vitals", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print_success("Vital Signs data retrieved")
            
            print("\n📊 Current Vital Signs:")
            print(f"   ❤️  Heart Rate:     {data.get('heart_rate', 'N/A')} bpm")
            print(f"   🫁 SpO2:           {data.get('spo2', 'N/A')} %")
            print(f"   🩸 Blood Pressure: {data.get('blood_pressure', 'N/A')} mmHg")
            print(f"   🌡️  Temperature:    {data.get('temperature', 'N/A')} °C")
            print(f"   📅 Timestamp:      {data.get('timestamp', 'N/A')}\n")
            
            return True
        else:
            print_error(f"Failed to get vital signs: {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Error: {str(e)}")
        return False


def test_local_camera():
    """اختبار الكاميرا محلياً"""
    print_header("6. Local Camera Test")

    try:
        print_info("Attempting to open camera...")
        cap = cv2.VideoCapture(0)
        
        if not cap.isOpened():
            print_error("Cannot open camera - check if it's connected")
            return False
        
        print_success("Camera opened successfully")
        
        # Get camera properties
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = cap.get(cv2.CAP_PROP_FPS)
        
        print_info(f"Resolution: {width}x{height}")
        print_info(f"FPS: {fps}")
        
        # Try to read a frame
        ret, frame = cap.read()
        if ret:
            print_success(f"Frame read successfully ({frame.shape})")
        else:
            print_error("Failed to read frame from camera")
        
        cap.release()
        return ret
        
    except Exception as e:
        print_error(f"Error: {str(e)}")
        return False


def run_all_tests(base_url="http://localhost:8000"):
    """تشغيل جميع الاختبارات"""
    print_header("MedMonitor Camera Service - Testing Suite")
    print_info(f"Testing service at: {base_url}")
    print_info(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    results = {
        "Health Check": test_service_health(base_url),
        "Camera Config": test_camera_config(base_url),
        "Snapshot": test_snapshot(base_url),
        "Stream Connection": test_stream_connection(base_url),
        "Vital Signs": test_vital_signs(base_url),
        "Local Camera": test_local_camera(),
    }
    
    # Summary
    print_header("Test Summary")
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status:8} | {test_name}")
    
    print()
    print_info(f"Total: {passed}/{total} tests passed")
    
    if passed == total:
        print_success("\n🎉 All tests passed!")
    elif passed > 0:
        print_warning(f"\n⚠️  {total - passed} test(s) failed")
    else:
        print_error("\n❌ All tests failed - check your setup")
    
    print()


if __name__ == "__main__":
    try:
        base_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"
        run_all_tests(base_url)
    except KeyboardInterrupt:
        print_warning("\n\nTests interrupted by user")
    except Exception as e:
        print_error(f"Fatal error: {str(e)}")
