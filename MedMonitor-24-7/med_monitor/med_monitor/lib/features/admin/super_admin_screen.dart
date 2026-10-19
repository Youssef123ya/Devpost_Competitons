import 'package:flutter/material.dart';
import 'package:provider/provider.dart';  // ✅ ADD: Required for context.read<T>()
import '../../models/dashboard_stats_model.dart';
import '../../models/user_model.dart';
import '../../models/app_models.dart';
import '../../services/api_service.dart';
import '../../providers/bed_provider.dart';  // ✅ ADD: Import BedProvider
import '../../providers/dashboard_provider.dart';  // ✅ ADD: Import DashboardProvider
import 'custom_drawer.dart';
import '../doctor/dynamic_circle_painter.dart';
import 'profile_screen.dart';
import 'occupied_beds_screen.dart';  // ✅ ADD: Import OccupiedBedsScreen
import '../../main.dart' as app_main;  // ✅ Import for RouteObserver

class SuperAdminScreen extends StatefulWidget {
  final UserModel user;
  final Function(UserModel) onUpdate;
  final List<StatCardData>? initialStats;
  final List<AgeGroupData>? initialAgeGroups;

  const SuperAdminScreen({
    super.key,
    required this.user,
    required this.onUpdate,
    this.initialStats,
    this.initialAgeGroups,
  });

  @override
  State<SuperAdminScreen> createState() => _SuperAdminScreenState();
}

class _SuperAdminScreenState extends State<SuperAdminScreen> with RouteAware {
  // --- DESIGN SPECS COLORS ---
  static const Color _outerBg = Color(0xFFE8EDF5);
  static const Color _cardGradStart = Color(0xFFF0F4FB);
  static const Color _cardGradEnd = Color(0xFFDCE6F5);
  static const Color _iconColor = Color(0xFF2D4A7A);
  static const Color _numberColor = Color(0xFF1A3260);
  static const Color _labelColor = Color(0xFF5A7AAA);
  static const Color _primaryBlue = Color(0xFF7CA1FF);

  int _selectedIndex = 0;
  late UserModel _currentUser;

