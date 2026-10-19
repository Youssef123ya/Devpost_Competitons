# 🚀 Quick Start Guide - Medical Workflow

## 5-Minute Setup

### 1️⃣ **Update pubspec.yaml**

The project already has `provider: ^6.0.5`. ✅ No changes needed!

### 2️⃣ **Add Provider to main.dart**

```dart
import 'package:provider/provider.dart';
import 'lib/providers/patient_workflow_provider.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(
          create: (_) => PatientWorkflowProvider(),
        ),
        // ... other existing providers
      ],
      child: MaterialApp(
        title: 'MedMonitor',
        home: const YourHomeScreen(),
        routes: {
          '/patient-form': (context) => const PatientFormScreenEnhanced(),
          '/beds-monitoring': (context) => const BedsMonitoringScreenEnhanced(),
          '/workflow-demo': (context) => const MedicalWorkflowDemoScreen(),
        },
      ),
    );
  }
}
```

### 3️⃣ **Import Files in Your Navigation**

```dart
// In your admin screen or navigation
import 'features/admin/patient_form_screen_enhanced.dart';
import 'features/admin/beds_monitoring_screen_enhanced.dart';
import 'features/admin/medical_workflow_demo_screen.dart';
```

### 4️⃣ **Launch Screens**

**Option A: Direct Navigation**
```dart
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (context) => const PatientFormScreenEnhanced(),
  ),
);
```

**Option B: Named Routes**
```dart
Navigator.pushNamed(context, '/patient-form');
Navigator.pushNamed(context, '/workflow-demo'); // For testing
```

### 5️⃣ **Test the Implementation**

Go to the demo screen to verify everything works:
```dart
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (context) => const MedicalWorkflowDemoScreen(),
  ),
);
```

---

## 📂 Files Location

```
your_project/
└── lib/
    ├── models/
    │   ├── patient.dart              (✅ Already exists)
    │   └── medical_unit.dart         (✅ Already exists)
    ├── providers/
    │   └── patient_workflow_provider.dart   (✨ NEW)
    ├── features/admin/
    │   ├── patient_form_screen_enhanced.dart      (✨ NEW)
    │   ├── beds_monitoring_screen_enhanced.dart   (✨ NEW)
    │   └── medical_workflow_demo_screen.dart      (✨ NEW)
    ├── widgets/
    │   ├── patient_bed_card.dart     (✨ NEW)
    │   └── empty_bed_card.dart       (✨ NEW)
    └── main.dart                     (📝 UPDATE REQUIRED)
```

---

## 🎯 Testing Workflow

### Manual Test (Step-by-Step):

1. **Start App** → Navigate to Patient Form Screen
2. **Fill Form:**
   - Name: Ahmed
   - ID: P001
   - Age: 45
   - Gender: Male
   - Weight: 75.5
   - Illness: High BP
   - Companion Phone: 01234567890
   - Nurse Name: Fatima
3. **Click Approve** → Auto-navigates to Beds Screen
4. **Verify:** "Beds: 0/12" displays, dropdown shows "A"
5. **Click Empty Bed** → Patient assigned automatically
6. **Verify:** Bed now shows patient card with all info
7. **Click Delete** → Confirmation dialog appears
8. **Confirm Delete** → Patient removed, bed empty again
9. **Switch Unit:** Click dropdown, select "B", beds refresh
10. **Success!** ✅

### Auto Test (Using Demo Screen):

1. Go to **MedicalWorkflowDemoScreen**
2. Click **"Load Sample Patient"** → Creates pending patient
3. Click **"Assign Pending Patient to Bed 0"** → Assigns to bed
4. Verify in status card that occupancy changes
5. Click different units in the units list
6. View debug info for provider state inspection

---

## 🎨 Customization Checklist

### Change Colors:
Edit color codes in screen files:
```dart
// Current: Dark blue theme
Color(0xFF719EFF)   // Primary blue → Change this
Color(0xFF2E55A7)   // Dark blue → Change this
Color(0xFF5B9EFF)   // Light blue → Change this
Color(0xFFEDF3FF)   // Background → Change this
```

### Add More Units:
```dart
// In PatientWorkflowProvider._medicalUnits initialization
Map<String, MedicalUnit> _medicalUnits = {
  'A': const MedicalUnit(unitName: 'A', totalBeds: 12),
  'B': const MedicalUnit(unitName: 'B', totalBeds: 12),
  'C': const MedicalUnit(unitName: 'C', totalBeds: 12),
  'D': const MedicalUnit(unitName: 'D', totalBeds: 12),  // ADD HERE
};
```

### Change Beds Per Unit:
```dart
// Change totalBeds parameter
'A': const MedicalUnit(unitName: 'A', totalBeds: 20),  // 20 beds instead of 12
```

### Modify Form Fields:
Edit `patient_form_screen_enhanced.dart` to add/remove fields.

---

## 🔗 Integration with Existing Code

### Use with Current BedProvider:

