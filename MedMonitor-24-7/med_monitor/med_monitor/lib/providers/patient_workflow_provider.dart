import 'package:flutter/material.dart';

import '../config/app_config.dart';
import '../models/patient.dart';
import '../models/medical_unit.dart';

/// Bed slot wrapper used to render occupied and empty beds
class BedSlot {
  final Patient? patient;

  BedSlot(this.patient);

  bool get isEmpty => patient == null;
}

/// Manages the patient form workflow and pending patient state
class PatientWorkflowProvider with ChangeNotifier {
  // Pending patient waiting to be assigned to a bed
  Patient? _pendingPatient;

  // List of medical units with their assigned patients
  Map<String, MedicalUnit> _medicalUnits = {
    'A': const MedicalUnit(unitName: 'A', totalBeds: 12),
    'B': const MedicalUnit(unitName: 'B', totalBeds: 12),
    'C': const MedicalUnit(unitName: 'C', totalBeds: 12),
    'D': const MedicalUnit(unitName: 'D', totalBeds: 12),
    'E': const MedicalUnit(unitName: 'E', totalBeds: 12),
    'F': const MedicalUnit(unitName: 'F', totalBeds: 12),
    'G': const MedicalUnit(unitName: 'G', totalBeds: 12),
  };

  // Currently selected unit for bed monitoring
  String _selectedUnitName = 'A';

  // Getters
  Patient? get pendingPatient => _pendingPatient;
  Patient? get pendingApprovedPatient => _pendingPatient;
  Map<String, MedicalUnit> get medicalUnits => _medicalUnits;
  String get selectedUnitName => _selectedUnitName;
  MedicalUnit get selectedUnit => _medicalUnits[_selectedUnitName]!;
  List<String> get unitNames => _medicalUnits.keys.toList();

  /// Submit a new patient form - holds patient as pending
  void submitPatientForm(Patient patient) {
    _pendingPatient = patient;
    notifyListeners();
  }

  /// Alias for admin approval workflow
  void approvePendingPatient(Patient patient) {
    submitPatientForm(patient);
  }

  static const String _defaultCameraUrl = AppConfig.streamUrl;

  /// Assign the pending patient to a specific bed in the selected unit
  bool assignPendingPatientToBed(int bedIndex) {
    if (_pendingPatient == null) {
      debugPrint('❌ No pending patient to assign');
      return false;
    }

    try {
      final currentUnit = _medicalUnits[_selectedUnitName]!;
      
      // Check if bed is already occupied
      if (currentUnit.getPatientAtBed(bedIndex) != null) {
        debugPrint('❌ Bed $bedIndex is already occupied');
        return false;
      }

      final patientWithCamera = _pendingPatient!.copyWith(
        cameraUrl: _pendingPatient!.cameraUrl?.isNotEmpty == true
            ? _pendingPatient!.cameraUrl
            : _defaultCameraUrl,
      );

      // Assign patient to bed
      final updatedUnit = currentUnit.assignPatientToBed(patientWithCamera, bedIndex);
      _medicalUnits[_selectedUnitName] = updatedUnit;
      
      // Clear pending patient
      _pendingPatient = null;
      
      notifyListeners();
      debugPrint('✅ Patient assigned to bed $bedIndex in unit $_selectedUnitName');
      return true;
    } catch (e) {
      debugPrint('❌ Error assigning patient: $e');
      return false;
    }
  }

  /// Remove a patient from a specific bed
  void removePatientFromBed(int bedIndex) {
    try {
      final currentUnit = _medicalUnits[_selectedUnitName]!;
      final updatedUnit = currentUnit.removePatientFromBed(bedIndex);
      _medicalUnits[_selectedUnitName] = updatedUnit;
      notifyListeners();
      debugPrint('✅ Patient removed from bed $bedIndex');
    } catch (e) {
      debugPrint('❌ Error removing patient: $e');
    }
  }

  /// Switch to a different medical unit
  void switchUnit(String unitName) {
    if (_medicalUnits.containsKey(unitName)) {
      _selectedUnitName = unitName;
      notifyListeners();
      debugPrint('🔄 Switched to unit: $unitName');
    }
  }

  /// Clear pending patient (e.g., on rejection)
  void clearPendingPatient() {
    _pendingPatient = null;
    notifyListeners();
  }

  /// Get all bed slots for the selected unit (including empty ones)
  List<Patient?> getBedSlotsForSelectedUnit() {
    return selectedUnit.generateBedSlots();
  }

  /// Returns a list of bed slot wrappers for any unit
  List<BedSlot> getBedsForUnit(String unitName) {
    final unit = _medicalUnits[unitName];
    if (unit == null) return [];
    return unit.generateBedSlots().map((patient) => BedSlot(patient)).toList();
  }

  /// Get occupied bed count for the selected unit
  int getOccupiedBedCountForSelectedUnit() {
    return selectedUnit.occupiedBedCount;
  }

  /// Get total bed count for the selected unit
  int getTotalBedsForSelectedUnit() {
    return selectedUnit.totalBeds;
  }

  /// Assign a patient to an arbitrary bed in a specific unit
  bool assignPatientToBed(String unitName, int bedIndex, Patient patient) {
    final unit = _medicalUnits[unitName];
    if (unit == null) return false;

    try {
      if (unit.getPatientAtBed(bedIndex) != null) {
        return false;
      }

      final patientWithCamera = patient.cameraUrl?.isNotEmpty == true
          ? patient
          : patient.copyWith(cameraUrl: _defaultCameraUrl);

      final updatedUnit = unit.assignPatientToBed(patientWithCamera, bedIndex);
      _medicalUnits[unitName] = updatedUnit;
      if (_pendingPatient != null && _pendingPatient!.id == patient.id) {
        _pendingPatient = null;
      }
      notifyListeners();
      return true;
    } catch (e) {
      debugPrint('❌ Error assigning patient to bed: $e');
      return false;
    }
  }

  /// Remove a patient from a specific bed in any unit
  bool deletePatientFromBed(String unitName, int bedIndex) {
    final unit = _medicalUnits[unitName];
    if (unit == null) return false;

    try {
      final updatedUnit = unit.removePatientFromBed(bedIndex);
      _medicalUnits[unitName] = updatedUnit;
      notifyListeners();
      return true;
    } catch (e) {
      debugPrint('❌ Error deleting patient from bed: $e');
      return false;
    }
  }

  /// Check if there's a pending patient
  bool hasPendingPatient() => _pendingPatient != null;

  /// Add a new medical unit
  void addMedicalUnit(String unitName, int totalBeds) {
    if (!_medicalUnits.containsKey(unitName)) {
      _medicalUnits[unitName] = MedicalUnit(
        unitName: unitName,
        totalBeds: totalBeds,
      );
      notifyListeners();
    }
  }
}
