# Complete File Structure & Navigation Guide

## 📁 Project Structure

```
med_monitor/
├── lib/
│   ├── main.dart                                  ✅ UPDATED
│   │   └── Added: 4 new providers, /beds-monitoring route
│   │
│   ├── models/
│   │   ├── patient.dart                          ✅ NEW
│   │   ├── medical_unit.dart                     ✅ NEW
│   │   └── ... (existing models)
│   │
│   ├── providers/
│   │   ├── medical_workflow_provider.dart        ✅ NEW
│   │   │   ├── PendingPatientNotifier
│   │   │   ├── MedicalUnitsNotifier
│   │   │   ├── SelectedUnitNotifier
│   │   │   └── WorkflowNotifier
│   │   └── ... (existing providers)
│   │
│   ├── features/
│   │   ├── admin/
│   │   │   ├── beds_monitoring_screen.dart       ✅ NEW
│   │   │   ├── patient_form_screen.dart          ✅ (existing form)
│   │   │   └── ... (other admin screens)
│   │   │
│   │   ├── doctor/
│   │   │   ├── beds_screen.dart                  (existing)
│   │   │   ├── patient_details_screen.dart       (existing)
│   │   │   └── ... (other doctor screens)
│   │   │
│   │   └── ... (other features)
│   │
│   ├── widgets/
│   │   ├── camera_stream_widget.dart             (existing)
│   │   └── ... (other widgets)
│   │
│   └── services/
│       └── ... (existing services)
│
├── pubspec.yaml                                  ✅ (no changes needed)
│   └── provider: ^6.0.5 (already available)
│
└── (root)
    ├── MEDICAL_WORKFLOW_IMPLEMENTATION.md        ✅ NEW
    ├── STATE_MANAGEMENT_QUICK_REFERENCE.md       ✅ NEW
    ├── COMPLETE_IMPLEMENTATION_EXAMPLES.md        ✅ NEW
    ├── STATE_MANAGEMENT_SUMMARY.md               ✅ NEW
    └── IMPLEMENTATION_CHECKLIST.md               ✅ NEW
```

---

## 🔄 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        App Layer                             │
├─────────────────────────────────────────────────────────────┤
│
│  PatientFormScreen          BedsMonitoringScreen
│  (Existing)                 (New)
│     │                            │
│     │ Create Patient             │
│     └──────────────┐             │
│                    ▼             │
│          ┌──────────────────┐    │
│          │ Widget Consumer  │    │
│          │ Layers           │    │
│          └────────┬─────────┘    │
│                   │              │
└───────────────────┼──────────────┼──────────────────────────┘
                    │              │
                    ▼              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Provider Layer                            │
├─────────────────────────────────────────────────────────────┤
│
│  MultiProvider
│  ├── PendingPatientNotifier
│  │   └── Holds: Patient?
│  │       Methods: setPendingPatient, clearPendingPatient
│  │
│  ├── MedicalUnitsNotifier
│  │   └── Holds: List<MedicalUnit>
│  │       Methods: assignPatientToBed, removePatientFromBed
│  │
│  ├── SelectedUnitNotifier
│  │   └── Holds: String (unit name)
│  │       Methods: selectUnit
│  │
│  └── WorkflowNotifier
│      └── Holds: WorkflowState
│          Methods: markFormAsSubmitted, selectBedForAssignment
│
└─────────────────────────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    Model Layer                               │
├─────────────────────────────────────────────────────────────┤
│
│  Patient Model
│  ├── id: String
│  ├── name: String
│  ├── age: int
│  ├── gender: String
│  ├── weight: double
│  ├── illness: String
│  ├── companionPhone: String
│  ├── nurseName: String
│  ├── assignedBedIndex: int?
│  ├── cameraUrl: String?
│  └── Methods: copyWith, toJson, fromJson, ==, hashCode
│
│  MedicalUnit Model
│  ├── unitName: String
│  ├── totalBeds: int (12)
│  ├── patients: List<Patient>
│  └── Methods: generateBedSlots, assignPatientToBed,
│              removePatientFromBed, getPatientAtBed, etc.
│
└─────────────────────────────────────────────────────────────┘
```

---

## 🗺️ Navigation Flow

```
                    ┌─────────────┐
                    │  Main App   │
                    │   (home)    │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  Role Check │
                    │  (Doctor/   │
                    │   Admin)    │
                    └──────┬──────┘
                           │
                ┌──────────┼──────────┐
                │                    │
         ┌──────▼──────┐      ┌──────▼──────┐
         │    DOCTOR   │      │   ADMIN     │
         │  Home Screen│      │Home Screen  │
         └──────┬──────┘      └──────┬──────┘
                │                    │
      ┌─────────▼─────────┐  ┌──────▼──────┐
      │   Beds Screen     │  │Patient Form │
      │   (Existing)      │  │ Screen      │
      │                   │  │(Existing)   │
      │  - Show beds      │  │             │
      │  - Patient data   │  │- Collect    │
      │  - Basic monitor  │  │  info       │
      │                   │  │- Approve    │
      └───────────────────┘  └──────┬──────┘
                                    │
                            ┌───────▼────────┐
                            │ Set Pending    │
                            │ Patient        │
                            └───────┬────────┘
                                    │
                            ┌───────▼────────────┐
                            │ Navigate to        │
                            │ BedsMonitoring     │
                            │ Screen (NEW)       │
                            └───────┬────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │  BedsMonitoringScreen          │
                    │  (Dynamic Workflow - NEW)      │
                    │                                │
                    │  ┌─────────────────────────┐  │
                    │  │ Header: Unit Selector   │  │
                    │  │ + Occupancy Counter     │  │
                    │  └─────────────────────────┘  │
                    │                                │
                    │  ┌─────────────────────────┐  │
                    │  │ 12 Bed Slots Grid       │  │
                    │  │ ├─ Empty beds (click    │  │
                    │  │ │  to assign)          │  │
                    │  │ └─ Occupied (with      │  │
                    │  │    delete button)      │  │
                    │  └─────────────────────────┘  │
                    │                                │
                    └────────────────────────────────┘
                            │        │
                     ┌──────▼──┐    └──────────┐
                     │ Assign  │               │ Delete
                     │ Patient │               │ Patient
                     │ to Bed  │               │
                     └────┬────┘               │
                          │                   │
                          ▼                   ▼
                   ┌──────────────┐   ┌────────────────┐
                   │Bed Updates   │   │Confirmation    │
                   │with Patient  │   │Dialog          │
                   │Card          │   │                │
                   │& Camera      │   │On Confirm:     │
                   │Stream        │   │Remove Patient  │
                   └──────────────┘   └────────────────┘
