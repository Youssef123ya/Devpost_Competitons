# Quick Reference: Complete Code Snippets

## 1. DashboardProvider (NEW)
**File:** `lib/providers/dashboard_provider.dart`

```dart
import 'package:flutter/material.dart';
import '../models/dashboard_stats_model.dart';
import '../services/api_service.dart';

class DashboardProvider with ChangeNotifier {
  DashboardStatsModel? _stats;
  bool _isLoading = false;
  String? _error;

  DashboardStatsModel? get stats => _stats;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<bool> fetchStats() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final stats = await ApiService.getDashboardStats();
      if (stats != null) {
        _stats = stats;
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = "Failed to fetch dashboard stats";
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      debugPrint('❌ DashboardProvider Error: $e');
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> refreshStats({Duration? delay}) async {
    if (delay != null) {
      await Future.delayed(delay);
    }
    return fetchStats();
  }
}
```

---

## 2. SuperAdminScreen Updates
**File:** `lib/features/admin/super_admin_screen.dart`

### 2.1 Add Import
```dart
import '../../providers/dashboard_provider.dart';
```

### 2.2 Add State Variable
```dart
DashboardStatsModel? _dashboardStats;  // ✅ ADD
```

### 2.3 Update _fetchDashboardData()
```dart
Future<void> _fetchDashboardData() async {
  setState(() => _isLoading = true);
  
  try {
    final dashboardProvider = context.read<DashboardProvider>();
    final success = await dashboardProvider.fetchStats();
    
    if (!mounted) return;
    
    if (success && dashboardProvider.stats != null) {
      final stats = dashboardProvider.stats!;
      
      setState(() {
        _dashboardStats = stats;
        _currentStats = [
          StatCardData(value: stats.occupiedBeds, label: 'Occupied Beds'),
          StatCardData(value: stats.availableBeds, label: 'Available Beds'),
          StatCardData(value: stats.totalPatients, label: 'Total Patients'),      // ✅ DYNAMIC
          StatCardData(value: stats.totalDoctors, label: 'Total Doctors'),
          StatCardData(value: stats.totalNurses, label: 'Total Nurses'),
          StatCardData(value: stats.totalRequests, label: 'Total Requests'),      // ✅ DYNAMIC
        ];
        
        _currentAgeGroups = [
          AgeGroupData(title: 'Newborns', range: '0-28 Days', count: stats.newbornsCount, imagePath: 'assets/newborn(1).png'),
          AgeGroupData(title: 'Children', range: '1-12 Years', count: stats.childrenCount, imagePath: 'assets/children (1).png'),
          AgeGroupData(title: 'Teenagers', range: '13-19 Years', count: stats.teenagersCount, imagePath: 'assets/teenagers (1).png'),
          AgeGroupData(title: 'Adults', range: '20-64 Years', count: stats.adultsCount, imagePath: 'assets/adults(1).png'),
          AgeGroupData(title: 'Elderly', range: '65+ Years', count: stats.elderlyCount, imagePath: 'assets/elderly (1).png'),
        ];
        
        _isLoading = false;
      });
    } else {
      debugPrint('❌ Failed to fetch dashboard stats');
      setState(() => _isLoading = false);
    }
  } catch (e) {
    debugPrint('❌ Error loading dashboard data: $e');
    setState(() => _isLoading = false);
  }
}
```

---

## 3. PatientFormScreen Updates
**File:** `lib/features/admin/patient_form_screen.dart`

### 3.1 Add Import
```dart
import '../../providers/dashboard_provider.dart';
```

### 3.2 Approve Button (Simplified)
```dart
ElevatedButton(
  onPressed: () async {
    if (widget.request.id == null) return;
    _showLoading();

    // Approve request
    final admissionProvider = context.read<AdmissionProvider>();
    await admissionProvider.respondToRequest(widget.request.id!, 'approved', '');

    // ✅ Refresh dashboard
    if (mounted) {
      final dashboardProvider = context.read<DashboardProvider>();
      await dashboardProvider.refreshStats(delay: const Duration(milliseconds: 500));
    }

    if (mounted) Navigator.pop(context);
  },
  child: const Text("Approve", ...),
)
```

### 3.3 Reject Button (Simplified)
```dart
OutlinedButton(
  onPressed: () async {
    if (widget.request.id == null) return;
    _showLoading();

    // Reject request
    final admissionProvider = context.read<AdmissionProvider>();
    await admissionProvider.respondToRequest(widget.request.id!, 'rejected', '');

    // ✅ Refresh dashboard
    if (mounted) {
      final dashboardProvider = context.read<DashboardProvider>();
      await dashboardProvider.refreshStats(delay: const Duration(milliseconds: 500));
    }

    if (mounted) Navigator.pop(context);
  },
  child: const Text("Rejection", ...),
)
```

---

## 4. PendingAdmissionScreen Updates
**File:** `lib/features/admin/pending_admission_screen.dart`

### 4.1 Add Import
```dart
import '../../providers/dashboard_provider.dart';
```

### 4.2 Update Request Card
```dart
Widget _buildRequestCard(AdmissionRequest request) {
  return GestureDetector(
    onTap: () async {
      // Navigate
      await Navigator.push(
        context,
        MaterialPageRoute(builder: (c) => PatientFormScreen(request: request)),
      );
      
      // ✅ Refresh on return
      if (mounted) {
        await Future.wait([
          context.read<DashboardProvider>().refreshStats(),
          context.read<AdmissionProvider>().fetchPendingRequests(),
        ]);
      }
    },
    child: Container(
      // ... existing card widget ...
    ),
  );
}
```

---

## 5. Main App Updates
**File:** `lib/main.dart`

### 5.1 Add Import
```dart
import 'providers/dashboard_provider.dart';
```

