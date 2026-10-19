import requests

for ep in ['/debug', '/health', '/vitals']:
    url = 'http://127.0.0.1:8001' + ep
    try:
        r = requests.get(url, timeout=5)
        print('URL:', url)
        print('Status:', r.status_code)
        print('Content-Type:', r.headers.get('content-type'))
        print(r.text)
    except Exception as e:
        print('ERROR', e)
    print('---')
