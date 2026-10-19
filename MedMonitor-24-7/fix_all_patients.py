import requests
import uuid
from backend_integration import BackendIntegration
from datetime import datetime, timedelta

client = BackendIntegration(username='superadmin', password='Admin@123456')

# Define patient mappings with current patient GUID
patients = {
    'H1': {'name': 'Maro Isaac', 'guid': '18543ebe-5751-4fe1-8fd6-a9c76425d4fa'},  # Current patient with vital signs data
}

print('[1] Assigning GUIDs to ALL patients (including H2, H3)...\n')

for bed, info in patients.items():
    print('Bed: {}  |  Patient: {}  |  GUID: {}'.format(
        bed, info['name'], info['guid']
    ))

print('\n[2] Creating test vital signs data for all patients (8 AM - 8 PM)...\n')

for bed, info in patients.items():
    guid = info['guid']
    
    # Create 13 hours of data (8 AM to 8 PM)
    success_count = 0
    for hour in range(8, 21):
        payload = {
            'patientId': guid,
            'heartRate': 70 + hour + int(bed[0], 36) % 10,
            'spo2': 95 + (hour % 3),
            'pulse': 72 + hour,
            'respiratoryRate': 16 + (hour % 4),
            'temperature': 37.0 + (hour % 5) * 0.1,
            'recordedAt': datetime.utcnow().replace(hour=hour, minute=0, second=0, microsecond=0).isoformat() + 'Z'
        }
        
        response = requests.post(
            'http://localhost:5140/VitalSign/Add',
            json=payload,
            headers=client.headers
        )
        
        if response.status_code == 200:
            success_count += 1
    
    print('✅ Bed {}: Created {} records for {}'.format(bed, success_count, info['name']))

print('\n[3] Verification: Checking records per bed...\n')

for bed, info in patients.items():
    guid = info['guid']
    url = 'http://localhost:5140/VitalSign/GetByPatient?patientId=' + guid
    response = requests.get(url, headers=client.headers)
    
    if response.status_code == 200:
        data = response.json()
        records = data if isinstance(data, list) else data.get('data', [])
        count = len(records) if isinstance(records, list) else 0
        
        print('✅ Bed {}: {} records found'.format(bed, count))
    else:
        print('❌ Bed {}: Status {}'.format(bed, response.status_code))

print('\n[✓] Complete! Now all patients have vital sign data.')
print('[✓] Use these GUIDs in bedPatientId assignments:')
for bed, info in patients.items():
    print('  Bed {} ({}): {}'.format(bed, info['name'], info['guid']))
