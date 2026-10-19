# 🏥 Hospital Bed Management System - Implementation Guide

## 📘 Architecture Overview

This React app implements a **5-screen workflow** with **3 user roles** using pure React hooks.

```
┌─────────────────────────────────────────────────────────┐
│          HospitalBedManagementApp (State Root)           │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Global State:                                          │
│  • pendingPatients []      → From doctors               │
│  • approvedQueue []        → From admin approval       │
│  • units {A, B, C, D}      → Bed assignments           │
│  • screen (routing)        → Current view              │
│  • currentUnit             → Selected admin unit       │
│  • nurseCurrentUnit        → Selected nurse unit       │
│                                                          │
└─────────────────────────────────────────────────────────┘
         ↓
┌────────────────────────────────────────────────────┐
│ Conditional Rendering Based on screen State       │
└────────────────────────────────────────────────────┘
         ↓
    ┌─────┴──────┬──────────┬──────────┬────────────┐
    ↓            ↓          ↓          ↓            ↓
DoctorForm AdminPatientList AdminBeds NurseHome NurseBeds
```

## 🔄 Complete Data Flow

### Step 1: Doctor Submits Patient
```javascript
// DoctorForm → onSubmit
setPendingPatients(prev => [...prev, { ...formData, timestamp: Date.now() }])
```
**Result**: Patient appears in admin's pending list

### Step 2: Admin Approves Patient
```javascript
// AdminPatientList → handleApprove
setPendingPatients(prev => prev.filter(p => p.timestamp !== patient.timestamp))
setApprovedQueue(prev => [...prev, patient])
setScreen('adminBeds')  // Navigate to beds screen
```
**Result**: Patient moves to approval queue, admin auto-navigated to beds

### Step 3: Admin Assigns to Bed
```javascript
// AdminBeds → handleEmptyBedClick
if (approvedQueue.length === 0) {
  alert('No approved patients in queue')
} else {
  setUnits(prev => ({
    ...prev,
    [currentUnit]: prev[currentUnit].map((bed, idx) =>
      idx === emptyBedIndex ? approvedQueue[0] : bed
    )
  }))
  setApprovedQueue(prev => prev.slice(1))  // Remove from queue
}
```
**Result**: Patient assigned to bed, removed from approval queue

### Step 4: Admin Deletes Patient
```javascript
// AdminBeds → handleDeletePatient
setUnits(prev => ({
  ...prev,
  [currentUnit]: prev[currentUnit].map((bed, idx) =>
    idx === bedIndex ? null : bed
  )
}))
```
**Result**: Bed becomes empty, patient removed

### Step 5: Nurse Views Units
```javascript
// NurseHome → unit card onClick
setNurseCurrentUnit(unit)
setScreen('nurseBeds')
```
**Result**: Navigates to NurseBeds showing only occupied beds

## 🎯 Component Breakdown

### 1. ECGMonitor Component
**Purpose**: Displays animated vital signs monitor (reusable)

**Features**:
- Animated SVG polyline (scrolling effect)
- Glowing green line with CSS animation
- Fixed vital signs display (74 BPM, 65%, 34 RPM)
- Dark medical theme

**Code Pattern**:
```javascript
const ECGMonitor = () => {
  const points = Array.from({ length: 60 }, (_, i) => {
    const x = i * 8
    const y = 50 + Math.sin(i * 0.3) * 15 + (Math.random() - 0.5) * 8
    return `${x},${y}`
  }).join(' ')
  
  return <svg>...</svg>
}
```

**SVG Animation**:
```css
@keyframes scrollLine {
  0% { transform: translateX(0) }
  100% { transform: translateX(-480px) }
}
polyline {
  animation: scrollLine 4s linear infinite
}
```

### 2. DoctorForm Component
**Props**: 
- `pendingPatients`, `setPendingPatients`
- `setScreen` (not used directly but available)

**Features**:
- 8 input fields (Name, ID, Age, Gender, Weight, Illness, Phone, Nurse)
- Form validation (required fields)
- Success message after submission
- Form reset after submit

**State**:
```javascript
const [formData, setFormData] = useState({...})
const [submitted, setSubmitted] = useState(false)
```

**Data Flow**:
```
Form Submit 
  → Create patient object with timestamp
  → Add to pendingPatients
  → Show success message
  → Clear form
```

