import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

import '../config/app_config.dart';
import 'camera_stream_widget_mobile.dart'
    if (dart.library.html) 'camera_stream_widget_mobile_stub.dart';
import 'camera_stream_widget_web_stub.dart'
    if (dart.library.html) 'camera_stream_widget_web.dart';

class CameraStreamWidget extends StatelessWidget {
  static const String defaultCameraUrl = AppConfig.streamUrl;
  static const String fallbackCameraUrl = AppConfig.streamUrl;

  final String streamUrl;
  final double? width;
  final double? height;
  final double aspectRatio;
  final BorderRadius? borderRadius;
  final bool showLoadingIndicator;

  const CameraStreamWidget({
    super.key,
    required this.streamUrl,
    this.width,
    this.height,
    this.aspectRatio = 16 / 9,
    this.borderRadius,
    this.showLoadingIndicator = true,
  });

  String get _effectiveStreamUrl {
    return streamUrl.isNotEmpty ? streamUrl : AppConfig.streamUrl;
  }

  Widget _buildOfflinePlaceholder() {
    return Container(
      width: width ?? double.infinity,
      height: height,
      color: Colors.black87,
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.videocam_off, color: Colors.grey, size: 48),
            const SizedBox(height: 12),
            Text(
              'Camera Offline',
              style: TextStyle(color: Colors.grey.shade400, fontSize: 14, fontWeight: FontWeight.w500),
            ),
            const SizedBox(height: 8),
            Text(
              'Unable to connect to stream',
              style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMobileView(String url) {
    return buildMobileCameraView(url);
  }

  @override
  Widget build(BuildContext context) {
    final BorderRadiusGeometry effectiveBorderRadius =
        borderRadius ?? BorderRadius.circular(8);
    final url = _effectiveStreamUrl;
    final streamContent = kIsWeb
        ? WebCameraView(streamUrl: url)
        : _buildMobileView(url);

    Widget content = streamContent;
    if (width != null || height != null) {
      content = SizedBox(
        width: width,
        height: height,
        child: streamContent,
      );
    }

    return ClipRRect(
      borderRadius: effectiveBorderRadius,
      child: AspectRatio(
        aspectRatio: aspectRatio,
        child: content,
      ),
    );
  }
}
