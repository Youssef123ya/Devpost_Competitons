import urllib.request
import json

TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1bmlxdWVfbmFtZSI6ImRvY3RvcjEiLCJVc2VySWQiOiJjYWZlYTVkNi05YmY2LTRjODYtYjJmNC00ZDUzMzdiNjgyMmEiLCJFbWFpbCI6ImRvY3RvcjFAZXhhbXBsZS5jb20iLCJGdWxsTmFtZSI6IkRvY3RvciBPbmUiLCJQaG9uZU51bWJlciI6IjAxMTExMjIyMzMzIiwiSXNBY3RpdmUiOiJUcnVlIiwicm9sZSI6IkRvY3RvciIsIm5iZiI6MTc4MTEyODM4OCwiZXhwIjoxODEyNjY0Mzg4LCJpYXQiOjE3ODExMjgzODgsImlzcyI6Imh0dHBzOi8vbGF1bmNoLnNtYXJ0aGVhbHRoaXQub3JnL3YvcjQvZmhpciIsImF1ZCI6IjQ4ZGI4YmNjLWRhMmEtNDRiNy1iMzg1LTE4NTlkMTQyNmQxMCJ9.sGtc47AQ7LPq6N29tHNk94x-fZU57C9wUHcQYb9SYKY'
HEADERS = {'Authorization': f'Bearer {TOKEN}', 'Accept': 'application/json'}

for patient_id in ['18543ebe-5751-4fe1-8fd6-a9c76425d4fa']:
    url = f'http://localhost:5140/VitalSign/GetByPatient?patientId={patient_id}'
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req) as resp:
            body = resp.read().decode('utf-8')
            print('PATIENT_ID:', patient_id)
            print('STATUS:', resp.status)
            print(body)
            print('---')
    except Exception as e:
        print('PATIENT_ID:', patient_id)
        print('ERROR:', e)
        print('---')
