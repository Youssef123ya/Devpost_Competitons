import 'dart:convert';
import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'storage_service.dart';

class ApiService {

  final String baseUrl =
      "https://nonimperialistically-unlibellous-tanika.ngrok-free.dev";

  static const String chatEndpoint =
      "/api/chatbot/chat";

  Map<String, dynamic> parseResponse(http.Response response) {
    if (response.body.isEmpty) return {};

    try {
      return jsonDecode(response.body);
    } catch (e) {
      debugPrint("JSON PARSE ERROR: $e");
      return {};
    }
  }

  Future<Map<String, String>> authHeaders({
    bool requireAuth = true,
  }) async {
    final headers = {
      "Content-Type": "application/json",
    };

    if (requireAuth) {
      final token = await StorageService.getToken();

      if (token == null || token.isEmpty) {
        throw Exception("User not authenticated");
      }

      headers["Authorization"] = "Bearer $token";
    }

    return headers;
  }

  /// ================= SIGN UP (Public) =================
  Future<void> signUpUser({
    required String name,
    required String email,
    required String password,
  }) async {
    final url = Uri.parse("$baseUrl/api/auth/register");

    final response = await http.post(
      url,
      headers: await authHeaders(requireAuth: false),
      body: jsonEncode({
        "name": name.trim(),
        "email": email.trim(),
        "password": password.trim(),
      }),
    );

    debugPrint("SIGN UP STATUS: ${response.statusCode}");
    debugPrint("SIGN UP BODY: ${response.body}");

    final data = parseResponse(response);

    if (response.statusCode != 200 &&
        response.statusCode != 201) {
      throw Exception(
        data['message'] ?? response.body,
      );
    }
  }

  /// ================= LOGIN (Public) =================
  Future<Map<String, dynamic>> loginUser({
    required String email,
    required String password,
  }) async {
    final url = Uri.parse("$baseUrl/api/auth/login");

    final response = await http.post(
      url,
      headers: await authHeaders(requireAuth: false),
      body: jsonEncode({
        "email": email.trim(),
        "password": password.trim(),
      }),
    );

    debugPrint("LOGIN STATUS: ${response.statusCode}");
    debugPrint("LOGIN BODY: ${response.body}");

    final data = parseResponse(response);

    if (response.statusCode == 200) {
      final token = data['data']?['token'];
      final user = data['data']?['user'];

      if (token != null && token is String) {
        await StorageService.saveToken(token);
      }

      if (user != null && user is Map<String, dynamic>) {
        await StorageService.saveUserData(user);
      }

      return data;
    }

    throw Exception(
      data['message'] ?? response.body,
    );
  }

  /// ================= SOCIAL LOGIN (Public) =================
  Future<void> socialLogin({
    required String token,
    required String provider,
  }) async {
    final url = Uri.parse("$baseUrl/api/auth/social-login");

    final response = await http.post(
      url,
      headers: await authHeaders(requireAuth: false),
      body: jsonEncode({
        "token": token.trim(),
        "provider": provider.trim(),
      }),
    );

    final data = parseResponse(response);

    if (response.statusCode == 200) {
      final authToken = data['data']?['token'];

      if (authToken != null && authToken is String) {
        await StorageService.saveToken(authToken);
      }
    } else {
      throw Exception(data['message'] ?? response.body);
    }
  }

  /// ================= SEND OTP (Public) =================
  Future<void> sendOtp({
    String? email,
    String? phone,
  }) async {
    final url = Uri.parse("$baseUrl/api/auth/send-otp");

    if (email == null && phone == null) {
      throw Exception("Email or Phone is required");
    }

    final body = {
      "value": (email ?? phone)!.trim(),
      "contactMethod": email != null ? "Email" : "Phone",
    };

    final response = await http.post(
      url,
      headers: await authHeaders(requireAuth: false),
      body: jsonEncode(body),
    );

    final data = parseResponse(response);

    if (response.statusCode != 200) {
      throw Exception(data['message'] ?? response.body);
    }
  }

