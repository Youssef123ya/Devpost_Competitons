import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/patient.dart';
import '../../providers/patient_workflow_provider.dart';
import '../../widgets/camera_stream_widget.dart';

class NoBedsuperAdminScreen extends StatefulWidget {
  final String selectedUnit;
  const NoBedsuperAdminScreen({super.key, required this.selectedUnit});

  @override
  State<NoBedsuperAdminScreen> createState() => _NoBedsuperAdminScreenState();
}

class _NoBedsuperAdminScreenState extends State<NoBedsuperAdminScreen> {
  // الألوان والتنسيقات الثابتة كما هي في كودك
  static const Color _headerBlue = Color(0xFF719EFF);
  static const Color _mainBgColor = Color(0xFFEDF3FF);
  static const Color _sharpFrameColor = Color(0xFF8DAEF2);
  static const Color _numberGrey = Color(0xFF626262);
  static const Color _redDelete = Color(0xFFE53935);

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<PatientWorkflowProvider>(context, listen: false).switchUnit(widget.selectedUnit);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _mainBgColor,
      body: Consumer<PatientWorkflowProvider>(
        builder: (context, provider, _) {
          final beds = provider.getBedsForUnit(provider.selectedUnitName);
          final occupied = provider.getOccupiedBedCountForSelectedUnit();
          final total = provider.getTotalBedsForSelectedUnit();

          return Column(
            children: [
              _buildHeader(provider, occupied, total),
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  itemCount: beds.length,
                  itemBuilder: (context, index) {
                    final bed = beds[index];
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 16),
                      child: bed.isEmpty
                          ? _buildEmptyBedCard(context, provider, index)
                          : _buildOccupiedBedCard(context, provider, bed.patient!, index),
                    );
                  },
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildHeader(PatientWorkflowProvider provider, int occupied, int total) {
    return Container(
      color: _headerBlue,
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Row(
            children: [
              GestureDetector(
                onTap: () => Navigator.pop(context),
                child: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Beds : $occupied/$total',
                      style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    DropdownButton<String>(
                      value: provider.selectedUnitName,
                      dropdownColor: _headerBlue,
                      underline: const SizedBox(),
                      icon: const Icon(Icons.arrow_drop_down, color: Colors.white),
                      style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.bold),
                      items: provider.unitNames.map((unitName) {
                        return DropdownMenuItem(value: unitName, child: Text(unitName, style: const TextStyle(color: Colors.white)));
                      }).toList(),
                      onChanged: (value) {
                        if (value != null) {
                          provider.switchUnit(value);
                        }
                      },
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // كارت السرير المشغول (مربوط بالبيانات الحقيقية)
  Widget _buildOccupiedBedCard(
    BuildContext context,
    PatientWorkflowProvider provider,
    Patient patient,
    int bedIndex,
  ) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: _sharpFrameColor, width: 2.5),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 3)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          ClipRRect(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(14)),
            child: CameraStreamWidget(
              streamUrl: patient.cameraUrl?.isNotEmpty == true
                  ? patient.cameraUrl!
                  : CameraStreamWidget.defaultCameraUrl,
              height: 160,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(14)),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(child: _buildInfoItem('Name: ', patient.name)),
                    const SizedBox(width: 10),
                    Expanded(child: _buildInfoItem('Age: ', '${patient.age}')),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(child: _buildInfoItem('Nurse: ', patient.nurseName)),
                    const SizedBox(width: 10),
                    Expanded(child: _buildInfoItem('Illness: ', patient.illness)),
                  ],
                ),
                const SizedBox(height: 14),
                Align(
                  alignment: Alignment.centerRight,
                  child: OutlinedButton(
                    onPressed: () {
                      final success = provider.deletePatientFromBed(provider.selectedUnitName, bedIndex);
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(success
                              ? 'Patient ${patient.name} deleted from bed ${bedIndex + 1}.'
                              : 'Unable to delete patient. Try again.'),
                        ),
                      );
                    },
                    style: OutlinedButton.styleFrom(
                      foregroundColor: _redDelete,
                      side: const BorderSide(color: _redDelete, width: 1.5),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                    ),
                    child: const Text('Delete patient', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyBedCard(
    BuildContext context,
    PatientWorkflowProvider provider,
    int bedIndex,
  ) {
    final pendingPatient = provider.pendingApprovedPatient;
    return InkWell(
      onTap: () {
        if (pendingPatient == null) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('No pending approved patient. Please approve a patient first.')),
          );
          return;
        }

        final success = provider.assignPatientToBed(provider.selectedUnitName, bedIndex, pendingPatient);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(success
                ? 'Patient ${pendingPatient.name} assigned to bed ${bedIndex + 1} in Unit ${provider.selectedUnitName}'
                : 'Unable to assign patient to this bed.'),
          ),
        );
      },
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: _sharpFrameColor, width: 2.5),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 3)),
          ],
        ),
        padding: const EdgeInsets.symmetric(vertical: 22, horizontal: 12),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.bed_outlined, size: 80, color: Colors.grey),
            const SizedBox(height: 12),
            const Text(
              'No Patient added yet',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.grey),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            const Text(
              'Click to add patient',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Color(0xFF4D86FF)),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoItem(String title, String value) {
    return Row(
      children: [
        Text(title, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 12)),
        Text(value, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12)),
      ],
    );
  }
}