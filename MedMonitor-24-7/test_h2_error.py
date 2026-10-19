import requests
from backend_integration import BackendIntegration
from datetime import datetime

client = BackendIntegration(username='superadmin', password='Admin@123456')

# Test with H2 new GUID
test_guid = '7b20aa47-84d3-4656-aff1-de8d14d16c18'

payload = {
    'patientId': test_guid,
    'heartRate': 75,
    'spo2': 95,
    'pulse': 72,
    'respiratoryRate': 16,
    'temperature': 37.0,
    'recordedAt': datetime.utcnow().isoformat() + 'Z'
}

print('[Test] Posting vital sign for new GUID: {}\n'.format(test_guid))
print('Payload: {}\n'.format(payload))

response = requests.post(
    'http://localhost:5140/VitalSign/Add',
    json=payload,
    headers=client.headers
)

print('Status: {}'.format(response.status_code))
print('Response: {}'.format(response.text[:500]))
