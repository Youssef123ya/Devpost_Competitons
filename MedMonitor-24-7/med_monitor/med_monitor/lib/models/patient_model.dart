// lib/models/patient_model.dart

import '../config/app_config.dart';

class PatientData {
  final String? id;
  final String name;
  final int age;
  final String? nurseName;
  final String? illness;
  final int? bpm;
  final int? respRate;
  final String cameraUrl;

  const PatientData({
    this.id,
    required this.name,
    required this.age,
    this.nurseName,
    this.illness,
    this.bpm,
    this.respRate,
    this.cameraUrl = AppConfig.streamUrl,
  });

  // ✅ إضافة دالة الـ FromJson عشان السواجر
  factory PatientData.fromJson(Map<String, dynamic> json) {
    return PatientData(
      id: json['id']?.toString(),
      name: json['name'] ?? json['fullName'] ?? 'Unknown',
      age: json['age'] ?? 0,
      nurseName: json['nurseName'],
      illness: json['illness'] ?? json['diagnosis'],
      bpm: json['bpm'] ?? json['heartRate'],
      respRate: json['respRate'],
      cameraUrl: json['cameraUrl'] ?? AppConfig.streamUrl,
    );
  }

  // ✅ إضافة دالة الـ ToJson عشان لو هتبعتي بيانات للسيرفر
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'age': age,
      'illness': illness,
      'cameraUrl': cameraUrl,
    };
  }
}

// كلاس السرير - يفضل دمجه أو ربطه بالـ Bed ID
class PatientBed {
  final int bedId;
  final String bedNumber;
  final String patientName;
  final int status; // 0: Empty, 1: Occupied

  const PatientBed({
    required this.bedId,
    required this.bedNumber,
    required this.patientName,
    required this.status,
  });

  factory PatientBed.fromJson(Map<String, dynamic> json) {
    return PatientBed(
      bedId: json['id'] ?? 0,
      bedNumber: json['bedNumber']?.toString() ?? '',
      patientName: json['patientName'] ?? 'Empty',
      status: json['status'] ?? 0,
    );
  }
}