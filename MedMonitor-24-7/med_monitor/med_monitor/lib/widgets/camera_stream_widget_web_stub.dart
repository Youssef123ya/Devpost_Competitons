import 'package:flutter/widgets.dart';

class WebCameraView extends StatelessWidget {
  final String streamUrl;
  const WebCameraView({Key? key, required this.streamUrl}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return const SizedBox.shrink();
  }
}
