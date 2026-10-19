import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'dart:math' as math;
import '../../core/nav_painter.dart';
import '../../models/user_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/nurse_provider.dart';
import '../../providers/bed_provider.dart';
import '../../providers/notification_provider.dart';
import '../../services/notification_sound_service.dart';
import 'nurse_custom_drawer.dart';
import 'nurse_profile_screen.dart';
import 'nurse_tasks_screen_new.dart';
import 'notifications_screen.dart';

class NurseHomeScreen extends StatefulWidget {
  final UserModel user;
  final Function(UserModel) onUpdate;

  const NurseHomeScreen({
    Key? key,
    required this.user,
    required this.onUpdate,
  }) : super(key: key);

  @override
  State<NurseHomeScreen> createState() => _NurseHomeScreenState();
}

class _NurseHomeScreenState extends State<NurseHomeScreen> {
  int _selectedIndex = 0;

  @override
  void initState() {
    super.initState();
    debugPrint('🟡 [NurseHomeScreen.initState] NurseHomeScreen initialized');
    debugPrint('🟡 [NurseHomeScreen.initState] Current nurse: ${widget.user.userName}, ID: ${widget.user.id}');
    
    // ✅ Fetch beds first to dynamically get units
    WidgetsBinding.instance.addPostFrameCallback((_) {
      debugPrint('🟡 [NurseHomeScreen.initState] Post-frame callback triggered');
      
      final bedProvider = Provider.of<BedProvider>(context, listen: false);
      bedProvider.fetchAllBeds();
      
      // ✅ Also fetch units via nurse provider
      Provider.of<NurseProvider>(context, listen: false).fetchAllUnits();
      
      // Initialize audio for notification sounds (works around browser autoplay restrictions)
      debugPrint('🟡 [NurseHomeScreen.initState] Initializing audio for notifications...');
      NotificationSoundService().initializeAudio();
      debugPrint('🟡 [NurseHomeScreen.initState] ✅ Audio initialized');
      
      // 🔔 Fetch notifications for this nurse
      debugPrint('🟡 [NurseHomeScreen.initState] Getting NotificationProvider...');
      final notifProvider = Provider.of<NotificationProvider>(context, listen: false);
      final nurseId = widget.user.id;
      
      debugPrint('🟡 [NurseHomeScreen.initState] Nurse ID: $nurseId');
      String effectiveNurseId = nurseId ?? '';
      if (effectiveNurseId.isEmpty) {
        final authUserId = Provider.of<AuthProvider>(context, listen: false).currentUser?.id ?? '';
        effectiveNurseId = authUserId;
        debugPrint('🟡 [NurseHomeScreen.initState] nurseId was empty, fallback to authProvider.currentUser.id=$effectiveNurseId');
      }

      if (effectiveNurseId.isNotEmpty) {
        debugPrint('🟡 [NurseHomeScreen.initState] Calling fetchNotifications($effectiveNurseId)...');
        notifProvider.fetchNotifications(effectiveNurseId);
        if (kIsWeb) {
          notifProvider.startAutoRefresh(effectiveNurseId);
        }
        debugPrint('🟡 [NurseHomeScreen.initState] ✅ fetchNotifications() returned');
      } else {
        debugPrint('🟡 [NurseHomeScreen.initState] ❌ Effective nurse ID is still empty');
      }
    });
  }

  @override
  void dispose() {
    Provider.of<NotificationProvider>(context, listen: false).stopAutoRefresh();
    super.dispose();
  }

  void _handleUserUpdate(UserModel newUser) {
    widget.onUpdate(newUser);
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    debugPrint('🟡 [NurseHomeScreen.build] Rebuilding...');
    
    // Listen to NotificationProvider changes
    final notificationProvider = context.watch<NotificationProvider>();
    debugPrint('🟡 [NurseHomeScreen.build] Unread notifications: ${notificationProvider.unreadCount}');
    debugPrint('🟡 [NurseHomeScreen.build] Total notifications: ${notificationProvider.notifications.length}');
    
    return Scaffold(
      extendBody: true,
      backgroundColor: const Color(0xFFE9EEF6),
      // الدرور يظهر فقط في الشاشة الرئيسية (Units)
      drawer: _selectedIndex == 0
          ? CustomSideDrawer(
        user: widget.user,
        onUpdate: _handleUserUpdate,
        onProfileBack: () => setState(() {}),
      )
          : null,
      bottomNavigationBar: _buildCurvedBottomNav(context),
      body: _buildBodyContent(context),
    );
  }

  Widget _buildBodyContent(BuildContext context) {
    switch (_selectedIndex) {
      case 0:
        return _buildUnitsView(context);
      case 1:
      // ✅ تم تمرير الـ nurseId لحل إيرور "1 positional argument expected"
        return NurseTasksScreen(nurseId: widget.user.id ?? "");
      case 2:
        return NurseProfileScreen(
          user: widget.user,
          onUpdate: _handleUserUpdate,
        );
      default:
        return _buildUnitsView(context);
    }
  }

