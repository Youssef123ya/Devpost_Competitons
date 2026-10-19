from pathlib import Path
path = Path(r'C:\Nahda CS\PROJECT FINAL-NUB\fiels project\med_monitor\med_monitor\flutter_build_verbose.log')
text = path.read_bytes().decode('utf-16le', errors='replace')
lines = text.splitlines()
for i in range(570, 626):
    if i <= len(lines):
        print(f'{i}: {lines[i-1]}')