  /// ================= VERIFY OTP (Public) =================
  Future<void> verifyOtp({
    required String otp,
    required String emailOrPhone,
  }) async {
    final url = Uri.parse("$baseUrl/api/auth/verify-otp");

    final response = await http.post(
      url,
      headers: await authHeaders(requireAuth: false),
      body: jsonEncode({
        "otpCode": otp.trim(),
        "emailOrPhone": emailOrPhone.trim(),
      }),
    );

    final data = parseResponse(response);

    if (response.statusCode != 200) {
      throw Exception(
        data['message'] ?? "Invalid or expired OTP",
      );
    }
  }

  /// ================= RESET PASSWORD (Public) =================
  Future<void> resetPassword({
    required String emailOrPhone,
    required String newPassword,
    required String confirmPassword,
  }) async {
    final url = Uri.parse("$baseUrl/api/auth/reset-password");

    final response = await http.post(
      url,
      headers: await authHeaders(requireAuth: false),
      body: jsonEncode({
        "EmailOrPhone": emailOrPhone.trim(),
        "NewPassword": newPassword.trim(),
        "ConfirmNewPassword": confirmPassword.trim(),
      }),
    );

    final data = parseResponse(response);

    if (response.statusCode != 200) {
      throw Exception(data['message'] ?? response.body);
    }
  }

  /// ================= PROFILE (Authorized) =================
  Future<Map<String, dynamic>> getProfile() async {
    final url = Uri.parse("$baseUrl/api/account/profile");

    final response = await http.get(
      url,
      headers: await authHeaders(requireAuth: true),
    );

    debugPrint("PROFILE STATUS: ${response.statusCode}");
    debugPrint("PROFILE BODY: ${response.body}");

    final data = parseResponse(response);

    if (response.statusCode == 200) {
      return Map<String, dynamic>.from(data['data'] ?? {});
    }

    throw Exception(
      data['message'] ?? "Failed to load profile",
    );
  }

  /// ================= UPDATE PROFILE (Authorized) =================
  Future<void> updateProfile({
    required String name,
    required String email,
    String? profileImageUrl,
    String? location,
  }) async {
    final url = Uri.parse(
      "$baseUrl/api/account/profile",
    );

    final response = await http.put(
      url,
      headers: await authHeaders(requireAuth: true),
      body: jsonEncode({
        "name": name.trim(),
        "email": email.trim(),
        "profileImageUrl": profileImageUrl,
        "location": location,
      }),
    );

    debugPrint("UPDATE PROFILE STATUS: ${response.statusCode}");
    debugPrint("UPDATE PROFILE BODY: ${response.body}");

    final data = parseResponse(response);

    if (response.statusCode == 200) {
      final updatedUser = data['data'];

      if (updatedUser != null && updatedUser is Map<String, dynamic>) {
        final oldUser = await StorageService.getUserData();

        await StorageService.saveUserData({
          ...?oldUser,
          ...updatedUser,
        });
      }
    } else {
      throw Exception(
        data['message'] ?? "Failed to update profile",
      );
    }
  }

  /// ================= LOGOUT (Authorized) =================
  Future<void> logoutUser() async {
    final url = Uri.parse("$baseUrl/api/auth/logout");

    final response = await http.post(
      url,
      headers: await authHeaders(requireAuth: true),
    );

    debugPrint("LOGOUT STATUS: ${response.statusCode}");
    debugPrint("LOGOUT BODY: ${response.body}");

    final data = parseResponse(response);

    if (response.statusCode != 200) {
      throw Exception(data['message'] ?? response.body);
    }

    await StorageService.clearUserData();
  }

  /// ================= DELETE ACCOUNT (Authorized) =================
  Future<void> deleteAccount() async {
    final url = Uri.parse("$baseUrl/api/account/delete");

    final response = await http.delete(
      url,
      headers: await authHeaders(requireAuth: true),
    );

    debugPrint("DELETE ACCOUNT STATUS: ${response.statusCode}");
    debugPrint("DELETE ACCOUNT BODY: ${response.body}");

    final data = parseResponse(response);

    if (response.statusCode != 200) {
      throw Exception(
        data['message'] ?? "Failed to delete account",
      );
    }

    await StorageService.clearUserData();
  }

