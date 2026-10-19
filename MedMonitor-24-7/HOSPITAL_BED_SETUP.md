# 🏥 Hospital Bed Management System - Quick Start

## 📋 Overview

This is a complete **React Single-Page Application** for managing hospital bed assignments with role-based workflows for Doctors, Super Admins, and Nurses.

## 🚀 Quick Setup

### Option 1: Using Vite (Recommended)
```bash
# Create a new Vite React project
npm create vite@latest hospital-beds -- --template react
cd hospital-beds
npm install

# Replace src/App.jsx with the HospitalBedManagement.jsx file
npm run dev
```

### Option 2: Using Create React App
```bash
npx create-react-app hospital-beds
cd hospital-beds

# Replace src/App.js with HospitalBedManagement.jsx
npm start
```

## 📂 File Structure

```
HospitalBedManagement.jsx
├── ECGMonitor Component
├── DoctorForm Screen
├── AdminPatientList Screen
├── AdminBeds Screen
├── NurseHome Screen
├── NurseBeds Screen
└── HospitalBedManagementApp (Main App with state)
```

## 🎯 Complete Data Flow

### 1️⃣ **Doctor Adds Patient**
- Click "Doctor" button at bottom
- Fill form with patient details
- Click "Submit Request"
- Patient appears in pending queue

### 2️⃣ **Super Admin Reviews & Approves**
- Click "Admin List" button
- See all pending patient requests
- Click ✅ **APPROVE** → Patient moves to approval queue
- Click ❌ **REJECT** → Patient discarded

### 3️⃣ **Super Admin Assigns to Bed**
- Click "Admin Beds" button
- Select Unit (A, B, C, D) using buttons at top
- Click any empty bed (🛏️)
- First approved patient is assigned to that bed
- Can delete patients using red "Delete Patient" button

### 4️⃣ **Nurse Views Units**
- Click "Nurse Home" button
- See all 4 units as cards
- Each card shows occupancy level
- Click a unit card to enter

### 5️⃣ **Nurse Views Beds (Read-Only)**
- See only occupied beds in selected unit
- View patient info and ECG monitor
- No add/delete permissions

## 🎨 Key Features

✅ **Global State Management**
- All state at App level, passed as props
- No external state libraries needed

✅ **Screen Navigation**
- 5 different screens accessible via bottom buttons
- Smooth transitions
- Persistent state across navigation

✅ **Pre-populated Demo Data**
- Unit A comes with 3 sample patients
- Immediate visual feedback on first load

✅ **Responsive Design**
- Mobile-first (420px max-width)
- Works on all screen sizes
- Centered layout

✅ **Animated ECG Monitor**
- Scrolling green line animation
- Shows vital signs (BPM, %, RPM)
- Dark medical aesthetic

✅ **Role-Based Views**
- Different screens for different users
- Doctor: Add patient
- Admin: Approve & assign to beds
- Nurse: View only (read-only)

## 🎛️ Global State Structure

```javascript
// Pending patient requests (awaiting super admin approval)
pendingPatients = [
  { name, id, age, gender, weight, illness, companionPhone, nurseName }
]

// Approved patients waiting to be assigned to beds
approvedQueue = [
  { name, id, age, gender, weight, illness, companionPhone, nurseName }
]

// Unit beds (4 units, 12 beds each)
units = {
  A: [patient, patient, null, null, ...],  // occupied beds mixed with empty
  B: [null, null, null, ...],
  C: [null, null, null, ...],
  D: [null, null, null, ...]
}
```

## 🔧 Customization

### Change Primary Color
Replace all instances of `#5B8DEF` with your color:
```javascript
// Search & replace: #5B8DEF → your-color
```

### Modify Sample Data
Edit the initial state in `HospitalBedManagementApp`:
```javascript
const [units, setUnits] = useState({
  A: [
    {
      name: 'Your Patient',
      id: 'P001',
      // ... other fields
    },
    // ... more patients
  ]
});
```

### Change Number of Beds per Unit
Find this line in state initialization:
```javascript
B: Array(12).fill(null),  // Change 12 to your number
```

### Change Unit Names
Add more units by extending the units object:
```javascript
const [units, setUnits] = useState({
  A: Array(12).fill(null),
  B: Array(12).fill(null),
  C: Array(12).fill(null),
  D: Array(12).fill(null),
  E: Array(12).fill(null),  // Add new unit
});
```

Then update all references to ['A', 'B', 'C', 'D'] to include 'E'.

## 📱 Screen Reference

| Screen | Role | Actions |
|--------|------|---------|
| Doctor Form | Doctor | Submit patient admission request |
| Patient List | Super Admin | Approve/Reject pending requests |
| Beds | Super Admin | Assign patients to beds, delete |
| Nurse Home | Nurse | View all units |
| Nurse Beds | Nurse | View occupied beds (read-only) |

## 🎯 Test Workflow

1. Start with "Admin Beds" - see 3 pre-loaded patients in Unit A
2. Switch to "Doctor" - add a new patient
3. Switch to "Admin List" - approve the new patient
4. Switch to "Admin Beds" - assign to an empty bed
5. Switch to "Nurse Home" - see updated occupancy
6. Click Unit A card - view all patients (read-only)

## 🔐 Design Patterns

- **Immutable Updates**: All state updates use functional setState
- **Props Passing**: All state passed down, no context/Redux needed
- **Separation of Concerns**: Each screen is independent component
- **CSS-in-JS**: All styling inline, no external CSS files needed
- **SVG Animations**: Using native SVG + CSS animations for ECG

## 📝 No Dependencies Required

This app uses **only React**. No additional npm packages needed:
- ❌ No React Router (using useState instead)
- ❌ No Tailwind (using inline styles)
- ❌ No Redux/Context (using props)
- ❌ No UI library

## 🐛 Troubleshooting

**Buttons at bottom not working?**
- These are demo navigation buttons for testing all screens
- You can hide them by removing the fixed div at the end of JSX

**Patient not appearing in bed?**
- Make sure you approved the patient first in "Admin List"
- Then go to "Admin Beds" and click an empty bed

**Nurse sees all beds instead of just occupied?**
- The app correctly filters - only occupied beds should show
- Check the unit has patients assigned

## ✨ Future Enhancements

- Add search/filter for patients
- Add patient discharge workflow
- Add shift/schedule management
- Add real-time notifications
- Add database integration
- Add authentication system

---

**Built with ❤️ using React Hooks only**

