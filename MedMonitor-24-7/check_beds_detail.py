import requests
from backend_integration import BackendIntegration

client = BackendIntegration(username='superadmin', password='Admin@123456')

print('[1] Getting ALL beds...\n')

url = 'http://localhost:5140/Bed/GetAll'
response = requests.get(url, headers=client.headers)

if response.status_code == 200:
    beds = response.json()
    if isinstance(beds, dict):
        beds = beds.get('data', [])
    
    print('Total beds: {}\n'.format(len(beds)))
    print('Occupied beds:\n')
    
    for bed in beds:
        if bed.get('status') == 1:  # Occupied
            bed_number = bed.get('bedNumber', 'N/A')
            patient_name = bed.get('patientName', 'N/A')
            patient_id = bed.get('patientId', 'N/A')
            
            print('Bed: {}  |  Patient: {}  |  patientId: {}'.format(
                bed_number, patient_name, patient_id
            ))
