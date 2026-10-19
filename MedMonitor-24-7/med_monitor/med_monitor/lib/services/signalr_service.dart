import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:signalr_core/signalr_core.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import 'dart:math' as math;
import 'dart:async';
import 'dio_client.dart';
import '../models/notification_model.dart';
import '../providers/notification_provider.dart';
import '../providers/auth_provider.dart';
import 'package:provider/provider.dart';

class SignalRService {
  HubConnection? _hubConnection;

  static final SignalRService _instance = SignalRService._internal();

  factory SignalRService() => _instance;

  SignalRService._internal();
  int _reconnectAttempts = 0;
  bool _isReconnecting = false;
  Timer? _monitorTimer;

  Future<void> startConnection(BuildContext? context) async {
    try {
      debugPrint('[E2E:Flutter][SignalR] startConnection() called');

      if (_hubConnection != null) {
        if (_hubConnection!.state == HubConnectionState.connected) {
          debugPrint('[E2E:Flutter][SignalR] Existing SignalR connection is already active. Skipping new start.');
          return;
        }

        if (_hubConnection!.state != HubConnectionState.disconnected) {
          debugPrint('[E2E:Flutter][SignalR] Stopping existing SignalR connection before restart.');
          await _hubConnection!.stop();
        }

        _hubConnection = null;
      }
      
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token') ?? '';
      final baseUrl = DioClient.baseUrl;

      debugPrint('🔴 [SignalR] Base URL from DioClient: $baseUrl');
      debugPrint('🔴 [SignalR] Token exists: ${token.isNotEmpty}');
      debugPrint('🔴 [SignalR] Full URL: $baseUrl/chatHub?access_token=${token.substring(0, math.min(10, token.length))}...');

      _hubConnection = HubConnectionBuilder()
          .withUrl(
            '$baseUrl/chatHub',
            HttpConnectionOptions(
              accessTokenFactory: () async => token,
            ),
          )
          .withAutomaticReconnect()
          .build();

      debugPrint('[E2E:Flutter][SignalR] HubConnection created');
      debugPrint('[E2E:Flutter][SignalR] Current state: ${_hubConnection?.state}');

      _hubConnection?.onclose((error) {
        debugPrint('[E2E:Flutter][SignalR] DISCONNECTED. Error: $error');
        try {
          _scheduleReconnect();
        } catch (e) {
          debugPrint('[E2E:Flutter][SignalR] Failed to schedule reconnect: $e');
        }
      });

      _hubConnection?.on('ReceiveTaskNotification', _onReceiveTaskNotificationHandler);
      _hubConnection?.on('ReceiveNotification', _onReceiveTaskNotificationHandler);
      debugPrint('[E2E:Flutter][SignalR] Event handlers registered for ReceiveTaskNotification and ReceiveNotification');

      await _hubConnection?.start();
      debugPrint('[E2E:Flutter][SignalR] ✅ CONNECTED SUCCESSFULLY');
      debugPrint('[E2E:Flutter][SignalR] Connection state: ${_hubConnection?.state}');
      // reset reconnect state on successful connection
      _reconnectAttempts = 0;
      _isReconnecting = false;
      // start monitor timer to ensure connection stays alive
      _startMonitorTimer();
    } catch (e, stackTrace) {
      debugPrint('🔴 [SignalR] ❌ CONNECTION FAILED: $e');
      debugPrint('🔴 [SignalR] Stack trace: $stackTrace');
    }
  }

  Future<void> stopConnection() async {
    try {
      await _hubConnection?.stop();
      _hubConnection = null;
      _monitorTimer?.cancel();
      _monitorTimer = null;
    } catch (e) {
      debugPrint('SignalR stop error: $e');
    }
  }

