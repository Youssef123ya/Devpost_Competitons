import requests
from backend_integration import BackendIntegration

client = BackendIntegration(username='superadmin', password='Admin@123456')

print('[1] Getting admission requests to find real GUIDs...\n')

url = 'http://localhost:5140/AdmissionRequest/GetAll'
response = requests.get(url, headers=client.headers)

if response.status_code == 200:
    admissions = response.json()
    if isinstance(admissions, dict):
        admissions = admissions.get('data', [])
    
    print('Searching for patients: ahmed magdy, kerols Emad, Patient Two, Patient Three, Patient Four, Shad Ahmed\n')
    
    target_patients = [
        'ahmed magdy',
        'kerols emad',
        'patient two',
        'patient three',
        'patient four',
        'shad ahmed'
    ]
    
    for admission in admissions:
        patient_name = admission.get('patientName', '').lower()
        patient_id = admission.get('patientId', 'N/A')
        
        for target in target_patients:
            if target in patient_name:
                print('✅ Found: {}  →  GUID: {}'.format(
                    admission.get('patientName'),
                    patient_id
                ))
                break
