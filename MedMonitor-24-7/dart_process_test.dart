import 'dart:io';

void main() async {
  final path1 = r'C:\Nahda CS\PROJECT FINAL-NUB\flutter_windows_3.41.9-stable\flutter\bin\cache\dart-sdk\bin\dart.exe';
  final path2 = r'C:\Nahda CS\PROJECT FINAL-NUB\flutter_windows_3.41.9-stable\flutter\bin\cache\dart-sdk\bin\dart';
  final args = ['--version'];
  for (final path in [path1, path2]) {
    print('TEST path: $path');
    for (final runInShell in [false, true]) {
      print(' runInShell=$runInShell');
      try {
        final process = await Process.start(path, args, runInShell: runInShell);
        final out = await process.stdout.transform(systemEncoding.decoder).join();
        final err = await process.stderr.transform(systemEncoding.decoder).join();
        print('  exit ${process.exitCode}');
        print('  stdout: $out');
        print('  stderr: $err');
      } catch (e, st) {
        print('  exception: $e');
        print(st);
      }
    }
  }
}
