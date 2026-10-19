import 'package:flutter/material.dart';
import 'package:flutter_mjpeg/flutter_mjpeg.dart';

Widget buildMobileCameraView(String url) {
  return _MobileCameraView(url: url);
}

class _MobileCameraView extends StatelessWidget {
  final String url;

  const _MobileCameraView({Key? key, required this.url}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Mjpeg(
      stream: url,
      isLive: true,
      fit: BoxFit.cover,
      loading: (context) => Container(
        color: Colors.black,
        child: const Center(
          child: CircularProgressIndicator(color: Colors.white),
        ),
      ),
      error: (context, error, stack) => Container(
        color: Colors.black,
        padding: const EdgeInsets.all(16),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.videocam_off, color: Colors.red, size: 48),
              const SizedBox(height: 12),
              const Text(
                'Camera stream unavailable',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600),
              ),
              const SizedBox(height: 8),
              const Text(
                'Check that the camera server is running on the same network and that the stream URL is reachable.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.white70, fontSize: 12),
              ),
              const SizedBox(height: 10),
              Text(
                url,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.white70, fontSize: 12),
              ),
              const SizedBox(height: 10),
              Text(
                error?.toString() ?? 'Unknown error',
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.white54, fontSize: 12),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
