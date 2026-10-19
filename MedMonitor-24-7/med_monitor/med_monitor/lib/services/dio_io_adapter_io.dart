import 'package:dio/dio.dart';
import 'package:dio/io.dart';

HttpClientAdapter? createIOHttpClientAdapter() {
  return IOHttpClientAdapter(
    validateCertificate: (certificate, host, port) => true,
  );
}
