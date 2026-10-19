import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/patient.dart';
import '../../providers/medical_workflow_provider.dart';
import '../../providers/bed_provider.dart';
import '../../widgets/camera_stream_widget.dart';

class BedsMonitoringScreen extends StatefulWidget {
  const BedsMonitoringScreen({Key? key}) : super(key: key);

  @override
  State<BedsMonitoringScreen> createState() => _BedsMonitoringScreenState();
}

class _BedsMonitoringScreenState extends State<BedsMonitoringScreen> {
  @override
  void initState() {
    super.initState();
    // ✅ FIXED: Fetch beds data when screen opens
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        context.read<BedProvider>().fetchAllBeds();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFEDF3FF),
      body: Column(
        children: [
          // Header with Unit Selector
          _buildHeader(context),

          // Beds Grid
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
              child: _buildBedsGrid(context),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Container(
      color: const Color(0xFF719EFF),
      padding: EdgeInsets.only(
        top: MediaQuery.of(context).padding.top,
        bottom: 16,
        left: 16,
        right: 16,
      ),
      child: Column(
        children: [
          Row(
            children: [
              IconButton(
                icon: const Icon(Icons.arrow_back, color: Colors.white),
                onPressed: () => Navigator.pop(context),
              ),
              const Expanded(
                child: Padding(
                  padding: EdgeInsets.only(left: 8),
                  child: Text(
                    'Beds Monitoring',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              // Unit Selector Dropdown
              Expanded(
                flex: 1,
                child: Consumer<SelectedUnitNotifier>(
                  builder: (context, selectedUnitNotifier, _) {
                    return Consumer<MedicalUnitsNotifier>(
                      builder: (context, medicalUnitsNotifier, _) {
                        final unitNames =
                            medicalUnitsNotifier.getUnitNames();

                        return DropdownButton<String>(
                          value: selectedUnitNotifier.selectedUnit,
                          dropdownColor: const Color(0xFF5B89D6),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                          icon: const Icon(Icons.arrow_drop_down,
                              color: Colors.white),
                          items: unitNames.map((unitName) {
                            return DropdownMenuItem<String>(
                              value: unitName,
                              child: Text('Unit $unitName'),
                            );
                          }).toList(),
                          onChanged: (value) {
                            if (value != null) {
                              selectedUnitNotifier.selectUnit(value);
                            }
                          },
                          isExpanded: true,
                          underline: const SizedBox(),
                        );
                      },
                    );
                  },
                ),
              ),
              const SizedBox(width: 16),
              // Occupied Beds Counter
              Consumer<MedicalUnitsNotifier>(
                builder: (context, medicalUnitsNotifier, _) {
                  return Consumer<SelectedUnitNotifier>(
                    builder: (context, selectedUnitNotifier, _) {
                      final currentUnit =
                          medicalUnitsNotifier.getUnitByName(
                        selectedUnitNotifier.selectedUnit,
                      );
                      final occupiedCount = currentUnit?.patients.length ?? 0;
                      final totalBeds = currentUnit?.totalBeds ?? 12;

                      return Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 8,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.white, width: 1.5),
                        ),
                        child: Text(
                          'Beds: $occupiedCount/$totalBeds',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      );
                    },
                  );
                },
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBedsGrid(BuildContext context) {
    return Consumer<SelectedUnitNotifier>(
      builder: (context, selectedUnitNotifier, _) {
        return Consumer<MedicalUnitsNotifier>(
          builder: (context, medicalUnitsNotifier, _) {
            return Consumer<PendingPatientNotifier>(
              builder: (context, pendingPatientNotifier, _) {
                final currentUnit =
                    medicalUnitsNotifier.getUnitByName(
                  selectedUnitNotifier.selectedUnit,
                );

                if (currentUnit == null) {
                  return const Center(
                    child: Text(
                      'Unit not found',
                      style: TextStyle(color: Colors.grey, fontSize: 16),
                    ),
                  );
                }

                final bedSlots = currentUnit.generateBedSlots();

                return GridView.builder(
                  gridDelegate:
                      const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    mainAxisSpacing: 12,
                    crossAxisSpacing: 12,
                    childAspectRatio: 0.9,
                  ),
                  itemCount: bedSlots.length,
                  itemBuilder: (context, index) {
                    final patient = bedSlots[index];

                    if (patient == null) {
                      // Empty Bed Card
                      return _buildEmptyBedCard(
                        context,
                        index,
                        selectedUnitNotifier.selectedUnit,
                        pendingPatientNotifier.hasPendingPatient,
                        medicalUnitsNotifier,
                        pendingPatientNotifier,
                      );
                    } else {
                      // Occupied Bed Card
                      return _buildOccupiedBedCard(
                        context,
                        patient,
                        index,
                        selectedUnitNotifier.selectedUnit,
                        medicalUnitsNotifier,
                      );
                    }
                  },
                );
              },
            );
          },
        );
      },
    );
  }

  Widget _buildEmptyBedCard(
    BuildContext context,
    int bedIndex,
    String unitName,
    bool hasPendingPatient,
    MedicalUnitsNotifier medicalUnitsNotifier,
    PendingPatientNotifier pendingPatientNotifier,
  ) {
    return GestureDetector(
      onTap: () {
        if (hasPendingPatient) {
          final pendingPatient = pendingPatientNotifier.pendingPatient!;

          // Assign pending patient to this bed
          final success = medicalUnitsNotifier.assignPatientToBed(
            unitName: unitName,
            patient: pendingPatient,
            bedIndex: bedIndex,
          );

          if (success) {
            // Clear pending patient after assignment
            pendingPatientNotifier.clearPendingPatient();

            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                  '✅ Patient ${pendingPatient.name} assigned to Bed $bedIndex',
                ),
                backgroundColor: Colors.green,
              ),
            );
          }
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('⚠️ No pending patient to assign'),
              backgroundColor: Colors.orange,
            ),
          );
        }
      },
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: hasPendingPatient
                ? const Color(0xFFFFB800)
                : const Color(0xFF719EFF),
            width: hasPendingPatient ? 2.5 : 2,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Hospital Bed Icon
            Icon(
              Icons.bed_outlined,
              size: 48,
              color: const Color(0xFF719EFF),
            ),
            const SizedBox(height: 12),

            // No Patient Text
            const Text(
              'No Patient',
              style: TextStyle(
                color: Color(0xFF2E55A7),
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 4),
            const Text(
              'added yet',
              style: TextStyle(
                color: Colors.grey,
                fontSize: 12,
              ),
            ),
            const SizedBox(height: 12),

            // Click to Add Button
            if (hasPendingPatient)
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFB800),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text(
                  'Click to add',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildOccupiedBedCard(
    BuildContext context,
    Patient patient,
    int bedIndex,
    String unitName,
    MedicalUnitsNotifier medicalUnitsNotifier,
  ) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: const Color(0xFF719EFF),
          width: 2,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          // Camera Stream at Top
          ClipRRect(
            borderRadius: const BorderRadius.vertical(
              top: Radius.circular(14),
            ),
            child: SizedBox(
              height: 100,
              child: CameraStreamWidget(
                streamUrl: patient.cameraUrl ?? '',
                height: 100,
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(14),
                ),
              ),
            ),
          ),

          // Patient Details
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              patient.name,
                              style: const TextStyle(
                                color: Color(0xFF2E55A7),
                                fontSize: 13,
                                fontWeight: FontWeight.bold,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Age: ${patient.age}',
                              style: const TextStyle(
                                color: Colors.grey,
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ),
                      ),
                      GestureDetector(
                        onTap: () {
                          _showDeleteConfirmation(
                            context,
                            patient.name,
                            () {
                              // Perform deletion
                              medicalUnitsNotifier.removePatientFromBed(
                                unitName: unitName,
                                bedIndex: bedIndex,
                              );

                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(
                                    '✅ Patient ${patient.name} removed',
                                  ),
                                  backgroundColor: Colors.green,
                                ),
                              );

                              Navigator.pop(context);
                            },
                          );
                        },
                        child: const Icon(
                          Icons.close,
                          color: Colors.red,
                          size: 20,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Nurse: ${patient.nurseName}',
                    style: const TextStyle(
                      color: Colors.grey,
                      fontSize: 11,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'Illness: ${patient.illness}',
                    style: const TextStyle(
                      color: Colors.grey,
                      fontSize: 11,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showDeleteConfirmation(
    BuildContext context,
    String patientName,
    VoidCallback onConfirm,
  ) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Patient'),
        content: Text(
          'Are you sure you want to remove $patientName from this bed?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: onConfirm,
            style: TextButton.styleFrom(
              foregroundColor: Colors.red,
            ),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }
}