  void _onReceiveTaskNotificationHandler(List<dynamic>? args) async {
    try {
      debugPrint('[E2E:Flutter][SignalR] ReceiveTaskNotification EVENT RECEIVED!');
      debugPrint('[E2E:Flutter][SignalR] Args is null: ${args == null}');
      debugPrint('[E2E:Flutter][SignalR] Args length: ${args?.length}');
      
      if (args == null || args.isEmpty) {
        debugPrint('🟡 [SignalR Event] ❌ Args is null or empty, returning');
        return;
      }
      
      final raw = args[0];
      debugPrint('🟡 [SignalR Event] Raw payload type: ${raw.runtimeType}');
      debugPrint('🟡 [SignalR Event] Raw payload: $raw');
      
      Map<String, dynamic> json;
      if (raw is String) {
        debugPrint('🟡 [SignalR Event] Parsing as JSON string');
        json = jsonDecode(raw) as Map<String, dynamic>;
      } else if (raw is Map) {
        debugPrint('🟡 [SignalR Event] Converting Map to Map<String, dynamic>');
        json = Map<String, dynamic>.from(raw);
      } else {
        debugPrint('🟡 [SignalR Event] ❌ Unknown payload type: ${raw.runtimeType}');
        return;
      }

      debugPrint('🟡 [SignalR Event] Parsed JSON: $json');
      final notification = NotificationModel.fromJson(json);
      debugPrint('🟡 [SignalR Event] ✅ Notification created: title=${notification.taskName}');
      debugPrint('🟡 [SignalR Event] Notification details: patientId=${notification.patientId}, patientName=${notification.patientName}, unit=${notification.unitName}, alertLevel=${notification.alertLevel}, nurseId=${notification.nurseId}');

      // As a fallback, try to find NotificationProvider via the global context if available
      try {
        final context = DioClient.navigatorKey.currentContext;
        debugPrint('🟡 [SignalR Event] Context from navigator key: ${context != null}');
        
        if (context != null) {
          debugPrint('[E2E:Flutter][SignalR] Getting providers from context...');
          final provider = Provider.of<NotificationProvider>(context, listen: false);
          final authProvider = Provider.of<AuthProvider>(context, listen: false);
          final currentUserId = authProvider.currentUser?.id ?? '';
          debugPrint('[E2E:Flutter][SignalR] ✅ NotificationProvider and AuthProvider obtained; currentUserId=$currentUserId');

          debugPrint('[E2E:Flutter][SignalR] Calling addNotification()...');
          await provider.addNotification(notification);
          debugPrint('[E2E:Flutter][SignalR] ✅ addNotification() completed successfully');

          // If the notification targets a specific nurse, refresh only that nurse's list.
          if (notification.nurseId.isNotEmpty) {
            debugPrint('[E2E:Flutter][SignalR] Notification targets nurseId=${notification.nurseId}');
            // If current user matches the targeted nurse, fetch their notifications to ensure consistency
            if (notification.nurseId == currentUserId) {
              debugPrint('[E2E:Flutter][SignalR] Notification is for current user; fetching notifications');
              await provider.fetchNotifications(notification.nurseId);
              debugPrint('[E2E:Flutter][SignalR] ✅ NotificationProvider.fetchNotifications completed for current nurse');
            } else {
              debugPrint('[E2E:Flutter][SignalR] Notification is for another nurse; skipping fetch for current user');
            }
          } else {
            // If no nurseId provided, attempt to refresh for current user if set
            if (currentUserId.isNotEmpty) {
              debugPrint('[E2E:Flutter][SignalR] No nurseId on payload; refreshing notifications for currentUserId=$currentUserId');
              await provider.fetchNotifications(currentUserId);
              debugPrint('[E2E:Flutter][SignalR] ✅ NotificationProvider.fetchNotifications completed for current user');
            }
          }
        } else {
          debugPrint('🟡 [SignalR Event] ❌ Context is null - cannot deliver notification');
        }
      } catch (e) {
        debugPrint('🟡 [SignalR Event] ❌ Error delivering notification to provider: $e');
        debugPrint('🟡 [SignalR Event] ❌ Stack trace: ${StackTrace.current}');
      }
    } catch (e) {
      debugPrint('🟡 [SignalR Event] ❌ Error in _onReceiveTaskNotification: $e');
      debugPrint('🟡 [SignalR Event] ❌ Stack trace: ${StackTrace.current}');
    }
  }

  void _scheduleReconnect() {
    if (_isReconnecting) return;
    _isReconnecting = true;

    Future<void> _retryLoop() async {
      while (_reconnectAttempts < 10) {
        final delaySeconds = math.min(30, (1 << _reconnectAttempts));
        debugPrint('[E2E:Flutter][SignalR] Reconnect attempt ${_reconnectAttempts + 1} in $delaySeconds seconds');
        await Future.delayed(Duration(seconds: delaySeconds));
        try {
          _reconnectAttempts++;
          debugPrint('[E2E:Flutter][SignalR] Trying to restart connection (attempt ${_reconnectAttempts})');
          await startConnection(null);
          debugPrint('[E2E:Flutter][SignalR] Reconnect successful');
          _isReconnecting = false;
          _reconnectAttempts = 0;
          return;
        } catch (e) {
          debugPrint('[E2E:Flutter][SignalR] Reconnect attempt failed: $e');
        }
      }
      debugPrint('[E2E:Flutter][SignalR] Reconnect attempts exhausted');
      _isReconnecting = false;
    }

    _retryLoop();
  }

  void _startMonitorTimer() {
    _monitorTimer?.cancel();
    _monitorTimer = Timer.periodic(const Duration(seconds: 10), (timer) async {
      try {
        final state = _hubConnection?.state;
        debugPrint('[E2E:Flutter][SignalR] Monitor: hub state = $state');
        if (state != null && state != HubConnectionState.connected && !_isReconnecting) {
          debugPrint('[E2E:Flutter][SignalR] Monitor detected disconnected state, scheduling reconnect');
          _scheduleReconnect();
        }
      } catch (e) {
        debugPrint('[E2E:Flutter][SignalR] Monitor error: $e');
      }
    });
  }
}
