import 'package:flutter/material.dart';

class PatientChatProvider with ChangeNotifier {
  // ✅ Fix for notifyListeners during build crash
  // Map patientId -> list of messages
  final Map<String, List<Map<String, dynamic>>> _chats = {};

  List<Map<String, dynamic>> messagesFor(String patientId) {
    return _chats[patientId] ?? [];
  }

  void ensureChatExists(String patientId, String patientName, String nurseName) {
    if (_chats.containsKey(patientId)) return;

    _chats[patientId] = [];
    // ✅ Wrap notifyListeners in WidgetsBinding to avoid setState during build crash
    WidgetsBinding.instance.addPostFrameCallback((_) {
      notifyListeners();
    });
  }

  void sendMessage(String patientId, String senderName, String text) {
    final list = _chats.putIfAbsent(patientId, () => []);
    list.add({
      'id': DateTime.now().millisecondsSinceEpoch.toString(),
      'senderName': senderName,
      'text': text,
      'timestamp': DateTime.now(),
    });
    notifyListeners();
  }
}
