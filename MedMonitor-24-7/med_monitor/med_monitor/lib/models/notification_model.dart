class NotificationModel {
  final int id;
  final String nurseId;
  final String? nurseName;
  final String? patientId;
  final String title;
  final String taskName;
  final String patientName;
  final String startTime;
  final String endTime;
  final String note;
  final String? alertLevel;
  final String? unitName;
  final bool isRead;
  final DateTime createdAt;

  NotificationModel({
    required this.id,
    required this.nurseId,
    this.nurseName,
    this.patientId,
    required this.title,
    required this.taskName,
    required this.patientName,
    required this.startTime,
    required this.endTime,
    required this.note,
    this.alertLevel,
    this.unitName,
    required this.isRead,
    required this.createdAt,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    final createdAtString = json['createdAt']?.toString() ?? json['CreatedAt']?.toString() ?? json['created_at']?.toString() ?? '';
    DateTime createdAtValue = DateTime.now().toUtc();

    if (createdAtString.isNotEmpty) {
      try {
        var normalized = createdAtString;
        if (!normalized.contains('Z') && !normalized.contains('+') && !normalized.contains('-00:00')) {
          normalized = '${normalized}Z';
        }
        createdAtValue = DateTime.parse(normalized).toUtc();
      } catch (_) {
        createdAtValue = DateTime.now().toUtc();
      }
    }

    final nurseIdValue = json['nurseId'] ?? json['NurseId'] ?? json['NurseID'] ?? json['nurseID'] ?? json['userId'] ?? json['UserId'];
    final patientIdValue = json['patientId'] ?? json['PatientId'] ?? json['PatientID'] ?? json['patientID'];
    final titleValue = json['title'] ?? json['Title'];
    final taskNameValue = json['taskName'] ?? json['TaskName'] ?? json['title'] ?? json['Title'];
    final patientNameValue = json['patientName'] ?? json['PatientName'] ?? json['name'] ?? json['patient_name'];
    final startTimeValue = json['startTime'] ?? json['StartTime'] ?? json['start_time'];
    final endTimeValue = json['endTime'] ?? json['EndTime'] ?? json['end_time'];
    final noteValue = json['note'] ?? json['Note'];
    final alertLevelValue = json['alertLevel'] ?? json['AlertLevel'];
    final unitNameValue = json['unitName'] ?? json['UnitName'];
    final isReadValue = json['isRead'] ?? json['IsRead'] ?? json['read'] ?? json['is_read'];

    final nurseNameValue = json['nurseName'] ?? json['NurseName'];

    return NotificationModel(
      id: json['id'] as int? ?? json['Id'] as int? ?? 0,
      nurseId: nurseIdValue?.toString() ?? '',
      nurseName: nurseNameValue?.toString(),
      patientId: patientIdValue?.toString(),
      title: titleValue?.toString() ?? '',
      taskName: taskNameValue?.toString() ?? '',
      patientName: patientNameValue?.toString() ?? '',
      startTime: startTimeValue?.toString() ?? '',
      endTime: endTimeValue?.toString() ?? '',
      note: noteValue?.toString() ?? '',
      alertLevel: alertLevelValue?.toString(),
      unitName: unitNameValue?.toString(),
      isRead: isReadValue is bool ? isReadValue : (isReadValue?.toString().toLowerCase() == 'true'),
      createdAt: createdAtValue.toLocal(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'patientId': patientId,
      'nurseId': nurseId,
      'nurseName': nurseName,
      'title': title,
      'taskName': taskName,
      'patientName': patientName,
      'startTime': startTime,
      'endTime': endTime,
      'note': note,
      'alertLevel': alertLevel,
      'unitName': unitName,
      'isRead': isRead,
      'createdAt': createdAt.toUtc().toIso8601String(),
    };
  }

  NotificationModel copyWith({
    int? id,
    String? nurseId,
    String? nurseName,
    String? patientId,
    String? title,
    String? taskName,
    String? patientName,
    String? startTime,
    String? endTime,
    String? note,
    String? alertLevel,
    String? unitName,
    bool? isRead,
    DateTime? createdAt,
  }) {
    return NotificationModel(
      id: id ?? this.id,
      nurseId: nurseId ?? this.nurseId,
      nurseName: nurseName ?? this.nurseName,
      patientId: patientId ?? this.patientId,
      title: title ?? this.title,
      taskName: taskName ?? this.taskName,
      patientName: patientName ?? this.patientName,
      startTime: startTime ?? this.startTime,
      endTime: endTime ?? this.endTime,
      note: note ?? this.note,
      alertLevel: alertLevel ?? this.alertLevel,
      unitName: unitName ?? this.unitName,
      isRead: isRead ?? this.isRead,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
