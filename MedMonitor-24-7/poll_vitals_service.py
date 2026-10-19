import time
import requests

for i in range(15):
    try:
        r = requests.get('http://127.0.0.1:8001/vitals', timeout=5)
        print(f'{i}:', r.status_code, r.text)
    except Exception as e:
        print(f'{i}: error', e)
    time.sleep(2)
