import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/patient.dart';
import '../models/medical_unit.dart';

// ============================================================================
// PENDING PATIENT NOTIFIER
// ============================================================================

class PendingPatientNotifier extends ChangeNotifier {
  Patient? _pendingPatient;

  Patient? get pendingPatient => _pendingPatient;
  bool get hasPendingPatient => _pendingPatient != null;

  void setPendingPatient(Patient patient) {
    _pendingPatient = patient;
    notifyListeners();
  }

  void clearPendingPatient() {
    _pendingPatient = null;
    notifyListeners();
  }
}

// ============================================================================
// MEDICAL UNITS NOTIFIER
// ============================================================================

class MedicalUnitsNotifier extends ChangeNotifier {
  List<MedicalUnit> _units = [
    const MedicalUnit(unitName: 'A', totalBeds: 12, patients: []),
    const MedicalUnit(unitName: 'B', totalBeds: 12, patients: []),
    const MedicalUnit(unitName: 'C', totalBeds: 12, patients: []),
  ];

  List<MedicalUnit> get units => _units;

  MedicalUnit? getUnitByName(String unitName) {
    try {
      return _units.firstWhere((unit) => unit.unitName == unitName);
    } catch (e) {
      return null;
    }
  }

  bool assignPatientToBed({
    required String unitName,
    required Patient patient,
    required int bedIndex,
  }) {
    try {
      final unitIndex = _units.indexWhere((unit) => unit.unitName == unitName);
      if (unitIndex == -1) return false;

      final unit = _units[unitIndex];

      // Check if bed is already occupied
      if (unit.getPatientAtBed(bedIndex) != null) {
        return false;
      }

      // Assign patient to bed
      final updatedUnit = unit.assignPatientToBed(patient, bedIndex);

      // Update state
      _units = [
        ..._units.sublist(0, unitIndex),
        updatedUnit,
        ..._units.sublist(unitIndex + 1),
      ];

      notifyListeners();
      return true;
    } catch (e) {
      print('Error assigning patient: $e');
      return false;
    }
  }

  bool removePatientFromBed({
    required String unitName,
    required int bedIndex,
  }) {
    try {
      final unitIndex = _units.indexWhere((unit) => unit.unitName == unitName);
      if (unitIndex == -1) return false;

      final unit = _units[unitIndex];
      final updatedUnit = unit.removePatientFromBed(bedIndex);

      // Update state
      _units = [
        ..._units.sublist(0, unitIndex),
        updatedUnit,
        ..._units.sublist(unitIndex + 1),
      ];

      notifyListeners();
      return true;
    } catch (e) {
      print('Error removing patient: $e');
      return false;
    }
  }

  void addUnit(String unitName) {
    if (_units.any((unit) => unit.unitName == unitName)) {
      return; // Unit already exists
    }
    _units = [
      ..._units,
      MedicalUnit(unitName: unitName, totalBeds: 12),
    ];
    notifyListeners();
  }

  List<String> getUnitNames() {
    return _units.map((unit) => unit.unitName).toList();
  }
}

// ============================================================================
// SELECTED UNIT NOTIFIER
// ============================================================================

class SelectedUnitNotifier extends ChangeNotifier {
  String _selectedUnit = 'A';

  String get selectedUnit => _selectedUnit;

  void selectUnit(String unitName) {
    _selectedUnit = unitName;
    notifyListeners();
  }
}

// ============================================================================
// WORKFLOW NOTIFIER
// ============================================================================

class WorkflowState {
  final bool isFormSubmitted;
  final String? selectedBedUnitForAssignment;
  final int? selectedBedIndexForAssignment;

  WorkflowState({
    this.isFormSubmitted = false,
    this.selectedBedUnitForAssignment,
    this.selectedBedIndexForAssignment,
  });

  WorkflowState copyWith({
    bool? isFormSubmitted,
    String? selectedBedUnitForAssignment,
    int? selectedBedIndexForAssignment,
  }) {
    return WorkflowState(
      isFormSubmitted: isFormSubmitted ?? this.isFormSubmitted,
      selectedBedUnitForAssignment:
          selectedBedUnitForAssignment ?? this.selectedBedUnitForAssignment,
      selectedBedIndexForAssignment:
          selectedBedIndexForAssignment ?? this.selectedBedIndexForAssignment,
    );
  }
}

class WorkflowNotifier extends ChangeNotifier {
  WorkflowState _state = WorkflowState();

  WorkflowState get state => _state;

  void markFormAsSubmitted() {
    _state = _state.copyWith(isFormSubmitted: true);
    notifyListeners();
  }

  void selectBedForAssignment(String unitName, int bedIndex) {
    _state = _state.copyWith(
      selectedBedUnitForAssignment: unitName,
      selectedBedIndexForAssignment: bedIndex,
    );
    notifyListeners();
  }

  void clearBedAssignmentSelection() {
    _state = _state.copyWith(
      selectedBedUnitForAssignment: null,
      selectedBedIndexForAssignment: null,
    );
    notifyListeners();
  }

  void reset() {
    _state = WorkflowState();
    notifyListeners();
  }
}

// ============================================================================
// PROVIDER DEFINITIONS
// ============================================================================

final pendingPatientProvider =
    ChangeNotifierProvider<PendingPatientNotifier>(
      create: (context) => PendingPatientNotifier(),
    );

final medicalUnitsProvider =
    ChangeNotifierProvider<MedicalUnitsNotifier>(
      create: (context) => MedicalUnitsNotifier(),
    );

final selectedUnitProvider =
    ChangeNotifierProvider<SelectedUnitNotifier>(
      create: (context) => SelectedUnitNotifier(),
    );

final workflowProvider = ChangeNotifierProvider<WorkflowNotifier>(
  create: (context) => WorkflowNotifier(),
);
