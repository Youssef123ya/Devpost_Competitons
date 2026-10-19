import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/user_model.dart';
import '../../models/app_models.dart';
import '../../providers/admission_provider.dart';
import '../../providers/auth_provider.dart';
import '../admin/profile_screen.dart';

class DoctorAdmissionStatusScreen extends StatefulWidget {
  final UserModel user;
  final void Function(UserModel) onUpdate;

  const DoctorAdmissionStatusScreen({
    super.key,
    required this.user,
    required this.onUpdate,
  });

  @override
  State<DoctorAdmissionStatusScreen> createState() => _DoctorAdmissionStatusScreenState();
}

class _DoctorAdmissionStatusScreenState extends State<DoctorAdmissionStatusScreen> {
  late UserModel _currentLocalUser;
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocusNode = FocusNode();
  bool _isSearching = false;
  String _searchQuery = '';

  @override
  void initState() {
    super.initState();
    _currentLocalUser = widget.user;
    _searchController.addListener(() {
      setState(() {
        _searchQuery = _searchController.text.trim();
      });
    });

    WidgetsBinding.instance.addPostFrameCallback((_) {
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final authUserId = authProvider.currentUser?.id;
      final doctorId = widget.user.id ?? authUserId;
      if (doctorId != null && doctorId.isNotEmpty) {
        debugPrint('DoctorAdmissionStatusScreen: fetching requests for doctorId=$doctorId');
        Provider.of<AdmissionProvider>(context, listen: false).fetchDoctorRequests(doctorId);
      } else {
        debugPrint('DoctorAdmissionStatusScreen: no doctorId found for current doctor');
      }
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    _searchFocusNode.dispose();
    super.dispose();
  }

  Color _getStatusColor(String status) {
    if (status.toLowerCase().contains('pending')) return Colors.orange;
    if (status.toLowerCase().contains('approved')) return Colors.green;
    if (status.toLowerCase().contains('rejected')) return Colors.red;
    return Colors.grey;
  }

  IconData _getStatusIcon(String status) {
    if (status.toLowerCase().contains('pending')) return Icons.access_time;
    if (status.toLowerCase().contains('approved')) return Icons.check_circle;
    if (status.toLowerCase().contains('rejected')) return Icons.cancel;
    return Icons.info;
  }

  String formatTimeAgo(dynamic timeData) {
    if (timeData == null) return "Unknown time";
    try {
      // Parse datetime - handle both DateTime objects and strings
      DateTime sentTime;
      if (timeData is DateTime) {
        sentTime = timeData;
      } else {
        // Parse string - should already be in local time from fromJson
        // But let's be safe and handle potential UTC strings
        String timeStr = timeData.toString();
        
        // If string doesn't have timezone info, it should already be local
        // from our fromJson conversion
        sentTime = DateTime.parse(timeStr);
      }
      
      final now = DateTime.now();
      final difference = now.difference(sentTime);
      
      // DEBUG: Log time information
      debugPrint('=== TIME DEBUG ===');
      debugPrint('Raw timeData: $timeData');
      debugPrint('Parsed sentTime: $sentTime');
      debugPrint('sentTime.isUtc: ${sentTime.isUtc}');
      debugPrint('DateTime.now(): $now');
      debugPrint('Difference: ${difference.inSeconds} seconds (${difference.inMinutes} minutes, ${difference.inHours} hours)');
      
      if (difference.inSeconds < 60) {
        return "Just now";
      } else if (difference.inMinutes < 60) {
        return "${difference.inMinutes} minute${difference.inMinutes > 1 ? 's' : ''} ago";
      } else if (difference.inHours < 24) {
        return "${difference.inHours} hour${difference.inHours > 1 ? 's' : ''} ago";
      } else {
        return "${difference.inDays} day${difference.inDays > 1 ? 's' : ''} ago";
      }
    } catch (e) {
      debugPrint('formatTimeAgo error: $e');
      return timeData.toString();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFEEF0FB),
      appBar: AppBar(
        backgroundColor: const Color(0xFF719EFF),
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white, size: 24),
          onPressed: () => Navigator.pop(context),
        ),
        title: _isSearching
            ? TextField(
                controller: _searchController,
                focusNode: _searchFocusNode,
                autofocus: true,
                style: const TextStyle(color: Colors.white),
                cursorColor: Colors.white,
                decoration: const InputDecoration(
                  hintText: 'Search patient name',
                  hintStyle: TextStyle(color: Colors.white70),
                  border: InputBorder.none,
                ),
                textInputAction: TextInputAction.search,
                onSubmitted: (value) {
                  setState(() {
                    _searchQuery = value.trim();
                  });
                },
              )
            : const Text(
                'Admission Requests',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                  fontSize: 20,
                ),
              ),
        actions: [
          IconButton(
            tooltip: 'Search by patient name',
            icon: Icon(_isSearching ? Icons.close : Icons.search, color: Colors.white, size: 24),
            onPressed: () {
              setState(() {
                if (_isSearching) {
                  _searchController.clear();
                  _searchQuery = '';
                } else {
                  WidgetsBinding.instance.addPostFrameCallback((_) {
                    if (mounted) {
                      _searchFocusNode.requestFocus();
                    }
                  });
                }
                _isSearching = !_isSearching;
              });
            },
          ),
        ],
      ),
      body: _buildRequestsTab(),
    );
  }

  Widget _buildRequestsTab() {
    return Consumer<AdmissionProvider>(
      builder: (context, admissionProvider, child) {
        final requests = admissionProvider.myRequests;

        if (admissionProvider.isLoading && requests.isEmpty) {
          return const Center(child: CircularProgressIndicator());
        }

        final filteredRequests = _searchQuery.isEmpty
            ? requests
            : requests.where((request) {
                final patientName = request.patientName.toLowerCase();
                return patientName.contains(_searchQuery.toLowerCase());
              }).toList();

        if (filteredRequests.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.search_off, size: 64, color: Colors.grey[400]),
                const SizedBox(height: 16),
                Text(
                  _searchQuery.isEmpty ? "No admission requests yet" : "No requests found for '$_searchQuery'",
                  textAlign: TextAlign.center,
                  style: const TextStyle(color: Color(0xFF2E55A7), fontSize: 16),
                ),
              ],
            ),
          );
        }

        return RefreshIndicator(
          onRefresh: () {
            final authUserId = Provider.of<AuthProvider>(context, listen: false).currentUser?.id;
            final doctorId = widget.user.id ?? authUserId;
            return Provider.of<AdmissionProvider>(context, listen: false).fetchDoctorRequests(doctorId ?? "");
          },
          child: ListView.separated(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 20),
            itemCount: filteredRequests.length,
            separatorBuilder: (_, __) => const SizedBox(height: 12),
            itemBuilder: (context, index) => _buildRequestCard(filteredRequests[index]),
          ),
        );
      },
    );
  }

  Widget _buildRequestCard(AdmissionRequest request) {
    final statusColor = _getStatusColor(request.status);
    final statusIcon = _getStatusIcon(request.status);
    final statusText = request.statusLabel;

    return Card(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: statusColor, width: 1.5),
      ),
      color: Colors.white,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status icon and info row
            Row(
              children: [
                CircleAvatar(
                  backgroundColor: statusColor.withOpacity(0.15),
                  radius: 22,
                  child: Icon(
                    statusIcon,
                    color: statusColor,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        statusText,
                        style: TextStyle(
                          color: statusColor,
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        formatTimeAgo(request.timeSent),
                        style: const TextStyle(
                          color: Colors.grey,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              'Patient Name',
              style: TextStyle(
                color: Colors.black54,
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              request.patientName,
              style: const TextStyle(
                color: Color(0xFF2B4C9B),
                fontWeight: FontWeight.bold,
                fontSize: 15,
              ),
            ),
          ],
        ),
      ),
    );
  }


}
