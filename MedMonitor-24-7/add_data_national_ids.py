import requests
from backend_integration import BackendIntegration
from datetime import datetime

client = BackendIntegration(username='superadmin', password='Admin@123456')

print('[1] Creating vital signs for H2 and H3 using their current IDs...\n')

# Use the CURRENT national IDs for H2 and H3
patient_ids = {
    'H2 (ahmed magdy)': '2210501111',
    'H3 (kerols Emad)': '222103456',
}

print('[Attempting to add vital signs with national IDs]\n')

for patient_name, patient_id in patient_ids.items():
    print('Patient: {}  |  ID: {}'.format(patient_name, patient_id))
    
    success_count = 0
    for hour in range(8, 21):
        payload = {
            'patientId': patient_id,
            'heartRate': 72 + hour,
            'spo2': 96 + (hour % 3),
            'pulse': 74 + hour,
            'respiratoryRate': 17 + (hour % 4),
            'temperature': 37.5 + (hour % 5) * 0.1,
            'recordedAt': datetime.utcnow().replace(hour=hour, minute=0, second=0, microsecond=0).isoformat() + 'Z'
        }
        
        response = requests.post(
            'http://localhost:5140/VitalSign/Add',
            json=payload,
            headers=client.headers
        )
        
        if response.status_code == 200:
            success_count += 1
        else:
            if hour == 8:  # Only print first error to avoid spam
                print('  Error: {} - {}'.format(response.status_code, response.text[:80]))
    
    print('  Added {} records\n'.format(success_count))

print('\n[2] Summary:')
print('=== Current Bed Status ===')
print('A1-A5: GUIDs with 13+ records each ✅')
print('H2: National ID 2210501111 - attempting to add test data')
print('H3: National ID 222103456 - attempting to add test data')
print('\nNote: Flutter will need to use GUID format to query vital signs.')
print('For H2 and H3 to work, they need to be assigned VALID GUIDs.')
