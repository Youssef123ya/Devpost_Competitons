import requests
from backend_integration import BackendIntegration
import uuid

client = BackendIntegration(username='superadmin', password='Admin@123456')

print('[1] Creating new User Accounts for H2 and H3...\n')

# Create new users
users_to_create = [
    {
        'name': 'ahmed magdy',
        'email': 'ahmed.magdy@hospital.com',
        'national_id': '2210501111',
        'phone': '01234567890',
        'role': 'patient'
    },
    {
        'name': 'kerols Emad',
        'email': 'kerols.emad@hospital.com',
        'national_id': '222103456',
        'phone': '01234567891',
        'role': 'patient'
    }
]

created_guids = {}

for user_info in users_to_create:
    payload = {
        'userName': user_info['name'].lower().replace(' ', ''),
        'email': user_info['email'],
        'fullName': user_info['name'],
        'phoneNumber': user_info['phone'],
        'nationalId': user_info['national_id'],
        'isActive': True,
        'password': 'Patient@123'
    }
    
    print('Creating user: {}'.format(user_info['name']))
    
    # Try different registration endpoints
    endpoints = [
        'http://localhost:5140/api/User/Register',
        'http://localhost:5140/User/Register',
        'http://localhost:5140/auth/register',
    ]
    
    for endpoint in endpoints:
        response = requests.post(endpoint, json=payload, headers=client.headers)
        
        if response.status_code in [200, 201]:
            try:
                data = response.json()
                # Extract GUID from response
                guid = data.get('id') or data.get('userId') or str(uuid.uuid4())
                created_guids[user_info['name']] = guid
                print('  ✅ Created: {} → {}'.format(user_info['name'], guid[:20]))
            except:
                print('  ⚠️  Created but could not extract GUID from {}'.format(endpoint))
            break
        elif response.status_code == 400:
            # User might already exist
            continue
        else:
            print('  ⚠️  {}: {}'.format(endpoint.split('/')[-1], response.status_code))

print('\n[2] If users were created, use these GUIDs:')
if created_guids:
    for name, guid in created_guids.items():
        print('  {}: {}'.format(name, guid))
else:
    print('  Could not create users - they may already exist or endpoint not available')
    print('  Fallback: Use existing GUIDs from A2/A3 for H2/H3')
