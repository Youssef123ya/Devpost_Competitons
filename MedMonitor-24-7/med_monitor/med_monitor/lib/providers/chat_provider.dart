import 'package:flutter/material.dart';
import '../models/chat_message_model.dart';
import '../services/dio_client.dart';

class ChatProvider with ChangeNotifier {
  final List<ChatMessageModel> _messages = [];
  bool _isLoading = false;

  List<ChatMessageModel> get messages => _messages;
  bool get isLoading => _isLoading;

  Future<void> fetchMessages(String patientId, String currentUserId, {bool showLoading = true}) async {
    if (showLoading) {
      _isLoading = true;
      notifyListeners();
    }

    try {
      final resp = await DioClient.instance.get('/api/Chat/GetMessages', queryParameters: {'patientId': patientId});
      if (resp.statusCode == 200 && resp.data != null) {
        final data = resp.data;
        List<dynamic>? list;
        if (data is List) {
          list = data;
        } else if (data is Map && data['data'] is List) {
          list = List.from(data['data'] as List);
        } else if (data is Map && data['rows'] is List) {
          list = List.from(data['rows'] as List);
        }

        final newMessages = <ChatMessageModel>[];
        if (list != null) {
          for (var item in list) {
            if (item is Map<String, dynamic>) {
              newMessages.add(ChatMessageModel.fromJson(item, currentUserId));
            } else if (item is Map) {
              newMessages.add(ChatMessageModel.fromJson(Map<String, dynamic>.from(item), currentUserId));
            }
          }
        }

        if (_areMessagesDifferent(newMessages, _messages)) {
          _messages
            ..clear()
            ..addAll(newMessages);
          notifyListeners();
        }
      }
    } catch (e) {
      debugPrint('Failed to load chat history: $e');
    } finally {
      if (showLoading) {
        _isLoading = false;
        notifyListeners();
      }
    }
  }

  bool _areMessagesDifferent(List<ChatMessageModel> a, List<ChatMessageModel> b) {
    if (a.length != b.length) return true;
    for (var i = 0; i < a.length; i++) {
      if (a[i].id != b[i].id || a[i].text != b[i].text || a[i].timestamp != b[i].timestamp) {
        return true;
      }
    }
    return false;
  }

  Future<void> sendMessage(
    String patientId,
    String senderName,
    String text,
    String senderId,
    String senderRole,
    String receiverId,
  ) async {
    try {
      final response = await DioClient.instance.post(
        '/api/Chat/SendMessage',
        data: {
          'patientId': patientId,
          'senderId': senderId,
          'senderName': senderName,
          'senderRole': senderRole,
          'receiverId': receiverId,
          'message': text,
        },
      );

      if (response.statusCode == 200 && response.data != null) {
        final data = response.data;
        final payload = data is Map<String, dynamic>
            ? data
            : Map<String, dynamic>.from(data as Map);
        final newMsg = ChatMessageModel.fromJson(payload, senderId);
        _messages.add(newMsg);
        notifyListeners();
      }
    } catch (e) {
      debugPrint('❌ sendMessage error: $e');
    }
  }
}
