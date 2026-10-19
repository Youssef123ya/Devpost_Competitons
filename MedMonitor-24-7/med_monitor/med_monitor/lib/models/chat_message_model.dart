class ChatMessageModel {
  final String id;
  final String text;
  final String senderId;
  final String senderName;
  final bool isMe; // بنحددها بناءً على الـ ID بتاع اليوزر الحالي
  final DateTime timestamp;

  ChatMessageModel({
    required this.id,
    required this.text,
    required this.senderId,
    required this.senderName,
    required this.isMe,
    required this.timestamp,
  });

  factory ChatMessageModel.fromJson(Map<String, dynamic> json, String currentUserId) {
    final senderId = json['senderId']?.toString() ?? '';
    return ChatMessageModel(
      id: json['id']?.toString() ?? '',
      text: json['messageText'] ?? json['message'] ?? '',
      senderId: senderId,
      senderName: json['senderName']?.toString() ?? '',
      isMe: senderId == currentUserId,
      timestamp: DateTime.parse(json['sentAt'] ?? DateTime.now().toIso8601String()),
    );
  }

  Map<String, dynamic> toJson() => {
    'messageText': text,
    'senderId': senderId,
    'senderName': senderName,
    // الـ timestamp السيرفر بيحطه غالباً
  };

  String get displayName => senderName.isNotEmpty ? senderName : senderId;
}