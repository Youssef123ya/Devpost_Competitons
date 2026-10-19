import 'package:flutter/foundation.dart';

/// Represents a patient in the ICU system
class Patient {
  final String id;
  final String name;
  final int age;
  final String gender;
  final double weight;
  final String illness;
  final String companionPhone;
  final String nurseName;
  final int? assignedBedIndex; // null if not assigned
  final String? cameraUrl; // For live monitor stream

  const Patient({
    required this.id,
    required this.name,
    required this.age,
    required this.gender,
    required this.weight,
    required this.illness,
    required this.companionPhone,
    required this.nurseName,
    this.assignedBedIndex,
    this.cameraUrl,
  });

  /// Create a copy with modified fields
  Patient copyWith({
    String? id,
    String? name,
    int? age,
    String? gender,
    double? weight,
    String? illness,
    String? companionPhone,
    String? nurseName,
    int? assignedBedIndex,
    String? cameraUrl,
  }) {
    return Patient(
      id: id ?? this.id,
      name: name ?? this.name,
      age: age ?? this.age,
      gender: gender ?? this.gender,
      weight: weight ?? this.weight,
      illness: illness ?? this.illness,
      companionPhone: companionPhone ?? this.companionPhone,
      nurseName: nurseName ?? this.nurseName,
      assignedBedIndex: assignedBedIndex ?? this.assignedBedIndex,
      cameraUrl: cameraUrl ?? this.cameraUrl,
    );
  }

  /// Convert to JSON for API calls
  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'age': age,
    'gender': gender,
    'weight': weight,
    'illness': illness,
    'companionPhone': companionPhone,
    'nurseName': nurseName,
    'assignedBedIndex': assignedBedIndex,
    'cameraUrl': cameraUrl,
  };

  /// Create from JSON
  factory Patient.fromJson(Map<String, dynamic> json) => Patient(
    id: json['id'] as String,
    name: json['name'] as String,
    age: json['age'] as int,
    gender: json['gender'] as String,
    weight: (json['weight'] as num).toDouble(),
    illness: json['illness'] as String,
    companionPhone: json['companionPhone'] as String,
    nurseName: json['nurseName'] as String,
    assignedBedIndex: json['assignedBedIndex'] as int?,
    cameraUrl: json['cameraUrl'] as String?,
  );

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is Patient &&
          runtimeType == other.runtimeType &&
          id == other.id &&
          name == other.name &&
          age == other.age &&
          gender == other.gender &&
          weight == other.weight &&
          illness == other.illness &&
          companionPhone == other.companionPhone &&
          nurseName == other.nurseName &&
          assignedBedIndex == other.assignedBedIndex;

  @override
  int get hashCode =>
      id.hashCode ^
      name.hashCode ^
      age.hashCode ^
      gender.hashCode ^
      weight.hashCode ^
      illness.hashCode ^
      companionPhone.hashCode ^
      nurseName.hashCode ^
      assignedBedIndex.hashCode;
}
