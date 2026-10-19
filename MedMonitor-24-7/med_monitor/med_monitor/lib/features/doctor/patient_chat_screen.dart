import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../models/patient.dart';
import '../../models/user_model.dart';
import '../../providers/chat_provider.dart';
import '../../providers/auth_provider.dart';
import '../../services/dio_client.dart';
import '../../models/app_models.dart';

class PatientChatScreen extends StatefulWidget {
  final Patient patient;

  const PatientChatScreen({super.key, required this.patient});

  @override
  State<PatientChatScreen> createState() => _PatientChatScreenState();
}

class _PatientChatScreenState extends State<PatientChatScreen> {
  final TextEditingController _controller = TextEditingController();
  Timer? _pollTimer;

  String? _resolvedPatientGuid;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final currentUser = authProvider.currentUser ?? authProvider.user;
      if (currentUser == null || currentUser.id == null || !mounted) return;

      // Resolve patient GUID before fetching messages
      _resolvedPatientGuid = await _resolvePatientGuid();
      if (!mounted) return;

      final patientKey = _resolvedPatientGuid ?? widget.patient.id;
      debugPrint('🔍 PatientChatScreen init patientId(raw)=${widget.patient.id} resolvedGuid=${_resolvedPatientGuid} currentUserId=${currentUser.id}');

      final chatProvider = Provider.of<ChatProvider>(context, listen: false);
      await chatProvider.fetchMessages(patientKey, currentUser.id!);
      if (!mounted) return;
      debugPrint('🔍 PatientChatScreen loaded ${chatProvider.messages.length} messages');

