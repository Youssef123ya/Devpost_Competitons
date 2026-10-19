"""
MedMonitor Backend Integration Service
خدمة ربط Python Camera Service مع .NET Backend
With JWT Authentication + Auto-refresh + Patient ID management
"""

import requests
import json
import time
import threading
import os
import re
from typing import Dict, Optional
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class BackendIntegration:
    """
    تكامل الكاميرا مع الـ Backend
    يرسل بيانات الـ Vital Signs للـ .NET API
    مع JWT Authentication و Auto-refresh
    """

    def __init__(
        self,
        camera_service_url: str = "http://localhost:8000",
        backend_api_url: str = "http://localhost:5140",
        username: str = "superadmin",
        password: str = "Admin@123456",
        polling_interval: int = 5,
        config_file: str = "ocr_config.json"
    ):
        """
        Initialize Backend Integration with JWT Auth
        
        Args:
            camera_service_url: عنوان Python Camera Service
            backend_api_url: عنوان .NET Backend API
            username: اسم المستخدم للـ Login
            password: كلمة المرور للـ Login
            polling_interval: الفترة الزمنية لقراءة البيانات (ثواني)
            config_file: مسار ملف الإعدادات (يحتوي على patientId)
        """
        self.camera_service_url = camera_service_url
        self.backend_api_url = backend_api_url
        self.username = username
        self.password = password
        self.polling_interval = polling_interval
        self.config_file = config_file
        
        # JWT Token Management
        self.token: Optional[str] = None
        self.headers: Dict = {"Content-Type": "application/json", "Accept": "application/json"}
        
        # Patient ID Management
        self.patient_id: Optional[str] = None
        
        self.is_running = False
        self.last_vital_signs = None
        
        # Startup sequence:
        # 1. Try to load patient ID from config file
        self._load_patient_id_from_config()
        
        # 2. Login to get JWT token (required for all other API calls)
        self.login()
        
        # 3. Get active patient ID from occupied beds (if not in config)
        if not self.patient_id:
            self.patient_id = self.get_active_patient_id()
    def _load_patient_id_from_config(self) -> bool:
        """
        Load patient ID from config file
        Config file format:
        {
            "patientId": "PATIENT_ID_HERE",
            "bedNumber": "A1"
        }
        """
        try:
            if os.path.exists(self.config_file):
                with open(self.config_file, 'r') as f:
                    config = json.load(f)
                    self.patient_id = config.get('patientId')
                    # Load backend URL from config if available (for network changes)
                    if config.get('backendUrl'):
                        self.backend_api_url = config.get('backendUrl')
                        logger.info(f"✅ Loaded backend URL from config: {self.backend_api_url}")
                    if self.patient_id:
                        logger.info(f"✅ Loaded patientId from config: {self.patient_id}")
                        return True
        except Exception as e:
            logger.warning(f"⚠️  Could not load config file: {e}")

        return False

    def login(self) -> bool:
        """
        Login to backend and get JWT Token
        Endpoint: POST /LoginContoller/loginUser
        Response: { "token": "JWT_TOKEN_HERE", ... }
        """
        try:
            payload = {
                "userName": self.username,
                "password": self.password
            }
            
            logger.info(f"🔐 Logging in as {self.username}...")
            
            response = requests.post(
                f"{self.backend_api_url}/LoginContoller/loginUser",
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code in [200, 201]:
                data = response.json()
                
                # Token can be in 'token' or 'data.accessToken' or 'data.token'
                if isinstance(data, dict):
                    self.token = (
                        data.get('token') or 
                        data.get('data', {}).get('accessToken') or
                        data.get('data', {}).get('token')
                    )
                    
                    if self.token:
                        # Update headers with new token
                        self.headers = {
                            "Content-Type": "application/json",
                            "Accept": "application/json",
                            "Authorization": f"Bearer {self.token}"
                        }
                        logger.info(f"✅ Login successful! Token obtained")
                        logger.info(f"   Token length: {len(self.token)} chars")
                        return True
                    else:
                        logger.error(f"❌ Login response missing token: {data}")
                        return False
            else:
                logger.error(f"❌ Login failed: {response.status_code} - {response.text}")
                return False
                
        except requests.exceptions.ConnectionError:
            logger.error(f"❌ Cannot connect to login endpoint at {self.backend_api_url}")
            return False
        except Exception as e:
            logger.error(f"❌ Login error: {e}")
            return False

    def _parse_list_response(self, raw):
        if isinstance(raw, list):
            return raw
        if isinstance(raw, dict):
            if isinstance(raw.get('rows'), list):
                return raw['rows']
            if isinstance(raw.get('data'), list):
                return raw['data']
        return []

    def _normalize_patient_name(self, name):
        if not name:
            return ''
        return str(name).strip().lower()

    def _is_guid(self, value: str) -> bool:
        if not value or not isinstance(value, str):
            return False
        return bool(re.match(r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$', value))

    def _parse_blood_pressure(self, bp_value) -> tuple[int, int]:
        """Parse a blood pressure value into systolic/diastolic integers."""
        if bp_value is None:
            return 0, 0

        if isinstance(bp_value, dict):
            bp_value = bp_value.get('value') or bp_value.get('val') or ''

        if isinstance(bp_value, (int, float)):
            try:
                return int(bp_value), 0
            except Exception:
                return 0, 0

        if isinstance(bp_value, str):
            raw = bp_value.strip().replace(' ', '').replace('\\', '/').replace('‐', '-')
            match = re.match(r'^(\d{2,3})(?:/(\d{2,3}))?$', raw)
            if match:
                try:
                    systolic = int(match.group(1))
                    diastolic = int(match.group(2)) if match.group(2) else 0
                    return systolic, diastolic
                except Exception:
                    pass

            digits = ''.join(c for c in raw if c.isdigit())
            if len(digits) >= 3:
                try:
                    systolic = int(digits[:-2])
                    diastolic = int(digits[-2:])
                    return systolic, diastolic
                except Exception:
                    pass
            if digits:
                try:
                    return int(digits), 0
                except Exception:
                    pass

        return 0, 0

    def _coerce_number(self, value, target_type=int, default=0):
        if value is None:
            return default
        if isinstance(value, target_type):
            return value
        try:
            if target_type is int:
                return int(float(value))
            if target_type is float:
                return float(value)
        except (ValueError, TypeError):
            pass
        return default

    def _extract_vitals_payload(self, ocr_results: Dict) -> Dict:
        """Extract plain numbers from OCR results dict or pass-through if already simple."""
        def get_val(key):
            v = ocr_results.get(key)
            if isinstance(v, dict):
                return v.get('value') or v.get('val') or 0
            return v or 0

        try:
            systolic_bp, diastolic_bp = self._parse_blood_pressure(get_val('NBP'))
            return {
                "heartRate": int(get_val('HR') or 0),
                "spO2": int(get_val('SpO2') or 0),
                "pulse": int(get_val('Pulse') or 0),
                "respiratoryRate": int(get_val('RR') or 0),
                "temperature": float(get_val('Temp') or 0),
                "bloodPressure": f"{systolic_bp}/{diastolic_bp}",
                "systolicBP": systolic_bp,
                "diastolicBP": diastolic_bp,
                "recordedAt": datetime.utcnow().isoformat() + 'Z'
            }
        except Exception:
            # Fallback: return minimal mapping with zeros
            return {
                "heartRate": 0,
                "spO2": 0,
                "pulse": 0,
                "respiratoryRate": 0,
                "temperature": 0.0,
                "bloodPressure": "0/0",
                "systolicBP": 0,
                "diastolicBP": 0,
                "recordedAt": datetime.utcnow().isoformat() + 'Z'
            }

    def get_active_patient_id(self) -> str:
        """
        🔥 Get active patient's User.Id (GUID) from first occupied bed
        """
        try:
            response = requests.get(
                f"{self.backend_api_url}/Bed/GetAll",
                headers=self.headers,
                timeout=10
            )

            if response.status_code != 200:
                logger.error(f"❌ Failed to get beds: {response.status_code}")
                return 'default'

            beds = self._parse_list_response(response.json())
            if not beds:
                logger.warning("⚠️  Parsed beds response is empty or invalid")
                return 'default'

            patient_name = None
            bed_number = None
            patient_guid = None

            for bed in beds:
                if bed.get('status') == 1:
                    patient_name = bed.get('patientName') or bed.get('patient')
                    bed_number = bed.get('bedNumber') or bed.get('bed')
                    candidate_id = bed.get('patientId')

                    if self._is_guid(candidate_id):
                        logger.info(f"✅ Found occupied bed with GUID patientId: {bed_number}, Patient: {patient_name}")
                        return candidate_id

                    if patient_name:
                        logger.info(f"✅ Found occupied bed: {bed_number}, Patient: {patient_name}")
                        break

            if not patient_name:
                logger.warning("⚠️  No occupied bed with a patient name found")
                return 'default'

            requests_response = requests.get(
                f"{self.backend_api_url}/AdmissionRequest/GetAll",
                headers=self.headers,
                timeout=10
            )

            if requests_response.status_code != 200:
                logger.error(f"❌ Failed to get admission requests: {requests_response.status_code}")
                return 'default'

            all_requests = self._parse_list_response(requests_response.json())
            if not all_requests:
                logger.warning("⚠️  Parsed admission requests response is empty or invalid")
                return 'default'

            normalized_name = self._normalize_patient_name(patient_name)
            for req in all_requests:
                if self._normalize_patient_name(req.get('patientName')) == normalized_name:
                    patient_id = req.get('patientId')
                    if patient_id:
                        logger.info(f"✅ Found admission request for patient: {patient_name}")
                        logger.info(f"   PatientId (User.Id): {patient_id}")
                        return patient_id
                    logger.warning(f"⚠️  Admission request exists but patientId is empty for {patient_name}")
                    return 'default'

            logger.warning(f"⚠️  No admission request found for patient: {patient_name}")
            return 'default'

        except Exception as e:
            logger.error(f"❌ Error getting active patient ID: {e}")
            return 'default'

    def get_all_occupied_patients(self) -> list:
        """
        Get ALL occupied beds' patientId (User.Id GUID)
        Returns: list of dicts [{'patientId': guid, 'patientName': name, 'bedNumber': bed}, ...]
        """
        try:
            response = requests.get(
                f"{self.backend_api_url}/Bed/GetAll",
                headers=self.headers,
                timeout=10
            )
            if response.status_code != 200:
                logger.error(f"❌ Failed to get beds: {response.status_code}")
                return []

            beds = self._parse_list_response(response.json())
            if not beds:
                logger.warning("⚠️  Parsed beds response is empty or invalid")
                return []

            req_response = requests.get(
                f"{self.backend_api_url}/AdmissionRequest/GetAll",
                headers=self.headers,
                timeout=10
            )
            if req_response.status_code != 200:
                logger.error(f"❌ Failed to get admission requests: {req_response.status_code}")
                all_requests = []
            else:
                all_requests = self._parse_list_response(req_response.json())

            occupied_patients = []
            for bed in beds:
                if bed.get('status') != 1:
                    continue

                patient_name = bed.get('patientName') or bed.get('patient')
                bed_number = bed.get('bedNumber') or bed.get('bed')
                bed_patient_id = bed.get('patientId')

                if self._is_guid(bed_patient_id):
                    occupied_patients.append({
                        'patientId': bed_patient_id,
                        'patientName': patient_name or 'Unknown',
                        'bedNumber': bed_number or 'Unknown'
                    })
                    continue

                if not patient_name:
                    logger.warning(f"⚠️  Occupied bed {bed_number} has no patientName")
                    continue

                normalized_bed_name = self._normalize_patient_name(patient_name)
                patient_guid = None
                for req in all_requests:
                    if self._normalize_patient_name(req.get('patientName')) == normalized_bed_name:
                        candidate = req.get('patientId')
                        if self._is_guid(candidate):
                            patient_guid = candidate
                            break
                        if not patient_guid:
                            patient_guid = candidate

                if patient_guid:
                    occupied_patients.append({
                        'patientId': patient_guid,
                        'patientName': patient_name,
                        'bedNumber': bed_number or 'Unknown'
                    })
                else:
                    logger.warning(f"⚠️  No GUID found for occupied bed {bed_number} patient '{patient_name}'")

            logger.info(f"📥 Found {len(occupied_patients)} occupied patients")
            return occupied_patients
        except Exception as e:
            logger.error(f"❌ Error getting occupied patients: {e}")
            return []

    def send_vitals_to_all_patients(self, vital_signs: Dict) -> int:
        """
        Send the SAME vital signs reading to ALL occupied patients.
        Returns: count of successful saves.
        """
        # If OCR-style nested payload provided, extract primitive values
        try:
            # Detect nested structure (dict values with 'value')
            if any(isinstance(v, dict) and ('value' in v or 'val' in v) for v in (vital_signs.values() if isinstance(vital_signs, dict) else [])):
                base_payload = self._extract_vitals_payload(vital_signs)
            else:
                base_payload = vital_signs.copy() if isinstance(vital_signs, dict) else {}
        except Exception:
            base_payload = vital_signs.copy() if isinstance(vital_signs, dict) else {}

        patients = self.get_all_occupied_patients()
        if not patients:
            logger.warning("⚠️ No occupied patients found, trying active patient fallback")
            active_id = self.get_active_patient_id()
            if active_id and active_id != 'default':
                payload = base_payload.copy()
                payload['patientId'] = active_id
                payload.setdefault('recordedAt', datetime.utcnow().isoformat() + 'Z')
                if self.send_to_backend(payload):
                    logger.info(f"✅ Fallback saved for active patient GUID: {active_id}")
                    return 1
            return 0

        success_count = 0
        for patient in patients:
            payload = base_payload.copy()
            payload['patientId'] = patient['patientId']
            payload.setdefault('recordedAt', datetime.utcnow().isoformat() + 'Z')

            if self.send_to_backend(payload):
                success_count += 1
                logger.info(f"✅ Saved for {patient['patientName']} (Bed {patient['bedNumber']})")
            else:
                logger.error(f"❌ Failed for {patient['patientName']} (Bed {patient['bedNumber']})")

        return success_count

    def get_vital_signs(self) -> Optional[Dict]:
        """قراءة الـ Vital Signs من Camera Service"""
        try:
            response = requests.get(
                f"{self.camera_service_url}/vitals",
                timeout=5
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Camera service returned {response.status_code}")
                return None
                
        except requests.exceptions.ConnectionError:
            logger.error(f"Cannot connect to camera service at {self.camera_service_url}")
            return None
        except Exception as e:
            logger.error(f"Error getting vital signs: {e}")
            return None

    def send_to_ai_alert(self, vital_signs: Dict) -> bool:
        """
        JOB 1: Send vital signs to AI Alert endpoint for real-time prediction
        Called every 5 seconds → AI checks if patient is in danger
        If danger detected → backend sends alert to doctor and nurse
        
        Endpoint: POST /AIAlert/Predict
        Response: { "alertLevel": 0-3, "confidence": 0-100, "reason": "..." }
        """
        try:
            # If nested OCR payload provided, extract primitive values
            if isinstance(vital_signs, dict) and any(isinstance(v, dict) and ('value' in v or 'val' in v) for v in vital_signs.values()):
                payload = self._extract_vitals_payload(vital_signs)
            else:
                payload = vital_signs.copy() if isinstance(vital_signs, dict) else {}

            # Ensure we have a valid token
            if not self.token:
                logger.warning("⚠️  No token found, attempting login...")
                if not self.login():
                    return False

            # Determine patientId and patientName for query parameters
            patient_id = payload.get('patientId') or self.patient_id or 'default'
            patient_name = payload.get('patientName') if isinstance(payload.get('patientName'), str) else None

            if not patient_name and patient_id and patient_id != 'default':
                try:
                    occupants = self.get_all_occupied_patients()
                    for p in occupants:
                        if p.get('patientId') == patient_id:
                            patient_name = p.get('patientName')
                            break
                except Exception:
                    patient_name = None

            if not patient_name:
                patient_name = 'Unknown'

            # Normalize AI alert request body to backend contract
            systolic_bp, diastolic_bp = self._parse_blood_pressure(payload.get('bloodPressure') or payload.get('NBP'))
            ai_payload = {
                'heartRate': self._coerce_number(payload.get('heartRate'), int, 0),
                'spO2': self._coerce_number(payload.get('spO2'), int, 0),
                'systolicBP': max(0, systolic_bp),
                'diastolicBP': max(0, diastolic_bp),
                'temperature': min(43.0, max(35.0, self._coerce_number(payload.get('temperature'), float, 35.0))),
                'PatientId': patient_id,
                'PatientName': patient_name,
                'fallDetected': bool(payload.get('fallDetected', False))
            }

            params = {'patientId': patient_id, 'patientName': patient_name}

            # Send to AI Alert endpoint (with query params so controller can use patientName)
            response = requests.post(
                f"{self.backend_api_url}/AIAlert/Predict",
                params=params,
                json=ai_payload,
                headers=self.headers,
                timeout=10
            )
            
            # Handle 401 Unauthorized - Token expired
            if response.status_code == 401:
                if self.login():
                    response = requests.post(
                        f"{self.backend_api_url}/AIAlert/Predict",
                        params=params,
                        json=ai_payload,
                        headers=self.headers,
                        timeout=10
                    )
                else:
                    return False
            
            # Check response
            if response.status_code in [200, 201, 202]:
                try:
                    result = response.json()
                    if result.get('data', {}).get('alertLevel'):
                        logger.warning(f"⚠️  AI ALERT: Level={result['data']['alertLevel']}")
                except:
                    pass
                return True
            else:
                logger.error(f"❌ AI Alert endpoint returned {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Error sending to AI alert: {e}")
            return False

    def _normalize_vital_payload(self, vital_signs: Dict) -> Dict:
        """Normalize incoming OCR/back-end payload fields to backend JSON names."""
        payload = vital_signs.copy()

        field_map = {
            'HR': 'heartRate',
            'SpO2': 'spO2',
            'Pulse': 'pulse',
            'RR': 'respiratoryRate',
            'Temp': 'temperature',
            'NBP': 'bloodPressure',
            'BloodPressure': 'bloodPressure',
            'EtCO2': 'etCO2',
            'ETCO2': 'etCO2'
        }

        for source, target in field_map.items():
            if source in payload and target not in payload:
                payload[target] = payload[source]

        # Ensure backend vital sign payload stores valid integer blood pressure.
        if 'bloodPressure' in payload:
            systolic_bp, _ = self._parse_blood_pressure(payload.get('bloodPressure'))
            payload['bloodPressure'] = max(0, systolic_bp)
        elif 'NBP' in payload:
            systolic_bp, _ = self._parse_blood_pressure(payload.get('NBP'))
            payload['bloodPressure'] = max(0, systolic_bp)

        if not payload.get('recordedAt'):
            payload['recordedAt'] = datetime.utcnow().isoformat() + 'Z'

        return payload

    def send_to_backend(self, vital_signs: Dict) -> bool:
        """
        Send vital signs to backend API with JWT Authentication
        
        Expected payload from camera_ocr_complete.py (camelCase for JSON):
        {
            "patientId": str,
            "heartRate": int,
            "spO2": int,
            "etCO2": int,
            "pulse": int,
            "respiratoryRate": int,
            "temperature": float,
            "recordedAt": ISO 8601 string with Z
        }
        
        ✅ Maps to VitalSignDto fields (C# PascalCase → JSON camelCase via JsonNamingPolicy.CamelCase):
        - PatientId → patientId
        - HeartRate → heartRate
        - SpO2 → spO2
        - EtCO2 → etCO2
        - Pulse → pulse
        - RespiratoryRate → respiratoryRate
        - Temperature → temperature
        - RecordedAt → recordedAt
        
        ✅ Posts to: POST /VitalSign/Add (port 5140)
        ✅ With JWT Bearer token in Authorization header
        """
        try:
            # Ensure we have a valid token
            if not self.token:
                logger.warning("⚠️  No token found, attempting login...")
                if not self.login():
                    logger.error("❌ Login failed, cannot send vital signs")
                    return False
            
            # Prepare payload with patient ID
            payload = self._normalize_vital_payload(vital_signs)
            if not payload.get('patientId'):
                payload['patientId'] = self.patient_id or 'default'
            
            logger.info(f"📤 Sending vital signs for patient: {payload.get('patientId')}")
            logger.debug(f"   Payload: {payload}")
            
            # First attempt with current token
            response = requests.post(
                f"{self.backend_api_url}/VitalSign/Add",
                json=payload,
                headers=self.headers,
                timeout=10
            )
            
            # Handle 401 Unauthorized - Token expired
            if response.status_code == 401:
                logger.warning("🔄 Token expired (401 Unauthorized), re-logging in...")
                if self.login():
                    logger.info("🔄 Retrying vital signs with new token...")
                    # Retry with refreshed token
                    response = requests.post(
                        f"{self.backend_api_url}/VitalSign/Add",
                        json=payload,
                        headers=self.headers,
                        timeout=10
                    )
                else:
                    logger.error("❌ Re-login failed, cannot retry")
                    return False
            
            # Check final response
            if response.status_code in [200, 201, 202]:
                logger.info(f"✅ Vital signs sent successfully ({response.status_code})")
                logger.debug(f"   HR: {payload.get('heartRate')}, SpO2: {payload.get('spO2')}, "
                           f"etCO2: {payload.get('etCO2')}, Pulse: {payload.get('pulse')}, "
                           f"RR: {payload.get('respiratoryRate')}, Temp: {payload.get('temperature')}")
                return True
            else:
                logger.error(f"❌ Backend returned {response.status_code}: {response.text}")
                return False
                
        except requests.exceptions.ConnectionError:
            logger.error(f"❌ Cannot connect to backend at {self.backend_api_url}")
            return False
        except Exception as e:
            logger.error(f"❌ Error sending to backend: {e}")
            return False

    def check_backend_health(self) -> bool:
        """التحقق من صحة اتصال الـ Backend"""
        try:
            response = requests.get(
                f"{self.backend_api_url}/health",
                timeout=5
            )
            return response.status_code == 200
        except:
            return False

    def check_camera_health(self) -> bool:
        """التحقق من صحة Camera Service"""
        try:
            response = requests.get(
                f"{self.camera_service_url}/health",
                timeout=5
            )
            if response.status_code == 200:
                data = response.json()
                return data.get("camera_running", False)
        except:
            pass
        return False

    def start_polling(self, callback=None):
        """
        بدء polling مستمر للـ Vital Signs وإرسالها للـ Backend
        
        Args:
            callback: دالة يتم استدعاؤها عند كل عملية إرسال
        """
        self.is_running = True
        
        def polling_loop():
            logger.info("🔄 Starting backend polling...")
            logger.info(f"   Camera Service: {self.camera_service_url}")
            logger.info(f"   Backend API: {self.backend_api_url}")
            logger.info(f"   Polling Interval: {self.polling_interval} seconds")
            
            consecutive_errors = 0
            max_consecutive_errors = 5
            
            while self.is_running:
                try:
                    # التحقق من الاتصالات
                    if not self.check_camera_health():
                        logger.warning("⚠️  Camera service not responding")
                        consecutive_errors += 1
                    elif not self.check_backend_health():
                        logger.warning("⚠️  Backend API not responding")
                        consecutive_errors += 1
                    else:
                        # قراءة الـ Vital Signs
                        vital_signs = self.get_vital_signs()
                        
                        if vital_signs and vital_signs != self.last_vital_signs:
                            # Send to AI alert every polling cycle as a single check
                            self.send_to_ai_alert(vital_signs)

                            # Save to database for all occupied patients
                            saved_count = self.send_vitals_to_all_patients(vital_signs)
                            if saved_count > 0:
                                self.last_vital_signs = vital_signs
                                consecutive_errors = 0
                                if callback:
                                    callback(vital_signs)
                            else:
                                consecutive_errors += 1
                        
                    # التحقق من الأخطاء المتكررة
                    if consecutive_errors >= max_consecutive_errors:
                        logger.error(
                            f"❌ {consecutive_errors} consecutive errors. "
                            f"Stopping polling."
                        )
                        self.is_running = False
                        break
                    
                    time.sleep(self.polling_interval)
                    
                except Exception as e:
                    logger.error(f"❌ Polling error: {e}")
                    consecutive_errors += 1
                    time.sleep(self.polling_interval)
        
        # بدء في thread منفصل
        polling_thread = threading.Thread(target=polling_loop, daemon=True)
        polling_thread.start()

    def stop_polling(self):
        """إيقاف polling"""
        self.is_running = False
        logger.info("🛑 Polling stopped")


# مثال على الاستخدام
if __name__ == "__main__":
    # Initialize integration with JWT auth
    integration = BackendIntegration(
        camera_service_url="http://localhost:8000",
        backend_api_url="http://localhost:5140",
        username="superadmin",
        password="Admin@123456",
        polling_interval=5,
        config_file="ocr_config.json"  # Optional config file
    )
    
    def on_vital_signs_sent(vital_signs):
        print(f"\n✅ Vital signs sent at {vital_signs.get('timestamp')}")
        print(f"   HR: {vital_signs.get('heartRate')} bpm")
        print(f"   SpO2: {vital_signs.get('spO2')}%")
        print(f"   etCO2: {vital_signs.get('etCO2')}")
        print(f"   Pulse: {vital_signs.get('pulse')}")
        print(f"   RR: {vital_signs.get('respiratoryRate')}")
        print(f"   Temp: {vital_signs.get('temperature')}°C")
    
    # بدء Polling
    integration.start_polling(callback=on_vital_signs_sent)
    
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\nStopping...")
        integration.stop_polling()
        print("✅ Integration stopped")
