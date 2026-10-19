import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/bed_provider.dart';
import '../../providers/admission_provider.dart';
import '../../models/bed.dart';
import '../../models/patient.dart';
import '../../widgets/camera_stream_widget.dart';
import '../../features/doctor/patient_details_screen.dart';

class BedsScreen extends StatefulWidget {
  const BedsScreen({super.key});

  @override
  State<BedsScreen> createState() => _BedsScreenState();
}

class _BedsScreenState extends State<BedsScreen> {
  // ✅ NEW: Track loading state to prevent race condition
  bool _admissionRequestsLoaded = false;
  List<dynamic>? _cachedAdmissionRequests;

  @override
  void initState() {
    super.initState();
    // ✅ FIXED: Properly await admission requests before allowing navigation
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      if (mounted) {
        // Fetch beds
        await context.read<BedProvider>().fetchAllBeds();
        debugPrint('✅ Beds fetched');
        
        // Fetch and cache admission requests
        if (!_admissionRequestsLoaded) {
          debugPrint('🔄 Fetching admission requests...');
          await context.read<AdmissionProvider>().fetchAllAdmissionRequests();
          _cachedAdmissionRequests = context.read<AdmissionProvider>().allAdmissionRequests;
          debugPrint('✅ Admission requests loaded (${_cachedAdmissionRequests?.length ?? 0} records)');
          
          if (mounted) {
            setState(() {
              _admissionRequestsLoaded = true;
            });
          }
        }
      }
    });
  }

  /// Get GUID from AdmissionRequest by patient name
  /// Checks cache first, then falls back to provider
  String _getPatientGuid(BuildContext context, String patientName, String fallbackId) {
    // Use cached requests if available, otherwise get from provider
    final admissionReqs = _cachedAdmissionRequests ?? 
                         context.read<AdmissionProvider>().allAdmissionRequests;
    
    // Normalize the bed patient name for comparison
    final normalizedBedName = (patientName ?? '').trim().toLowerCase();
    debugPrint('🔍 Looking for GUID match for: "$patientName" (normalized: "$normalizedBedName")');
    debugPrint('   Using ${_cachedAdmissionRequests != null ? "CACHED" : "LIVE"} admission requests (count: ${admissionReqs.length})');
    
    // Find matching admission request by patient name (case-insensitive, trimmed)
    for (var req in admissionReqs) {
      final normalizedReqName = (req.patientName ?? '').trim().toLowerCase();

      if (normalizedBedName.isNotEmpty && normalizedReqName.isNotEmpty) {
        if (normalizedBedName == normalizedReqName) {
          if (req.patientId != null && req.patientId!.isNotEmpty) {
            // Return the admission request's patientId (should be the GUID)
            debugPrint('✅ Found patientId for "$patientName" from admission request: ${req.patientId}');
            return req.patientId!;
          } else {
            debugPrint('⚠️ Found matching name "$normalizedReqName" but no patientId field');
          }
        }
      }
    }
    
    // Log all available admission requests for debugging
    debugPrint('❌ No GUID found for "$patientName"');
    if (admissionReqs.isEmpty) {
      debugPrint('  → No admission requests in cache/provider');
    } else {
      debugPrint('  → Available admission requests (first 10):');
      for (var req in admissionReqs.take(10)) {
        final normalized = (req.patientName ?? '').trim().toLowerCase();
        debugPrint('     - "${req.patientName}" (normalized: "$normalized") → ID: ${req.patientId}');
      }
    }
    
    // Fallback to bed.patientId if admission request not found
    debugPrint('  → Falling back to bed.patientId: $fallbackId');
    return fallbackId;
  }

  @override
  Widget build(BuildContext context) {
    final args = ModalRoute.of(context)?.settings.arguments;
    final String unitName = args != null ? args.toString() : 'Unknown';

    return Scaffold(
      backgroundColor: const Color(0xFFEDF3FF),
      body: Column(
        children: [
          _buildHeader(context, unitName),
          Expanded(
            child: Consumer<BedProvider>(
              builder: (context, bedProvider, child) {
                // ✅ FIXED: Show ALL beds for this unit (occupied + available)
                final allUnitBeds = bedProvider.beds
                    .where((bed) => bed.bedNumber.startsWith(unitName))
                    .toList();
                
                // Sort by bed number for consistent order
                allUnitBeds.sort((a, b) => a.bedNumber.compareTo(b.bedNumber));

                if (bedProvider.isLoading) {
                  return const Center(child: CircularProgressIndicator());
                }

                if (allUnitBeds.isEmpty) {
                  return _buildEmptyBedsState(unitName);
                }

                return ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  itemCount: allUnitBeds.length,
                  itemBuilder: (context, index) {
                    final bed = allUnitBeds[index];
                    // ✅ FIXED: Show different card based on bed status
                    if (bed.status == 1) {
                      // Occupied bed with patient info
                      // ✅ NEW: Wrap with GestureDetector for navigation to patient details
                      return GestureDetector(
                        onTap: () async {
                          // ✅ FIXED: Ensure admission requests are loaded before navigating
                          if (!_admissionRequestsLoaded) {
                            if (!mounted) return;
                            
                            // Show loading dialog
                            showDialog(
                              context: context,
                              barrierDismissible: false,
                              builder: (dialogContext) => AlertDialog(
                                title: const Text('Loading...'),
                                content: const SizedBox(
                                  height: 50,
                                  child: Center(child: CircularProgressIndicator()),
                                ),
                              ),
                            );
                            
                            // Wait for admission requests to load
                            debugPrint('⏳ Waiting for admission requests to load...');
                            await context.read<AdmissionProvider>().fetchAllAdmissionRequests();
                            _cachedAdmissionRequests = context.read<AdmissionProvider>().allAdmissionRequests;
                            debugPrint('✅ Admission requests now loaded (${_cachedAdmissionRequests?.length ?? 0} records)');
                            
                            if (mounted) {
                              setState(() {
                                _admissionRequestsLoaded = true;
                              });
                              Navigator.pop(context); // Close loading dialog
                            }
                          }
                          
                          if (!mounted) return;
                          
                          // ✅ FIXED: Get GUID from AdmissionRequest instead of using National ID from Bed
                          final patientGuid = _getPatientGuid(
                            context,
                            bed.patientName ?? 'Unknown',
                            bed.patientId ?? '',
                          );

                          // Create Patient object from bed data for navigation
                          final patient = Patient(
                            id: patientGuid,  // ✅ Use GUID instead of National ID
                            name: bed.patientName ?? 'Unknown',
                            age: bed.patientAge ?? 0,
                            gender: bed.gender ?? 'N/A',
                            weight: (bed.weight ?? 0).toDouble(),
                            illness: bed.patientIllness ?? 'N/A',
                            companionPhone: bed.companionPhone ?? '',
                            nurseName: bed.nurseName ?? 'N/A',
                            assignedBedIndex: null,
                            cameraUrl: CameraStreamWidget.defaultCameraUrl,
                          );
                          
                          debugPrint('📱 Navigating to patient details: ${patient.name} (GUID: ${patient.id})');
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => PatientDetailScreen(patient: patient),
                            ),
                          );
                        },
                        child: OccupiedBedCard(bed: bed),
                      );
                    } else {
                      // Available bed - show empty card
                      return AvailableBedCard(bed: bed);
                    }
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context, String unit) {
    return Consumer<BedProvider>(
      builder: (context, bedProvider, child) {
        // ✅ FIXED: Get ALL beds for this unit
        final allUnitBeds = bedProvider.beds
            .where((bed) => bed.bedNumber.startsWith(unit))
            .toList();
        
        // Count only occupied beds
        final occupiedCount = allUnitBeds.where((bed) => bed.status == 1).length;
        
        // Total should always be 12 per unit (or less if unit not full in DB)
        final totalCount = allUnitBeds.length;

        return Container(
          width: double.infinity,
          color: const Color(0xFF719EFF),
          child: SafeArea(
            bottom: false,
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 8),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back, color: Colors.white),
                    onPressed: () => Navigator.pop(context),
                  ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Unit $unit',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Beds: $occupiedCount / $totalCount',
                          style: const TextStyle(color: Colors.white70, fontSize: 14),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildEmptyBedsState(String unitName) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.bed_outlined, size: 80, color: Colors.grey),
          const SizedBox(height: 14),
          Text(
            'No occupied beds in Unit $unitName',
            style: const TextStyle(color: Colors.grey, fontSize: 16),
          ),
          const SizedBox(height: 8),
          const Text(
            'Assign patients to see live camera feeds here.',
            style: TextStyle(color: Colors.grey, fontSize: 14),
          ),
        ],
      ),
    );
  }
}

class OccupiedBedCard extends StatelessWidget {
  final Bed bed;

  const OccupiedBedCard({
    super.key,
    required this.bed,
  });

  @override
  Widget build(BuildContext context) {
    final streamUrl = CameraStreamWidget.defaultCameraUrl;

    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: const [
          BoxShadow(color: Color.fromRGBO(0, 0, 0, 0.05), blurRadius: 10, offset: Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          ClipRRect(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
            child: CameraStreamWidget(
              streamUrl: streamUrl,
              height: 180,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        'Bed ${bed.bedNumber}',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF2E55A7),
                        ),
                      ),
                    ),
                    DecoratedBox(
                      decoration: BoxDecoration(
                        color: const Color(0xFFE6F0FF),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        child: Text(
                          'Occupied',
                          style: TextStyle(
                            color: Color(0xFF2E55A7),
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                _infoRow('Patient', bed.patientName ?? 'Unknown'),
                const SizedBox(height: 8),
                _infoRow('Age', '${bed.patientAge ?? 'N/A'}'),
                const SizedBox(height: 8),
                _infoRow('Nurse', bed.nurseName ?? 'N/A'),
                const SizedBox(height: 8),
                _infoRow('Illness', bed.patientIllness ?? 'N/A'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _infoRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(
            color: Color(0xFF626262),
            fontWeight: FontWeight.w500,
          ),
        ),
        Text(
          value,
          style: const TextStyle(
            fontWeight: FontWeight.bold,
            color: Color(0xFF2E55A7),
          ),
        ),
      ],
    );
  }
}

// ✅ NEW: AvailableBedCard for empty beds
class AvailableBedCard extends StatelessWidget {
  final Bed bed;

  const AvailableBedCard({
    super.key,
    required this.bed,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: const Color(0xFF719EFF),
          width: 2,
        ),
        boxShadow: const [
          BoxShadow(color: Color.fromRGBO(0, 0, 0, 0.05), blurRadius: 10, offset: Offset(0, 4)),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    'Bed ${bed.bedNumber}',
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF2E55A7),
                    ),
                  ),
                ),
                DecoratedBox(
                  decoration: BoxDecoration(
                    color: const Color(0xFFE6F2FF),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    child: Text(
                      'Available',
                      style: TextStyle(
                        color: Color(0xFF719EFF),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            Center(
              child: Column(
                children: [
                  Icon(
                    Icons.bed_outlined,
                    size: 50,
                    color: const Color(0xFF719EFF).withOpacity(0.5),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Ready for patient',
                    style: TextStyle(
                      color: const Color(0xFF719EFF).withOpacity(0.7),
                      fontSize: 14,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}