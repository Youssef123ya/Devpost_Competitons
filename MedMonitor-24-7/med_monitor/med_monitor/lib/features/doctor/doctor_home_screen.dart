import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/doctor_provider.dart';
import '../../providers/bed_provider.dart';
import '../../providers/notification_provider.dart';
import '../../models/notification_model.dart';
import '../../models/user_model.dart';
import '../../widgets/custom_critical_alert.dart';
import '../../services/notification_sound_service.dart';
import 'doctor_custom_drawer.dart';
import '../../core/nav_painter.dart';
import '../../features/doctor/doctor_profile_screen.dart';
import 'doctor_tasks_screen.dart'; // ✅ تأكدي من عمل import لملف TasksScreen

class DoctorHomeScreen extends StatefulWidget {
  final UserModel user;
  final Function(UserModel) onUpdate;

  const DoctorHomeScreen({
    Key? key,
    required this.user,
    required this.onUpdate,
  }) : super(key: key);

  @override
  State<DoctorHomeScreen> createState() => _DoctorHomeScreenState();
}

class _DoctorHomeScreenState extends State<DoctorHomeScreen> {
  late UserModel currentUser;
  int _selectedIndex = 0;
  NotificationModel? _currentCriticalNotification;
  bool _isCriticalAlertDisplayed = false;

  @override
  void initState() {
    super.initState();
    debugPrint('🟣 [DoctorHomeScreen.initState] DoctorHomeScreen initialized');
    currentUser = widget.user;
    debugPrint('🟣 [DoctorHomeScreen.initState] Current doctor: ${currentUser.userName}, ID: ${currentUser.id}');

    WidgetsBinding.instance.addPostFrameCallback((_) {
      debugPrint('🟣 [DoctorHomeScreen.initState] Post-frame callback triggered');
      
      final bedProvider = Provider.of<BedProvider>(context, listen: false);
      bedProvider.fetchAllBeds();
      
      final doctorProvider = Provider.of<DoctorProvider>(context, listen: false);
      doctorProvider.fetchBedsByUnit("1");
      
      // Initialize audio for notification sounds (works around browser autoplay restrictions)
      debugPrint('🟣 [DoctorHomeScreen.initState] Initializing audio for notifications...');
      NotificationSoundService().initializeAudio();
      debugPrint('🟣 [DoctorHomeScreen.initState] ✅ Audio initialized');
      
      // Fetch notifications for this doctor
      debugPrint('🟣 [DoctorHomeScreen.initState] Getting NotificationProvider...');
      final notifProvider = Provider.of<NotificationProvider>(context, listen: false);
      final doctorId = currentUser.id;
      
      debugPrint('🟣 [DoctorHomeScreen.initState] Doctor ID: $doctorId');
      if (doctorId != null && doctorId.isNotEmpty) {
        debugPrint('🟣 [DoctorHomeScreen.initState] Calling fetchNotifications($doctorId)...');
        notifProvider.fetchNotifications(doctorId);
        debugPrint('🟣 [DoctorHomeScreen.initState] ✅ fetchNotifications() returned');
      } else {
        debugPrint('🟣 [DoctorHomeScreen.initState] ❌ Doctor ID is null or empty');
      }
    });
  }

  void _updateUser(UserModel newUser) {
    setState(() => currentUser = newUser);
    widget.onUpdate(newUser);
  }

