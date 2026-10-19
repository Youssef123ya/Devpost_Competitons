import requests
from backend_integration import BackendIntegration

client = BackendIntegration(username='superadmin', password='Admin@123456')

print('[1] Getting all Users from backend...\n')

# Try to get users list (may need to check via admission requests or users endpoint)
urls = [
    'http://localhost:5140/User/GetAll',
    'http://localhost:5140/Users/GetAll',
    'http://localhost:5140/api/User/GetAll',
]

for url in urls:
    try:
        response = requests.get(url, headers=client.headers)
        if response.status_code == 200:
            print('✅ Found users endpoint: {}\n'.format(url))
            data = response.json()
            if isinstance(data, dict):
                data = data.get('data', [])
            
            print('Total Users: {}\n'.format(len(data)))
            for user in data[:10]:  # Show first 10
                user_id = user.get('id', 'N/A')
                user_name = user.get('userName', user.get('fullName', 'N/A'))
                print('ID: {}  |  Name: {}'.format(user_id, user_name))
            break
    except:
        pass

print('\n[2] Alternative: Check existing GUIDs from Admission Requests\n')

url = 'http://localhost:5140/AdmissionRequest/GetAll'
response = requests.get(url, headers=client.headers)

if response.status_code == 200:
    admissions = response.json()
    if isinstance(admissions, dict):
        admissions = admissions.get('data', [])
    
    print('All Patient GUIDs in system:')
    seen_guids = set()
    for admission in admissions:
        patient_id = admission.get('patientId')
        patient_name = admission.get('patientName')
        if patient_id and patient_id not in seen_guids:
            print('  {} → {}'.format(patient_name, patient_id))
            seen_guids.add(patient_id)