```dart
// Your existing bed_provider.dart can still work
// Just add the new PatientWorkflowProvider alongside it

// In your MultiProvider:
providers: [
  ChangeNotifierProvider(create: (_) => BedProvider()),        // Existing
  ChangeNotifierProvider(create: (_) => AdmissionProvider()), // Existing
  ChangeNotifierProvider(
    create: (_) => PatientWorkflowProvider(),                 // NEW
  ),
]
```

### Connect to Existing Admin Screen:

```dart
// In your super_admin_screen.dart or wherever:
Consumer<PatientWorkflowProvider>(
  builder: (context, provider, _) {
    return Container(
      child: Column(
        children: [
          Text('Pending Patient: ${provider.pendingPatient?.name ?? "None"}'),
          ElevatedButton(
            onPressed: () => Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => const PatientFormScreenEnhanced(),
              ),
            ),
            child: const Text('Add New Patient'),
          ),
        ],
      ),
    );
  },
)
```

---

## 📊 State Management Integration

### Access Provider from Any Widget:

```dart
// Read current state (doesn't rebuild)
final provider = context.read<PatientWorkflowProvider>();

// Watch for changes (rebuilds when notifyListeners called)
final provider = context.watch<PatientWorkflowProvider>();

// Consumer widget (best practice)
Consumer<PatientWorkflowProvider>(
  builder: (context, provider, _) => Text(
    'Occupied: ${provider.getOccupiedBedCountForSelectedUnit()}',
  ),
)
```

---

## ✅ Validation Rules

### Patient Form:
- ✅ All fields required
- ✅ Age must be numeric
- ✅ Weight must be numeric
- ✅ Phone must be valid format

### Bed Assignment:
- ✅ Can't assign to occupied bed
- ✅ Must have pending patient
- ✅ Bed index must be 0-11

### Unit Switching:
- ✅ Can only switch to existing units
- ✅ Switches instantly without data loss

---

## 🎯 Common Tasks

### Task 1: Start Patient Admission
```dart
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (context) => const PatientFormScreenEnhanced(),
  ),
);
```

### Task 2: Monitor Beds for Unit A
```dart
// Provider automatically selects Unit A by default
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (context) => const BedsMonitoringScreenEnhanced(),
  ),
);
```

### Task 3: Check Pending Patient
```dart
final provider = context.read<PatientWorkflowProvider>();
if (provider.hasPendingPatient()) {
  print('Pending: ${provider.pendingPatient!.name}');
} else {
  print('No pending patient');
}
```

### Task 4: Switch Unit Programmatically
```dart
context.read<PatientWorkflowProvider>().switchUnit('B');
```

### Task 5: Get Bed Occupancy
```dart
final provider = context.read<PatientWorkflowProvider>();
final occupied = provider.getOccupiedBedCountForSelectedUnit();
final total = provider.getTotalBedsForSelectedUnit();
print('Beds: $occupied/$total');
```

---

## 📱 Screen Navigation Map

```
App Start
    ↓
Admin Dashboard
    ├── [Patient Form Button]
    │        ↓
    │   PatientFormScreenEnhanced
    │   - Fill form
    │   - Click Approve
    │        ↓
    │   BedsMonitoringScreenEnhanced
    │   - View beds
    │   - Assign patient
    │   - Switch units
    │   - Delete patient
    │
    ├── [Demo/Testing Button]
    │        ↓
    │   MedicalWorkflowDemoScreen
    │   - View workflow status
    │   - Load sample data
    │   - Test features
    │
    └── [Other Admin Features]
```

---

## 🐛 Troubleshooting

### Issue: "PatientWorkflowProvider not found in context"
**Solution:** Ensure it's added to MultiProvider in main.dart

### Issue: Beds don't update when switching units
**Solution:** Wrap screen with Consumer<PatientWorkflowProvider>

### Issue: Form won't submit
**Solution:** Check form validation - ensure all fields are filled correctly

### Issue: Pending patient shows but can't assign to bed
**Solution:** 
- Check if bed is already occupied
- Ensure bed index is 0-11
- Try different empty bed

---

## 📖 Additional Resources

- Full documentation: `MEDICAL_WORKFLOW_GUIDE.md`
- Implementation details: `IMPLEMENTATION_SUMMARY.md`
- Models: `lib/models/patient.dart`, `lib/models/medical_unit.dart`
- Provider: `lib/providers/patient_workflow_provider.dart`

---

## ✨ What You Get

✅ Complete patient form with validation
✅ Dynamic 12-bed monitoring dashboard
✅ Multiple unit support (A, B, C, etc.)
✅ Real-time occupancy tracking
✅ Responsive design for all devices
✅ Professional UI matching your mockups
✅ Production-ready code
✅ Easy to customize and extend
✅ No additional dependencies required
✅ Full documentation included

---

## 🎉 You're All Set!

Everything is implemented and ready to use. Just follow the 5-minute setup above and you're good to go.

Need help? Check `MEDICAL_WORKFLOW_GUIDE.md` for detailed documentation.

**Happy coding!** 🚀
