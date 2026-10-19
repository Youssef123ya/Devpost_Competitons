class AppConfig {
  static const String backendServerIp = '192.168.1.168';
  static const String backendBaseUrl = 'http://$backendServerIp:5140';

  static const String cameraServerIp = '192.168.1.168';
  static const int cameraServerPort = 8000;
  static const String cameraApiPort = '5140';
  static const String streamUrl = 'http://$cameraServerIp:$cameraServerPort/stream';
  static const String cameraApiBaseUrl = 'http://$cameraServerIp:$cameraApiPort';
}
