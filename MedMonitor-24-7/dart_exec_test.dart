import 'dart:io';

void main() async {
  final path = r'C:\Nahda CS\PROJECT FINAL-NUB\flutter_windows_3.41.9-stable\flutter\bin\cache\dart-sdk\bin\dart.exe';
  print('Launching: $path');
  try {
    final process = await Process.start(path, ['--version'], runInShell: false);
    await stdout.addStream(process.stdout);
    await stderr.addStream(process.stderr);
    final rc = await process.exitCode;
    print('exit code: $rc');
  } catch (e, st) {
    print('exception: $e');
    print(st);
  }
}