      _pollTimer = Timer.periodic(const Duration(seconds: 3), (_) {
        if (!mounted) return;
        chatProvider.fetchMessages(patientKey, currentUser.id!, showLoading: false);
      });
    });
  }

  @override
  void dispose() {
    _pollTimer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  String _determineReceiverId(UserModel? currentUser) {
    // Prefer explicit nurse/doctor id fields if added to Patient in future
    // Current Patient model contains only `nurseName`, so this helper only
    // handles trivial mismatch case. Real resolution is done in
    // `_resolveReceiverIdForRole` which may call backend APIs.
    if (currentUser == null) return '';
    if (currentUser.id == widget.patient.id) {
      debugPrint('PatientChatScreen: current user and patient are the same user; receiverId fallback to empty');
      return '';
    }

    // default fallback: empty — use resolver to find actual other-party id
    return '';
  }

  /// Resolve the other-party user id based on current user role.
  /// If current user is Doctor (role==2) -> find Nurse id by `widget.patient.nurseName` via `/Users`.
  /// If current user is Nurse (role==3) -> find Doctor id by searching admissions for this patient.
  Future<String> _resolveReceiverIdForRole(UserModel? currentUser) async {
    if (currentUser == null) return '';

    // If Patient model is later extended with nurseId/doctorId, prefer those.
    // NOTE: current `Patient` class does not expose nurseId or doctorId.

    final role = currentUser.role;

    try {
      if (role == 2) {
        // Doctor -> need the assigned nurse id
        final nurseName = widget.patient.nurseName?.trim() ?? '';
        if (nurseName.isEmpty) return '';

        final resp = await DioClient.dio.get('/Users');
        if (resp.statusCode == 200 && resp.data != null) {
          dynamic users = resp.data;
          if (users is Map && users['rows'] is List) users = users['rows'];
          if (users is Map && users['data'] is List) users = users['data'];
          if (users is List) {
            for (var u in users) {
              try {
                final map = u as Map<String, dynamic>;
                final userName = (map['userName'] ?? map['username'] ?? '').toString().trim();
                if (userName.toLowerCase() == nurseName.toLowerCase()) {
                  return map['id']?.toString() ?? '';
                }
              } catch (_) {}
            }
          }
        }
      } else if (role == 3) {
        // Nurse -> need the doctor id that admitted / owns the patient
        // Query admissions and match patientId or patientName
        final resp = await DioClient.dio.get('/AdmissionRequest/GetAll');
        if (resp.statusCode == 200 && resp.data != null) {
          dynamic rows = resp.data;
          if (rows is Map && rows['rows'] is List) rows = rows['rows'];
          if (rows is Map && rows['data'] is List) rows = rows['data'];
          if (rows is List) {
            for (var it in rows) {
              try {
                final adm = AdmissionRequest.fromJson(it as Map<String, dynamic>);
                if ((adm.patientId ?? '') == widget.patient.id || (adm.patientName ?? '').toLowerCase() == widget.patient.name.toLowerCase()) {
                  return adm.doctorId ?? '';
                }
              } catch (_) {}
            }
          }
        }
      }
    } catch (e) {
      debugPrint('Receiver resolution error: $e');
    }

    return '';
  }

  /// Resolve the Patient GUID to use for backend operations.
  /// If `widget.patient.id` already looks like a GUID, return it.
  /// Otherwise query admission records to find matching patient and return its PatientId.
  Future<String?> _resolvePatientGuid() async {
    final raw = widget.patient.id ?? '';
    // crude GUID check
    final guidRegex = RegExp(r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$');
    if (guidRegex.hasMatch(raw)) return raw;

    try {
      final resp = await DioClient.dio.get('/AdmissionRequest/GetAll');
      if (resp.statusCode == 200 && resp.data != null) {
        dynamic rows = resp.data;
        if (rows is Map && rows['rows'] is List) rows = rows['rows'];
        if (rows is Map && rows['data'] is List) rows = rows['data'];
        if (rows is List) {
          for (var it in rows) {
            try {
              final adm = AdmissionRequest.fromJson(it as Map<String, dynamic>);
              // match by provided patient id (national) OR by name
              if ((adm.patientId ?? '') == raw || (adm.patientName ?? '').toLowerCase() == widget.patient.name.toLowerCase()) {
                final candidate = adm.patientId ?? '';
                if (guidRegex.hasMatch(candidate)) return candidate;
              }
            } catch (_) {}
          }
        }
      }
    } catch (e) {
      debugPrint('Patient GUID resolution error: $e');
    }

    return null;
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context, listen: false);
    final currentUser = auth.currentUser ?? auth.user;
    final currentUserName = currentUser?.userName ?? '';
    final canWrite = currentUser?.role == 2 || currentUser?.role == 3;

    return Scaffold(
      appBar: AppBar(
        iconTheme: const IconThemeData(color: Colors.white),
        backgroundColor: const Color(0xFF5B8DEF),
        title: Text(
          '${widget.patient.name} - Chat',
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
            child: Container(
              width: 12,
              height: 12,
              decoration: BoxDecoration(color: Colors.green, shape: BoxShape.circle),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: Consumer<ChatProvider>(
              builder: (context, chatProvider, child) {
                if (chatProvider.isLoading) {
                  return const Center(child: CircularProgressIndicator());
                }

                return ListView.builder(
                  padding: const EdgeInsets.all(12),
                  itemCount: chatProvider.messages.length,
                  itemBuilder: (context, index) {
                    final msg = chatProvider.messages[index];
                    final isMe = msg.senderId == currentUser?.id;
                    final sender = isMe ? currentUserName : msg.senderName.isNotEmpty ? msg.senderName : msg.senderId;
                    final text = msg.text;
                    final timestamp = msg.timestamp;

                    final alignment = isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start;
                    final bubbleColor = isMe ? const Color(0xFF5B8DEF) : const Color(0xFFF2F2F2);
                    final textColor = isMe ? Colors.white : Colors.black87;

                    return Column(
                      crossAxisAlignment: alignment,
                      children: [
                        Container(
                          margin: const EdgeInsets.symmetric(vertical: 6),
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                          decoration: BoxDecoration(
                            color: bubbleColor,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(sender, style: TextStyle(color: textColor, fontWeight: FontWeight.w600)),
                              const SizedBox(height: 6),
                              Text(text, style: TextStyle(color: textColor)),
                              const SizedBox(height: 6),
                              Text(
                                '${timestamp.hour.toString().padLeft(2, '0')}:${timestamp.minute.toString().padLeft(2, '0')}',
                                style: const TextStyle(fontSize: 11, color: Colors.grey),
                              ),
                            ],
                          ),
                        ),
                      ],
                    );
                  },
                );
              },
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            color: Colors.white,
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _controller,
                    readOnly: !canWrite,
                    decoration: InputDecoration.collapsed(
                      hintText: canWrite ? 'Type a message' : 'Only doctor and nurse can send messages',
                      hintStyle: TextStyle(color: canWrite ? Colors.black54 : Colors.grey),
                    ),
                  ),
                ),
                IconButton(
                  icon: Icon(Icons.send, color: canWrite ? const Color(0xFF5B8DEF) : Colors.grey),
                  onPressed: canWrite
                      ? () async {
                          final text = _controller.text.trim();
                          if (text.isEmpty) return;
                          final chatProvider = Provider.of<ChatProvider>(context, listen: false);
                          final senderRole = currentUser?.role == 2 ? 'Doctor' : 'Nurse';

                          // Try fast-path resolver first (local fields), otherwise perform remote lookup
                          String receiverId = _determineReceiverId(currentUser);
                          if (receiverId.isEmpty) {
                            receiverId = await _resolveReceiverIdForRole(currentUser);
                          }

                          final patientKey = _resolvedPatientGuid ?? widget.patient.id;
                          debugPrint('PatientChatScreen send: patientKey=$patientKey (raw=${widget.patient.id}), senderId=${currentUser?.id}, receiverId=$receiverId');

                          await chatProvider.sendMessage(
                            patientKey,
                            currentUserName,
                            text,
                            currentUser!.id!,
                            senderRole,
                            receiverId,
                          );
                          _controller.clear();
                        }
                      : null,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
