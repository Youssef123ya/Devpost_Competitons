from backend_integration import BackendIntegration
import requests
import json

# Login
print('[1] Logging in...')
client = BackendIntegration(username='superadmin', password='Admin@123456')

# Check each bed's GUID for vital signs
guids = [
    ('18543ebe-5751-4fe1-8fd6-a9c76425d4fa', 'H1'),
]

print('\n[2] Checking vital sign records per patient GUID:\n')
for guid, bed_name in guids:
    url = 'http://localhost:5140/VitalSign/GetByPatient?patientId=' + guid
    try:
        response = requests.get(url, headers=client.headers)
        if response.status_code == 200:
            data = response.json()
            
            # API may return list directly or wrapped in {data: [...]}
            records = data
            if isinstance(data, dict):
                records = data.get('data', [])
            
            count = len(records) if isinstance(records, list) else 0
            print('Patient {} ({}...):'.format(bed_name, guid[:8]))
            print('  Records: {}'.format(count))
            if count > 0 and isinstance(records, list):
                latest = records[0]
                print('  Latest: HR={}, SpO2={}, Temp={}'.format(
                    latest.get('heartRate'),
                    latest.get('spo2'),
                    latest.get('temperature')
                ))
        else:
            print('Patient {}: {}'.format(bed_name, response.status_code))
    except Exception as e:
        print('Patient {}: Error - {}'.format(bed_name, str(e)[:80]))
    print()
