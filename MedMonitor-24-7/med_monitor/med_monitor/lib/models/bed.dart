class Bed {
  final int id;
  final String bedNumber;
  final int status;           // 0=Available, 1=Occupied, 2=Maintenance
  
  // ✅ CHANGED: Store patient info directly instead of ID
  final String? patientId;    // National ID or Patient ID for navigation
  final String? patientName;
  final int? patientAge;
  final String? gender;       // NEW: Patient gender
  final int? weight;          // NEW: Patient weight
  final int? height;          // NEW: Patient height
  final String? patientIllness;
  final String? companionPhone; // NEW: Companion phone number
  final String? nurseName;
  final String? medicalHistory; // NEW: Medical history
  final String? diagnosis;    // NEW: Diagnosis
  
  final DateTime? assignedDate;

  Bed({
    required this.id,
    required this.bedNumber,
    required this.status,
    this.patientId,
    this.patientName,
    this.patientAge,
    this.gender,
    this.weight,
    this.height,
    this.patientIllness,
    this.companionPhone,
    this.nurseName,
    this.medicalHistory,
    this.diagnosis,
    this.assignedDate,
  });

  /// Create Bed from API JSON response
  /// Handles both PascalCase (current backend) and camelCase (after fix)
  factory Bed.fromJson(Map<String, dynamic> json) {
    return Bed(
      id: json['id'] ?? json['Id'] ?? 0,
      bedNumber: json['bedNumber'] ?? json['BedNumber'] ?? '',
      status: json['status'] ?? json['Status'] ?? 0,
      patientId: json['patientId']?.toString() ?? json['PatientId']?.toString(),
      patientName: json['patientName'] ?? json['PatientName'],
      patientAge: json['patientAge'] ?? json['PatientAge'],
      gender: json['gender'] ?? json['Gender'],
      weight: json['weight'] ?? json['Weight'],
      height: json['height'] ?? json['Height'],
      patientIllness: json['patientIllness'] ?? json['PatientIllness'],
      companionPhone: json['companionPhone'] ?? json['CompanionPhone'],
      nurseName: json['nurseName'] ?? json['NurseName'],
      medicalHistory: json['medicalHistory'] ?? json['MedicalHistory'],
      diagnosis: json['diagnosis'] ?? json['Diagnosis'],
      assignedDate: _parseDateTime(json['assignedDate'] ?? json['AssignedDate']),
    );
  }

  /// Parse DateTime from JSON string
  static DateTime? _parseDateTime(dynamic value) {
    if (value == null) return null;
    if (value is DateTime) return value;
    if (value is String) {
      try {
        return DateTime.parse(value);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  /// Convert Bed to JSON for API requests
  Map<String, dynamic> toJson() => {
    'id': id,
    'bedNumber': bedNumber,
    'status': status,
    'patientId': patientId,
    'patientName': patientName,
    'patientAge': patientAge,
    'gender': gender,
    'weight': weight,
    'height': height,
    'patientIllness': patientIllness,
    'companionPhone': companionPhone,
    'nurseName': nurseName,
    'medicalHistory': medicalHistory,
    'diagnosis': diagnosis,
    'assignedDate': assignedDate?.toIso8601String(),
  };

  /// Create a copy with modified fields (immutability pattern)
  Bed copyWith({
    int? id,
    String? bedNumber,
    int? status,
    String? patientId,
    String? patientName,
    int? patientAge,
    String? gender,
    int? weight,
    int? height,
    String? patientIllness,
    String? companionPhone,
    String? nurseName,
    String? medicalHistory,
    String? diagnosis,
    DateTime? assignedDate,
  }) {
    return Bed(
      id: id ?? this.id,
      bedNumber: bedNumber ?? this.bedNumber,
      status: status ?? this.status,
      patientId: patientId ?? this.patientId,
      patientName: patientName ?? this.patientName,
      patientAge: patientAge ?? this.patientAge,
      gender: gender ?? this.gender,
      weight: weight ?? this.weight,
      height: height ?? this.height,
      patientIllness: patientIllness ?? this.patientIllness,
      companionPhone: companionPhone ?? this.companionPhone,
      nurseName: nurseName ?? this.nurseName,
      medicalHistory: medicalHistory ?? this.medicalHistory,
      diagnosis: diagnosis ?? this.diagnosis,
      assignedDate: assignedDate ?? this.assignedDate,
    );
  }

  /// Check if bed is occupied
  bool get isOccupied => status == 1 && patientName != null;

  /// Check if bed is available
  bool get isAvailable => status == 0;

  /// Check if bed is under maintenance
  bool get isMaintenance => status == 2;

  @override
  String toString() => 'Bed(id: $id, number: $bedNumber, status: $status, patient: $patientName)';

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Bed &&
          runtimeType == other.runtimeType &&
          id == other.id &&
          bedNumber == other.bedNumber &&
          status == other.status &&
          patientName == other.patientName &&
          patientAge == other.patientAge &&
          patientIllness == other.patientIllness &&
          nurseName == other.nurseName &&
          assignedDate == other.assignedDate;

  @override
  int get hashCode =>
      id.hashCode ^
      bedNumber.hashCode ^
      status.hashCode ^
      patientName.hashCode ^
      patientAge.hashCode ^
      patientIllness.hashCode ^
      nurseName.hashCode ^
      assignedDate.hashCode;
}
