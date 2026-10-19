import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class TaskModel {
  final String id;
  final String title;
  final String note;
  final DateTime date;
  final String startTime;
  final String endTime;
  final String remind;
  final String repeat;
  final String nurseName;
  final String patientName;
  final String nurseId;
  final String patientId;
  final String doctorId;
  final Color color;
  String status;

  TaskModel({
    required this.id,
    required this.title,
    required this.note,
    required this.date,
    required this.startTime,
    required this.endTime,
    required this.remind,
    required this.repeat,
    this.nurseName = '',
    this.patientName = '',
    this.nurseId = '',
    this.patientId = '',
    this.doctorId = '',
    this.color = Colors.blue,
    this.status = 'To Do',
  });

  factory TaskModel.fromJson(Map<String, dynamic> json) {
    final startRaw = json['startTime']?.toString() ?? json['StartTime']?.toString() ?? '';
    final endRaw = json['endTime']?.toString() ?? json['EndTime']?.toString() ?? '';
    final parsedDate = DateTime.tryParse(startRaw) ?? DateTime.tryParse(endRaw) ?? DateTime.now();

    return TaskModel(
      id: json['id']?.toString() ?? json['Id']?.toString() ?? '',
      title: json['title']?.toString() ?? json['Title']?.toString() ?? '',
      note: json['notes']?.toString() ?? json['note']?.toString() ?? json['Notes']?.toString() ?? '',
      date: parsedDate,
      startTime: _formatTime(startRaw),
      endTime: _formatTime(endRaw),
      remind: _normalizeRemind(json['remind']?.toString() ?? json['Remind']?.toString() ?? ''),
      repeat: _normalizeRepeat(json['repeat']?.toString() ?? json['Repeat']?.toString() ?? ''),
      nurseName: json['nurseName']?.toString() ?? json['NurseName']?.toString() ?? '',
      patientName: json['patientName']?.toString() ?? json['PatientName']?.toString() ?? '',
      nurseId: json['nurseId']?.toString() ?? json['NurseId']?.toString() ?? '',
      patientId: json['patientId']?.toString() ?? json['PatientId']?.toString() ?? '',
      doctorId: json['doctorId']?.toString() ?? json['DoctorId']?.toString() ?? '',
      color: Colors.blue,
      status: _statusFromApi(json['status'] ?? json['Status']),
    );
  }

  Map<String, dynamic> toJson() {
    final startTimeStr = _buildDateTimeString(date, startTime);
    final endTimeStr = _buildDateTimeString(date, endTime);
    final statusCode = _statusToApi(status);
    final idInt = int.tryParse(id) ?? 0;
    
    debugPrint('------------------------------------------------------------');
    debugPrint('TaskModel.toJson() - Generating Request Body');
    debugPrint('------------------------------------------------------------');
    debugPrint('INPUT VALUES:');
    debugPrint('  - id: "$id" -> int: $idInt');
    debugPrint('  - title: "$title"');
    debugPrint('  - note: "$note"');
    debugPrint('  - date: "$date"');
    debugPrint('  - startTime (raw): "$startTime"');
    debugPrint('  - endTime (raw): "$endTime"');
    debugPrint('  - status (str): "$status" -> code: $statusCode');
    debugPrint('  - doctorId: "$doctorId"');
    debugPrint('  - nurseId: "$nurseId"');
    debugPrint('  - patientId: "$patientId"');
    debugPrint('');
    debugPrint('CONVERTED VALUES:');
    debugPrint('  - startTime (ISO): "$startTimeStr"');
    debugPrint('  - endTime (ISO): "$endTimeStr"');
    debugPrint('');
    
    final result = {
      'id': idInt,
      'title': title,
      'notes': note,
      'startTime': startTimeStr,
      'endTime': endTimeStr,
      'status': statusCode,
      'doctorId': doctorId,
      'nurseId': nurseId,
      'patientId': patientId.isNotEmpty ? patientId : null,
      'patientName': patientName.isNotEmpty ? patientName : null,
      'nurseName': nurseName.isNotEmpty ? nurseName : null,
      'remind': remind.isNotEmpty ? remind : null,
      'repeat': repeat.isNotEmpty ? repeat : null,
    };
    debugPrint('FINAL JSON OUTPUT:');
    debugPrint('  $result');
    debugPrint('------------------------------------------------------------');
    debugPrint('');
    return result;
  }

  static String _normalizeRemind(String raw) {
    final value = raw.toLowerCase().trim();
    if (value.isEmpty) return '';

    if (value.contains('5') && value.contains('min')) return '5 minutes before';
    if (value.contains('10') && value.contains('min')) return '10 minutes before';
    if (value.contains('15') && value.contains('min')) return '15 minutes before';
    if (value.contains('30') && value.contains('min')) return '30 minutes before';
    if (value.contains('1') && value.contains('hour')) return '1 hour before';
    if (value.contains('5 minutes before')) return '5 minutes before';
    if (value.contains('10 minutes before')) return '10 minutes before';
    if (value.contains('15 minutes before')) return '15 minutes before';
    if (value.contains('30 minutes before')) return '30 minutes before';
    if (value.contains('1 hour before')) return '1 hour before';
    if (value.contains('5 minutes')) return '5 minutes before';
    if (value.contains('10 minutes')) return '10 minutes before';
    if (value.contains('15 minutes')) return '15 minutes before';
    if (value.contains('30 minutes')) return '30 minutes before';
    if (value.contains('1 hour')) return '1 hour before';

    return raw;
  }

  static String _normalizeRepeat(String raw) {
    final value = raw.toLowerCase().trim();
    if (value.isEmpty) return '';
    if (value.contains('never')) return 'Never';
    if (value.contains('daily')) return 'Daily';
    if (value.contains('weekly')) return 'Weekly';
    if (value.contains('monthly')) return 'Monthly';
    return raw;
  }

  static String _formatTime(String raw) {
    if (raw.isEmpty) return '';
    final parsed = DateTime.tryParse(raw);
    if (parsed != null) {
      return DateFormat.jm().format(parsed);
    }
    return raw;
  }

  static String _buildDateTimeString(DateTime date, String timeString) {
    final normalizedTime = timeString.trim();
    if (normalizedTime.isEmpty) {
      return DateTime(date.year, date.month, date.day).toIso8601String();
    }

    debugPrint('  ↳ _buildDateTimeString: date="$date", timeString="$timeString"');

    String sanitized = normalizedTime
        .replaceAll('ص', 'AM')
        .replaceAll('م', 'PM')
        .replaceAll(RegExp(r'[\u0000-\u001F\u007F]+'), '')
        .replaceAll(RegExp(r'\s+'), ' ')
        .trim();

    DateTime? parsedTime;
    try {
      parsedTime = DateFormat.jm().parse(sanitized);
    } catch (_) {
      try {
        parsedTime = DateFormat.Hm().parse(sanitized);
      } catch (_) {
        parsedTime = null;
      }
    }

    if (parsedTime == null) {
      final match = RegExp(r'^(\d{1,2}):(\d{2})(?:\s*([AaPp][Mm]|AM|PM))?').firstMatch(sanitized);
      if (match != null) {
        int hour = int.parse(match.group(1)!);
        final int minute = int.parse(match.group(2)!);
        final String? meridiem = match.group(3)?.toUpperCase();

        if (hour >= 1 && hour <= 12 && meridiem != null) {
          if (meridiem.startsWith('P') && hour < 12) hour += 12;
          if (meridiem.startsWith('A') && hour == 12) hour = 0;
        }

        if (hour >= 0 && hour < 24 && minute >= 0 && minute < 60) {
          parsedTime = DateTime(date.year, date.month, date.day, hour, minute);
        }
      }
    }

    if (parsedTime == null) {
      debugPrint('    â†³ ERROR parsing time "$timeString"; falling back to date-only ISO string');
      return DateTime(date.year, date.month, date.day).toIso8601String();
    }

    final result = DateTime(date.year, date.month, date.day, parsedTime.hour, parsedTime.minute);
    final iso = result.toIso8601String();
    debugPrint('    â†³ Result ISO: "$iso"');
    return iso;
  }

  static String _statusFromApi(dynamic status) {
    if (status == null) return 'To Do';
    if (status is int) {
      switch (status) {
        case 2:
          return 'In Progress';
        case 3:
          return 'Done';
        case 4:
          return 'Cancelled';
        default:
          return 'To Do';
      }
    }
    final normalized = status.toString().toLowerCase();
    if (normalized.contains('progress')) return 'In Progress';
    if (normalized.contains('done')) return 'Done';
    if (normalized.contains('cancel')) return 'Cancelled';
    return 'To Do';
  }

  static int _statusToApi(String status) {
    final normalized = status.toLowerCase();
    if (normalized.contains('progress')) return 2;
    if (normalized.contains('done')) return 3;
    if (normalized.contains('cancel')) return 4;
    return 1;
  }

  TaskModel copyWith({
    String? id,
    String? title,
    String? note,
    DateTime? date,
    String? startTime,
    String? endTime,
    String? remind,
    String? repeat,
    String? nurseName,
    String? patientName,
    String? nurseId,
    String? patientId,
    String? doctorId,
    Color? color,
    String? status,
  }) {
    return TaskModel(
      id: id ?? this.id,
      title: title ?? this.title,
      note: note ?? this.note,
      date: date ?? this.date,
      startTime: startTime ?? this.startTime,
      endTime: endTime ?? this.endTime,
      remind: remind ?? this.remind,
      repeat: repeat ?? this.repeat,
      nurseName: nurseName ?? this.nurseName,
      patientName: patientName ?? this.patientName,
      nurseId: nurseId ?? this.nurseId,
      patientId: patientId ?? this.patientId,
      doctorId: doctorId ?? this.doctorId,
      color: color ?? this.color,
      status: status ?? this.status,
    );
  }
}

