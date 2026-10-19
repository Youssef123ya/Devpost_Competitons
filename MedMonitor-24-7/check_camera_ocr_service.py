import requests
import cv2
import numpy as np

urls = [
    'http://127.0.0.1:8001/debug_roi',
    'http://127.0.0.1:8001/snapshot',
    'http://127.0.0.1:8001/vitals',
    'http://127.0.0.1:8001/health'
]
for url in urls:
    try:
        r = requests.get(url, timeout=10)
        print(url, r.status_code, r.headers.get('content-type'))
        if r.headers.get('content-type', '').startswith('image'):
            data = np.frombuffer(r.content, np.uint8)
            img = cv2.imdecode(data, cv2.IMREAD_COLOR)
            if img is not None:
                fn = 'live_' + url.split('/')[-1] + '.jpg'
                cv2.imwrite(fn, img)
                print('saved', fn, 'shape', img.shape)
            else:
                print('failed to decode image')
        else:
            print(r.text[:500])
    except Exception as exc:
        print(url, 'ERROR', exc)
