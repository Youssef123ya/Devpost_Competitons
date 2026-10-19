import requests
from backend_integration import BackendIntegration
from datetime import datetime
from collections import defaultdict

client = BackendIntegration(username='superadmin', password='Admin@123456')

guids = [
    ('18543ebe-5751-4fe1-8fd6-a9c76425d4fa', 'H1'),
]

print('[+] Checking data distribution by HOUR for all patients:\n')

for guid, bed_name in guids:
    url = 'http://localhost:5140/VitalSign/GetByPatient?patientId=' + guid
    response = requests.get(url, headers=client.headers)
    
    if response.status_code == 200:
        data = response.json()
        records = data if isinstance(data, list) else data.get('data', [])
        
        if not records:
            print('Patient {} - NO DATA'.format(bed_name))
            continue
        
        # Group by hour
        hours = defaultdict(int)
        for record in records:
            if isinstance(record, dict) and 'recordedAt' in record:
                try:
                    dt = datetime.fromisoformat(record['recordedAt'].replace('Z', '+00:00'))
                    hour = dt.hour
                    hours[hour] += 1
                except:
                    pass
        
        print('Patient {} - {} total records:'.format(bed_name, len(records)))
        if hours:
            for hour in sorted(hours.keys()):
                print('  {:02d}:00 - {} records'.format(hour, hours[hour]))
        else:
            print('  (Could not parse timestamps)')
    else:
        print('Patient {} - Error {}'.format(bed_name, response.status_code))
    
    print()