  /// ================= CONTACT SUPPORT (Authorized) =================
  Future<void> sendContactMessage({
    required String name,
    required String email,
    required String message,
  }) async {
    final url = Uri.parse("$baseUrl/api/support/contact");

    final response = await http.post(
      url,
      headers: await authHeaders(requireAuth: true),
      body: jsonEncode({
        "name": name.trim(),
        "email": email.trim(),
        "message": message.trim(),
      }),
    );

    final data = parseResponse(response);

    if (response.statusCode != 200 && response.statusCode != 201) {
      throw Exception(data['message'] ?? response.body);
    }
  }

  /// ================= SENSOR DATA (Authorized) =================
  Future<Map<String, dynamic>> getSensorData() async {
    final url = Uri.parse(
      "$baseUrl/api/sensors/latest",
    );

    final response = await http.get(
      url,
      headers: await authHeaders(requireAuth: true),
    );

    debugPrint("SENSOR STATUS: ${response.statusCode}");
    debugPrint("SENSOR BODY: ${response.body}");

    final data = parseResponse(response);

    if (response.statusCode == 200 && data is Map<String, dynamic>) {
      return data;
    }

    throw Exception(
      data is Map
          ? data["message"] ?? "Failed to load sensor data"
          : "Failed to load sensor data",
    );
  }

  /// ================= ALERT (Authorized) =================
  Future<Map<String, dynamic>> getAlert() async {
    final url = Uri.parse(
      "$baseUrl/api/alerts",
    );

    final response = await http.get(
      url,
      headers: await authHeaders(requireAuth: true),
    );

    debugPrint("ALERT STATUS: ${response.statusCode}");
    debugPrint("ALERT BODY: ${response.body}");

    final data = parseResponse(response);

    if (response.statusCode == 200 && data is Map<String, dynamic>) {
      return data;
    }

    throw Exception(
      data is Map
          ? data["message"] ?? "Failed to load alert"
          : "Failed to load alert",
    );
  }

  /// ================= GAS VALVE CONTROL (Authorized) =================
  Future<Map<String, dynamic>> toggleGas({
    required bool enableGas,
    bool? enableFan,
  }) async {
    final url = Uri.parse(
      "$baseUrl/api/gas/control",
    );

    final Map<String, dynamic> body = {
      "enableGas": enableGas,
      "enableFan": enableFan,
    };

    body.removeWhere(
          (key, value) => value == null,
    );

    final response = await http.post(
      url,
      headers: await authHeaders(requireAuth: true),
      body: jsonEncode(body),
    );

    debugPrint("GAS CONTROL STATUS: ${response.statusCode}");
    debugPrint("GAS CONTROL BODY: ${response.body}");

    final data = parseResponse(response);

    if (response.statusCode == 200 && data is Map<String, dynamic>) {
      return data;
    }

    if (response.statusCode == 409) {
      throw Exception(
        data is Map
            ? data["message"] ?? "Manual control is disabled during Critical safety mode."
            : "Manual control is disabled during Critical safety mode.",
      );
    }

    throw Exception(
      data is Map
          ? data["message"] ?? "Failed to control gas"
          : "Failed to control gas",
    );
  }

  /// ================= ACTIVITY LOG (Authorized) =================
  Future<List<dynamic>> getActivityLog(
      String filter,
      ) async {
    final allowedFilters = [
      "Today",
      "Yesterday",
      "Last 7 days",
      "All",
    ];

    final selectedFilter =
    allowedFilters.contains(filter) ? filter : "All";

    final url = Uri.parse(
      "$baseUrl/api/activity-log",
    ).replace(
      queryParameters: {
        "filter": selectedFilter,
      },
    );

    final response = await http.get(
      url,
      headers: await authHeaders(requireAuth: true),
    );

    debugPrint("ACTIVITY STATUS: ${response.statusCode}");
    debugPrint("ACTIVITY BODY: ${response.body}");

    final dynamic data = jsonDecode(response.body);

    if (response.statusCode == 200) {
      if (data is List) {
        return List<dynamic>.from(data);
      }

      if (data is Map && data["data"] is List) {
        return List<dynamic>.from(data["data"]);
      }

      return <dynamic>[];
    }

    throw Exception(
      data is Map
          ? data["message"] ?? "Failed to load activity log"
          : "Failed to load activity log",
    );
  }

