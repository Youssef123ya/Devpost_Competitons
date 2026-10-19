import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/patient.dart';
import '../../providers/patient_workflow_provider.dart';
import '../../providers/bed_provider.dart';
import '../../services/api_service.dart';
import '../../widgets/patient_bed_card.dart';
import '../../widgets/empty_bed_card.dart';

class BedsMonitoringScreenEnhanced extends StatefulWidget {
  const BedsMonitoringScreenEnhanced({Key? key}) : super(key: key);

  @override
  State<BedsMonitoringScreenEnhanced> createState() =>
      _BedsMonitoringScreenEnhancedState();
}

class _BedsMonitoringScreenEnhancedState
    extends State<BedsMonitoringScreenEnhanced> {
  
  @override
  void initState() {
    super.initState();
    // ✅ IMPROVED: Use addPostFrameCallback to ensure context is available
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<BedProvider>().fetchAllBeds();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFEDF3FF),
      body: Consumer<PatientWorkflowProvider>(
        builder: (context, workflowProvider, _) {
          return Column(
            children: [
              // Header with Unit Selector and Bed Counter
              _buildHeader(context, workflowProvider),

              // Dynamic Beds Grid
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                  child: _buildBedsGrid(context, workflowProvider),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  /// Build the header with unit selector and bed counter
  Widget _buildHeader(BuildContext context, PatientWorkflowProvider provider) {
    final occupiedCount = provider.getOccupiedBedCountForSelectedUnit();
    final totalBeds = provider.getTotalBedsForSelectedUnit();

    return Container(
      color: const Color(0xFF719EFF),
      padding: EdgeInsets.only(
        top: MediaQuery.of(context).padding.top + 12,
        bottom: 16,
        left: 16,
        right: 16,
      ),
      child: Column(
        children: [
          // Back button and title
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
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Bed counter and unit selector
          Row(
            children: [
              // Bed Counter Display
              Expanded(
                flex: 1,
                child: Container(
                  decoration: BoxDecoration(
                    color: const Color(0xFF5B89D6),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 8,
                  ),
                  child: Text(
                    'Beds : $occupiedCount/$totalBeds',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),

              // Unit Selector Dropdown
              Container(
                decoration: BoxDecoration(
                  color: const Color(0xFF5B89D6),
                  borderRadius: BorderRadius.circular(10),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: DropdownButton<String>(
                  value: provider.selectedUnitName,
                  dropdownColor: const Color(0xFF5B89D6),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                  ),
                  icon: const Icon(Icons.arrow_drop_down, color: Colors.white),
                  underline: const SizedBox(),
                  items: provider.unitNames.map((unitName) {
                    return DropdownMenuItem<String>(
                      value: unitName,
                      child: Text('Unit $unitName'),
                    );
                  }).toList(),
                  onChanged: (value) {
                    if (value != null) {
                      provider.switchUnit(value);
                    }
                  },
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  /// Build the dynamic grid of beds (12 beds total)
  Widget _buildBedsGrid(
    BuildContext context,
    PatientWorkflowProvider provider,
  ) {
    // ✅ CHANGED: Use BedProvider instead of PatientWorkflowProvider
    final bedProvider = context.read<BedProvider>();
    final beds = bedProvider.beds;

    return GridView.builder(
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        childAspectRatio: 0.75,
      ),
      itemCount: beds.length,
      itemBuilder: (context, index) {
        final bed = beds[index];

        if (bed.isOccupied) {
          // ✅ CHANGED: Show bed data directly (patient info stored on bed)
          return PatientBedCard(
            patientName: bed.patientName ?? 'Unknown',
            patientAge: bed.patientAge ?? 0,
            patientIllness: bed.patientIllness ?? 'N/A',
            bedNumber: bed.bedNumber,
            nurseName: bed.nurseName,
            bedIndex: index,
            onDeletePatient: () {
              // Handle patient removal
            },
          );
        } else {
          // Empty bed - show empty bed card
          return EmptyBedCard(
            bedIndex: index,
            bedNumber: bed.bedNumber,
            onAddPatient: () {
              // Handle adding patient to bed
            },
          );
        }
      },
    );
  }

  /// Show delete confirmation dialog
  void _showDeleteConfirmationDialog(
    BuildContext context,
    Patient patient,
    int bedIndex,
    PatientWorkflowProvider provider,
  ) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Remove Patient"),
        content: Text(
          "Are you sure you want to remove ${patient.name} from this bed?",
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text("Cancel"),
          ),
          TextButton(
            onPressed: () async {
              provider.removePatientFromBed(bedIndex);
              Navigator.pop(context);
              _showSuccessSnackBar(context, "${patient.name} removed successfully");

              // ✅ CRITICAL FIX: Sync bed removal to backend
              try {
                final bedProvider = context.read<BedProvider>();
                final bedId = bedIndex + 1; // Adjust based on your bed ID scheme
                await bedProvider.removePatientFromBed(bedId);
                
                // ✅ Refresh dashboard stats after bed removal
                await ApiService.getDashboardStats();
              } catch (e) {
                debugPrint('⚠️ Backend sync failed for removal: $e');
              }
            },
            child: const Text(
              "Delete",
              style: TextStyle(color: Colors.red),
            ),
          ),
        ],
      ),
    );
  }

  /// Handle adding patient to empty bed
  void _handleAddPatientToBed(
    BuildContext context,
    int bedIndex,
    PatientWorkflowProvider provider,
  ) async {
    // Check if there's a pending patient
    if (!provider.hasPendingPatient()) {
      _showErrorSnackBar(
        context,
        "No pending patient. Please fill the patient form first.",
      );
      return;
    }

    // Assign pending patient to this bed in local state
    final success = provider.assignPendingPatientToBed(bedIndex);

    if (success) {
      _showSuccessSnackBar(
        context,
        "Patient assigned to bed $bedIndex successfully",
      );

      // ✅ CRITICAL FIX: Sync bed assignment to backend
      // Get the assigned patient's ID from the provider
      final patient = provider.pendingPatient;
      if (patient != null && patient.id.isNotEmpty) {
        try {
          // Call backend to update bed status
          // Using BedProvider to make the API call
          final bedProvider = context.read<BedProvider>();
          
          // Note: bedIndex+1 because bedIndex is 0-indexed but bed IDs might be 1-indexed
          // Adjust this based on your actual bed ID scheme
          final bedId = bedIndex + 1;
          final patientId = patient.id;
          
          await bedProvider.assignPatientToBed(bedId, int.tryParse(patientId) ?? 0);
          
          // ✅ CRITICAL FIX: Refresh dashboard stats after bed assignment
          // This ensures SuperAdminScreen shows updated bed counts
          await ApiService.getDashboardStats();
          
        } catch (e) {
          debugPrint('⚠️ Backend sync failed, but local assignment succeeded: $e');
          // Don't show error since local assignment already succeeded
        }
      }
    } else {
      _showErrorSnackBar(context, "Failed to assign patient to bed");
    }
  }

  void _showSuccessSnackBar(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.green,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  void _showErrorSnackBar(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
        duration: const Duration(seconds: 2),
      ),
    );
  }
}
