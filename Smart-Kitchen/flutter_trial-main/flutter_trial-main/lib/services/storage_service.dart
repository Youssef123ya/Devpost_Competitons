import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

class StorageService {
  static const String _tokenKey = "token";
  static const String _userKey = "user";

  // ================= Save Token =================
  static Future<void> saveToken(String? token) async {
    if (token == null || token.isEmpty) return;

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
  }

  // ================= Save User Data =================
  static Future<void> saveUserData(Map<String, dynamic>? user) async {
    if (user == null) return;

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_userKey, jsonEncode(user));
  }

  // ================= Get Token =================
  static Future<String> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey) ?? '';
  }

  // ================= Get User Data =================
  static Future<Map<String, dynamic>> getUserData() async {
    final prefs = await SharedPreferences.getInstance();

    final userString = prefs.getString(_userKey);

    if (userString == null || userString.isEmpty) {
      return {};
    }

    try {
      return jsonDecode(userString) as Map<String, dynamic>;
    } catch (_) {
      return {};
    }
  }

  // ================= Check Login =================
  static Future<bool> isLoggedIn() async {
    return (await getToken()).isNotEmpty;
  }

  // ================= Get User Name =================
  static Future<String> getUserName({
    String defaultValue = "No Name",
  }) async {
    final user = await getUserData();
    return user["name"]?.toString() ?? defaultValue;
  }

  // ================= Get User Email =================
  static Future<String> getUserEmail({
    String defaultValue = "No Email",
  }) async {
    final user = await getUserData();
    return user["email"]?.toString() ?? defaultValue;
  }

  // ================= Clear All Data =================
  static Future<void> clearUserData() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_userKey);
  }
}