  /// ================= =============================================================RECIPES BROWSE (Public) =================
  Future<List<Map<String, dynamic>>> getRecipes(
      String category,
      String subCategory, {
        String? dish,
      }) async {
    final queryParams = {
      "category": category,
      "subcategory": subCategory,
    };

    if (dish != null && dish.trim().isNotEmpty) {
      queryParams["dish"] = dish;
    }

    final url = Uri.parse(
      "$baseUrl/api/recipes",
    ).replace(
      queryParameters: queryParams,
    );

    debugPrint("CATEGORY => $category");
    debugPrint("SUBCATEGORY => $subCategory");
    debugPrint("URL => $url");

    final response = await http.get(
      url,
      headers: await authHeaders(requireAuth: false),
    );

    debugPrint("RECIPES STATUS: ${response.statusCode}");
    debugPrint("RECIPES BODY: ${response.body}");

    final data = parseResponse(response);

    if (response.statusCode == 200) {
      final List<dynamic> list = data['data']?['items'] ?? [];

      return list
          .map(
            (e) => Map<String, dynamic>.from(e),
      )
          .toList();
    }

    throw Exception(
      data['message'] ?? "Failed to load recipes",
    );
  }

  /// ================= TRENDING RECIPES (Public) =================
  Future<List<dynamic>> getTrendingRecipes() async {
    try {
      final response = await http.get(
        Uri.parse("$baseUrl/api/home/trending"),
        headers: await authHeaders(requireAuth: false),
      );

      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body);
        return decoded["data"] ?? [];
      }

      return [];
    } catch (e) {
      debugPrint("TRENDING ERROR: $e");
      return [];
    }
  }

  /// ================= SUGGESTED RECIPES (Authorized) =================
  Future<List<dynamic>> getSuggestedRecipes() async {
    try {
      final response = await http.get(
        Uri.parse("$baseUrl/api/home/suggested"),
        headers: await authHeaders(requireAuth: true),
      );

      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body);
        return decoded["data"] ?? [];
      }

      return [];
    } catch (e) {
      debugPrint("SUGGESTED ERROR: $e");
      return [];
    }
  }

  /// ================= SEASONAL RECIPES (Public) =================
  Future<List<dynamic>> getSeasonalRecipes() async {
    try {
      final response = await http.get(
        Uri.parse("$baseUrl/api/home/seasonal"),
        headers: await authHeaders(requireAuth: false),
      );

      if (response.statusCode == 200) {
        final decoded = jsonDecode(response.body);
        return decoded["data"] ?? [];
      }

      return [];
    } catch (e) {
      debugPrint("SEASONAL ERROR: $e");
      return [];
    }
  }

  /// ================= CATEGORY RECIPES (Public) =================
  Future<List<dynamic>> getRecipesByCategoryAndValue(
      String category,
      String value,
      ) async {
    try {
      final sanitizedCategory = category
          .trim()
          .toLowerCase()
          .replaceAll(' & ', '-')
          .replaceAll(' ', '-');

      final encodedCategory = Uri.encodeComponent(sanitizedCategory);
      final encodedValue = Uri.encodeComponent(value);

      final url = Uri.parse(
        "$baseUrl/api/categories/$encodedCategory/$encodedValue/recipes",
      ).replace(
        queryParameters: {
          "page": "1",
          "pageSize": "6",
        },
      );

      final response = await http.get(
        url,
        headers: await authHeaders(requireAuth: false),
      );

      debugPrint("CATEGORY RECIPES URL => $url");
      debugPrint("STATUS: ${response.statusCode}");
      debugPrint("BODY: ${response.body}");

      final data = parseResponse(response);

      if (response.statusCode == 200 && data != null) {
        final raw = data["data"];

        if (raw is List) {
          return raw;
        }

        if (raw is Map && raw["items"] is List) {
          return List<dynamic>.from(raw["items"]);
        }
      }

      return [];
    } catch (e) {
      debugPrint("GET CATEGORY RECIPES ERROR: $e");
      return [];
    }
  }

  /// ================= GET SAVED RECIPES (Authorized) =================
