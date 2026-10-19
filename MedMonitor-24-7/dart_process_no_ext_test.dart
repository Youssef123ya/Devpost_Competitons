import 'dart:io';

void main() async {
  final pathExe = r'C:\Nahda CS\PROJECT FINAL-NUB\flutter_windows_3.41.9-stable\flutter\bin\cache\dart-sdk\bin\dart.exe';
  final pathNoExt = r'C:\Nahda CS\PROJECT FINAL-NUB\flutter_windows_3.41.9-stable\flutter\bin\cache\dart-sdk\bin\dart';
  for (final path in [pathExe, pathNoExt]) {
    print('=== Testing: $path');
    try {
      final process = await Process.start(path, ['--version'], runInShell: false);
      final out = await process.stdout.transform(systemEncoding.decoder).join();
      final err = await process.stderr.transform(systemEncoding.decoder).join();
      final rc = await process.exitCode;
      print('exit: $rc');
      print('stdout: $out');
      print('stderr: $err');
    } catch (e, st) {
      print('exception: $e');
      print(st);
    }
  }
}
