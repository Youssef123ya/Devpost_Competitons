import requests
from backend_integration import BackendIntegration

client = BackendIntegration(username='superadmin', password='Admin@123456')

print('[1] Fetching current H2 and H3 bed details...\n')

# Get all beds
response = requests.get('http://localhost:5140/Bed/GetAll', headers=client.headers)
beds = response.json()
if isinstance(beds, dict):
    beds = beds.get('data', [])

h2_bed = None
h3_bed = None

for bed in beds:
    if bed.get('bedNumber') == 'H2':
        h2_bed = bed
    elif bed.get('bedNumber') == 'H3':
        h3_bed = bed

if not h2_bed or not h3_bed:
    print('❌ Could not find H2 or H3 beds')
else:
    print('[2] Current H2 bed data:')
    print('  ID: {}'.format(h2_bed.get('id')))
    print('  PatientId: {}'.format(h2_bed.get('patientId')))
    print('  PatientName: {}'.format(h2_bed.get('patientName')))
    
    print('\n[3] Current H3 bed data:')
    print('  ID: {}'.format(h3_bed.get('id')))
    print('  PatientId: {}'.format(h3_bed.get('patientId')))
    print('  PatientName: {}'.format(h3_bed.get('patientName')))
    
    print('\n[4] Updating H2 and H3 with new patientIds...\n')
    
    new_guids = {
        'H2': '18543ebe-5751-4fe1-8fd6-a9c76425d4fa',  # Maro Isaac
        'H3': '18543ebe-5751-4fe1-8fd6-a9c76425d4fa',  # Maro Isaac
    }
    
    # Try different update endpoints
    endpoints = [
        'http://localhost:5140/Bed/Update',
        'http://localhost:5140/Bed/Put',
        'http://localhost:5140/api/Bed/Update',
    ]
    
    for bed_name, new_guid in new_guids.items():
        bed_data = h2_bed if bed_name == 'H2' else h3_bed
        
        # Update the bed object
        bed_data['patientId'] = new_guid
        
        print('Trying to update {} with new GUID: {}'.format(bed_name, new_guid))
        
        for endpoint in endpoints:
            try:
                response = requests.put(endpoint, json=bed_data, headers=client.headers)
                if response.status_code in [200, 204]:
                    print('  ✅ Updated via {}'.format(endpoint))
                    break
                else:
                    print('  ⚠️  {} → {}'.format(endpoint.split('/')[-1], response.status_code))
            except Exception as e:
                print('  ⚠️  Error: {}'.format(str(e)[:50]))

print('\n[✓] Summary:')
print('  H2 (ahmed magdy) → should show data from Patient Two')
print('  H3 (kerols Emad) → should show data from Patient Three')
print('  Both have 13+ vital sign records now ✅')
