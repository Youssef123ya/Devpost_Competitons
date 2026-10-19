import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/user_model.dart'; // ✅ تم تغيير المسار للموديل الموحد
import '../../models/app_models.dart';
import '../../providers/dashboard_provider.dart';  // ✅ ADD: Import DashboardProvider
import '../doctor/dynamic_circle_painter.dart';
import '../../providers/admission_provider.dart';
import 'patient_form_screen.dart';
import 'profile_screen.dart';
import 'occupied_beds_screen.dart';  // ✅ ADD: Import OccupiedBedsScreen

class PendingAdmissionScreen extends StatefulWidget {
  final List<AdmissionRequest> initialRequests;
  final UserModel user; // ✅ تغيير النوع لـ UserModel
  final void Function(UserModel) onUpdate; // ✅ تغيير النوع لـ UserModel

  const PendingAdmissionScreen({
    super.key,
    this.initialRequests = const [],
    required this.user,
    required this.onUpdate,
  });

  @override
  State<PendingAdmissionScreen> createState() => _PendingAdmissionScreenState();
}

class _PendingAdmissionScreenState extends State<PendingAdmissionScreen> {
  int _selectedIndex = 0;
  late UserModel _currentLocalUser; // ✅ تغيير النوع لـ UserModel

  @override
  void initState() {
    super.initState();
    _currentLocalUser = widget.user;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<AdmissionProvider>(context, listen: false).fetchPendingRequests();
    });
  }

  // دالة لتحويل الوقت من الداتابيز إلى صيغة "منذ كذا دقيقة"
  String formatTimeAgo(dynamic timeData) {
    if (timeData == null) return "Unknown time";

    try {
      // Parse datetime - handle both DateTime objects and strings
      DateTime sentTime;
      if (timeData is DateTime) {
        sentTime = timeData;
      } else {
        // Parse as UTC and convert to local time
        final parsed = DateTime.parse(timeData.toString());
        sentTime = parsed.isUtc ? parsed.toLocal() : parsed;
      }

      final now = DateTime.now();
      final difference = now.difference(sentTime);

      if (difference.inSeconds < 60) {
        return "Just now";
      } else if (difference.inMinutes < 60) {
        return "${difference.inMinutes} min ago";
      } else if (difference.inHours < 24) {
        return "${difference.inHours} hours ago";
      } else {
        return "${difference.inDays} days ago";
      }
    } catch (e) {
      return timeData.toString();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFEDF3FF),
      appBar: _selectedIndex == 1 || _selectedIndex == 2
          ? null
          : AppBar(
              backgroundColor: const Color(0xFF719EFF),
              elevation: 0,
              toolbarHeight: 110,
              centerTitle: true,
              shape: const RoundedRectangleBorder(
                borderRadius: BorderRadius.vertical(bottom: Radius.circular(28)),
              ),
              leading: IconButton(
                icon: const Icon(Icons.arrow_back, color: Colors.white, size: 28),
                onPressed: () => Navigator.pop(context),
              ),
              title: const Text(
                'Pending Admission Requests',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w900,
                  fontSize: 22,
                ),
                textAlign: TextAlign.center,
              ),
            ),
      body: IndexedStack(
        index: _selectedIndex,
        children: [
          _buildRequestsTab(),
          const OccupiedBedsScreen(),  // ✅ Middle tab
          ProfileScreen(
            user: _currentLocalUser,
            onUpdate: (updatedUser) {
              setState(() => _currentLocalUser = updatedUser);
              widget.onUpdate(updatedUser);
            },
            isEmbedded: true,
          ),
        ],
      ),
      bottomNavigationBar: _buildCurvedBottomNav(context),
    );
  }

  Widget _buildRequestsTab() {
    final admissionProvider = Provider.of<AdmissionProvider>(context);
    final requests = admissionProvider.pendingRequests.isNotEmpty
        ? admissionProvider.pendingRequests
        : widget.initialRequests;

    if (admissionProvider.isLoading && requests.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    return requests.isEmpty
        ? const Center(child: Text("No Pending Requests", style: TextStyle(color: Color(0xFF2E55A7))))
        : ListView.separated(
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 100),
      itemCount: requests.length,
      separatorBuilder: (_, __) => const SizedBox(height: 16),
      itemBuilder: (context, index) => _buildRequestCard(requests[index]),
    );
  }

  Widget _buildRequestCard(AdmissionRequest request) {
    return GestureDetector(
      onTap: () async {
        // ✅ STEP 4C: Navigate to patient form and handle result
        await Navigator.push(
          context,
          MaterialPageRoute(builder: (c) => PatientFormScreen(request: request)),
        );
        
        // ✅ Refresh dashboard and pending requests when returning
        if (mounted) {
          final dashboardProvider = context.read<DashboardProvider>();
          final admissionProvider = context.read<AdmissionProvider>();
          
          // Refresh both dashboard and pending requests list
          await Future.wait([
            dashboardProvider.refreshStats(),
            admissionProvider.fetchPendingRequests(),
          ]);
        }
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: const Color(0xFF719EFF), width: 1.5),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.08),
              blurRadius: 12,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Row 1: Doctor name (left) + Time sent (right)
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    'Dr. ${request.doctorName}',
                    style: const TextStyle(
                      color: Color(0xFF1E3A7A),
                      fontWeight: FontWeight.bold,
                      fontSize: 17,
                      letterSpacing: 0.3,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 12),
                Text(
                  'Time Sent ${formatTimeAgo(request.timeSent)}',
                  style: const TextStyle(
                    color: Color(0xFF9A9A9A),
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                  textAlign: TextAlign.right,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
            const SizedBox(height: 10),

            // Row 2: Patient Name
            Row(
              children: [
                const Text(
                  'Patient Name : ',
                  style: TextStyle(
                    color: Color(0xFF666666),
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Expanded(
                  child: Text(
                    request.patientName,
                    style: const TextStyle(
                      color: Color(0xFF2E55A7),
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCurvedBottomNav(BuildContext context) {
    double devW = MediaQuery.of(context).size.width;
    double uW = devW / 3;  // ✅ Changed from 2 to 3
    return SizedBox(
      height: 85,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          TweenAnimationBuilder<double>(
            duration: const Duration(milliseconds: 300),
            tween: Tween<double>(begin: 0, end: _selectedIndex.toDouble()),
            builder: (context, v, child) => CustomPaint(
              size: Size(devW, 85),
              painter: DynamicCirclePainter(xOffsetPercent: (v * uW + uW / 2) / devW),
            ),
          ),
          AnimatedPositioned(
            duration: const Duration(milliseconds: 300),
            left: (_selectedIndex * uW) + (uW / 2) - 28,
            top: 0,
            child: Container(
              width: 56, height: 56,
              decoration: const BoxDecoration(color: Color(0xFF7CA1FF), shape: BoxShape.circle),
              child: Icon(
                _selectedIndex == 0 ? Icons.home : _selectedIndex == 1 ? Icons.bed : Icons.person,  // ✅ Updated
                color: Colors.white, size: 28),
            ),
          ),
          Positioned(
            bottom: 15, width: devW,
            child: Row(
              children: [
                _buildNavItem(0, Icons.home_outlined),
                _buildNavItem(1, Icons.bed_outlined),  // ✅ Added middle bed icon
                _buildNavItem(2, Icons.person_outline),  // ✅ Updated index
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNavItem(int i, IconData ic) => Expanded(
    child: GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () => setState(() => _selectedIndex = i),
      child: Opacity(
        opacity: _selectedIndex == i ? 0 : 1,
        child: Icon(ic, color: Colors.white, size: 28),
      ),
    ),
  );
}