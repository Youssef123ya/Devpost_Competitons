import subprocess
from pathlib import Path

def run(cmd):
    print('CMD:', cmd)
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        print('RC:', result.returncode)
        print('STDOUT:', result.stdout)
        print('STDERR:', result.stderr)
    except Exception as e:
        print('EXC:', type(e).__name__, e)

paths = [
    r'C:\Nahda CS\PROJECT FINAL-NUB\flutter_windows_3.41.9-stable\flutter\bin\cache\dart-sdk\bin\dart.exe',
    r'C:\Nahda CS\PROJECT FINAL-NUB\flutter_windows_3.41.9-stable\flutter\bin\cache\dart-sdk\bin\dart',
]
for p in paths:
    run([p, '-e', 'print(1)'])
    print('---')
    run(['C:\Windows\System32\cmd.exe', '/C', p, '-e', 'print(1)'])
    print('===')