### 3. AdminPatientList Component
**Props**:
- `pendingPatients`, `setPendingPatients`
- `approvedQueue`, `setApprovedQueue`
- `setScreen`

**Features**:
- List all pending patients
- Two buttons per patient: Approve | Reject
- Badge showing pending count
- Empty state message

**Key Logic**:
```javascript
const handleApprove = (patient) => {
  // 1. Remove from pending
  setPendingPatients(prev => 
    prev.filter(p => p.timestamp !== patient.timestamp)
  )
  // 2. Add to approved queue
  setApprovedQueue(prev => [...prev, patient])
  // 3. Navigate to beds screen
  setScreen('adminBeds')
}

const handleReject = (patient) => {
  setPendingPatients(prev => 
    prev.filter(p => p.timestamp !== patient.timestamp)
  )
}
```

### 4. AdminBeds Component
**Props**:
- `units`, `setUnits`
- `approvedQueue`, `setApprovedQueue`
- `currentUnit`, `setCurrentUnit`

**Features**:
- Unit selector (tabs: A, B, C, D)
- Bed occupancy display ("Beds: 3/12")
- Occupied beds show ECG monitor + patient info + delete button
- Empty beds show illustration + "Click to add" message
- Adding patient auto-takes from approval queue

**Bed Card Types**:

**A) EMPTY BED**:
```javascript
<div className="bed-card empty" onClick={handleEmptyBedClick}>
  <div className="bed-emoji">🛏️</div>
  <div>No Patient added yet</div>
  <div>Click to add patient</div>
</div>
```

**B) OCCUPIED BED**:
```javascript
<div className="bed-card occupied">
  <ECGMonitor />
  <div>Patient Info</div>
  <button onClick={() => handleDeletePatient(idx)}>Delete</button>
</div>
```

**Bed Assignment Logic**:
```javascript
const handleEmptyBedClick = () => {
  if (approvedQueue.length === 0) {
    alert('No approved patients in queue')
    return
  }
  
  const patient = approvedQueue[0]
  const emptyBedIndex = units[currentUnit].findIndex(bed => bed === null)
  
  setUnits(prev => ({
    ...prev,
    [currentUnit]: prev[currentUnit].map((bed, idx) =>
      idx === emptyBedIndex ? patient : bed
    )
  }))
  
  setApprovedQueue(prev => prev.slice(1))  // FIFO
}
```

### 5. NurseHome Component
**Props**:
- `units`
- `setScreen`
- `setNurseCurrentUnit`
- `nurseName`

**Features**:
- Show all 4 units as cards
- Each card shows occupancy count
- Background color changes based on occupancy
- Bottom navigation bar (3 icons)
- Click card to enter NurseBeds screen

**Occupancy Color Logic**:
```javascript
const getOccupancyColor = (unit) => {
  const occupied = units[unit].filter(bed => bed !== null).length
  if (occupied === 0) return '#e0e0e0'          // Gray
  if (occupied < 6) return '#fff3cd'             // Yellow
  return '#ffcccc'                               // Light red
}
```

**Unit Card**:
```javascript
<div className="unit-card" onClick={() => {
  setNurseCurrentUnit(unit)
  setScreen('nurseBeds')
}}>
  <div className="unit-illustration">
    <div className="unit-letter">{unit}</div>
    🛏️
  </div>
  <div className="unit-info">
    <p>{occupied} Patient{occupied !== 1 ? 's' : ''}</p>
  </div>
</div>
```

### 6. NurseBeds Component
**Props**:
- `units`
- `nurseCurrentUnit`
- `setScreen`

**Features**:
- Filter: **ONLY show occupied beds** (this is key for nurse view)
- Back button to return to NurseHome
- No delete functionality (read-only)
- No add functionality (read-only)
- Display ECG monitor for each patient

**Read-Only Filter**:
```javascript
const occupiedBeds = units[nurseCurrentUnit]
  .map((bed, idx) => ({ bed, idx }))
  .filter(({ bed }) => bed !== null)  // ← KEY: Only occupied beds

return (
  <div>
    {occupiedBeds.length === 0 ? (
      <div>No patients in this unit</div>
    ) : (
      occupiedBeds.map(({ bed, idx }) => (
        <div key={idx}>
          <ECGMonitor />
          <PatientInfo />
          {/* NO DELETE BUTTON */}
        </div>
      ))
    )}
  </div>
)
```

## 🎨 Styling Architecture

### Global Styles
```javascript
<style>{`
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, ... }
`}</style>
```

