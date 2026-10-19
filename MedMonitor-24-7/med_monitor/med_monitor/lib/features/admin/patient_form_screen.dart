import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/app_models.dart';
import '../../models/patient.dart';
import '../../models/bed.dart';  // ✅ NEW: Import Bed model for selection dialog
import '../../providers/admission_provider.dart';
import '../../providers/patient_workflow_provider.dart';
import '../../providers/dashboard_provider.dart';  // ✅ ADD: Import DashboardProvider
import '../../providers/bed_provider.dart';  // ✅ NEW: Import BedProvider
import '../../widgets/camera_stream_widget.dart';

class PatientFormScreen extends StatefulWidget {
  final AdmissionRequest request;
  const PatientFormScreen({super.key, required this.request});

  @override
  State<PatientFormScreen> createState() => _PatientFormScreenState();
}

class _PatientFormScreenState extends State<PatientFormScreen> {
  String _selectedGender = 'Male';

  @override
  void initState() {
    super.initState();
    _selectedGender = (widget.request.gender != null && widget.request.gender!.isNotEmpty)
        ? widget.request.gender!
        : "Male";
  }

  @override
  void dispose() {
    super.dispose();
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
        title: Text(
          "Dr. ${widget.request.doctorName}",
          style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 22),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 25, vertical: 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ✅ Name
            _buildLabel("Name"),
            _buildDisplayField(widget.request.patientName ?? "N/A"),
            const SizedBox(height: 18),

            // ✅ ID
            _buildLabel("ID"),
            _buildDisplayField(widget.request.patientId ?? "N/A"),
            const SizedBox(height: 18),

            // ✅ Age
            _buildLabel("Age"),
            _buildDisplayField(widget.request.age ?? "N/A"),
            const SizedBox(height: 18),

            // ✅ Gender
            _buildLabel("Gender"),
            Row(
              children: [
                Checkbox(
                  value: _selectedGender == "Male" || _selectedGender == "ذكر",
                  onChanged: null,
                  checkColor: Colors.white,
                  fillColor: MaterialStateProperty.all(const Color(0xFF2E55A7)),
                  side: const BorderSide(color: Color(0xFF6B8DD6), width: 2),
                ),
                const Text("Male", style: TextStyle(color: Color(0xFF2E55A7), fontWeight: FontWeight.w600, fontSize: 15)),
                const SizedBox(width: 50),
                Checkbox(
                  value: _selectedGender == "Female" || _selectedGender == "أنثى",
                  onChanged: null,
                  checkColor: Colors.white,
                  fillColor: MaterialStateProperty.all(const Color(0xFF2E55A7)),
                  side: const BorderSide(color: Color(0xFF6B8DD6), width: 2),
                ),
                const Text("Female", style: TextStyle(color: Color(0xFF2E55A7), fontWeight: FontWeight.w600, fontSize: 15)),
              ],
            ),
            const SizedBox(height: 22),

            // ✅ Weight
            _buildLabel("Weight"),
            _buildDisplayField(widget.request.weight?.toString() ?? "N/A"),
            const SizedBox(height: 18),

            // ✅ Illness
            _buildLabel("Illness"),
            _buildDisplayField(widget.request.illness ?? "N/A"),
            const SizedBox(height: 18),

            // ✅ Companion Phone
            _buildLabel("Companion Phone"),
            _buildDisplayField(widget.request.companionPhone ?? "N/A"),
            const SizedBox(height: 18),

            // ✅ Nurse Name
            _buildLabel("Nurse Name"),
            _buildDisplayField(widget.request.nurseName ?? "N/A"),
            const SizedBox(height: 30),

            // ✅ Approve and Reject Buttons
            Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    onPressed: () async {
                      if (widget.request.id == null) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text("Error: Request ID is missing")),
                        );
                        return;
                      }

                      // ✅ STEP 1: Fetch all beds from server
                      await context.read<BedProvider>().fetchAllBeds();
                      
                      // ✅ STEP 2: Get available beds grouped by unit
                      final availableBeds = context.read<BedProvider>().getAvailableBeds();
                      
                      if (availableBeds.isEmpty) {
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text("No available beds at the moment")),
                          );
                        }
                        return;
                      }

                      // ✅ STEP 3: Show bed selection dialog grouped by unit
                      final selectedBed = await _showBedSelectionDialog(context, availableBeds);
                      
                      if (selectedBed == null) {
                        return; // User cancelled
                      }

                      _showLoading();

                      final patient = _buildPatientFromRequest();
                      final workflowProvider = context.read<PatientWorkflowProvider>();
                      workflowProvider.approvePendingPatient(patient);

                      final admissionProvider = context.read<AdmissionProvider>();
                      
                      // ✅ STEP 4: Approve with SPECIFIC bed ID chosen by admin
                      final bool success = await admissionProvider.respondToRequest(
                        widget.request.id!.toString(),
                        'approved',
                        '',
                        bedId: selectedBed.id,  // ← Pass the specific bed ID
                      );

                      // ✅ STEP 5: Refresh everything after approval
                      if (mounted) {
                        final dashboardProvider = context.read<DashboardProvider>();
                        final bedProvider = context.read<BedProvider>();
                        
                        await dashboardProvider.refreshStats(delay: const Duration(milliseconds: 1000));
                        await bedProvider.fetchAllBeds();
                      }

                      if (mounted) Navigator.pop(context);

                      if (!success && mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: const Text('Server sync failed. Patient approved locally.'),
                            backgroundColor: Colors.orange,
                            duration: const Duration(seconds: 2),
                          ),
                        );
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF5B9EFF),
                      padding: const EdgeInsets.symmetric(vertical: 13),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      elevation: 3,
                    ),
                    child: const Text("Approve", style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                  ),
                ),
                const SizedBox(width: 16),

                Expanded(
                  child: OutlinedButton(
                    onPressed: () async {
                      if (widget.request.id == null) return;
                      _showLoading();

                      final admissionProvider = context.read<AdmissionProvider>();
                      final bool success = await admissionProvider.respondToRequest(widget.request.id!, 'rejected', '');

                      // ✅ STEP 4B: Refresh dashboard stats after rejection
                      if (mounted) {
                        final dashboardProvider = context.read<DashboardProvider>();
                        final bedProvider = context.read<BedProvider>();
                        
                        await dashboardProvider.refreshStats(delay: const Duration(milliseconds: 1000));
                        // ✅ NEW: Also refresh beds list for consistency
                        await bedProvider.fetchAllBeds();
                      }

                      if (mounted) Navigator.pop(context);

                      if (success) {
                        if (mounted) {
                          Provider.of<PatientWorkflowProvider>(context, listen: false).clearPendingPatient();
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text("Request rejected successfully")),
                          );
                          Navigator.pop(context);
                        }
                      } else {
                        if (mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text("Failed to reject. Try again later.")),
                          );
                        }
                      }
                    },
                    style: OutlinedButton.styleFrom(
                      backgroundColor: Colors.white,
                      side: const BorderSide(color: Color(0xFF719EFF), width: 2),
                      padding: const EdgeInsets.symmetric(vertical: 13),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text("Rejection", style: TextStyle(color: Colors.red, fontSize: 16, fontWeight: FontWeight.bold)),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Patient _buildPatientFromRequest() {
    return Patient(
      id: widget.request.patientId ?? widget.request.phone ?? '0',
      name: widget.request.patientName,
      age: int.tryParse(widget.request.age ?? '') ?? 0,
      gender: _selectedGender,
      weight: double.tryParse(widget.request.weight ?? '') ?? 0,
      illness: widget.request.illness ?? '',
      companionPhone: widget.request.companionPhone ?? '',
      nurseName: widget.request.nurseName ?? '',
      cameraUrl: CameraStreamWidget.defaultCameraUrl,
    );
  }

  // ✅ NEW: Bed selection dialog with grouping by unit
  Future<Bed?> _showBedSelectionDialog(BuildContext context, List<Bed> availableBeds) async {
    final bedProvider = context.read<BedProvider>();
    List<Bed> currentAvailableBeds = List.of(availableBeds);

    String getNextUnitLetter() {
      final units = bedProvider.beds
          .map((b) => b.bedNumber.isNotEmpty ? b.bedNumber[0] : '')
          .where((unit) => unit.isNotEmpty)
          .toSet()
          .toList()
        ..sort();

      if (units.isEmpty) return 'A';
      final nextCode = units.last.codeUnitAt(0) + 1;
      return String.fromCharCode(nextCode <= 90 ? nextCode : 90);
    }

    Map<String, List<Bed>> groupBeds(List<Bed> beds) {
      final grouped = <String, List<Bed>>{};
      for (final bed in beds) {
        final unit = bed.bedNumber.isNotEmpty ? bed.bedNumber[0] : 'Unknown';
        grouped.putIfAbsent(unit, () => []).add(bed);
      }
      return grouped;
    }

    Future<void> refreshAvailableBeds(StateSetter dialogSetState) async {
      await bedProvider.fetchAllBeds();
      currentAvailableBeds = bedProvider.getAvailableBeds();
      dialogSetState(() {});
    }

    return await showDialog<Bed>(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (dialogContext, dialogSetState) {
            final bedsByUnit = groupBeds(currentAvailableBeds);
            final sortedUnits = bedsByUnit.keys.toList()..sort();
            final nextUnitLetter = getNextUnitLetter();

            return AlertDialog(
              title: const Text('Select Available Bed'),
              contentPadding: const EdgeInsets.all(16),
              content: SizedBox(
                width: double.maxFinite,
                height: 460,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: ListView(
                        children: [
                          for (final unit in sortedUnits) ...[
                            Padding(
                              padding: const EdgeInsets.fromLTRB(8, 12, 8, 8),
                              child: Text(
                                'Unit $unit (${bedsByUnit[unit]!.length} available)',
                                style: const TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                  color: Color(0xFF2E55A7),
                                ),
                              ),
                            ),
                            ...bedsByUnit[unit]!.map((bed) => ListTile(
                                  leading: Icon(Icons.bed, color: Colors.green[700]),
                                  title: Text(
                                    'Bed ${bed.bedNumber}',
                                    style: const TextStyle(fontWeight: FontWeight.w600),
                                  ),
                                  subtitle: Text('Unit $unit'),
                                  trailing: Chip(
                                    label: const Text('Available'),
                                    backgroundColor: Colors.green[100],
                                    labelStyle: const TextStyle(color: Colors.green),
                                  ),
                                  onTap: () => Navigator.pop(ctx, bed),
                                )),
                            const Divider(height: 8),
                          ],
                          const SizedBox(height: 8),
                          ListTile(
                            leading: const CircleAvatar(
                              backgroundColor: Color(0xFF2E55A7),
                              child: Icon(Icons.add, color: Colors.white),
                            ),
                            title: const Text('Add New Unit'),
                            subtitle: Text('Creates Unit $nextUnitLetter with 12 beds'),
                            onTap: () async {
                              await _addNewUnit(context, dialogSetState);
                              await refreshAvailableBeds(dialogSetState);
                            },
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('Cancel'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  Future<void> _addNewUnit(BuildContext context, StateSetter dialogSetState) async {
    final bedProvider = context.read<BedProvider>();
    final units = bedProvider.beds
        .map((b) => b.bedNumber.isNotEmpty ? b.bedNumber[0] : '')
        .where((unit) => unit.isNotEmpty)
        .toSet()
        .toList()
      ..sort();

    final nextUnit = units.isEmpty ? 'A' : String.fromCharCode(units.last.codeUnitAt(0) + 1);
    if (nextUnit.isEmpty) return;

    for (var i = 1; i <= 12; i++) {
      try {
        await bedProvider.createBed('$nextUnit$i');
      } catch (e) {
        debugPrint('Failed to create bed $nextUnit$i: $e');
      }
    }

    await bedProvider.fetchAllBeds();
    dialogSetState(() {});

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Unit $nextUnit created with 12 beds ✅')),
      );
    }
  }

  void _showLoading() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(child: CircularProgressIndicator(color: Color(0xFF719EFF))),
    );
  }

  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8, left: 2),
      child: Text(
        text,
        style: const TextStyle(color: Color(0xFF2E55A7), fontWeight: FontWeight.w700, fontSize: 15),
      ),
    );
  }

  Widget _buildDisplayField(String value) {
    return Container(
      decoration: BoxDecoration(
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.08), blurRadius: 8, offset: const Offset(0, 2)),
        ],
      ),
      child: TextField(
        readOnly: true,
        controller: TextEditingController(text: value),
        decoration: InputDecoration(
          filled: true,
          fillColor: Colors.white,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: Color(0xFF6B8DD6), width: 1.5),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: Color(0xFF6B8DD6), width: 1.5),
          ),
          disabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: Color(0xFF6B8DD6), width: 1.5),
          ),
        ),
        style: const TextStyle(fontSize: 15, color: Colors.black87, fontWeight: FontWeight.w500),
      ),
    );
  }

  Widget _buildReadOnlyField(TextEditingController controller) {
    return Container(
      decoration: BoxDecoration(
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: TextField(
        controller: controller,
        readOnly: true,
        decoration: InputDecoration(
          filled: true,
          fillColor: Colors.grey[100],
          contentPadding: const EdgeInsets.symmetric(horizontal: 15, vertical: 12),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: Color(0xFF719EFF), width: 1),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(12),
            borderSide: const BorderSide(color: Color(0xFF2E55A7), width: 2),
          ),
        ),
        style: const TextStyle(fontSize: 15, color: Colors.black87, fontWeight: FontWeight.w500),
      ),
    );
  }
}