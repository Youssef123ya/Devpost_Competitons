import os
import requests
import json

SERVICE_PORT = int(os.environ.get('SERVICE_PORT', '8001'))
BASE_URL = f'http://localhost:{SERVICE_PORT}'

print(f"Checking OCR service endpoints on {BASE_URL}")
for ep in ['/vitals', '/snapshot', '/debug', '/debug_roi', '/health']:
    try:
        r = requests.get(BASE_URL + ep, timeout=10)
        print(ep, r.status_code, r.headers.get('Content-Type', '')[:50])
        if 'application/json' in r.headers.get('Content-Type', ''):
            print(json.dumps(r.json(), indent=2)[:800])
        else:
            print('non-json', len(r.content), 'bytes')
    except Exception as e:
        print(ep, 'ERROR', e)
