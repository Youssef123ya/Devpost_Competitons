import 'dart:io';

void main() async {
  final dartExe = r'C:\Nahda CS\PROJECT FINAL-NUB\flutter_windows_3.41.9-stable\flutter\bin\cache\dart-sdk\bin\dart.exe';
  final scriptPath = r'C:\Nahda CS\PROJECT FINAL-NUB\fiels project\med_monitor\med_monitor\temp_script.dart';
  final outputPath = r'C:\Nahda CS\PROJECT FINAL-NUB\fiels project\med_monitor\med_monitor\temp_script.dill';
  await File(scriptPath).writeAsString('void main() => print("hello");');
  final args = ['compile', 'kernel', '--output=$outputPath', scriptPath];
  print('Process.start $dartExe ${args.join(' ')}');
  try {
    final process = await Process.start(dartExe, args, runInShell: false);
    final out = await process.stdout.transform(systemEncoding.decoder).join();
    final err = await process.stderr.transform(systemEncoding.decoder).join();
    final rc = await process.exitCode;
    print('exitCode=$rc');
    print('stdout=$out');
    print('stderr=$err');
  } catch (e, st) {
    print('exception: $e');
    print(st);
  }
}