```

---

## 📄 File Reference Guide

### **New Files**

#### `lib/models/patient.dart`
- **Purpose:** Define Patient data structure
- **Key Methods:** copyWith(), toJson(), fromJson()
- **Used By:** PendingPatientNotifier, MedicalUnit, BedsMonitoringScreen

#### `lib/models/medical_unit.dart`
- **Purpose:** Define MedicalUnit and bed management logic
- **Key Methods:** generateBedSlots(), assignPatientToBed(), removePatientFromBed()
- **Used By:** MedicalUnitsNotifier, BedsMonitoringScreen

#### `lib/providers/medical_workflow_provider.dart`
- **Purpose:** Central state management for patient workflow
- **Contains:**
  - PendingPatientNotifier (holds patient after form approval)
  - MedicalUnitsNotifier (manages units and bed assignments)
  - SelectedUnitNotifier (tracks current unit)
  - WorkflowNotifier (manages form state)
- **Used By:** BedsMonitoringScreen, PatientFormScreen

#### `lib/features/admin/beds_monitoring_screen.dart`
- **Purpose:** Display and manage 12 bed slots for selected unit
- **Features:**
  - Unit dropdown selector
  - Occupancy counter
  - Empty bed cards (with pending patient logic)
  - Occupied bed cards (with camera stream & delete)
  - Confirmation dialogs
- **Uses:** All 4 notifiers, CameraStreamWidget, Patient, MedicalUnit

### **Modified Files**

#### `lib/main.dart`
- **Changes:**
  - Added `import 'providers/medical_workflow_provider.dart'`
  - Added `import 'features/admin/beds_monitoring_screen.dart'`
  - Added 4 ChangeNotifierProviders in MultiProvider
  - Added `/beds-monitoring` route

---

## 🔗 Inter-Component Dependencies

```
BedsMonitoringScreen
    │
    ├── depends on PendingPatientNotifier
    │   └── provides: hasPendingPatient, pendingPatient
    │   └── calls: clearPendingPatient()
    │
    ├── depends on MedicalUnitsNotifier
    │   └── provides: units, getUnitByName()
    │   └── calls: assignPatientToBed(), removePatientFromBed()
    │
    ├── depends on SelectedUnitNotifier
    │   └── provides: selectedUnit
    │   └── calls: selectUnit()
    │
    ├── uses Patient model
    │   └── reads: name, age, nurseName, illness, cameraUrl
    │
    ├── uses MedicalUnit model
    │   └── calls: generateBedSlots()
    │
    ├── displays CameraStreamWidget
    │   └── passes: patient.cameraUrl
    │
    └── uses Consumer widgets
        └── watches: All 3 notifiers + business logic
```

---

## 🎯 Data Mutation Paths

```
User Action                Flow                           State Update

Form Approve       Patient created → setPendingPatient()  └─ PendingPatientNotifier
                                                          
Assign to Bed      Click empty bed → assignPatientToBed() ├─ MedicalUnitsNotifier
                                  → clearPendingPatient() └─ PendingPatientNotifier
                                  
Delete Patient     Click X button  → removePatientFromBed()└─ MedicalUnitsNotifier
                                  
