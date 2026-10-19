class StatCardData {
  final int value;
  final String label;
  StatCardData({required this.value, required this.label});
}

class AgeGroupData {
  final String title;
  final String range;
  final int count;
  final String imagePath;
  AgeGroupData({
    required this.title,
    required this.range,
    required this.count,
    required this.imagePath,
  });
}

class ProfileFieldData {
  final String label;
  final String value;
  ProfileFieldData({required this.label, required this.value});
}

class AdmissionRequest {
  final String? id;
  final String doctorName;
  final String? doctorId;
  final String patientName;
  final String? patientId; // ✅ رقم الهوية الجديد
  final String? age;
  final String? phone;
  final String? companionPhone;
  final String? gender;
  final String? height;
  final String? weight;
  final String? illness;
  final String? nurseName;
  final String? timeSent;
  final String status;
  final String? adminNote; // ✅ ملاحظة الأدمن الجديدة

  AdmissionRequest({
    this.id,
    required this.doctorName,
    this.doctorId,
    required this.patientName,
    this.patientId,
    this.age,
    this.phone,
    this.companionPhone,
    this.gender,
    this.height,
    this.weight,
    this.illness,
    this.nurseName,
    this.timeSent,
    this.status = "pending",
    this.adminNote,
  });

  bool get isPending => status.toLowerCase() == 'pending';
  bool get isApproved => status.toLowerCase() == 'approved';
  bool get isRejected => status.toLowerCase() == 'rejected';

  String get statusLabel {
    if (isPending) return 'Pending';
    if (isApproved) return 'Approved';
    if (isRejected) return 'Rejected';
    return status;
  }

  static String _parseStatus(dynamic rawStatus) {
    if (rawStatus == null) return 'pending';
    if (rawStatus is int) {
      switch (rawStatus) {
        case 1:
          return 'pending';
        case 2:
          return 'approved';
        case 3:
          return 'rejected';
        default:
          return rawStatus.toString();
      }
    }
    final statusString = rawStatus.toString().toLowerCase();
    if (statusString == '1') return 'pending';
    if (statusString == '2') return 'approved';
    if (statusString == '3') return 'rejected';
    return statusString;
  }