  @override
  void initState() {
    super.initState();
    // ✅ Register this state with the global RouteObserver for lifecycle detection
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final route = ModalRoute.of(context);
      if (route != null && mounted) {
        app_main.routeObserver.subscribe(this, route);
      }
    });
    _currentUser = widget.user;
    _fetchDashboardData();
  }

  @override
  void didPopNext() {
    // ✅ CRITICAL FIX: Refresh dashboard stats when returning from other screens
    // This is called when SuperAdminScreen comes back into focus after other screens
    _fetchDashboardData();
    super.didPopNext();
  }

  @override
  void dispose() {
    // ✅ Unsubscribe from RouteObserver when disposing
    app_main.routeObserver.unsubscribe(this);
    super.dispose();
  }

  void _handleUserUpdate(UserModel updatedUser) {
    setState(() => _currentUser = updatedUser);
    widget.onUpdate(updatedUser);
  }

  /// Fetch dashboard statistics from backend
  Future<void> _fetchDashboardData() async {
    try {
      final dashboardProvider = context.read<DashboardProvider>();
      await dashboardProvider.fetchStats();
    } catch (e) {
      debugPrint('Error loading dashboard data: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _outerBg,
      endDrawer: CustomSideDrawer(
        user: _currentUser,
        onUpdate: _handleUserUpdate,
        onProfileBack: () => setState(() => _selectedIndex = 0),
      ),
      body: Stack(
        children: [
          IndexedStack(
            index: _selectedIndex,
            children: [
              _buildHomeScreen(),
              const OccupiedBedsScreen(),  // ✅ Middle tab
              ProfileScreen(
                user: _currentUser,
                onUpdate: _handleUserUpdate,
                isEmbedded: true,
              ),
            ],
          ),
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: _buildCurvedBottomNav(context),
          ),
        ],
      ),
    );
  }

  Widget _buildHomeScreen() {
    return SafeArea(
      child: Column(
        children: [
          _buildNewHeader(),
          Expanded(
            child: RefreshIndicator(
              onRefresh: _fetchDashboardData,
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 10, 16, 120),
                  child: Column(
                    children: [
                      _buildStatsGrid(),
                      const SizedBox(height: 25),
                      const Text(
                        "Statistics of Patients' Ages Inside\nthe Hospital",
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          color: _numberColor,
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                      const SizedBox(height: 20),
                      _buildAgeList(),
                      const SizedBox(height: 30),
                      _buildPendingButton(),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNewHeader() {
    return SizedBox(
      height: 150,
      child: Stack(
        children: [
          Container(
            height: 110,
            decoration: const BoxDecoration(
              color: Color(0xFF7CA1FF),
              borderRadius: BorderRadius.only(
                bottomLeft: Radius.circular(40),
                bottomRight: Radius.circular(40),
              ),
            ),
          ),
          Positioned(
            top: 45,
            left: 20,
            right: 20,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.92),
                borderRadius: BorderRadius.circular(25),
                boxShadow: [
                  BoxShadow(
                    color: Colors.blue.withOpacity(0.1),
                    blurRadius: 15,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Row(
                children: [
                  const CircleAvatar(
                    radius: 20,
                    backgroundImage: AssetImage('assets/super admin (1).png'),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      _currentUser.userName ?? "Super Admin",
                      style: const TextStyle(
                        color: _numberColor,
                        fontSize: 17,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  Builder(
                    builder: (c) => IconButton(
                      icon: const Icon(Icons.menu, color: Color(0xFF7CA1FF)),
                      onPressed: () => Scaffold.of(c).openEndDrawer(),
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

  Widget _buildStatsGrid() {
    final dashboardProvider = context.watch<DashboardProvider>();
    final stats = dashboardProvider.stats;

    if (stats == null) return _buildLoadingSkeleton();

    final statsToDisplay = [
      StatCardData(value: stats.occupiedBeds, label: 'Occupied Beds'),
      StatCardData(value: stats.availableBeds, label: 'Available Beds'),
      StatCardData(value: stats.totalPatients, label: 'Total Patients'),
      StatCardData(value: stats.totalDoctors, label: 'Total Doctors'),
      StatCardData(value: stats.totalNurses, label: 'Total Nurses'),
      StatCardData(value: stats.totalRequests, label: 'Total Requests'),
    ];

    return LayoutBuilder(
      builder: (context, constraints) {
        final width = constraints.maxWidth;
        int crossAxisCount = 3; // Fixed at 3 as per design image
        double aspectRatio = width > 600 ? 1.1 : 0.88; 

        return GridView.builder(
          shrinkWrap: true,
          padding: EdgeInsets.zero,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: crossAxisCount,
            mainAxisSpacing: 10,
            crossAxisSpacing: 10,
            childAspectRatio: aspectRatio,
          ),
          itemCount: statsToDisplay.length,
          itemBuilder: (context, i) => _buildStatCard(statsToDisplay[i]),
        );
      },
    );
  }

  Widget _buildStatCard(StatCardData s) {
    IconData icon;
    switch (s.label) {
      case 'Occupied Beds': icon = Icons.king_bed_outlined; break;
      case 'Available Beds': icon = Icons.bed_outlined; break;
      case 'Total Patients': icon = Icons.people_outline; break;
      case 'Total Doctors': icon = Icons.medical_services_outlined; break;
      case 'Total Nurses': icon = Icons.personal_injury_outlined; break;
      default: icon = Icons.assignment_ind_outlined;
    }

    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [_cardGradStart, _cardGradEnd],
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, color: _iconColor, size: 24),
              const SizedBox(width: 4),
              Flexible(
                child: Text(
                  '${s.value}',
                  style: const TextStyle(
                    color: _numberColor,
                    fontSize: 24,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4.0),
            child: Text(
              s.label,
              textAlign: TextAlign.center,
              maxLines: 2,
              style: const TextStyle(
                color: _labelColor,
                fontSize: 12,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLoadingSkeleton() {
    return LayoutBuilder(
      builder: (context, constraints) {
        final width = constraints.maxWidth;
        int crossAxisCount;
        double aspectRatio;

        if (width >= 1100) {
          crossAxisCount = 3;
          aspectRatio = 1.05;
        } else if (width >= 680) {
          crossAxisCount = 2;
          aspectRatio = 1.1;
        } else {
          crossAxisCount = 1;
          aspectRatio = 3.2;
        }

        return GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: crossAxisCount,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: aspectRatio,
          ),
          itemCount: 6,
          itemBuilder: (context, i) => Container(
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.5),
              borderRadius: BorderRadius.circular(20),
            ),
          ),
        );
      },
    );
  }

  Widget _buildAgeList() {
    final dashboardProvider = context.watch<DashboardProvider>();
    final stats = dashboardProvider.stats;

    if (stats == null) return const SizedBox.shrink();

    final ageGroups = [
      AgeGroupData(title: 'Newborns', range: '0-28 Days', count: stats.newbornsCount, imagePath: 'assets/newborn(1).png'),
      AgeGroupData(title: 'Children', range: '1-12 Years', count: stats.childrenCount, imagePath: 'assets/children (1).png'),
      AgeGroupData(title: 'Teenagers', range: '13-19 Years', count: stats.teenagersCount, imagePath: 'assets/teenagers (1).png'),
      AgeGroupData(title: 'Adults', range: '20-64 Years', count: stats.adultsCount, imagePath: 'assets/adults(1).png'),
      AgeGroupData(title: 'Elderly', range: '65+ Years', count: stats.elderlyCount, imagePath: 'assets/elderly (1).png'),
    ];

    return Column(
      children: [
        // Row 1: Newborns & Children
        Row(
          children: [
            Expanded(child: _buildNewAgeCard(ageGroups[0])),
            const SizedBox(width: 10),
            Expanded(child: _buildNewAgeCard(ageGroups[1])),
          ],
        ),
        const SizedBox(height: 10),
        // Row 2: Teenagers & Adults
        Row(
          children: [
            Expanded(child: _buildNewAgeCard(ageGroups[2])),
            const SizedBox(width: 10),
            Expanded(child: _buildNewAgeCard(ageGroups[3])),
          ],
        ),
        const SizedBox(height: 10),
        // Row 3: Elderly Centered
        Center(
          child: SizedBox(
            width: MediaQuery.of(context).size.width * 0.45,
            child: _buildNewAgeCard(ageGroups[4]),
          ),
        ),
      ],
    );
  }

  Widget _buildNewAgeCard(AgeGroupData g) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [_cardGradStart, _cardGradEnd],
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        children: [
          Image.asset(
            g.imagePath,
            width: 50,
            height: 50,
            fit: BoxFit.contain,
            errorBuilder: (_, __, ___) => const Icon(Icons.person, size: 40),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  g.title,
                  style: const TextStyle(
                    color: _numberColor,
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                Text(
                  g.range,
                  style: TextStyle(
                    color: _numberColor.withOpacity(0.5),
                    fontSize: 9,
                  ),
                ),
                Text(
                  '${g.count}',
                  style: const TextStyle(
                    color: _numberColor,
                    fontSize: 18,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPendingButton() {
    return Container(
      width: double.infinity,
      height: 60,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(20),
        onTap: () => Navigator.pushNamed(
          context,
          '/pending-admission',
          arguments: {
            'user': _currentUser,
            'onUpdate': _handleUserUpdate,
          },
        ),
        child: const Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.assignment_turned_in_outlined, color: _numberColor, size: 24),
            SizedBox(width: 12),
            Text(
              'Pending Admission Requests',
              style: TextStyle(
                color: _numberColor,
                fontSize: 16,
                fontWeight: FontWeight.w700,
              ),
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
              painter: DynamicCirclePainter(
                xOffsetPercent: (v * uW + uW / 2) / devW,
              ),
            ),
          ),
          AnimatedPositioned(
            duration: const Duration(milliseconds: 300),
            left: (_selectedIndex * uW) + (uW / 2) - 28,
            top: 0,
            child: Container(
              width: 56,
              height: 56,
              decoration: const BoxDecoration(
                color: _primaryBlue,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black12,
                    blurRadius: 10,
                    offset: Offset(0, 5),
                  ),
                ],
              ),
              child: Icon(
                _selectedIndex == 0 ? Icons.home : _selectedIndex == 1 ? Icons.bed : Icons.person,  // ✅ Updated
                color: Colors.white,
                size: 28,
              ),
            ),
          ),
          Positioned(
            bottom: 15,
            width: devW,
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