import requests
import cv2
import numpy as np

base = 'http://127.0.0.1:8001'
endpoints = ['/health', '/vitals', '/debug_roi', '/snapshot']
for ep in endpoints:
    url = base + ep
    try:
        r = requests.get(url, timeout=10)
        print('URL:', url, 'status:', r.status_code, 'content-type:', r.headers.get('content-type'))
        if r.headers.get('content-type', '').startswith('image'):
            data = np.frombuffer(r.content, np.uint8)
            img = cv2.imdecode(data, cv2.IMREAD_COLOR)
            if img is None:
                print('  failed to decode image')
            else:
                fn = 'live' + ep.replace('/', '_') + '.jpg'
                cv2.imwrite(fn, img)
                print('  saved', fn, 'shape', img.shape)
        else:
            print('  body:', r.text[:800])
    except Exception as exc:
        print('  error:', exc)