  // ✅ تحويل JSON لـ AdmissionRequest مع جميع الحقول الجديدة
  factory AdmissionRequest.fromJson(Map<String, dynamic> json) {
    String? id = json['id']?.toString() ?? json['Id']?.toString();

    // Doctor name extraction
    String doctorName = "Unknown Doctor";
    if (json['doctorName'] != null) {
      doctorName = json['doctorName'].toString();
    } else if (json['DoctorName'] != null) {
      doctorName = json['DoctorName'].toString();
    } else if (json.containsKey('doctor') && json['doctor'] is Map) {
      final d = json['doctor'] as Map<String, dynamic>;
      doctorName = d['userName']?.toString() ?? d['name']?.toString() ?? d['fullName']?.toString() ?? d['email']?.toString() ?? "Unknown Doctor";
    } else if (json['doctorId'] != null) {
      doctorName = "Doctor ${json['doctorId']}";
    } else if (json['DoctorId'] != null) {
      doctorName = "Doctor ${json['DoctorId']}";
    }

    // Patient name extraction
    String patientName = "Unknown Patient";
    if (json['patientName'] != null) {
      patientName = json['patientName'].toString();
    } else if (json['PatientName'] != null) {
      patientName = json['PatientName'].toString();
    } else if (json.containsKey('patient') && json['patient'] is Map) {
      final p = json['patient'] as Map<String, dynamic>;
      patientName = p['name']?.toString() ?? p['userName']?.toString() ?? p['fullName']?.toString() ?? "Unknown Patient";
    } else if (json['patient'] != null) {
      patientName = json['patient'].toString();
    }

    // Time extraction - parse backend time as UTC and convert to local
    // Backend sends DateTime.UtcNow which may or may not include timezone info
    String? timeSent;
    if (json['timeSent'] != null) {
      timeSent = json['timeSent'].toString();
    } else if (json['createdAt'] != null) {
      // Parse as UTC (backend always sends UtcNow)
      final createdAtStr = json['createdAt'].toString();
      try {
        // Ensure the string is treated as UTC by adding Z if missing
        String timeStr = createdAtStr;
        if (!timeStr.contains('Z') && !timeStr.contains('+') && !timeStr.contains('-00:00')) {
          // Assume it's UTC if no timezone info is present
          timeStr = '${createdAtStr}Z';
        }
        final utcTime = DateTime.parse(timeStr);
        final localTime = utcTime.toLocal(); // Convert UTC to local
        timeSent = localTime.toString();
      } catch (e) {
        timeSent = createdAtStr;
      }
    } else if (json['CreatedAt'] != null) {
      // Parse as UTC (backend always sends UtcNow)
      final createdAtStr = json['CreatedAt'].toString();
      try {
        // Ensure the string is treated as UTC by adding Z if missing
        String timeStr = createdAtStr;
        if (!timeStr.contains('Z') && !timeStr.contains('+') && !timeStr.contains('-00:00')) {
          // Assume it's UTC if no timezone info is present
          timeStr = '${createdAtStr}Z';
        }
        final utcTime = DateTime.parse(timeStr);
        final localTime = utcTime.toLocal(); // Convert UTC to local
        timeSent = localTime.toString();
      } catch (e) {
        timeSent = createdAtStr;
      }
    } else if (json['time'] != null) {
      timeSent = json['time'].toString();
    }

    String status = _parseStatus(json['status'] ?? json['Status']);

    return AdmissionRequest(
      id: id,
      doctorName: doctorName,
      doctorId: json['doctorId']?.toString() ?? json['DoctorId']?.toString(),
      patientName: patientName,
      patientId: json['patientId']?.toString() ?? json['PatientId']?.toString(),
      timeSent: timeSent,
      status: status,
      age: json['age']?.toString() ?? json['Age']?.toString(),
      phone: json['phone']?.toString() ?? json['Phone']?.toString(),
      companionPhone: json['companionPhone']?.toString() ?? json['CompanionPhone']?.toString(),
      gender: json['gender']?.toString() ?? json['Gender']?.toString(),
      height: json['height']?.toString() ?? json['Height']?.toString(),
      weight: json['weight']?.toString() ?? json['Weight']?.toString() ?? json['height']?.toString() ?? json['Height']?.toString(),
      illness: json['illness']?.toString() ?? json['Illness']?.toString() ?? json['diagnosis']?.toString() ?? json['Diagnosis']?.toString(),
      nurseName: json['nurseName']?.toString() ?? json['NurseName']?.toString(),
      adminNote: json['adminNote']?.toString() ?? json['AdminNote']?.toString(),
    );
  }

  // ✅ تحويل AdmissionRequest لـ JSON لإرساله للسيرفر
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'doctorName': doctorName,
      'doctorId': doctorId,
      'patientName': patientName,
      'patientId': patientId,  // ✅ إرسال patientId
      'age': age,
      'phone': phone,
      'companionPhone': companionPhone,  // ✅ إرسال companionPhone
      'gender': gender,
      'height': height,  // ✅ FIXED: Send height correctly
      'weight': weight,  // ✅ FIXED: Send weight correctly
      'illness': illness,  // ✅ إرسال illness
      'nurseName': nurseName,  // ✅ إرسال nurseName
      'timeSent': timeSent,
      'status': status,
      'adminNote': adminNote,
    };
  }

  AdmissionRequest copyWith({
    String? id,
    String? doctorName,
    String? doctorId,
    String? patientName,
    String? patientId,
    String? age,
    String? phone,
    String? companionPhone,
    String? gender,
    String? height,
    String? weight,
    String? illness,
    String? nurseName,
    String? timeSent,
    String? status,
    String? adminNote,
  }) {
    return AdmissionRequest(
      id: id ?? this.id,
      doctorName: doctorName ?? this.doctorName,
      doctorId: doctorId ?? this.doctorId,
      patientName: patientName ?? this.patientName,
      patientId: patientId ?? this.patientId,
      age: age ?? this.age,
      phone: phone ?? this.phone,
      companionPhone: companionPhone ?? this.companionPhone,
      gender: gender ?? this.gender,
      height: height ?? this.height,
      weight: weight ?? this.weight,
      illness: illness ?? this.illness,
      nurseName: nurseName ?? this.nurseName,
      timeSent: timeSent ?? this.timeSent,
      status: status ?? this.status,
      adminNote: adminNote ?? this.adminNote,
    );
  }
}