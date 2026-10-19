import requests
from backend_integration import BackendIntegration

client = BackendIntegration(username='superadmin', password='Admin@123456')

print('[1] Trying POST endpoint to update beds...\n')

# Get current bed IDs
response = requests.get('http://localhost:5140/Bed/GetAll', headers=client.headers)
beds = response.json()
if isinstance(beds, dict):
    beds = beds.get('data', [])

updates = {
    'H2': {'id': 2967, 'new_guid': '18543ebe-5751-4fe1-8fd6-a9c76425d4fa'},
    'H3': {'id': 2968, 'new_guid': '18543ebe-5751-4fe1-8fd6-a9c76425d4fa'},
}

for bed_name, info in updates.items():
    bed_id = info['id']
    new_guid = info['new_guid']
    
    # Try POST to assign patient
    payload = {
        'bedId': bed_id,
        'patientId': new_guid
    }
    
    endpoints = [
        ('http://localhost:5140/Bed/AssignPatient', 'AssignPatient'),
        ('http://localhost:5140/Bed/Update', 'Update (POST)'),
    ]
    
    for url, name in endpoints:
        response = requests.post(url, json=payload, headers=client.headers)
        print('Bed {}: {} → {}'.format(bed_name, name, response.status_code))
        if response.status_code in [200, 204]:
            print('  ✅ Success!')
            break

print('\n[2] Final verification...\n')

response = requests.get('http://localhost:5140/Bed/GetAll', headers=client.headers)
beds = response.json()
if isinstance(beds, dict):
    beds = beds.get('data', [])

for bed in beds:
    if bed.get('bedNumber') in ['H2', 'H3']:
        print('Bed: {}  |  patientId: {}'.format(bed.get('bedNumber'), bed.get('patientId')))
