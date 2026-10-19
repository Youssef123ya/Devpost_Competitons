import 'package:flutter/material.dart';
import '../../models/patient.dart';
import '../../models/user_model.dart';

class PersonalDataScreen extends StatelessWidget {
  final dynamic patient;

  const PersonalDataScreen({super.key, required this.patient});

  static const Color _appBarBlue = Color(0xFF4D86FF);
  static const Color _backgroundBlue = Color(0xFFEAEEFF);
  static const Color _labelBlue = Color(0xFF2B4C9B);

  String _stringValue(String? value) => value != null && value.isNotEmpty ? value : '-';

  String get _name {
    if (patient is Patient) return patient.name;
    if (patient is UserModel) return patient.userName ?? '-';
    return '-';
  }

  String get _patientId {
    if (patient is Patient) return patient.id;
    if (patient is UserModel) return patient.id?.toString() ?? '-';
    return '-';
  }

  String get _age {
    if (patient is Patient) return patient.age.toString();
    if (patient is UserModel) return patient.age?.toString() ?? '-';
    return '-';
  }

  String get _gender {
    if (patient is Patient) return _stringValue(patient.gender);
    if (patient is UserModel) {
      final genderValue = patient.gender;
      if (genderValue == 1) return 'Male';
      if (genderValue == 2) return 'Female';
      return '-';
    }
    return '-';
  }

  String get _weight {
    if (patient is Patient) return patient.weight.toString();
    return '-';
  }

  String get _illness {
    if (patient is Patient) return _stringValue(patient.illness);
    if (patient is UserModel) return _stringValue(patient.specialization);
    return '-';
  }

  String get _companionPhone {
    if (patient is Patient) return _stringValue(patient.companionPhone);
    if (patient is UserModel) return _stringValue(patient.phoneNumber);
    return '-';
  }

  Widget _buildField(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            color: _labelBlue,
            fontWeight: FontWeight.bold,
            fontSize: 15,
          ),
        ),
        const SizedBox(height: 6),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Color(0xFF4D86FF), width: 1),
          ),
          child: Text(
            value.isNotEmpty ? value : '-',
            style: const TextStyle(fontSize: 15, color: Colors.black87),
          ),
        ),
        const SizedBox(height: 16),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Personal data'),
        backgroundColor: _appBarBlue,
        foregroundColor: Colors.white,
      ),
      backgroundColor: _backgroundBlue,
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            _buildField('Name', _name),
            _buildField('ID', _patientId),
            _buildField('Age', _age),
            _buildField('Gender', _gender),
            _buildField('Weight', _weight),
            _buildField('Illness', _illness),
            _buildField('Companion Phone', _companionPhone),
          ],
        ),
      ),
    );
  }
}
