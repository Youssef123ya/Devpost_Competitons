// @dart=2.12
// ignore: avoid_web_libraries_in_flutter
import 'dart:html' as html;
import 'dart:ui_web' as ui_web;
import 'package:flutter/widgets.dart';

class WebCameraView extends StatefulWidget {
  final String streamUrl;
  const WebCameraView({Key? key, required this.streamUrl}) : super(key: key);

  @override
  State<WebCameraView> createState() => _WebCameraViewState();
}

class _WebCameraViewState extends State<WebCameraView> {
  late final String _viewId;

  @override
  void initState() {
    super.initState();
    _viewId = 'mjpeg-stream-${widget.streamUrl.hashCode}-${DateTime.now().millisecondsSinceEpoch}';

    ui_web.platformViewRegistry.registerViewFactory(_viewId, (int id) {
      final iframe = html.IFrameElement()
        ..style.width = '100%'
        ..style.height = '100%'
        ..style.border = 'none'
        ..allowFullscreen = true
        ..setAttribute('scrolling', 'no')
        ..setAttribute('frameborder', '0')
        ..srcdoc = '''
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <style>
      html, body {
        width: 100%;
        height: 100%;
        margin: 0;
        padding: 0;
        overflow: hidden;
        background: black;
      }
      img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        display: block;
      }
    </style>
  </head>
  <body>
    <img src="${widget.streamUrl}" alt="Camera stream" />
  </body>
</html>
''';
      return iframe;
    });
  }

  @override
  Widget build(BuildContext context) {
    return AspectRatio(
      aspectRatio: 16 / 9,
      child: HtmlElementView(viewType: _viewId),
    );
  }
}
