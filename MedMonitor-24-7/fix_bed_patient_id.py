"""
Fix test data: Assign GUID to occupied beds so Flutter can fetch vitals
The known GUID with vitals: 18543ebe-5751-4fe1-8fd6-a9c76425d4fa
The occupied test bed: H1 (bedNumber H1)
"""

import requests
import json

base = 'http://localhost:5140'
known_guid = '18543ebe-5751-4fe1-8fd6-a9c76425d4fa'
occupied_bed_ids = [1]  # Bed H1 (assuming ID 1, adjust as needed)

# Step 1: Login
print("[1] Logging in...")
login_resp = requests.post(
    f'{base}/LoginContoller/loginUser',
    json={'userName': 'superadmin', 'password': 'Admin@123456'},
    headers={'Content-Type': 'application/json'}
)
print(f"    Status: {login_resp.status_code}")

if login_resp.status_code != 200:
    print(f"❌ Login failed: {login_resp.text}")
    exit(1)

token = login_resp.json()['token']
headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}

# Step 2: Assign GUID to each occupied bed
print(f"\n[2] Assigning GUID {known_guid} to occupied beds...")
for bed_id in occupied_bed_ids:
    resp = requests.post(
        f'{base}/Bed/AssignPatient',
        params={'bedId': bed_id, 'patientId': known_guid},
        headers=headers
    )
    status = "✅" if resp.status_code == 200 else "❌"
    print(f"    Bed {bed_id}: {status} {resp.status_code}")
    if resp.status_code != 200:
        print(f"       Error: {resp.text[:200]}")

# Step 3: Verify the fix by fetching beds again
print(f"\n[3] Verifying beds now have patientId...")
beds_resp = requests.get(f'{base}/Bed/GetAll', headers=headers)
if beds_resp.status_code == 200:
    beds = beds_resp.json()
    print(f"    Checking first 5 beds:")
    for bed in beds[:5]:
        patient_id = bed.get('patientId')
        status_icon = "✅" if patient_id == known_guid else "❌"
        print(f"    Bed {bed['bedNumber']}: patientId = {patient_id} {status_icon}")

# Step 4: Verify vitals can be fetched for this patientId
print(f"\n[4] Verifying vitals exist for GUID...")
vitals_resp = requests.get(
    f'{base}/VitalSign/GetByPatient',
    params={'patientId': known_guid},
    headers=headers
)
if vitals_resp.status_code == 200:
    vitals = vitals_resp.json()
    print(f"    ✅ Found {len(vitals)} vital sign records")
    if vitals:
        first = vitals[0]
        print(f"    Latest: HR={first.get('heartRate')}, SpO2={first.get('spO2')}, Temp={first.get('temperature')}")
else:
    print(f"    ❌ Error: {vitals_resp.status_code}")

print("\n✅ Fix complete! Now test in Flutter app.")