  Widget _buildUnitsView(BuildContext context) {
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
        _buildHeader("Units"),
        const SizedBox(height: 15),
        _buildNurseInfo(),
        const SizedBox(height: 10),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: GridView.builder(
              itemCount: units.length,
              physics: const BouncingScrollPhysics(),
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(context).padding.bottom + 110,
                top: 10,
              ),
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
      ],
    );
  }

  Widget _buildNurseInfo() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: [
          CircleAvatar(
            radius: 35,
            backgroundColor: Colors.white,
            backgroundImage: (widget.user.imageUrl != null && widget.user.imageUrl!.isNotEmpty)
                ? NetworkImage(widget.user.imageUrl!)
                : const AssetImage("assets/nurse (1).png") as ImageProvider,
          ),
          const SizedBox(width: 15),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(" ${widget.user.userName ?? 'Nurse'}",
                  style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF3B5BB5))),
              Text(widget.user.specialization ?? "Nurse Specialist",
                  style: const TextStyle(fontSize: 15, color: Color(0xFF7CA1FF))),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildUnitCard(BuildContext context, String unitName) {
    return InkWell(
      onTap: () => Navigator.pushNamed(context, '/beds', arguments: unitName),
      borderRadius: BorderRadius.circular(20),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, 5),
            )
          ],
          border: Border.all(
            color: const Color(0xFF7CA1FF).withOpacity(0.2),
          ),
        ),
        child: Stack(
          children: [
            Positioned(
              top: 15,
              left: 15,
              child: Text(
                unitName,
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF3B5BB5),
                ),
              ),
            ),
            Center(
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Image.asset("assets/unit.png", fit: BoxFit.contain),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(String title) {
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
          // 🔔 Notification bell icon with badge and animation
          Align(
            alignment: Alignment.centerRight,
            child: Consumer<NotificationProvider>(
              builder: (context, notifProvider, _) {
                final hasUnread = notifProvider.unreadCount > 0;
                
                return Stack(
                  children: [
                    // Animated bell icon with shake effect
                    if (hasUnread)
                      TweenAnimationBuilder<double>(
                        duration: const Duration(milliseconds: 600),
                        tween: Tween<double>(begin: 0, end: 1),
                        onEnd: () {
                          // Restart animation if still mounted and has unread
                          if (mounted && notifProvider.unreadCount > 0) {
                            setState(() {});
                          }
                        },
                        builder: (context, value, child) {
                          // Shake animation
                          final shake = math.sin(value * 12.566) * 0.08; // 2 complete oscillations
                          return Transform.rotate(
                            angle: shake,
                            child: child,
                          );
                        },
                        child: IconButton(
                          icon: const Icon(Icons.notifications, color: Colors.white, size: 28),
                          onPressed: () => Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => const NotificationsScreen(),
                            ),
                          ),
                        ),
                      )
                    else
                      IconButton(
                        icon: const Icon(Icons.notifications, color: Colors.white, size: 28),
                        onPressed: () => Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => const NotificationsScreen(),
                          ),
                        ),
                      ),
                    // Red badge with unread count
                    if (hasUnread)
                      Positioned(
                        right: 8,
                        top: 8,
                        child: AnimatedScale(
                          duration: const Duration(milliseconds: 300),
                          scale: 1.1,
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            decoration: const BoxDecoration(
                              color: Colors.red,
                              shape: BoxShape.circle,
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.red,
                                  blurRadius: 6,
                                  spreadRadius: 1,
                                ),
                              ],
                            ),
                            child: Text(
                              '${notifProvider.unreadCount}',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                      ),
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCurvedBottomNav(BuildContext context) {
    double deviceWidth = MediaQuery.of(context).size.width;
    double unitWidth = deviceWidth / 3;

    return Container(
      height: 85,
      color: Colors.transparent,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          TweenAnimationBuilder<double>(
            duration: const Duration(milliseconds: 400),
            curve: Curves.easeInOutCirc,
            tween: Tween<double>(begin: 0, end: _selectedIndex.toDouble()),
            builder: (context, value, child) {
              return CustomPaint(
                size: Size(deviceWidth, 85),
                painter: DynamicCirclePainter(
                  xOffsetPercent: (value * unitWidth + unitWidth / 2) / deviceWidth,
                ),
              );
            },
          ),
          AnimatedPositioned(
            duration: const Duration(milliseconds: 400),
            curve: Curves.easeInOutCirc,
            left: (_selectedIndex * unitWidth) + (unitWidth / 2) - 28,
            top: 0,
            child: Container(
              width: 56,
              height: 56,
              decoration: const BoxDecoration(
                color: Color(0xFF719EFF),
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(color: Colors.black12, blurRadius: 10, offset: Offset(0, 5))
                ],
              ),
              child: Icon(_getIconForIndex(_selectedIndex), color: Colors.white, size: 28),
            ),
          ),
          Positioned(
            bottom: 15,
            width: deviceWidth,
            child: Row(
              children: [
                _buildNavItem(0, Icons.home_outlined),
                _buildNavItem(1, Icons.assignment_turned_in_outlined),
                _buildNavItem(2, Icons.person_outline),
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
        behavior: HitTestBehavior.opaque,
        onTap: () => setState(() => _selectedIndex = index),
        child: Opacity(
          opacity: _selectedIndex == index ? 0 : 1,
          child: Icon(icon, color: Colors.white, size: 28),
        ),
      ),
    );
  }

  IconData _getIconForIndex(int index) {
    if (index == 0) return Icons.home;
    if (index == 1) return Icons.assignment_turned_in;
    return Icons.person;
  }
}