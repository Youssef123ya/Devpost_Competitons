import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/patient.dart';
import '../../providers/patient_workflow_provider.dart';
import 'beds_monitoring_screen_enhanced.dart';

class PatientFormScreenEnhanced extends StatefulWidget {
  final Patient? initialPatient;

  const PatientFormScreenEnhanced({
    Key? key,
    this.initialPatient,
  }) : super(key: key);

  @override
  State<PatientFormScreenEnhanced> createState() =>
      _PatientFormScreenEnhancedState();
}

class _PatientFormScreenEnhancedState extends State<PatientFormScreenEnhanced> {
  late TextEditingController _nameController;
  late TextEditingController _idController;
  late TextEditingController _ageController;
  late TextEditingController _weightController;
  late TextEditingController _illnessController;
  late TextEditingController _companionPhoneController;
  late TextEditingController _nurseNameController;

  String _selectedGender = 'Male';
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.initialPatient?.name ?? '');
    _idController = TextEditingController(text: widget.initialPatient?.id ?? '');
    _ageController = TextEditingController(text: widget.initialPatient?.age.toString() ?? '');
    _weightController = TextEditingController(text: widget.initialPatient?.weight.toString() ?? '');
    _illnessController = TextEditingController(text: widget.initialPatient?.illness ?? '');
    _companionPhoneController = TextEditingController(text: widget.initialPatient?.companionPhone ?? '');
    _nurseNameController = TextEditingController(text: widget.initialPatient?.nurseName ?? '');
    _selectedGender = widget.initialPatient?.gender ?? 'Male';
  }

  @override
  void dispose() {
    _nameController.dispose();
    _idController.dispose();
    _ageController.dispose();
    _weightController.dispose();
    _illnessController.dispose();
    _companionPhoneController.dispose();
    _nurseNameController.dispose();
    super.dispose();
  }

  bool _validateForm() {
    if (_nameController.text.isEmpty) {
      _showErrorSnackBar('Please enter patient name');
      return false;
    }
    if (_idController.text.isEmpty) {
      _showErrorSnackBar('Please enter patient ID');
      return false;
    }
    if (_ageController.text.isEmpty || int.tryParse(_ageController.text) == null) {
      _showErrorSnackBar('Please enter a valid age');
      return false;
    }
    if (_weightController.text.isEmpty || double.tryParse(_weightController.text) == null) {
      _showErrorSnackBar('Please enter a valid weight');
      return false;
    }
    if (_illnessController.text.isEmpty) {
      _showErrorSnackBar('Please enter illness');
      return false;
    }
    if (_companionPhoneController.text.isEmpty) {
      _showErrorSnackBar('Please enter companion phone');
      return false;
    }
    if (_nurseNameController.text.isEmpty) {
      _showErrorSnackBar('Please enter nurse name');
      return false;
    }
    return true;
  }

  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  void _handleApprove() {
    if (!_validateForm()) return;

    setState(() => _isLoading = true);

    try {
      final patient = Patient(
        id: _idController.text,
        name: _nameController.text,
        age: int.parse(_ageController.text),
        gender: _selectedGender,
        weight: double.parse(_weightController.text),
        illness: _illnessController.text,
        companionPhone: _companionPhoneController.text,
        nurseName: _nurseNameController.text,
      );

      // Submit the patient form to the workflow provider
      context.read<PatientWorkflowProvider>().submitPatientForm(patient);

      // Navigate to beds monitoring screen
      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => const BedsMonitoringScreenEnhanced(),
          ),
        );
      }
    } catch (e) {
      _showErrorSnackBar('Error processing form: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _handleRejection() {
    context.read<PatientWorkflowProvider>().clearPendingPatient();
    Navigator.pop(context);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFEDF3FF),
      appBar: AppBar(
        backgroundColor: const Color(0xFF719EFF),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        centerTitle: true,
        title: const Text(
          "Dr. Magdy Osama",
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 22,
          ),
        ),
      ),
      body: Stack(
        children: [
          SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Name Field
                _buildFieldLabel("Name"),
                _buildTextField(_nameController, "Enter patient name"),
                const SizedBox(height: 16),

                // ID Field
                _buildFieldLabel("ID"),
                _buildTextField(_idController, "Enter patient ID"),
                const SizedBox(height: 16),

                // Age Field
                _buildFieldLabel("Age"),
                _buildTextField(
                  _ageController,
                  "Enter patient age",
                  keyboardType: TextInputType.number,
                ),
                const SizedBox(height: 16),

                // Gender Selection
                _buildFieldLabel("Gender"),
                _buildGenderSelector(),
                const SizedBox(height: 20),

                // Weight Field
                _buildFieldLabel("Weight"),
                _buildTextField(
                  _weightController,
                  "Enter weight (kg)",
                  keyboardType: TextInputType.number,
                ),
                const SizedBox(height: 16),

                // Illness Field
                _buildFieldLabel("Illness"),
                _buildTextField(_illnessController, "Enter illness"),
                const SizedBox(height: 16),

                // Companion Phone Field
                _buildFieldLabel("Companion Phone"),
                _buildTextField(
                  _companionPhoneController,
                  "Enter companion phone",
                  keyboardType: TextInputType.phone,
                ),
                const SizedBox(height: 16),

                // Nurse Name Field
                _buildFieldLabel("Nurse Name"),
                _buildTextField(_nurseNameController, "Enter nurse name"),
                const SizedBox(height: 32),

                // Action Buttons
                _buildActionButtons(),
                const SizedBox(height: 24),
              ],
            ),
          ),
          if (_isLoading)
            Container(
              color: Colors.black.withOpacity(0.3),
              child: const Center(
                child: CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF719EFF)),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildFieldLabel(String label) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Text(
        label,
        style: const TextStyle(
          color: Color(0xFF2E55A7),
          fontSize: 16,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _buildTextField(
    TextEditingController controller,
    String hint, {
    TextInputType keyboardType = TextInputType.text,
  }) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(color: Color(0xFFB0B0B0)),
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFF6B8DD6), width: 2),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFF6B8DD6), width: 2),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: Color(0xFF2E55A7), width: 2.5),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      ),
      style: const TextStyle(
        color: Color(0xFF2E55A7),
        fontSize: 14,
        fontWeight: FontWeight.w500,
      ),
    );
  }

  Widget _buildGenderSelector() {
    return Row(
      children: [
        Expanded(
          child: _buildGenderOption("Male"),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: _buildGenderOption("Female"),
        ),
      ],
    );
  }

  Widget _buildGenderOption(String gender) {
    final isSelected = _selectedGender == gender;
    return GestureDetector(
      onTap: () => setState(() => _selectedGender = gender),
      child: Container(
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF2E55A7) : Colors.white,
          border: Border.all(
            color: const Color(0xFF6B8DD6),
            width: 2,
          ),
          borderRadius: BorderRadius.circular(12),
        ),
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Checkbox(
              value: isSelected,
              onChanged: null,
              checkColor: Colors.white,
              fillColor: MaterialStateProperty.all(
                isSelected ? const Color(0xFF2E55A7) : Colors.white,
              ),
              side: const BorderSide(color: Color(0xFF6B8DD6), width: 2),
            ),
            const SizedBox(width: 4),
            Text(
              gender,
              style: TextStyle(
                color: isSelected ? Colors.white : const Color(0xFF2E55A7),
                fontWeight: FontWeight.w600,
                fontSize: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButtons() {
    return Row(
      children: [
        Expanded(
          child: ElevatedButton(
            onPressed: _isLoading ? null : _handleApprove,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF5B9EFF),
              disabledBackgroundColor: Colors.grey,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              elevation: 4,
            ),
            child: const Text(
              "Approve",
              style: TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: OutlinedButton(
            onPressed: _isLoading ? null : _handleRejection,
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: Color(0xFF719EFF), width: 2),
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: const Text(
              "Rejection",
              style: TextStyle(
                color: Color(0xFFD32F2F),
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
      ],
    );
  }
}
