import subprocess
from pathlib import Path

dart = Path(r'C:\Nahda CS\PROJECT FINAL-NUB\flutter_windows_3.41.9-stable\flutter\bin\cache\dart-sdk\bin\dart.exe')
args = [
    str(dart),
    'compile',
    'kernel',
    '--packages=C:\Nahda CS\PROJECT FINAL-NUB\fiels project\med_monitor\med_monitor\.dart_tool\package_config.json',
    '--output=C:\Nahda CS\PROJECT FINAL-NUB\fiels project\med_monitor\med_monitor\.dart_tool\hooks_runner\objective_c\a2c0516986\hook.dill',
    '--depfile=C:\Nahda CS\PROJECT FINAL-NUB\fiels project\med_monitor\med_monitor\.dart_tool\hooks_runner\objective_c\a2c0516986\hook.dill.d',
    r'C:\Users\compumarts\AppData\Local\Pub\Cache\hosted\pub.dev\objective_c-9.4.1\hook\build.dart',
]
print('cmd:', args)
try:
    result = subprocess.run(args, capture_output=True, text=True)
    print('rc', result.returncode)
    print('stdout', result.stdout[:1000])
    print('stderr', result.stderr[:1000])
except Exception as e:
    print('exc', e)
