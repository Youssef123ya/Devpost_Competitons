import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../models/bed.dart';
import '../../providers/bed_provider.dart';
import '../../providers/dashboard_provider.dart';

class OccupiedBedsScreen extends StatefulWidget {
  const OccupiedBedsScreen({super.key});

  @override
  State<OccupiedBedsScreen> createState() => _OccupiedBedsScreenState();
}

class _OccupiedBedsScreenState extends State<OccupiedBedsScreen> {
  static const Color _outerBg = Color(0xFFF3F8FF);
  static const Color _primaryBlue = Color(0xFF7CA1FF);
  static const Color _darkBlue = Color(0xFF1E3A6E);

  bool _isDeleting = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) context.read<BedProvider>().fetchAllBeds();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _outerBg,
      appBar: AppBar(
        backgroundColor: _primaryBlue,
        elevation: 0,
        title: const Text('Occupied Beds'),
        centerTitle: true,
      ),
      body: Consumer<BedProvider>(
        builder: (context, bedProvider, _) {
          final occupiedBeds = bedProvider.beds.where((b) => b.isOccupied).toList();

          if (bedProvider.isLoading && occupiedBeds.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          if (occupiedBeds.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.hotel_rounded, size: 80, color: Colors.grey.shade300),
                  const SizedBox(height: 16),
                  Text('No Occupied Beds', style: TextStyle(color: Colors.grey.shade600, fontSize: 18, fontWeight: FontWeight.w500)),
                ],
              ),
            );
          }

          final Map<String, List<Bed>> grouped = {};
          for (final bed in occupiedBeds) {
            final unit = (bed.bedNumber.isNotEmpty) ? bed.bedNumber[0].toUpperCase() : '?';
            grouped.putIfAbsent(unit, () => []).add(bed);
          }

          final sortedUnits = grouped.keys.toList()..sort();

          return RefreshIndicator(
            onRefresh: () => context.read<BedProvider>().fetchAllBeds(),
            child: ListView.builder(
              padding: const EdgeInsets.fromLTRB(0, 8, 0, 20),
              itemCount: sortedUnits.length,
              itemBuilder: (ctx, i) {
                final unit = sortedUnits[i];
                final beds = grouped[unit]!;
                beds.sort((a, b) => a.bedNumber.compareTo(b.bedNumber));
                return _buildUnitSection(unit, beds);
              },
            ),
          );
        },
      ),
    );
  }

  Widget _buildUnitSection(String unit, List<Bed> beds) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: CircleAvatar(
            backgroundColor: _darkBlue,
            radius: 24,
            child: Text(unit, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
          ),
        ),
        ...beds.map((bed) => _buildBedCard(bed)),
        const SizedBox(height: 12),
      ],
    );
  }

  Widget _buildBedCard(Bed bed) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: Colors.blue.shade200, width: 1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: _darkBlue,
            radius: 22,
            child: Text(bed.bedNumber, style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text('Name: ${bed.patientName ?? "—"}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500), maxLines: 1, overflow: TextOverflow.ellipsis),
                    ),
                    const SizedBox(width: 8),
                    Text('Age: ${bed.patientAge ?? "—"}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
                  ],
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    Expanded(
                      child: Text('Nurse: ${bed.nurseName ?? "—"}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: Color(0xFF5A7AAA)), maxLines: 1, overflow: TextOverflow.ellipsis),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text('Illness: ${bed.patientIllness ?? "—"}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: Color(0xFF5A7AAA)), maxLines: 1, overflow: TextOverflow.ellipsis),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          OutlinedButton(
            onPressed: _isDeleting ? null : () => _confirmDelete(bed),
            style: OutlinedButton.styleFrom(
              foregroundColor: Colors.red,
              side: const BorderSide(color: Colors.red, width: 1.5),
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
            ),
            child: const Text('Delete', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
          ),
        ],
      ),
    );
  }

  void _confirmDelete(Bed bed) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Patient'),
        content: Text('Are you sure you want to delete ${bed.patientName ?? "this patient"} from Bed ${bed.bedNumber}?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          TextButton(
            onPressed: () {
              Navigator.pop(ctx);
              _deletePatient(bed);
            },
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  Future<void> _deletePatient(Bed bed) async {
    setState(() => _isDeleting = true);

    try {
      final bedProvider = context.read<BedProvider>();
      final dashboardProvider = context.read<DashboardProvider>();

      final success = await bedProvider.removePatientFromBed(bed.id);

      if (!mounted) return;

      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Patient deleted successfully')));
        await Future.wait([
          bedProvider.fetchAllBeds(),
          dashboardProvider.refreshStats(),
        ]);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to delete patient')));
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      if (mounted) setState(() => _isDeleting = false);
    }
  }
}