  @override
  Widget build(BuildContext context) {
    debugPrint('🟣 [DoctorHomeScreen.build] Rebuilding...');
    final doctorProvider = Provider.of<DoctorProvider>(context);
    
    // Listen to NotificationProvider changes
    final notificationProvider = context.watch<NotificationProvider>();
    debugPrint('🟣 [DoctorHomeScreen.build] Unread notifications: ${notificationProvider.unreadCount}');
    debugPrint('🟣 [DoctorHomeScreen.build] Total notifications: ${notificationProvider.notifications.length}');

    _scheduleCriticalAlertIfNeeded(notificationProvider);

    return Scaffold(
      extendBody: true,
      backgroundColor: const Color(0xFFE9EEF6),
      drawer: _selectedIndex == 0
          ? CustomSideDrawer(
        user: currentUser,
        onUpdate: _updateUser,
        onProfileBack: () => setState(() {}),
      )
          : null,
      bottomNavigationBar: _buildCurvedBottomNav(context),
      body: doctorProvider.isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF7CA1FF)))
          : _buildBodyContent(doctorProvider, notificationProvider),
    );
  }

  // ✅ الجزء اللي طلبتي إضافته وتعديله
  Widget _buildBodyContent(DoctorProvider provider, NotificationProvider notificationProvider) {
    debugPrint('🟣 [DoctorHomeScreen._buildBodyContent] Building with index: $_selectedIndex');
    
    switch (_selectedIndex) {
      case 0:
        return _buildUnitsView(provider, notificationProvider);
      case 1:
      // ✅ استدعاء واجهة المهام المستقلة
        return const DoctorTasksScreen();
      case 2:
        return _AdmissionStatusPlaceholder(user: currentUser);
      case 3:
        return DoctorProfileScreen(
          user: currentUser,
          onUpdate: _updateUser,
        );
      default:
        return _buildUnitsView(provider, notificationProvider);
    }
  }

  Widget _buildUnitsView(DoctorProvider provider, NotificationProvider notificationProvider) {
    // ✅ Dynamic units from BedProvider instead of hardcoded
    final bedProvider = Provider.of<BedProvider>(context);
    final beds = bedProvider.beds;
    
    List<String> units = beds
        .map((bed) => bed.bedNumber.isNotEmpty ? bed.bedNumber[0] : '')
        .where((unit) => unit.isNotEmpty)
        .toSet()
        .toList()
      ..sort();
    
    if (units.isEmpty) {
      units = ['A', 'B', 'C', 'D', 'E', 'F', 'G']; // Fallback if no beds
    }

    return Column(
      children: [
        _buildHeader("Units", notificationProvider),
        const SizedBox(height: 15),
        _buildDoctorInfo(),
        const SizedBox(height: 10),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: GridView.builder(
              itemCount: units.length,
              physics: const BouncingScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                mainAxisSpacing: 15,
                crossAxisSpacing: 15,
                childAspectRatio: 0.9,
              ),
              itemBuilder: (context, index) => _buildUnitCard(context, units[index]),
            ),
          ),
        ),
        _buildAddPatientButton(context),
        const SizedBox(height: 100),
      ],
    );
  }

  Widget _buildUnitCard(BuildContext context, String unitName) {
    return InkWell(
      onTap: () {
        Navigator.pushNamed(context, '/beds', arguments: unitName);
      },
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)],
          border: Border.all(color: const Color(0xFF7CA1FF).withOpacity(0.2)),
        ),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              unitName,
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Color(0xFF3B5BB5),
              ),
            ),
            const SizedBox(height: 12),
            Expanded(
              child: Center(
                child: Image.asset(
                  'assets/unit.png',
                  fit: BoxFit.contain,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(String title, NotificationProvider notificationProvider) {
    return Container(
      height: 120,
      padding: const EdgeInsets.only(top: 40, left: 10, right: 10),
      decoration: const BoxDecoration(
        color: Color(0xFF7CA1FF),
        borderRadius: BorderRadius.vertical(bottom: Radius.circular(30)),
      ),
      child: Stack(
        children: [
          if (_selectedIndex == 0)
            Align(
              alignment: Alignment.centerLeft,
              child: Builder(
                builder: (context) => IconButton(
                  icon: const Icon(Icons.menu, color: Colors.white, size: 30),
                  onPressed: () => Scaffold.of(context).openDrawer(),
                ),
              ),
            ),
          Align(
            alignment: Alignment.center,
            child: Text(title, style: const TextStyle(color: Colors.white, fontSize: 26, fontWeight: FontWeight.bold)),
          ),
          if (_selectedIndex == 0)
            Align(
              alignment: Alignment.centerRight,
              child: InkWell(
                onTap: () => Navigator.pushNamed(context, '/notifications'),
                borderRadius: BorderRadius.circular(30),
                child: Stack(
                  clipBehavior: Clip.none,
                  children: [
                    const Padding(
                      padding: EdgeInsets.all(8.0),
                      child: Icon(Icons.notifications, color: Colors.white, size: 28),
                    ),
                    if (notificationProvider.unreadCount > 0)
                      Positioned(
                        right: 4,
                        top: 6,
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: const BoxDecoration(
                            color: Colors.red,
                            shape: BoxShape.circle,
                          ),
                          child: Text(
                            notificationProvider.unreadCount.toString(),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildDoctorInfo() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: [
          CircleAvatar(
            radius: 35,
            backgroundColor: Colors.white,
            backgroundImage: (currentUser.imageUrl != null && currentUser.imageUrl!.isNotEmpty)
                ? NetworkImage(currentUser.imageUrl!)
                : const AssetImage("assets/doctor (1).png") as ImageProvider,
          ),
          const SizedBox(width: 15),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(" ${currentUser.userName ?? 'Doctor'}",
                  style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF3B5BB5))),
              Text(currentUser.specialization ?? "Medical Specialist",
                  style: const TextStyle(fontSize: 15, color: Color(0xFF7CA1FF))),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildAddPatientButton(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
      child: SizedBox(
        width: double.infinity,
        height: 55,
        child: ElevatedButton(
          style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF7CA1FF),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15))
          ),
          onPressed: () => Navigator.pushNamed(context, '/add_patient', arguments: {'user': currentUser, 'onUpdate': _updateUser}),
          child: const Text("Add New Patient", style: TextStyle(fontSize: 18, color: Colors.white)),
        ),
      ),
    );
  }

  void _scheduleCriticalAlertIfNeeded(NotificationProvider provider) {
    final critical = _findLatestCriticalNotification(provider.notifications);
    if (critical == null) return;
    if (_isCriticalAlertDisplayed && _currentCriticalNotification?.id == critical.id) return;

    _currentCriticalNotification = critical;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      if (_isCriticalAlertDisplayed) return;
      _showCriticalAlertDialog(critical);
    });
  }

  NotificationModel? _findLatestCriticalNotification(List<NotificationModel> notifications) {
    for (final notification in notifications) {
      final alertLevel = notification.alertLevel?.toLowerCase();
      if (alertLevel == 'critical' && !notification.isRead) {
        return notification;
      }

      final title = notification.title.toLowerCase();
      if (title.contains('ai alert - critical') && !notification.isRead) {
        return notification;
      }
    }
    return null;
  }

  void _showCriticalAlertDialog(NotificationModel notification) {
    _isCriticalAlertDisplayed = true;
    showDialog(
      context: context,
      barrierDismissible: true,
      builder: (dialogContext) {
        return Dialog(
          backgroundColor: Colors.transparent,
          insetPadding: const EdgeInsets.all(12),
          child: CustomCriticalAlert(
            patientName: notification.patientName.isNotEmpty ? notification.patientName : 'Unknown Patient',
            unitName: notification.unitName?.isNotEmpty == true ? notification.unitName! : 'Unknown Unit',
            time: notification.createdAt.toLocal().toString(),
          ),
        );
      },
    ).then((_) {
      if (!mounted) return;
      setState(() {
        _isCriticalAlertDisplayed = false;
      });
      // Mark critical alert as read to prevent re-showing
      debugPrint('🔵 [DoctorHomeScreen] Marking Critical Alert as read: ${notification.id}');
      final notifProvider = Provider.of<NotificationProvider>(context, listen: false);
      notifProvider.markAsRead(notification.id);
    });
  }

  Widget _buildCurvedBottomNav(BuildContext context) {
    double deviceWidth = MediaQuery.of(context).size.width;
    double unitWidth = deviceWidth / 4; // تغيير من 3 لـ 4
    return Container(
      height: 85,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          CustomPaint(
            size: Size(deviceWidth, 85),
            painter: DynamicCirclePainter(xOffsetPercent: (_selectedIndex * unitWidth + unitWidth / 2) / deviceWidth),
          ),
          AnimatedPositioned(
            duration: const Duration(milliseconds: 400),
            left: (_selectedIndex * unitWidth) + (unitWidth / 2) - 28,
            top: 0,
            child: Container(
              decoration: const BoxDecoration(shape: BoxShape.circle, color: Color(0xFF719EFF)),
              padding: const EdgeInsets.all(10),
              child: Icon(_getIconForIndex(_selectedIndex), color: Colors.white, size: 28),
            ),
          ),
          Positioned(
            bottom: 15, width: deviceWidth,
            child: Row(
              children: [
                _buildNavItem(0, Icons.home_outlined),
                _buildNavItem(1, Icons.assignment_turned_in_outlined),
                _buildNavItem(2, Icons.request_quote_outlined),
                _buildNavItem(3, Icons.person_outline),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNavItem(int index, IconData icon) {
    return Expanded(
      child: GestureDetector(
        onTap: () => setState(() => _selectedIndex = index),
        child: Opacity(opacity: _selectedIndex == index ? 0 : 1, child: Icon(icon, color: Colors.white, size: 28)),
      ),
    );
  }

  IconData _getIconForIndex(int index) {
    if (index == 0) return Icons.home;
    if (index == 1) return Icons.assignment_turned_in;
    if (index == 2) return Icons.request_quote;
    return Icons.person;
  }
}

class _AdmissionStatusPlaceholder extends StatelessWidget {
  final UserModel user;
  const _AdmissionStatusPlaceholder({required this.user});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFEDF3FF),
      appBar: AppBar(
        backgroundColor: const Color(0xFF719EFF),
        elevation: 0,
        centerTitle: true,
        title: const Text(
          'Access Requests',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w900,
            fontSize: 22,
          ),
        ),
      ),
      body: Center(
        child: ListView(
          padding: const EdgeInsets.symmetric(vertical: 50),
          children: [
            Center(
              child: TextButton(
                onPressed: () => Navigator.pushNamed(context, '/doctor-admission-status', arguments: {
                  'user': user,
                }),
                child: const Column(
                  children: [
                    Icon(Icons.request_quote_outlined, size: 64, color: Color(0xFF719EFF)),
                    SizedBox(height: 16),
                    Text(
                      'View Access Requests',
                      style: TextStyle(
                        color: Color(0xFF719EFF),
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    SizedBox(height: 8),
                    Text(
                      'Click to view your requests status',
                      style: TextStyle(
                        color: Color(0xFF7A7A7A),
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}