### Color Scheme
- **Primary**: #5B8DEF (Blue)
- **Secondary**: #4A7DD5 (Darker Blue)
- **Success**: #4CAF50 (Green)
- **Danger**: #f44336 (Red)
- **Background**: #EEF3FF (Light Blue)
- **White**: #FFFFFF
- **ECG**: #00ff88 (Neon Green)

### Responsive Design
```css
max-width: 420px            /* Mobile-first */
margin: 0 auto              /* Center */
padding: 20px               /* Safe area */
display: grid               /* Flexible layout */
```

### Common Card Pattern
```css
.card {
  background: white;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(91, 141, 239, 0.15);
}
```

## 📊 State Mutation Patterns

### Adding Items (Immutable)
```javascript
setPendingPatients(prev => [...prev, newPatient])
setApprovedQueue(prev => [...prev, patient])
```

### Removing Items
```javascript
setPendingPatients(prev => 
  prev.filter(p => p.timestamp !== targetTimestamp)
)
```

### Updating Nested Arrays
```javascript
setUnits(prev => ({
  ...prev,
  [currentUnit]: prev[currentUnit].map((bed, idx) =>
    idx === targetIndex ? newValue : bed
  )
}))
```

### Form Reset Pattern
```javascript
setFormData({
  name: '',
  id: '',
  age: '',
  // ... all fields reset to empty
})
```

## 🔐 Security Considerations

⚠️ **Note**: This is a demo. For production:
- Add authentication/authorization
- Validate all inputs server-side
- Hash sensitive data
- Implement role-based access control
- Add audit logging
- Implement database persistence

## 🎯 Key Implementation Details

### 1. Screen Routing (No Libraries)
```javascript
const [screen, setScreen] = useState('doctorForm')

return (
  <>
    {screen === 'doctorForm' && <DoctorForm ... />}
    {screen === 'adminPatientList' && <AdminPatientList ... />}
    {screen === 'adminBeds' && <AdminBeds ... />}
    {screen === 'nurseHome' && <NurseHome ... />}
    {screen === 'nurseBeds' && <NurseBeds ... />}
  </>
)
```

### 2. State Passing (Props Drilling)
```javascript
// Top level
<DoctorForm 
  pendingPatients={pendingPatients}
  setPendingPatients={setPendingPatients}
  setScreen={setScreen}
/>
```

### 3. Unique Patient ID (Timestamp)
```javascript
// Each patient needs unique ID for filtering
{ ...formData, timestamp: Date.now() }
```

### 4. FIFO Queue for Patient Assignment
```javascript
// Take first patient from queue
const patient = approvedQueue[0]
// ... assign to bed
// Remove from queue
setApprovedQueue(prev => prev.slice(1))  // FIFO
```

### 5. Bed Array Structure
```javascript
// Each unit is array of 12 beds
// null = empty, object = patient data
units.A = [patient1, patient2, null, null, ...]
```

## 🧪 Testing Workflows

### Workflow 1: Full Happy Path
1. Doctor adds patient → Success message
2. Admin List shows patient
3. Admin approves → Moves to beds
4. Admin clicks empty bed → Patient assigned
5. Nurse sees updated occupancy
6. Nurse views bed (read-only)

### Workflow 2: Rejection Path
1. Doctor adds patient
2. Admin rejects → Patient removed
3. Admin list empty

### Workflow 3: Multiple Units
1. Doctor adds multiple patients
2. Admin approves all
3. Admin assigns: some to Unit A, some to Unit B
4. Nurse checks each unit separately

### Workflow 4: Patient Deletion
1. Admin assigns patient to bed
2. Admin deletes patient
3. Bed becomes empty again
4. Can reassign new patient

## 📈 Performance Considerations

- **No Re-render Optimization**: All components re-render on any state change (acceptable for this scale)
- **For Large Scale**: Consider useMemo, useCallback, component memoization
- **Array Operations**: All immutable updates prevent accidental mutations

## 🎓 Learning Points

1. **State Management**: All state in parent, passed as props
2. **Conditional Rendering**: Show different components based on screen state
3. **Array Mutations**: Immutable patterns for state updates
4. **SVG Animations**: CSS animations on SVG elements
5. **Mobile Design**: Mobile-first responsive layout
6. **Role-Based UI**: Different views for different users

---

**This architecture scales well up to ~1000 patients before needing database/backend.**

