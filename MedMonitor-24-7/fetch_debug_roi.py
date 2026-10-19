import requests
from pathlib import Path

url = 'http://localhost:8000/debug_roi'
response = requests.get(url, timeout=10)
print('STATUS', response.status_code)
if response.status_code == 200:
    Path('debug_roi.jpg').write_bytes(response.content)
    print('Saved debug_roi.jpg')
else:
    print('ERROR', response.text[:400])
