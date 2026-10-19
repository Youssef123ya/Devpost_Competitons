// lib/models/auth_model.dart
class LoginResponse {
  final int userId;
  final String name;
  final String role;
  final String token;

  LoginResponse({required this.userId, required this.name, required this.role, required this.token});

  // وظيفتها تحول الـ JSON اللي جاي من السيرفر لـ Object
  factory LoginResponse.fromJson(Map<String, dynamic> json) {
    return LoginResponse(
      userId: json['userID'], // لاحظي الكابيتال والسمول حسب الـ DTO بتاع زميلك
      name: json['name'],
      role: json['role'],
      token: json['token'],
    );
  }
}