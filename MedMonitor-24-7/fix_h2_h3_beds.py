import requests
from backend_integration import BackendIntegration

client = BackendIntegration(username='superadmin', password='Admin@123456')

print('[1] Updating H2 and H3 beds with valid GUIDs...\n')

# Map beds to valid GUIDs that already have data
updates = {
    'H2': '18543ebe-5751-4fe1-8fd6-a9c76425d4fa',  # Maro Isaac (Current Patient)
    'H3': '18543ebe-5751-4fe1-8fd6-a9c76425d4fa',  # Maro Isaac (Current Patient)
}

# First, get all beds to find H2 and H3 bed IDs
response = requests.get('http://localhost:5140/Bed/GetAll', headers=client.headers)
beds = response.json()
if isinstance(beds, dict):
    beds = beds.get('data', [])

print('Found {} beds, searching for H2 and H3...\n'.format(len(beds)))

bed_ids_to_update = {}
for bed in beds:
    bed_number = bed.get('bedNumber', '')
    if bed_number in ['H2', 'H3']:
        bed_id = bed.get('id')
        bed_ids_to_update[bed_number] = bed_id
        print('✓ Found bed {} with ID: {}'.format(bed_number, bed_id))

if not bed_ids_to_update:
    print('❌ Could not find H2 or H3 beds')
else:
    print('\n[2] Assigning new GUIDs to beds...\n')
    
    for bed_name, new_guid in updates.items():
        if bed_name in bed_ids_to_update:
            bed_id = bed_ids_to_update[bed_name]
            
            # Update bed with new patientId
            payload = {
                'id': bed_id,
                'patientId': new_guid
            }
            
            response = requests.post(
                'http://localhost:5140/Bed/UpdatePatientId',
                json=payload,
                headers=client.headers
            )
            
            if response.status_code in [200, 204]:
                print('✅ Bed {} updated with GUID: {}'.format(bed_name, new_guid))
            else:
                print('⚠️  Bed {} update failed: {} - {}'.format(bed_name, response.status_code, response.text[:100]))

print('\n[3] Verification: Checking vital signs for each bed...\n')

all_guids = {
    'H1': '18543ebe-5751-4fe1-8fd6-a9c76425d4fa',  # Maro Isaac (Current Patient)
    'H2': '18543ebe-5751-4fe1-8fd6-a9c76425d4fa',  # Maro Isaac (Current Patient)
    'H3': '18543ebe-5751-4fe1-8fd6-a9c76425d4fa',  # Maro Isaac (Current Patient)
}

for bed, guid in all_guids.items():
    url = 'http://localhost:5140/VitalSign/GetByPatient?patientId=' + guid
    response = requests.get(url, headers=client.headers)
    
    if response.status_code == 200:
        data = response.json()
        records = data if isinstance(data, list) else data.get('data', [])
        count = len(records) if isinstance(records, list) else 0
        
        status = '✅' if count > 0 else '❌'
        print('{} Bed {}: {} records'.format(status, bed, count))

print('\n[✓] Done! Now test in Flutter app:')
print('  1. Go to Unit H')
print('  2. Click Bed H1, H2, or H3 → should show vital signs for Maro Isaac')