### 5.2 Register in MultiProvider
```dart
return MultiProvider(
  providers: [
    ChangeNotifierProvider(create: (_) => AuthProvider()),
    ChangeNotifierProvider(create: (_) => NotificationProvider()),
    ChangeNotifierProvider(create: (_) => DoctorProvider()),
    ChangeNotifierProvider(create: (_) => NurseProvider()),
    ChangeNotifierProvider(create: (_) => BedProvider()),
    ChangeNotifierProvider(create: (_) => VitalSignProvider()),
    ChangeNotifierProvider(create: (_) => ChatProvider()),
    ChangeNotifierProvider(create: (_) => PatientChatProvider()),
    ChangeNotifierProvider(create: (_) => ReportProvider()),
    ChangeNotifierProvider(create: (_) => ReportsProvider()),
    ChangeNotifierProvider(create: (_) => AdmissionProvider()),
    ChangeNotifierProvider(create: (_) => AiAlertProvider()),
    ChangeNotifierProvider(create: (_) => PatientWorkflowProvider()),
    ChangeNotifierProvider(create: (_) => TaskProvider()),
    ChangeNotifierProvider(create: (_) => DashboardProvider()),  // ✅ ADD THIS
    ChangeNotifierProvider(create: (_) => PendingPatientNotifier()),
    ChangeNotifierProvider(create: (_) => MedicalUnitsNotifier()),
    ChangeNotifierProvider(create: (_) => SelectedUnitNotifier()),
    ChangeNotifierProvider(create: (_) => WorkflowNotifier()),
  ],
  child: MaterialApp(
    // ... rest of app ...
  ),
);
```

---

## 6. Backend (Already Correct)
**File:** `MedMonitor/Controllers/DashboardController.cs`

```csharp
[HttpGet("Stats")]
public async Task<IActionResult> Stats()
{
    // Beds
    var occupiedBeds = await _context.Beds.CountAsync(b => (int)b.Status == 1);
    var availableBeds = await _context.Beds.CountAsync(b => (int)b.Status == 0);

    // Users
    var totalDoctors = await _context.Users.CountAsync(u => (int)u.Role == 2);
    var totalNurses = await _context.Users.CountAsync(u => (int)u.Role == 3);

    // Patients = approved requests only (Status = 2)
    var approvedPatients = await _context.AdmissionRequests
        .Where(r => (int)r.Status == 2)
        .ToListAsync();
    var totalPatients = approvedPatients.Count;

    // All requests
    var totalRequests = await _context.AdmissionRequests.CountAsync();

    // Age stats from approved patients
    var newbornsCount = approvedPatients.Count(r => r.Age == 0);
    var childrenCount = approvedPatients.Count(r => r.Age >= 1 && r.Age <= 12);
    var teenagersCount = approvedPatients.Count(r => r.Age >= 13 && r.Age <= 19);
    var adultsCount = approvedPatients.Count(r => r.Age >= 20 && r.Age <= 64);
    var elderlyCount = approvedPatients.Count(r => r.Age >= 65);

    var result = new DashboardStatsDto
    {
        OccupiedBeds = occupiedBeds,
        AvailableBeds = availableBeds,
        TotalPatients = totalPatients,
        TotalDoctors = totalDoctors,
        TotalNurses = totalNurses,
        TotalRequests = totalRequests,
        NewbornsCount = newbornsCount,
        ChildrenCount = childrenCount,
        TeenagersCount = teenagersCount,
        AdultsCount = adultsCount,
        ElderlyCount = elderlyCount,
    };

    return Ok(result);
}
```

---

## Usage Examples

### Example 1: Manual Refresh in a Screen
```dart
final dashboardProvider = context.read<DashboardProvider>();
await dashboardProvider.refreshStats();
```

### Example 2: Refresh with Delay (for API sync)
```dart
final dashboardProvider = context.read<DashboardProvider>();
await dashboardProvider.refreshStats(delay: const Duration(milliseconds: 500));
```

### Example 3: Listen to Dashboard Changes
```dart
context.watch<DashboardProvider>().stats  // Reactive
```

### Example 4: Access Data in Build Method
```dart
@override
Widget build(BuildContext context) {
  final stats = context.read<DashboardProvider>().stats;
  
  if (stats == null) {
    return Center(child: CircularProgressIndicator());
  }
  
  return Column(
    children: [
      Text('Total Patients: ${stats.totalPatients}'),
      Text('Total Requests: ${stats.totalRequests}'),
    ],
  );
}
```

---

## Debugging Tips

### Check if Provider is Registered
```dart
// In main.dart MultiProvider, verify DashboardProvider is in the list
ChangeNotifierProvider(create: (_) => DashboardProvider()), // ✅ Should exist
```

### Check API Response
```dart
final stats = await ApiService.getDashboardStats();
debugPrint('Stats: ${stats?.totalPatients}, ${stats?.totalRequests}');
```

### Check Provider State
```dart
final provider = context.read<DashboardProvider>();
debugPrint('Isloading: ${provider.isLoading}');
debugPrint('Stats: ${provider.stats?.totalPatients}');
debugPrint('Error: ${provider.error}');
```

### Check Refresh Trigger
```dart
// Add debug print in _fetchDashboardData()
debugPrint('✅ _fetchDashboardData called');
```

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| `ProviderNotFoundException` | Add `ChangeNotifierProvider(create: (_) => DashboardProvider())` to main.dart |
| Dashboard shows old values | Ensure `refreshStats()` called after request approval |
| Age groups not updating | Verify approved patient age is stored correctly in database |
| Slow dashboard refresh | Increase delay: `refreshStats(delay: Duration(milliseconds: 1000))` |
| API returns null | Check if `/Dashboard/Stats` endpoint exists and returns correct JSON |

