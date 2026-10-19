import requests
from pprint import pprint
base = 'http://localhost:5140'
cred = {'userName': 'superadmin', 'password': 'Admin@123456'}
login = requests.post(f'{base}/LoginContoller/loginUser', json=cred, headers={'Content-Type': 'application/json'})
print('login', login.status_code)
print(login.text)
if login.status_code == 200:
    token = login.json().get('token')
    headers = {'Authorization': f'Bearer {token}', 'Accept': 'application/json'}
    beds = requests.get(f'{base}/Bed/GetAll', headers=headers)
    print('beds', beds.status_code)
    if beds.status_code == 200:
        data = beds.json()
        print('count', len(data))
        for bed in data[:50]:
            print(bed.get('id'), bed.get('bedNumber'), bed.get('status'), bed.get('patientId'), bed.get('patientName'))
    vitals = requests.get(f'{base}/VitalSign/GetByPatient', headers=headers, params={'patientId': '18543ebe-5751-4fe1-8fd6-a9c76425d4fa'})
    print('vitals', vitals.status_code)
    print(vitals.text[:1000])
