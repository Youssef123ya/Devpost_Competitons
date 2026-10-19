import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/notification_model.dart';
import '../services/dio_client.dart';
import '../services/notification_sound_service.dart';

class NotificationProvider with ChangeNotifier {
  // Settings
  bool _enableNotifications = false;
  bool _heartRateAlert = false;
  bool _oxygenLevelAlert = true;
  bool _taskDelayAlert = false;

  // Task notifications
  List<NotificationModel> _notifications = [];
  bool _isLoading = false;
  String? _error;
  Timer? _refreshTimer;
  String? _refreshNurseId;

  // Getters for settings
  bool get enableNotifications => _enableNotifications;
  bool get heartRateAlert => _heartRateAlert;
  bool get oxygenLevelAlert => _oxygenLevelAlert;
  bool get taskDelayAlert => _taskDelayAlert;

  // Getters for task notifications
  List<NotificationModel> get notifications => _notifications;
  bool get isLoading => _isLoading;
  String? get error => _error;
  int get unreadCount => _notifications.where((n) => !n.isRead).length;

  NotificationProvider() {
    _loadSettings();
  }

  // Load settings from device
  Future<void> _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    _enableNotifications = prefs.getBool('enableNotifications') ?? false;
    _heartRateAlert = prefs.getBool('heartRateAlert') ?? false;
    _oxygenLevelAlert = prefs.getBool('oxygenLevelAlert') ?? true;
    _taskDelayAlert = prefs.getBool('taskDelayAlert') ?? false;
    notifyListeners();
  }

  // Update and save setting
  Future<void> updateSetting(String key, bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(key, value);

    if (key == 'enableNotifications') {
      _enableNotifications = value;
    } else if (key == 'heartRateAlert') {
      _heartRateAlert = value;
    } else if (key == 'oxygenLevelAlert') {
      _oxygenLevelAlert = value;
    } else if (key == 'taskDelayAlert') {
      _taskDelayAlert = value;
    }

    notifyListeners();
  }

  // Fetch task notifications from backend
  Future<void> fetchNotifications(String nurseId) async {
    if (nurseId.isEmpty) {
      debugPrint('[NotificationProvider.fetchNotifications] nurseId is empty, skipping fetch.');
      return;
    }

    try {
      _refreshNurseId = nurseId;
      _isLoading = true;
      _error = null;
      notifyListeners();

      debugPrint('[NotificationProvider.fetchNotifications] Called with nurseId: $nurseId');
      debugPrint('🔵 [NotificationProvider.fetchNotifications] Base URL: ${DioClient.baseUrl}');
      debugPrint('🔵 [NotificationProvider.fetchNotifications] Full endpoint: ${DioClient.baseUrl}/api/Notification/GetByNurse?nurseId=$nurseId');

      final response = await DioClient.dio.get(
        '/api/Notification/GetByNurse',
        queryParameters: {'nurseId': nurseId},
      );

      debugPrint('🔵 [NotificationProvider.fetchNotifications] Response status: ${response.statusCode}');
      debugPrint('🔵 [NotificationProvider.fetchNotifications] Response body: ${response.data}');

      if (response.statusCode == 200) {
        dynamic dataBody = response.data;
        List<dynamic> dataList = [];

        if (dataBody is String) {
          try {
            final parsed = jsonDecode(dataBody);
            dataBody = parsed;
          } catch (_) {
            dataBody = dataBody;
          }
        }

        if (dataBody is List) {
          dataList = dataBody;
        } else if (dataBody is Map<String, dynamic>) {
          if (dataBody['data'] is List) {
            dataList = dataBody['data'];
          } else if (dataBody['result'] is List) {
            dataList = dataBody['result'];
          } else if (dataBody['notifications'] is List) {
            dataList = dataBody['notifications'];
          } else {
            final fallback = dataBody.values
                .firstWhere((value) => value is List<dynamic>, orElse: () => []);
            if (fallback is List<dynamic>) {
              dataList = fallback;
            }
          }
        }

        if (dataList.isEmpty && response.data is! List) {
          debugPrint('🔵 [NotificationProvider.fetchNotifications] Response shape not recognized, attempting fallback parsing.');
        }

        _notifications = dataList
            .map((json) => NotificationModel.fromJson(json as Map<String, dynamic>))
            .toList();
        debugPrint('🔵 [NotificationProvider.fetchNotifications] ✅ Fetched ${_notifications.length} notifications');
        
        for (var i = 0; i < _notifications.length; i++) {
          final n = _notifications[i];
          debugPrint('🔵   [${i+1}] Title: ${n.taskName}, PatientName: ${n.patientName}, IsRead: ${n.isRead}, NurseId: ${n.nurseId}');
        }
      } else {
        debugPrint('🔵 [NotificationProvider.fetchNotifications] ❌ Status code not 200: ${response.statusCode}');
      }
    } catch (e) {
      _error = 'Failed to fetch notifications: $e';
      debugPrint('🔵 [NotificationProvider.fetchNotifications] ❌ Error: $e');
      debugPrint('🔵 [NotificationProvider.fetchNotifications] ❌ Stack: ${StackTrace.current}');
    } finally {
      _isLoading = false;
      notifyListeners();
      debugPrint('🔵 [NotificationProvider.fetchNotifications] notifyListeners() called');
    }
  }

  // Mark notification as read
  Future<void> markAsRead(int notificationId) async {
    try {
      await DioClient.dio.put('/api/Notification/MarkAsRead/$notificationId');
      
      final index = _notifications.indexWhere((n) => n.id == notificationId);
      if (index != -1) {
        _notifications[index] = _notifications[index].copyWith(isRead: true);
        notifyListeners();
        debugPrint('✅ Notification $notificationId marked as read');
      }
    } catch (e) {
      debugPrint('❌ Error marking notification as read: $e');
    }
  }

  void startAutoRefresh(String nurseId) {
    if (nurseId.isEmpty) {
      debugPrint('[NotificationProvider] startAutoRefresh skipped because nurseId is empty.');
      return;
    }

    _refreshNurseId = nurseId;
    _refreshTimer?.cancel();

    if (!kIsWeb) {
      debugPrint('[NotificationProvider] Auto-refresh only enabled for web fallback.');
      return;
    }

    debugPrint('[NotificationProvider] Starting web polling fallback for nurseId=$nurseId');
    fetchNotifications(nurseId);
    _refreshTimer = Timer.periodic(const Duration(seconds: 15), (timer) {
      if (_refreshNurseId == null || _refreshNurseId!.isEmpty) {
        debugPrint('[NotificationProvider] No nurseId available for polling; stopping timer.');
        timer.cancel();
        return;
      }
      debugPrint('[NotificationProvider] Web polling refresh for nurseId=${_refreshNurseId!}');
      fetchNotifications(_refreshNurseId!);
    });
  }

  void stopAutoRefresh() {
    if (_refreshTimer != null) {
      _refreshTimer?.cancel();
      _refreshTimer = null;
      debugPrint('[NotificationProvider] Stopped web polling fallback.');
    }
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }

  // Add new notification (from SignalR) and play sound
  Future<void> addNotification(NotificationModel notification) async {
    debugPrint('[E2E:Flutter][NotificationProvider] addNotification() called');
    debugPrint('[E2E:Flutter][NotificationProvider] Title: ${notification.taskName}');
    debugPrint('[E2E:Flutter][NotificationProvider] PatientId: ${notification.patientId}');
    debugPrint('[E2E:Flutter][NotificationProvider] PatientName: ${notification.patientName}');
    debugPrint('[E2E:Flutter][NotificationProvider] Current count before: ${_notifications.length}');

    final isDuplicate = _notifications.any((n) =>
      n.id == notification.id ||
      (n.taskName == notification.taskName &&
       n.patientName == notification.patientName &&
       n.alertLevel == notification.alertLevel &&
       n.startTime == notification.startTime &&
       n.createdAt == notification.createdAt)
    );

    if (isDuplicate) {
      debugPrint('[E2E:Flutter][NotificationProvider] Duplicate notification ignored by provider.');
      return;
    }

    _notifications.insert(0, notification);
    debugPrint('[E2E:Flutter][NotificationProvider] Current count after: ${_notifications.length}');

    debugPrint('[E2E:Flutter][NotificationProvider] Calling notifyListeners()...');
    notifyListeners();
    debugPrint('[E2E:Flutter][NotificationProvider] ✅ notifyListeners() called');

    // Play sound alert only for new AI alerts with severity Warning or Critical
    final level = notification.alertLevel?.toLowerCase();
    if (level == 'warning' || level == 'critical') {
      debugPrint('[E2E:Flutter][NotificationProvider] Playing notification sound for alertLevel=${notification.alertLevel}...');
      try {
        await NotificationSoundService().playNotificationSound();
        debugPrint('[E2E:Flutter][NotificationProvider] ✅ Sound playback finished');
      } catch (e) {
        debugPrint('[E2E:Flutter][NotificationProvider] ⚠️ Sound playback error: $e');
      }
    } else {
      debugPrint('[E2E:Flutter][NotificationProvider] Notification is not a Warning/Critical alert; no sound played. alertLevel=${notification.alertLevel}');
    }
  }

  // Clear all notifications
  void clearAll() {
    _notifications.clear();
    notifyListeners();
  }
}