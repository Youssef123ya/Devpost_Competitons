from pathlib import Path
path = Path('test_roi_ocr_out.txt')
raw = path.read_bytes()
for enc in ['utf-8', 'utf-16', 'utf-16le', 'utf-16be', 'latin-1']:
    try:
        text = raw.decode(enc)
        print('ENCODING', enc)
        print(text)
        break
    except Exception as e:
        print('failed', enc, e)