Switch Unit        Dropdown change → selectUnit()         └─ SelectedUnitNotifier
```

---

## 🧪 Testing Entry Points

```
Unit Tests:
├── lib/models/patient.dart
│   ├── Test: copyWith() creates new instance
│   ├── Test: toJson() serialization
│   ├── Test: fromJson() deserialization
│   └── Test: Equality comparison
│
├── lib/models/medical_unit.dart
│   ├── Test: generateBedSlots() returns 12 nulls
│   ├── Test: assignPatientToBed() adds patient
│   ├── Test: removePatientFromBed() removes patient
│   ├── Test: getPatientAtBed() returns correct patient
│   └── Test: occupiedBedCount updates
│
└── lib/providers/medical_workflow_provider.dart
    ├── Test: PendingPatientNotifier setPendingPatient()
    ├── Test: MedicalUnitsNotifier assignPatientToBed()
    ├── Test: SelectedUnitNotifier selectUnit()
    └── Test: notifyListeners() called

Widget Tests:
└── lib/features/admin/beds_monitoring_screen.dart
    ├── Test: BedsMonitoringScreen renders
    ├── Test: Grid displays 12 cards
    ├── Test: Unit dropdown appears
    ├── Test: Empty bed click handler
    ├── Test: Delete button shows dialog
    └── Test: Responsive layout

Integration Tests:
├── Complete form → approval → navigation flow
├── Patient assignment workflow
├── Unit switching with data persistence
└── Delete confirmation with rollback
```

---

## 📚 Documentation Map

| Document | Purpose | Key Sections |
|----------|---------|--------------|
| **MEDICAL_WORKFLOW_IMPLEMENTATION.md** | Architecture & Design | Components, Data Flow, Lifecycle |
| **STATE_MANAGEMENT_QUICK_REFERENCE.md** | Code Snippets | 12 Common Patterns, Examples |
| **COMPLETE_IMPLEMENTATION_EXAMPLES.md** | Full Code | Complete screen implementations |
| **STATE_MANAGEMENT_SUMMARY.md** | Overview | What was delivered, workflows |
| **IMPLEMENTATION_CHECKLIST.md** | Verification | Checklist, testing steps |
| **FILE_STRUCTURE_GUIDE.md** | Navigation | This file, file references |

---

## 🔍 Quick Lookup Table

| What I Need | Where to Find | Key File |
|------------|---------------|----------|
| Patient model | `lib/models/patient.dart` | Complete definition + methods |
| MedicalUnit model | `lib/models/medical_unit.dart` | Bed management logic |
| State notifiers | `lib/providers/medical_workflow_provider.dart` | All 4 notifiers |
| Beds screen UI | `lib/features/admin/beds_monitoring_screen.dart` | Complete screen |
| Usage examples | `COMPLETE_IMPLEMENTATION_EXAMPLES.md` | Ready-to-use code |
| Quick reference | `STATE_MANAGEMENT_QUICK_REFERENCE.md` | Common patterns |
| Architecture | `MEDICAL_WORKFLOW_IMPLEMENTATION.md` | Design details |
| Setup steps | `IMPLEMENTATION_CHECKLIST.md` | Verification guide |

---

## 🚀 Getting Started Roadmap

1. **Understand Architecture** (5 mins)
   → Read: STATE_MANAGEMENT_SUMMARY.md

2. **Review Models** (10 mins)
   → Read: lib/models/patient.dart
   → Read: lib/models/medical_unit.dart

3. **Study State Management** (15 mins)
   → Read: lib/providers/medical_workflow_provider.dart
   → Reference: STATE_MANAGEMENT_QUICK_REFERENCE.md

4. **Explore UI Screen** (10 mins)
   → Read: lib/features/admin/beds_monitoring_screen.dart
   → Study: COMPLETE_IMPLEMENTATION_EXAMPLES.md

5. **Integration** (5 mins)
   → Check: lib/main.dart changes
   → Verify: Route added

6. **Testing & Deployment** (varies)
   → Follow: IMPLEMENTATION_CHECKLIST.md

**Total Time: ~45 minutes**

---

## ✅ Completion Status

| Component | Status | File | Location |
|-----------|--------|------|----------|
| Patient Model | ✅ Complete | patient.dart | lib/models/ |
| MedicalUnit Model | ✅ Complete | medical_unit.dart | lib/models/ |
| State Notifiers | ✅ Complete | medical_workflow_provider.dart | lib/providers/ |
| BedsMonitoringScreen | ✅ Complete | beds_monitoring_screen.dart | lib/features/admin/ |
| main.dart Integration | ✅ Complete | main.dart | lib/ |
| Architecture Docs | ✅ Complete | 5 markdown files | root/ |
| Code Examples | ✅ Complete | Examples & Quick Ref | root/ |
| Testing Guide | ✅ Complete | Checklist | root/ |

---

**All files created and ready for integration! 🎉**
