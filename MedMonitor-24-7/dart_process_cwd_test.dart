import 'dart:io';

void main() async {
  final executable = r'C:\Nahda CS\PROJECT FINAL-NUB\flutter_windows_3.41.9-stable\flutter\bin\cache\dart-sdk\bin\dart.exe';
  final cwd = r'C:\Nahda CS\PROJECT FINAL-NUB\fiels project';
  final args = ['--version'];
  print('Executable: $executable');
  print('Working dir: $cwd');
  try {
    final process = await Process.start(executable, args, workingDirectory: cwd, runInShell: false);
    print('started pid ${process.pid}');
    final out = await process.stdout.transform(systemEncoding.decoder).join();
    final err = await process.stderr.transform(systemEncoding.decoder).join();
    print('stdout: $out');
    print('stderr: $err');
    print('exit: ${await process.exitCode}');
  } catch (e, st) {
    print('exception: $e');
    print(st);
  }
}
