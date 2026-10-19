import 'package:flutter/foundation.dart';
import 'patient.dart';

/// Represents a medical unit (e.g., ICU A, ICU B)
class MedicalUnit {
  final String unitName;
  final int totalBeds;
  final List<Patient> patients; // Patients assigned to this unit

  const MedicalUnit({
    required this.unitName,
    this.totalBeds = 12,
    this.patients = const [],
  });

  /// Get count of occupied beds
  int get occupiedBedCount => patients.length;

  /// Get count of available beds
  int get availableBedCount => totalBeds - occupiedBedCount;

  /// Get patient at specific bed index (0-11)
  Patient? getPatientAtBed(int bedIndex) {
    try {
      if (bedIndex < 0 || bedIndex >= totalBeds) return null;
      for (var patient in patients) {
        if (patient.assignedBedIndex == bedIndex) {
          return patient;
        }
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  /// Generate a list of 12 bed slots
  List<Patient?> generateBedSlots() {
    List<Patient?> slots = List.filled(totalBeds, null);
    for (var patient in patients) {
      if (patient.assignedBedIndex != null && patient.assignedBedIndex! < totalBeds) {
        slots[patient.assignedBedIndex!] = patient;
      }
    }
    return slots;
  }

  /// Assign patient to a specific bed
  MedicalUnit assignPatientToBed(Patient patient, int bedIndex) {
    if (bedIndex < 0 || bedIndex >= totalBeds) {
      throw Exception('Invalid bed index');
    }
    
    // Check if bed is already occupied
    if (getPatientAtBed(bedIndex) != null) {
      throw Exception('Bed is already occupied');
    }

    final updatedPatient = patient.copyWith(assignedBedIndex: bedIndex);
    final updatedPatients = [...patients, updatedPatient];

    return MedicalUnit(
      unitName: unitName,
      totalBeds: totalBeds,
      patients: updatedPatients,
    );
  }

  /// Remove patient from a specific bed
  MedicalUnit removePatientFromBed(int bedIndex) {
    if (bedIndex < 0 || bedIndex >= totalBeds) {
      throw Exception('Invalid bed index');
    }

    final updatedPatients = patients
        .where((patient) => patient.assignedBedIndex != bedIndex)
        .toList();

    return MedicalUnit(
      unitName: unitName,
      totalBeds: totalBeds,
      patients: updatedPatients,
    );
  }

  /// Create a copy with modified fields
  MedicalUnit copyWith({
    String? unitName,
    int? totalBeds,
    List<Patient>? patients,
  }) {
    return MedicalUnit(
      unitName: unitName ?? this.unitName,
      totalBeds: totalBeds ?? this.totalBeds,
      patients: patients ?? this.patients,
    );
  }

  /// Convert to JSON
  Map<String, dynamic> toJson() => {
    'unitName': unitName,
    'totalBeds': totalBeds,
    'patients': patients.map((p) => p.toJson()).toList(),
  };

  /// Create from JSON
  factory MedicalUnit.fromJson(Map<String, dynamic> json) => MedicalUnit(
    unitName: json['unitName'] as String,
    totalBeds: json['totalBeds'] as int? ?? 12,
    patients: (json['patients'] as List<dynamic>?)
        ?.map((p) => Patient.fromJson(p as Map<String, dynamic>))
        .toList() ?? [],
  );

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is MedicalUnit &&
          runtimeType == other.runtimeType &&
          unitName == other.unitName &&
          totalBeds == other.totalBeds &&
          listEquals(patients, other.patients);

  @override
  int get hashCode => unitName.hashCode ^ totalBeds.hashCode ^ patients.hashCode;
}