Future<List<Map<String, dynamic>>> getSavedRecipes({
  String filter = "all",
}) async {
  try {
    final url = Uri.parse(
      "$baseUrl/api/favorites",
    ).replace(
      queryParameters: {
        "filter": filter,
      },
    );

    debugPrint("FAVORITES URL => $url");

    final response = await http.get(
      url,
      headers: await authHeaders(requireAuth: true),
    );

    debugPrint("GET SAVED STATUS: ${response.statusCode}");
    debugPrint("GET SAVED BODY: ${response.body}");

    if (response.statusCode == 404 ||
        response.body.trim().isEmpty) {
      return [];
    }

    final data = parseResponse(response);

    if (response.statusCode == 200 && data != null) {
      final raw = data["data"];

      if (raw is Map && raw["items"] is List) {
        return (raw["items"] as List)
            .map(
              (e) => Map<String, dynamic>.from(e),
        )
            .toList();
      }
    }

    return [];
  } catch (e) {
    debugPrint("GET SAVED ERROR: $e");
    return [];
  }
}

  /// ================= ADD TO SAVED (Authorized) =================
  Future<void> saveRecipe(
      String recipeId,
      ) async {
    try {
      final url = Uri.parse(
        "$baseUrl/api/favorites",
      );

      final response = await http.post(
        url,
        headers: await authHeaders(requireAuth: true),
        body: jsonEncode(
          {
            "recipeId": int.parse(recipeId),
          },
        ),
      );

      debugPrint("SAVE STATUS: ${response.statusCode}");
      debugPrint("SAVE BODY: ${response.body}");

      if (response.statusCode != 200 && response.statusCode != 201) {
        throw Exception("Failed to save recipe");
      }
    } catch (e) {
      debugPrint("ADD TO SAVED ERROR: $e");
      rethrow;
    }
  }

  /// ================= REMOVE SAVED (Authorized) =================
  Future<void> removeSavedRecipe(
      String recipeId,
      ) async {
    try {
      final url = Uri.parse(
        "$baseUrl/api/favorites/$recipeId",
      );

      final response = await http.delete(
        url,
        headers: await authHeaders(requireAuth: true),
      );

      debugPrint("REMOVE STATUS: ${response.statusCode}");

      if (response.statusCode != 200) {
        throw Exception("Failed to remove recipe");
      }
    } catch (e) {
      debugPrint("REMOVE SAVED ERROR: $e");
      rethrow;
    }
  }

  /// ================= CHECK SAVED (Authorized) =================
  Future<bool> isRecipeSaved(
      String recipeId,
      ) async {
    try {
      final url = Uri.parse(
        "$baseUrl/api/favorites/$recipeId/is-favorite",
      );

      final response = await http.get(
        url,
        headers: await authHeaders(requireAuth: true),
      );

      final data = parseResponse(response);

      if (response.statusCode == 200 && data != null) {
        return data["data"] == true;
      }

      return false;
    } catch (e) {
      debugPrint("CHECK SAVED ERROR: $e");
      return false;
    }
  }

  /// =================== RECIPE DETAILS (Public) =================
  Future<Map<String, dynamic>> getRecipeDetails(String id) async {
    try {
      final url = Uri.parse("$baseUrl/api/recipes/$id");

      final response = await http.get(
        url,
        headers: {
          "accept": "application/json",
        },
      ).timeout(
        const Duration(seconds: 15),
      );

      debugPrint("DETAILS STATUS: ${response.statusCode}");

      if (response.body.isNotEmpty) {
        debugPrint("DETAILS BODY: ${response.body}");
      }

      if (response.statusCode == 404) {
        return {};
      }

      final data = parseResponse(response);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final recipeData = data['data'];

        if (recipeData is Map<String, dynamic>) {
          return recipeData;
        }

        debugPrint("Unexpected recipeData format: $recipeData");
        return {};
      }

      throw Exception(
        data is Map<String, dynamic>
            ? (data['message'] ?? "Failed to load recipe details")
            : "Failed to load recipe details",
      );
    } on TimeoutException {
      debugPrint("RECIPE DETAILS TIMEOUT ERROR");
      throw Exception("Connection timeout. Please try again.");
    } on SocketException {
      debugPrint("RECIPE DETAILS NETWORK ERROR");
      throw Exception("No internet connection.");
    } catch (e) {
      debugPrint("GET RECIPE DETAILS ERROR: $e");
      return {};
    }
  }

  /// ================= RECIPE STEPS (Public) =================
  Future<List<Map<String, dynamic>>> getRecipeSteps(
      String id,
      ) async {
    final url = Uri.parse(
      "$baseUrl/api/recipes/$id/steps",
    );

    final response = await http.get(
      url,
      headers: await authHeaders(requireAuth: false),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);

      final List list = data["steps"] ??
          data["data"]?["steps"] ??
          data["recipe"]?["steps"] ??
          [];

      return list
          .map(
            (e) => Map<String, dynamic>.from(e),
      )
          .toList();
    }

    throw Exception(
      "Failed to load recipe steps",
    );
  }

  /// ================= RECIPE INGREDIENTS (Public) =================
  Future<List<String>> getRecipeIngredients(String id) async {
    final recipe = await getRecipeDetails(id);
    final List list = recipe['ingredients'] ?? [];
    return List<String>.from(list);
  }

  /// =============== RECIPES BY INGREDIENTS (Authorized) ===============
  Future<List<Map<String, dynamic>>> getRecipesByIngredients(
      List<String> ingredients,
      ) async {
    try {
      final url = Uri.parse(
        "$baseUrl/api/recipes/by-ingredients",
      );

      final headers = await authHeaders(requireAuth: true);
      headers["Content-Type"] = "application/json";

      final body = jsonEncode({
        "ingredients": ingredients,
      });

      debugPrint("RECIPES BODY: $body");

      final response = await http.post(
        url,
        headers: headers,
        body: body,
      );

      debugPrint("RECIPES STATUS: ${response.statusCode}");
      debugPrint("RECIPES RESPONSE: ${response.body}");

      if (response.statusCode == 404 || response.body.isEmpty) {
        return [];
      }

      final data = parseResponse(response);

      if (response.statusCode == 200) {
  final items = data["data"];

  if (items is List) {
    return items.map<Map<String, dynamic>>(
      (e) => {
        "id": e["id"]?.toString() ?? "",
        "title": e["name"] ?? "Recipe",
        "image": e["imageUrl"] ?? "",
        "calories": e["calories"] ?? "",
        "time": e["minutes"] ?? "",
        "isFavorite": e["isFavorite"] ?? false,
      },
    ).toList();
  }

  return [];
}
      throw Exception(
        data["message"] ?? "Failed to load recipes",
      );
    } on SocketException {
      throw Exception("No internet connection");
    } catch (e) {
      debugPrint("RECIPES BY INGREDIENTS ERROR: $e");
      return [];
    }
  }

  /// ================= SEARCH RECIPES (Public) =================
  Future<List<dynamic>> searchRecipes(
      String query,
      ) async {
    try {
      final url = Uri.parse(
        "$baseUrl/api/search",
      ).replace(
        queryParameters: {
          "q": query.trim(),
          "page": "1",
          "pageSize": "6",
        },
      );

      final response = await http.get(
        url,
        headers: await authHeaders(requireAuth: false),
      );

      debugPrint("SEARCH URL: $url");
      debugPrint("SEARCH STATUS: ${response.statusCode}");
      debugPrint("SEARCH BODY: ${response.body}");

      final data = parseResponse(response);

      if (response.statusCode == 200 && data != null) {
        final raw = data["data"];

        if (raw is Map && raw["items"] is List) {
          return List<dynamic>.from(raw["items"]);
        }
      }

      return [];
    } catch (e, stack) {
      debugPrint("SEARCH ERROR: $e");
      debugPrint("STACK: $stack");
      return [];
    }
  }

  /// ================= RECENT SEARCHES (Authorized) =================
  Future<List<String>> getRecentSearches() async {
    try {
      final url = Uri.parse(
        "$baseUrl/api/search/recent",
      );

      final response = await http.get(
        url,
        headers: await authHeaders(requireAuth: true),
      );

      debugPrint("RECENT SEARCHES STATUS: ${response.statusCode}");
      debugPrint("RECENT SEARCHES BODY: ${response.body}");

      if (response.statusCode == 404 || response.body.trim().isEmpty) {
        return [];
      }

      final data = parseResponse(response);

      if (response.statusCode == 200 && data != null) {
        final raw = data["data"];

        if (raw is List) {
          return raw
              .map(
                (e) => e.toString(),
          )
              .toList();
        }
      }

      return [];
    } catch (e, stack) {
      debugPrint("GET RECENT SEARCHES ERROR: $e");
      debugPrint("STACK: $stack");
      return [];
    }
  }

  /// ================= SAVE SEARCH (Authorized) =================
  Future<void> saveRecentSearch(
      String value,
      ) async {
    try {
      if (value.trim().isEmpty) {
        return;
      }

      final url = Uri.parse(
        "$baseUrl/api/search/recent",
      );

      final response = await http.post(
        url,
        headers: await authHeaders(requireAuth: true),
        body: jsonEncode({
          "value": value.trim(),
        }),
      );

      debugPrint("SAVE SEARCH STATUS: ${response.statusCode}");
      debugPrint("SAVE SEARCH BODY: ${response.body}");

      if (response.statusCode != 200 && response.statusCode != 201) {
        throw Exception("Failed to save recent search");
      }
    } catch (e, stack) {
      debugPrint("SAVE SEARCH ERROR: $e");
      debugPrint("STACK: $stack");
    }
  }

  /// ================= GET RECENT INGREDIENTS (Authorized) =================
  Future<List<String>> getRecentIngredients() async {
    try {
      final url = Uri.parse(
        "$baseUrl/api/ingredients/recent",
      );

      final response = await http.get(
        url,
        headers: await authHeaders(requireAuth: true),
      );

      debugPrint("RECENT INGREDIENTS STATUS: ${response.statusCode}");

      if (response.statusCode != 200 || response.body.trim().isEmpty) {
        return [];
      }

      final data = parseResponse(response);

      return List<String>.from(data["data"] ?? []);
    } catch (e) {
      debugPrint("GET RECENT INGREDIENTS ERROR: $e");
      return [];
    }
  }

  /// ================= SAVE RECENT INGREDIENT (Authorized) =================
  Future<void> saveRecentIngredient(
      Map<String, dynamic> ingredient,
      ) async {
    try {
      final url = Uri.parse(
        "$baseUrl/api/ingredients/recent",
      );

      final response = await http.post(
        url,
        headers: await authHeaders(requireAuth: true),
        body: jsonEncode(ingredient),
      );

      debugPrint("SAVE INGREDIENT STATUS: ${response.statusCode}");

      if (response.statusCode != 200 && response.statusCode != 201) {
        throw Exception("API ERROR: ${response.statusCode}");
      }
    } catch (e) {
      debugPrint("SAVE RECENT INGREDIENT ERROR: $e");
      rethrow;
    }
  }

  /// ================= DELETE RECENT INGREDIENT (Authorized) =================
  Future<void> removeRecentIngredient(
      String ingredientName,
      ) async {
    try {
      final url = Uri.parse(
        "$baseUrl/api/ingredients/recent/by-name/${Uri.encodeComponent(ingredientName)}",
      );

      final response = await http.delete(
        url,
        headers: await authHeaders(requireAuth: true),
      );

      debugPrint("DELETE STATUS: ${response.statusCode}");
      debugPrint("DELETE BODY: ${response.body}");

      if (response.statusCode != 200 && response.statusCode != 204) {
        throw Exception("Failed to delete ingredient");
      }
    } catch (e) {
      debugPrint("DELETE INGREDIENT ERROR: $e");
      rethrow;
    }
  }

  /// ================= FILTERED SEARCH (Public) =================
  Future<List<dynamic>> searchWithFilters({
    String? query,
    String? skill,
    String? diet,
    String? meal,
    String? time,
  }) async {
    final queryParams = <String, String>{};

    if (query != null && query.trim().isNotEmpty) {
      queryParams["q"] = query.trim();
    }

    if (skill != null && skill.trim().isNotEmpty) {
      queryParams["skill"] = skill.trim();
    }

    if (diet != null && diet.trim().isNotEmpty) {
      queryParams["diet"] = diet.trim();
    }

    if (meal != null && meal.trim().isNotEmpty) {
      queryParams["meal"] = meal.trim();
    }

    if (time != null && time.trim().isNotEmpty) {
      queryParams["time"] = time.trim();
    }

    final url = Uri.parse(
      "$baseUrl/api/search",
    ).replace(queryParameters: queryParams);

    debugPrint("FILTER URL: $url");

    final response = await http.get(
      url,
      headers: await authHeaders(requireAuth: false),
    );

    debugPrint("SEARCH STATUS: ${response.statusCode}");
    debugPrint("SEARCH BODY: ${response.body}");

    if (response.body.isEmpty) {
      return [];
    }

    final data = parseResponse(response);

    if (response.statusCode == 200) {
      final recipes = data["data"]?["items"];

      if (recipes is List) {
        return List<dynamic>.from(recipes);
      }

      return [];
    }

    throw Exception(
      data["message"] ?? "Failed to search recipes",
    );
  }

  /// ================= DIET FILTER (Authorized) =================
  Future<List<dynamic>> filterRecipes({
    required String diet,
    String? allergen,
  }) async {
    try {
      final queryParams = <String, String>{
        "diet": diet.trim(),
      };

      if (allergen != null && allergen.trim().isNotEmpty) {
        queryParams["allergen"] = allergen.trim();
      }

      final url = Uri.parse(
        "$baseUrl/api/recipes/diet-allergen-filter",
      ).replace(
        queryParameters: queryParams,
      );

      final response = await http.get(
        url,
        headers: await authHeaders(requireAuth: true),
      );

      debugPrint("DIET FILTER URL => $url");
      debugPrint("STATUS: ${response.statusCode}");
      debugPrint("BODY: ${response.body}");

      final data = parseResponse(response);

      if (response.statusCode == 200 && data != null) {
        final raw = data["data"];

        if (raw is List) {
          return raw;
        }

        if (raw is Map && raw["items"] is List) {
          return List<dynamic>.from(raw["items"]);
        }
      }

      return [];
    } catch (e) {
      debugPrint("FILTER RECIPES ERROR: $e");
      return [];
    }
  }

  /// ================= CHATBOT (Authorized) =================
  Future<String> sendMessage(
      String message,
      ) async {
    final token = await StorageService.getToken();

    if (token == null || token.isEmpty) {
      throw Exception("User not authenticated");
    }

    final response = await http.post(
      Uri.parse("$baseUrl/api/chatbot/chat"),
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer $token",
      },
      body: jsonEncode({
        "message": message.trim(),
      }),
    ).timeout(
      const Duration(seconds: 30),
    );

    debugPrint("CHAT STATUS: ${response.statusCode}");
    debugPrint("CHAT BODY: ${response.body}");

    if (response.body.isEmpty) {
      throw Exception("Empty server response");
    }

    Map<String, dynamic> data = {};

    try {
      data = jsonDecode(response.body);
    } catch (e) {
      debugPrint("CHAT JSON ERROR: $e");
      throw Exception("Invalid server response");
    }

    if (response.statusCode == 200 || response.statusCode == 201) {
      final botReply = data["data"]?["reply"];

      if (botReply != null && botReply.toString().trim().isNotEmpty) {
        return botReply.toString();
      }

      return "No response from AI";
    }

    throw Exception(
      data["message"] ?? data["error"] ?? "Something went wrong",
    );
  }
}