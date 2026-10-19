import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/notification_provider.dart';
import '../../providers/auth_provider.dart';
import 'package:intl/intl.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  String _formatStartEnd(String start, String end) {
    if (start.isEmpty) return end;

    try {
      var s = start;
      if (!s.contains('Z') && !s.contains('+') && !s.contains('-00:00')) {
        s = '${s}Z';
      }
      final dt = DateTime.parse(s).toLocal();
      final formatted = DateFormat('dd/MM/yyyy hh:mm a').format(dt);

      if (end.isNotEmpty) {
        var e = end;
        if (!e.contains('Z') && !e.contains('+') && !e.contains('-00:00')) {
          e = '${e}Z';
        }
        try {
          final dt2 = DateTime.parse(e).toLocal();
          final formatted2 = DateFormat('hh:mm a').format(dt2);
          return '$formatted - $formatted2';
        } catch (_) {
          return '$formatted - $end';
        }
      }

      return formatted;
    } catch (_) {
      return start;
    }
  }

  void _loadNotifications() {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final notifProvider = Provider.of<NotificationProvider>(context, listen: false);
    
    final nurseId = authProvider.currentUser?.id;
    if (nurseId != null && nurseId.isNotEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        notifProvider.fetchNotifications(nurseId);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFE9EEF6),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFF3B5BB5), size: 28),
          onPressed: () => Navigator.pop(context),
        ),
        centerTitle: true,
        title: const Text(
          "Notifications",
          style: TextStyle(
            color: Color(0xFF3B5BB5),
            fontSize: 26,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: Consumer<NotificationProvider>(
        builder: (context, notifProvider, _) {
          if (notifProvider.isLoading) {
            return const Center(
              child: CircularProgressIndicator(),
            );
          }

          if (notifProvider.error != null) {
            return Center(
              child: Text(
                notifProvider.error!,
                style: const TextStyle(color: Colors.red),
              ),
            );
          }

          if (notifProvider.notifications.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.notifications_off,
                    size: 64,
                    color: Colors.grey[400],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'No notifications yet',
                    style: TextStyle(
                      color: Colors.grey[600],
                      fontSize: 16,
                    ),
                  ),
                ],
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            itemCount: notifProvider.notifications.length,
            itemBuilder: (context, index) {
              final notification = notifProvider.notifications[index];
              final isUnread = !notification.isRead;
              
              return GestureDetector(
                onTap: () async {
                  if (!notification.isRead) {
                    await notifProvider.markAsRead(notification.id);
                  }
                },
                child: Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: isUnread
                        ? const Color(0xFF7CA1FF).withOpacity(0.15)  // Light blue for unread
                        : Colors.white,                               // White for read
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isUnread
                          ? const Color(0xFF7CA1FF)                  // Blue border for unread
                          : Colors.grey[300]!,
                      width: isUnread ? 2 : 1,
                    ),
                    boxShadow: [
                      if (isUnread)
                        BoxShadow(
                          color: const Color(0xFF7CA1FF).withOpacity(0.2),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Row(
                              children: [
                                Icon(
                                  Icons.assignment,
                                  color: isUnread
                                      ? const Color(0xFF7CA1FF)
                                      : Colors.grey[600],
                                  size: 24,
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Text(
                                    notification.title,
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: isUnread
                                          ? FontWeight.bold
                                          : FontWeight.w600,
                                      color: isUnread
                                          ? const Color(0xFF7CA1FF)
                                          : const Color(0xFF3B5BB5),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          // Red dot badge for unread
                          if (isUnread)
                            Container(
                              width: 14,
                              height: 14,
                              decoration: const BoxDecoration(
                                color: Colors.red,
                                shape: BoxShape.circle,
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      // Task name - bold if unread
                      Text(
                        "Task: ${notification.taskName}",
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: isUnread
                              ? FontWeight.bold
                              : FontWeight.w600,
                          color: isUnread
                              ? const Color(0xFF3B5BB5)
                              : Colors.black87,
                        ),
                      ),
                      const SizedBox(height: 6),
                      // Patient name
                      Text(
                        "Patient: ${notification.patientName}",
                        style: TextStyle(
                          fontSize: 13,
                          color: isUnread
                              ? const Color(0xFF3B5BB5).withOpacity(0.8)
                              : Colors.grey[700],
                          fontWeight: isUnread ? FontWeight.w500 : FontWeight.normal,
                        ),
                      ),
                      if ((notification.alertLevel?.isNotEmpty ?? false) || (notification.unitName?.isNotEmpty ?? false)) ...[
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            if (notification.alertLevel?.isNotEmpty ?? false)
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                decoration: BoxDecoration(
                                  color: Colors.red.withOpacity(notification.alertLevel!.toLowerCase() == 'critical' ? 0.15 : 0.1),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  notification.alertLevel!,
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: notification.alertLevel!.toLowerCase() == 'critical'
                                        ? Colors.red
                                        : const Color(0xFF3B5BB5),
                                  ),
                                ),
                              ),
                            if ((notification.alertLevel?.isNotEmpty ?? false) && (notification.unitName?.isNotEmpty ?? false))
                              const SizedBox(width: 8),
                            if (notification.unitName?.isNotEmpty ?? false)
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                decoration: BoxDecoration(
                                  color: Colors.blue.withOpacity(0.12),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  notification.unitName!,
                                  style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: Color(0xFF3B5BB5),
                                  ),
                                ),
                              ),
                          ],
                        ),
                      ],
                      const SizedBox(height: 6),
                      // Time range
                      Row(
                        children: [
                          Icon(
                            Icons.access_time,
                            size: 14,
                            color: isUnread
                                ? const Color(0xFF7CA1FF)
                                : Colors.grey,
                          ),
                          const SizedBox(width: 6),
                          Text(
                            _formatStartEnd(notification.startTime, notification.endTime),
                            style: TextStyle(
                              fontSize: 13,
                              color: isUnread
                                  ? Colors.grey[600]
                                  : Colors.grey[700],
                              fontWeight: isUnread ? FontWeight.w500 : FontWeight.normal,
                            ),
                          ),
                        ],
                      ),
                      // Note if present
                      if (notification.note.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: Colors.grey[100],
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            "Note: ${notification.note}",
                            style: TextStyle(
                              fontSize: 13,
                              color: Colors.grey[700],
                              fontStyle: FontStyle.italic,
                            ),
                          ),
                        ),
                      ],
                      const SizedBox(height: 8),
                      // Relative time
                      Text(
                        _formatTime(notification.createdAt.toLocal()),
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[500],
                          fontWeight: isUnread ? FontWeight.w500 : FontWeight.normal,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }

  String _formatTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inMinutes < 1) {
      return "Just now";
    } else if (difference.inMinutes < 60) {
      return "${difference.inMinutes}m ago";
    } else if (difference.inHours < 24) {
      return "${difference.inHours}h ago";
    } else {
      return "${difference.inDays}d ago";
    }
  }
}
