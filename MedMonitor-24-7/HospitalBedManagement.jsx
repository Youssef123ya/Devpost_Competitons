import React, { useState, useEffect } from 'react';

// ============================================================================
// ECG MONITOR COMPONENT - Realistic Medical Display
// ============================================================================
const ECGMonitor = () => {
  // Generate EKG waveform (heart rate)
  const ekg = Array.from({ length: 120 }, (_, i) => {
    const x = i * 4;
    const normalWave = Math.sin(i * 0.15) * 8 + 5;
    const spike = Math.exp(-((i % 30 - 15) ** 2) / 50) * 20;
    const y = 40 + normalWave + spike + (Math.random() - 0.5) * 2;
    return `${x},${y}`;
  }).join(' ');

  // Generate brain activity waveform
  const brain = Array.from({ length: 120 }, (_, i) => {
    const x = i * 4;
    const wave = Math.sin(i * 0.2) * 6 + Math.sin(i * 0.05) * 4;
    const y = 50 + wave + (Math.random() - 0.5) * 3;
    return `${x},${y}`;
  }).join(' ');

  // Generate respiration waveform
  const resp = Array.from({ length: 120 }, (_, i) => {
    const x = i * 4;
    const y = 50 + Math.sin(i * 0.1) * 15 + (Math.random() - 0.5) * 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="monitor-container">
      <style>{`
        @keyframes scrollWave {
          0% { transform: translateX(0); }
          100% { transform: translateX(-480px); }
        }
        
        .monitor-container {
          background: linear-gradient(135deg, #0d1b2a 0%, #1a2d42 100%);
          border-radius: 14px;
          padding: 14px;
          margin-bottom: 14px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3), inset 0 1px 2px rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(0, 255, 136, 0.2);
        }
        
        .monitor-top {
          display: grid;
          grid-template-columns: 60px 1fr 80px;
          gap: 12px;
          margin-bottom: 12px;
          align-items: flex-start;
        }
        
        .monitor-label {
          font-size: 9px;
          font-weight: 700;
          color: #00ffaa;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          line-height: 1.4;
        }
        
        .monitor-label div {
          margin-bottom: 3px;
          padding: 2px 0;
        }
        
        .monitor-values {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 8px;
          text-align: center;
        }
        
        .vital-box {
          background: rgba(0, 255, 136, 0.08);
          border: 1px solid rgba(0, 255, 136, 0.2);
          border-radius: 6px;
          padding: 6px;
        }
        
        .vital-label {
          font-size: 8px;
          color: #00d4ff;
          opacity: 0.7;
          margin-bottom: 2px;
        }
        
        .vital-value {
          font-size: 14px;
          font-weight: 700;
          color: #00ffaa;
          line-height: 1;
        }
        
        .waveform-container {
          display: grid;
          gap: 8px;
          margin-bottom: 10px;
        }
        
        .waveform-row {
          display: grid;
          grid-template-columns: 50px 1fr;
          gap: 8px;
          align-items: center;
        }
        
        .waveform-label {
          font-size: 9px;
          font-weight: 600;
          color: #00ffaa;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .waveform {
          height: 32px;
          background: rgba(0, 255, 136, 0.05);
          border: 1px solid rgba(0, 255, 136, 0.2);
          border-radius: 4px;
          overflow: hidden;
          position: relative;
        }
        
        svg {
          width: 100%;
          height: 100%;
          filter: drop-shadow(0 0 2px rgba(0, 255, 136, 0.5));
        }
        
        polyline {
          animation: scrollWave 5s linear infinite;
        }
        
        .monitor-bottom {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          font-size: 9px;
          color: #00d4ff;
          padding: 8px;
          background: rgba(0, 255, 136, 0.04);
          border-radius: 6px;
          border: 1px solid rgba(0, 255, 136, 0.1);
        }
        
        .bottom-stat {
          padding: 2px 0;
        }
        
        .bottom-stat strong {
          color: #00ffaa;
          font-weight: 700;
        }
      `}</style>

      <div className="monitor-top">
        <div className="monitor-label">
          <div>EKG</div>
          <div>BRN</div>
          <div>RSP</div>
        </div>
        <div></div>
        <div className="monitor-values">
          <div className="vital-box">
            <div className="vital-label">BPM</div>
            <div className="vital-value">74</div>
          </div>
          <div className="vital-box">
            <div className="vital-label">SPO2</div>
            <div className="vital-value">65%</div>
          </div>
          <div className="vital-box">
            <div className="vital-label">RPM</div>
            <div className="vital-value">34</div>
          </div>
        </div>
      </div>

      <div className="waveform-container">
        <div className="waveform-row">
          <div className="waveform-label">EKG</div>
          <div className="waveform">
            <svg viewBox="0 0 480 80" preserveAspectRatio="none">
              <polyline
                points={ekg}
                fill="none"
                stroke="#00ff88"
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>
        </div>
        <div className="waveform-row">
          <div className="waveform-label">BRAIN</div>
          <div className="waveform">
            <svg viewBox="0 0 480 80" preserveAspectRatio="none">
              <polyline
                points={brain}
                fill="none"
                stroke="#00d4ff"
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>
        </div>
        <div className="waveform-row">
          <div className="waveform-label">RESP</div>
          <div className="waveform">
            <svg viewBox="0 0 480 80" preserveAspectRatio="none">
              <polyline
                points={resp}
                fill="none"
                stroke="#00ff88"
                strokeWidth="1.5"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>
        </div>
      </div>

      <div className="monitor-bottom">
        <div className="bottom-stat"><strong>TEMP:</strong> 37.2°C</div>
        <div className="bottom-stat"><strong>BP:</strong> 120/80</div>
        <div className="bottom-stat"><strong>HR:</strong> 74 bpm</div>
        <div className="bottom-stat"><strong>Status:</strong> STABLE</div>
      </div>
    </div>
  );
};

// ============================================================================
// DOCTOR FORM SCREEN
// ============================================================================
const DoctorForm = ({ pendingPatients, setPendingPatients, setScreen }) => {
  const [formData, setFormData] = useState({
    name: '',
    id: '',
    age: '',
    gender: 'Male',
    weight: '',
    illness: '',
    companionPhone: '',
    nurseName: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setPendingPatients(prev => [...prev, { ...formData, timestamp: Date.now() }]);
    setFormData({
      name: '', id: '', age: '', gender: 'Male', weight: '',
      illness: '', companionPhone: '', nurseName: ''
    });
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="screen doctor-form">
      <style>{`
        .doctor-form {
          background: linear-gradient(135deg, #EEF3FF 0%, #E8EEFF 100%);
          min-height: 100vh;
          padding: 20px;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .form-container {
          background: white;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 8px 32px rgba(91, 141, 239, 0.15);
          max-width: 420px;
          width: 100%;
        }
        .form-header {
          text-align: center;
          margin-bottom: 28px;
        }
        .form-header h1 {
          color: #5B8DEF;
          font-size: 28px;
          margin: 0 0 8px 0;
          font-weight: 700;
          letter-spacing: 0.3px;
        }
        .form-header p {
          color: #888;
          font-size: 14px;
          margin: 0;
        }
        .form-group {
          margin-bottom: 16px;
        }
        .form-group label {
          display: block;
          color: #333;
          font-weight: 600;
          margin-bottom: 6px;
          font-size: 13px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .form-group input,
        .form-group select {
          width: 100%;
          padding: 12px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 14px;
          font-family: inherit;
          transition: all 0.3s ease;
        }
        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #5B8DEF;
          box-shadow: 0 0 0 3px rgba(91, 141, 239, 0.1);
          background: #f8faff;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .submit-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #5B8DEF 0%, #4A7DD5 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 12px;
          text-transform: uppercase;
          letter-spacing: 1px;
          box-shadow: 0 4px 12px rgba(91, 141, 239, 0.2);
        }
        .submit-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(91, 141, 239, 0.3);
        }
        .submit-btn:active {
          transform: translateY(0);
        }
        .success-msg {
          background: #d4edda;
          color: #155724;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 16px;
          font-weight: 500;
          font-size: 13px;
          border-left: 4px solid #28a745;
          animation: slideDown 0.3s ease;
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      <div className="form-container">
        <div className="form-header">
          <h1>➕ Add Patient</h1>
          <p>Submit patient details for approval</p>
        </div>

        {submitted && (
          <div className="success-msg">✓ Request sent to Super Admin</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Patient ID</label>
              <input
                type="text"
                name="id"
                value={formData.id}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Age</label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Gender</label>
              <select name="gender" value={formData.gender} onChange={handleChange}>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Weight (kg)</label>
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Illness</label>
              <input
                type="text"
                name="illness"
                value={formData.illness}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Companion Phone</label>
            <input
              type="tel"
              name="companionPhone"
              value={formData.companionPhone}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Nurse Name</label>
            <input
              type="text"
              name="nurseName"
              value={formData.nurseName}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="submit-btn">Submit Request</button>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// ADMIN PATIENT LIST SCREEN
// ============================================================================
const AdminPatientList = ({ pendingPatients, setPendingPatients, approvedQueue, setApprovedQueue, setScreen }) => {
  const handleApprove = (patient) => {
    setPendingPatients(prev => prev.filter(p => p.timestamp !== patient.timestamp));
    setApprovedQueue(prev => [...prev, patient]);
    setScreen('adminBeds');
  };

  const handleReject = (patient) => {
    setPendingPatients(prev => prev.filter(p => p.timestamp !== patient.timestamp));
  };

  return (
    <div className="screen admin-patient-list">
      <style>{`
        .admin-patient-list {
          background: linear-gradient(135deg, #EEF3FF 0%, #E8EEFF 100%);
          min-height: 100vh;
          padding: 20px;
        }
        .screen-header {
          background: linear-gradient(135deg, #5B8DEF 0%, #4A7DD5 100%);
          color: white;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 24px;
          text-align: center;
          box-shadow: 0 6px 20px rgba(91, 141, 239, 0.25);
        }
        .screen-header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          letter-spacing: 0.3px;
        }
        .screen-header p {
          margin: 8px 0 0 0;
          font-size: 13px;
          opacity: 0.9;
        }
        .patient-card {
          background: white;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 16px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          border-left: 5px solid #5B8DEF;
          transition: all 0.3s ease;
        }
        .patient-card:hover {
          box-shadow: 0 6px 18px rgba(91, 141, 239, 0.12);
          transform: translateY(-2px);
        }
        .patient-info {
          margin-bottom: 12px;
        }
        .patient-name {
          font-size: 16px;
          font-weight: 700;
          color: #333;
          margin-bottom: 10px;
        }
        .patient-detail {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          font-size: 13px;
          color: #666;
          margin-bottom: 6px;
        }
        .patient-detail span {
          display: inline;
        }
        .patient-detail strong {
          color: #333;
          font-weight: 600;
        }
        .patient-actions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .btn-approve, .btn-reject {
          padding: 10px;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .btn-approve {
          background: #4CAF50;
          color: white;
        }
        .btn-approve:hover {
          background: #45a049;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
        }
        .btn-reject {
          background: #f44336;
          color: white;
        }
        .btn-reject:hover {
          background: #da190b;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
        }
        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #999;
        }
        .empty-state h3 {
          font-size: 18px;
          margin: 0 0 8px 0;
          color: #666;
        }
        .pending-count {
          display: inline-block;
          background: #5B8DEF;
          color: white;
          border-radius: 20px;
          padding: 4px 12px;
          font-size: 12px;
          font-weight: 600;
          margin-left: 8px;
        }
      `}</style>

      <div className="screen-header">
        <h1>📋 Pending Requests</h1>
        <p>Review and approve patient admissions</p>
        {pendingPatients.length > 0 && (
          <span className="pending-count">{pendingPatients.length} pending</span>
        )}
      </div>

      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {pendingPatients.length === 0 ? (
          <div className="empty-state">
            <h3>✓ No Pending Requests</h3>
            <p>All patient requests have been processed</p>
          </div>
        ) : (
          pendingPatients.map((patient, idx) => (
            <div key={patient.timestamp} className="patient-card">
              <div className="patient-name">{patient.name} (ID: {patient.id})</div>
              <div className="patient-detail">
                <span><strong>Age:</strong> {patient.age}</span>
                <span><strong>Gender:</strong> {patient.gender}</span>
              </div>
              <div className="patient-detail">
                <span><strong>Weight:</strong> {patient.weight} kg</span>
                <span><strong>Illness:</strong> {patient.illness}</span>
              </div>
              <div className="patient-detail">
                <span><strong>Nurse:</strong> {patient.nurseName}</span>
                <span><strong>Phone:</strong> {patient.companionPhone}</span>
              </div>
              <div className="patient-actions">
                <button className="btn-approve" onClick={() => handleApprove(patient)}>
                  ✅ Approve
                </button>
                <button className="btn-reject" onClick={() => handleReject(patient)}>
                  ❌ Reject
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ============================================================================
// ADMIN BEDS SCREEN
// ============================================================================
const AdminBeds = ({ units, setUnits, approvedQueue, setApprovedQueue, currentUnit, setCurrentUnit }) => {
  const occupiedCount = units[currentUnit].filter(bed => bed !== null).length;
  const totalBeds = units[currentUnit].length;

  const handleEmptyBedClick = () => {
    if (approvedQueue.length === 0) {
      alert('No approved patients in queue');
      return;
    }
    const patient = approvedQueue[0];
    const emptyBedIndex = units[currentUnit].findIndex(bed => bed === null);
    if (emptyBedIndex !== -1) {
      setUnits(prev => ({
        ...prev,
        [currentUnit]: prev[currentUnit].map((bed, idx) =>
          idx === emptyBedIndex ? patient : bed
        )
      }));
      setApprovedQueue(prev => prev.slice(1));
    }
  };

  const handleDeletePatient = (bedIndex) => {
    setUnits(prev => ({
      ...prev,
      [currentUnit]: prev[currentUnit].map((bed, idx) =>
        idx === bedIndex ? null : bed
      )
    }));
  };

  return (
    <div className="screen admin-beds">
      <style>{`
        .admin-beds {
          background: linear-gradient(135deg, #EEF3FF 0%, #E8EEFF 100%);
          min-height: 100vh;
          padding: 20px;
        }
        .bed-screen-header {
          display: grid;
          grid-template-columns: auto 1fr auto;
          gap: 16px;
          align-items: center;
          margin-bottom: 24px;
          background: white;
          padding: 16px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        .unit-selector {
          display: flex;
          gap: 8px;
        }
        .unit-btn {
          width: 40px;
          height: 40px;
          border: 2px solid #e0e0e0;
          background: white;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 700;
          font-size: 14px;
          transition: all 0.3s ease;
        }
        .unit-btn.active {
          background: #5B8DEF;
          color: white;
          border-color: #5B8DEF;
        }
        .unit-btn:hover {
          border-color: #5B8DEF;
        }
        .bed-count {
          text-align: center;
          font-weight: 600;
          color: #333;
        }
        .bed-count-label {
          font-size: 12px;
          color: #999;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .bed-count-value {
          font-size: 18px;
          color: #5B8DEF;
          margin-top: 4px;
        }
        .bed-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
          max-width: 600px;
          margin: 0 auto;
        }
        .bed-card {
          background: white;
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          transition: all 0.3s ease;
        }
        .bed-card.occupied {
          border-left: 5px solid #4CAF50;
          box-shadow: 0 6px 18px rgba(76, 175, 80, 0.12);
        }
        .bed-card.occupied:hover {
          box-shadow: 0 8px 24px rgba(76, 175, 80, 0.15);
        }
        .bed-card.empty {
          border: 2px dashed #d0d0d0;
          cursor: pointer;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 140px;
          flex-direction: column;
          transition: all 0.3s ease;
          background: linear-gradient(135deg, #fafbff 0%, #f0f2ff 100%);
        }
        .bed-card.empty:hover {
          border-color: #5B8DEF;
          background: #f8faff;
          box-shadow: 0 6px 16px rgba(91, 141, 239, 0.15);
          transform: translateY(-2px);
        }
        .empty-bed-text {
          font-size: 16px;
          font-weight: 600;
          color: #666;
          margin-bottom: 4px;
        }
        .empty-bed-subtext {
          font-size: 12px;
          color: #999;
          font-weight: 500;
        }
        .bed-emoji {
          font-size: 38px;
          margin-bottom: 8px;
          opacity: 0.7;
        }
        .patient-vitals {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 12px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #eee;
        }
        .vital {
          text-align: center;
          font-size: 12px;
          color: #666;
        }
        .vital-value {
          font-size: 16px;
          font-weight: 700;
          color: #333;
        }
        .delete-btn {
          width: 100%;
          padding: 11px;
          background: #f44336;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          font-size: 12px;
          margin-top: 12px;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          box-shadow: 0 2px 8px rgba(244, 67, 54, 0.2);
        }
        .delete-btn:hover {
          background: #da190b;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(244, 67, 54, 0.3);
        }
        .delete-btn:active {
          transform: translateY(0);
        }
      `}</style>

      <div className="bed-screen-header">
        <div className="unit-selector">
          {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map(unit => (
            units[unit] && (
              <button
                key={unit}
                className={`unit-btn ${currentUnit === unit ? 'active' : ''}`}
                onClick={() => setCurrentUnit(unit)}
              >
                {unit}
              </button>
            )
          ))}
        </div>
        <div className="bed-count">
          <div className="bed-count-label">Beds</div>
          <div className="bed-count-value">{occupiedCount}/{totalBeds}</div>
        </div>
      </div>

      <div className="bed-grid">
        {units[currentUnit].map((bed, idx) => (
          bed === null ? (
            <div
              key={idx}
              className="bed-card empty"
              onClick={handleEmptyBedClick}
            >
              <div className="bed-emoji">🛏️</div>
              <div className="empty-bed-text">No Patient added yet</div>
              <div className="empty-bed-subtext">Click to add patient</div>
            </div>
          ) : (
            <div key={idx} className="bed-card occupied">
              <ECGMonitor />
              <div style={{
                fontSize: '13px',
                marginBottom: '12px',
                padding: '12px',
                background: 'linear-gradient(135deg, #f8faff 0%, #eef3ff 100%)',
                borderRadius: '8px',
                border: '1px solid rgba(91, 141, 239, 0.1)'
              }}>
                <div style={{ marginBottom: '6px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div><strong style={{ color: '#333' }}>Name:</strong> <span style={{ color: '#555' }}>{bed.name}</span></div>
                  <div><strong style={{ color: '#333' }}>Age:</strong> <span style={{ color: '#555' }}>{bed.age}</span></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div><strong style={{ color: '#333' }}>Nurse:</strong> <span style={{ color: '#555' }}>{bed.nurseName}</span></div>
                  <div><strong style={{ color: '#333' }}>Illness:</strong> <span style={{ color: '#555' }}>{bed.illness}</span></div>
                </div>
              </div>
              <button
                className="delete-btn"
                onClick={() => handleDeletePatient(idx)}
              >
                🗑️ Delete Patient
              </button>
            </div>
          )
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// NURSE HOME SCREEN - Fixed Design with Proper Navigation
// ============================================================================
const NurseHome = ({ units, setScreen, setNurseCurrentUnit, nurseName }) => {
  // SVG illustration of patient bed - exactly as specified in requirements
  const PatientBedSVG = () => (
    <svg viewBox="0 0 160 130" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
      {/* Background */}
      <rect width="160" height="130" fill="#C8DCF5" rx="8"/>
      
      {/* Decorative circles */}
      <circle cx="20" cy="20" r="12" fill="#A8C4E8" opacity="0.6"/>
      <circle cx="140" cy="15" r="8" fill="#A8C4E8" opacity="0.5"/>
      <circle cx="30" cy="110" r="10" fill="#A8C4E8" opacity="0.4"/>
      <circle cx="130" cy="105" r="7" fill="#A8C4E8" opacity="0.5"/>
      <circle cx="80" cy="10" r="5" fill="#A8C4E8" opacity="0.4"/>
      
      {/* Bed base */}
      <rect x="35" y="35" width="90" height="60" rx="6" fill="#1A7FA8"/>
      
      {/* Bed sheet/pillow area */}
      <rect x="38" y="38" width="84" height="20" rx="4" fill="#5BB8D4"/>
      
      {/* Patient body */}
      <ellipse cx="80" cy="72" rx="22" ry="13" fill="#D4956A"/>
      
      {/* Patient head */}
      <circle cx="80" cy="48" r="10" fill="#D4956A"/>
      
      {/* Patient gown */}
      <rect x="62" y="60" width="36" height="20" rx="3" fill="#5BB8D4"/>
      
      {/* IV Stand (top-left) */}
      <line x1="15" y1="25" x2="15" y2="90" stroke="#888" strokeWidth="2.5"/>
      <line x1="8" y1="88" x2="22" y2="88" stroke="#888" strokeWidth="2.5"/>
      <ellipse cx="15" cy="35" rx="7" ry="10" fill="#B0C8E0" stroke="#888" strokeWidth="1"/>
      <line x1="15" y1="45" x2="45" y2="60" stroke="#B0C8E0" strokeWidth="1.5" strokeDasharray="3,2"/>
      
      {/* Monitor (top-right) */}
      <rect x="115" y="28" width="32" height="22" rx="3" fill="#2A3F5A"/>
      <rect x="117" y="30" width="28" height="16" rx="2" fill="#0A1A2E"/>
      {/* Monitor screen lines */}
      <polyline points="118,38 122,34 126,40 130,33 134,39 138,36 144,38" 
                fill="none" stroke="#00FF88" strokeWidth="1.2"/>
      {/* Monitor stand */}
      <rect x="129" y="50" width="3" height="12" fill="#666"/>
      <rect x="123" y="60" width="15" height="3" rx="1" fill="#666"/>
      
      {/* Nurse figure (bottom-right) */}
      <circle cx="128" cy="88" r="7" fill="#4A90C4"/>
      <rect x="122" y="95" width="14" height="16" rx="3" fill="#4A90C4"/>
      {/* Nurse hat */}
      <rect x="123" y="81" width="10" height="5" rx="1" fill="white"/>
      <rect x="127" y="79" width="2" height="4" fill="#E8507A"/>
      
      {/* Device/tablet (bottom-left) */}
      <rect x="10" y="80" width="18" height="24" rx="3" fill="#2A3F5A"/>
      <rect x="12" y="82" width="14" height="18" rx="2" fill="#1565C0"/>
      {/* Screen content */}
      <line x1="14" y1="86" x2="24" y2="86" stroke="#64B5F6" strokeWidth="1"/>
      <line x1="14" y1="89" x2="22" y2="89" stroke="#64B5F6" strokeWidth="1"/>
      <line x1="14" y1="92" x2="24" y2="92" stroke="#64B5F6" strokeWidth="1"/>
    </svg>
  );

  return (
    <div className="screen nurse-home">
      <style>{`
        .nurse-home {
          background: #EEF3FF;
          min-height: 100vh;
          padding: 0;
        }
        .nurse-header {
          background: linear-gradient(135deg, #5B8DEF 0%, #4A7DD5 100%);
          color: white;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          box-shadow: 0 4px 12px rgba(91, 141, 239, 0.2);
        }
        .hamburger-icon {
          position: absolute;
          left: 20px;
          font-size: 22px;
          cursor: pointer;
          opacity: 0.9;
        }
        .nurse-header h1 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        .nurse-info-section {
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .nurse-avatar-circle {
          width: 48px;
          height: 48px;
          background: #4ECCA9;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          box-shadow: 0 4px 12px rgba(78, 204, 169, 0.2);
          flex-shrink: 0;
        }
        .nurse-text {
          font-size: 16px;
          font-weight: 600;
          color: #333;
        }
        .units-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          padding: 0 16px;
          margin-bottom: 100px;
          margin-top: 8px;
        }
        .unit-card {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          border: 1.5px solid #D4E4F7;
          position: relative;
        }
        .unit-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 20px rgba(91, 141, 239, 0.15);
          border-color: #5B8DEF;
        }
        .unit-letter-badge {
          position: absolute;
          top: 10px;
          left: 10px;
          font-size: 16px;
          font-weight: 800;
          color: #000;
          z-index: 2;
        }
        .unit-illustration {
          width: 100%;
          height: 130px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .bottom-nav {
          display: flex;
          justify-content: space-around;
          align-items: flex-end;
          background: white;
          border-top: 1px solid #E0E0E0;
          box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.05);
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 70px;
          border-radius: 20px 20px 0 0;
        }
        .nav-item-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 8px 16px 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          flex: 1;
        }
        .nav-item-wrapper.active .nav-icon {
          background: #5B8DEF;
          color: white;
        }
        .nav-icon {
          width: 44px;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          font-size: 20px;
          transition: all 0.3s ease;
          color: #BDBDBD;
        }
        .nav-label {
          font-size: 10px;
          color: #BDBDBD;
          margin-top: 4px;
          font-weight: 600;
        }
        .nav-item-wrapper.active .nav-label {
          color: #5B8DEF;
        }
      `}</style>

      <div className="nurse-header">
        <div className="hamburger-icon">≡</div>
        <h1>Units</h1>
      </div>

      <div className="nurse-info-section">
        <div className="nurse-avatar-circle">👩‍⚕️</div>
        <div className="nurse-text">Nurse/ {nurseName || 'Mary'}</div>
      </div>

      <div className="units-grid">
        {['A', 'B', 'C', 'D', 'E', 'F', 'G'].map(unit => (
          <div
            key={unit}
            className="unit-card"
            onClick={() => {
              setNurseCurrentUnit(unit);
              setScreen('nurseBeds');
            }}
            style={{ cursor: 'pointer' }}
          >
            <div className="unit-letter-badge">{unit}</div>
            <div className="unit-illustration">
              <PatientBedSVG />
            </div>
          </div>
        ))}
      </div>

      <div className="bottom-nav">
        <div className="nav-item-wrapper active">
          <div className="nav-icon">🏠</div>
          <div className="nav-label">Home</div>
        </div>
        <div className="nav-item-wrapper">
          <div className="nav-icon">📋</div>
          <div className="nav-label">Tasks</div>
        </div>
        <div className="nav-item-wrapper">
          <div className="nav-icon">👤</div>
          <div className="nav-label">Profile</div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// NURSE BEDS SCREEN
// ============================================================================
const NurseBeds = ({ units, nurseCurrentUnit, setScreen }) => {
  const occupiedBeds = units[nurseCurrentUnit]
    .map((bed, idx) => ({ bed, idx }))
    .filter(({ bed }) => bed !== null);

  const occupiedCount = occupiedBeds.length;
  const totalBeds = units[nurseCurrentUnit].length;

  return (
    <div className="screen nurse-beds">
      <style>{`
        .nurse-beds {
          background: linear-gradient(135deg, #EEF3FF 0%, #E8EEFF 100%);
          min-height: 100vh;
          padding: 20px;
          padding-bottom: 40px;
        }
        .nurse-bed-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          background: white;
          padding: 16px;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }
        .back-btn {
          background: #5B8DEF;
          color: white;
          border: none;
          width: 40px;
          height: 40px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 18px;
          transition: all 0.3s ease;
        }
        .back-btn:hover {
          background: #4A7DD5;
          transform: translateY(-2px);
        }
        .no-patients {
          text-align: center;
          padding: 40px 20px;
          color: #999;
        }
        .no-patients h3 {
          font-size: 18px;
          margin: 0 0 8px 0;
          color: #666;
        }
      `}</style>

      <div className="nurse-bed-header">
        <button className="back-btn" onClick={() => setScreen('nurseHome')}>
          ← Back
        </button>
        <div className="bed-count">
          <div className="bed-count-label">Beds in Unit {nurseCurrentUnit}</div>
          <div className="bed-count-value">{occupiedCount}/{totalBeds}</div>
        </div>
        <div style={{ width: '40px' }}></div>
      </div>

      <div className="bed-grid" style={{ maxWidth: '600px', margin: '0 auto' }}>
        {occupiedBeds.length === 0 ? (
          <div className="no-patients">
            <h3>👻 No Patients in This Unit</h3>
            <p>Unit {nurseCurrentUnit} currently has no occupied beds</p>
          </div>
        ) : (
          occupiedBeds.map(({ bed, idx }) => (
            <div key={idx} className="bed-card occupied">
              <ECGMonitor />
              <div style={{
                fontSize: '13px',
                marginBottom: '12px',
                padding: '12px',
                background: 'linear-gradient(135deg, #f8faff 0%, #eef3ff 100%)',
                borderRadius: '8px',
                border: '1px solid rgba(91, 141, 239, 0.1)'
              }}>
                <div style={{ marginBottom: '6px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div><strong style={{ color: '#333' }}>Name:</strong> <span style={{ color: '#555' }}>{bed.name}</span></div>
                  <div><strong style={{ color: '#333' }}>Age:</strong> <span style={{ color: '#555' }}>{bed.age}</span></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div><strong style={{ color: '#333' }}>Nurse:</strong> <span style={{ color: '#555' }}>{bed.nurseName}</span></div>
                  <div><strong style={{ color: '#333' }}>Illness:</strong> <span style={{ color: '#555' }}>{bed.illness}</span></div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ============================================================================
// MAIN APP COMPONENT
// ============================================================================
const HospitalBedManagementApp = () => {
  const [screen, setScreen] = useState('doctorForm');
  const [currentUnit, setCurrentUnit] = useState('A');
  const [nurseCurrentUnit, setNurseCurrentUnit] = useState(null);

  // Global State
  const [pendingPatients, setPendingPatients] = useState([]);
  const [approvedQueue, setApprovedQueue] = useState([]);

  // Pre-populate Unit A with sample patients
  const [units, setUnits] = useState({
    A: [
      {
        name: 'Ahmed Hassan',
        id: 'P001',
        age: 45,
        gender: 'Male',
        weight: 75,
        illness: 'Hypertension',
        companionPhone: '+966501234567',
        nurseName: 'Soha'
      },
      {
        name: 'Ali Ibrahim',
        id: 'P002',
        age: 31,
        gender: 'Male',
        weight: 68,
        illness: 'Heat attack',
        companionPhone: '+966502345678',
        nurseName: 'Soha'
      },
      {
        name: 'Mona Khalid',
        id: 'P003',
        age: 20,
        gender: 'Female',
        weight: 58,
        illness: 'broken',
        companionPhone: '+966503456789',
        nurseName: 'Mahmoud'
      },
      null, null, null, null, null, null, null, null, null
    ],
    B: Array(12).fill(null),
    C: Array(12).fill(null),
    D: Array(12).fill(null),
    E: Array(12).fill(null),
    F: Array(12).fill(null),
    G: Array(12).fill(null),
  });

  return (
    <div style={{ width: '100%', margin: '0 auto' }}>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto',
            'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans',
            'Helvetica Neue', sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        .screen {
          width: 100%;
          max-width: 420px;
          margin: 0 auto;
        }
      `}</style>

      {screen === 'doctorForm' && (
        <DoctorForm
          pendingPatients={pendingPatients}
          setPendingPatients={setPendingPatients}
          setScreen={setScreen}
        />
      )}

      {screen === 'adminPatientList' && (
        <AdminPatientList
          pendingPatients={pendingPatients}
          setPendingPatients={setPendingPatients}
          approvedQueue={approvedQueue}
          setApprovedQueue={setApprovedQueue}
          setScreen={setScreen}
        />
      )}

      {screen === 'adminBeds' && (
        <AdminBeds
          units={units}
          setUnits={setUnits}
          approvedQueue={approvedQueue}
          setApprovedQueue={setApprovedQueue}
          currentUnit={currentUnit}
          setCurrentUnit={setCurrentUnit}
        />
      )}

      {screen === 'nurseHome' && (
        <NurseHome
          units={units}
          setScreen={setScreen}
          setNurseCurrentUnit={setNurseCurrentUnit}
          nurseName="Sarah"
        />
      )}

      {screen === 'nurseBeds' && nurseCurrentUnit && (
        <NurseBeds
          units={units}
          nurseCurrentUnit={nurseCurrentUnit}
          setScreen={setScreen}
        />
      )}

      {/* Screen Navigation Buttons (for demo purposes) */}
      <div style={{
        position: 'fixed',
        bottom: 20,
        left: 20,
        right: 20,
        display: 'flex',
        gap: 8,
        flexWrap: 'wrap',
        justifyContent: 'center',
        zIndex: 9999,
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '12px',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        backdropFilter: 'blur(4px)'
      }}>
        <button
          onClick={() => setScreen('doctorForm')}
          style={{
            padding: '6px 10px',
            fontSize: '10px',
            background: screen === 'doctorForm' ? '#5B8DEF' : '#e0e0e0',
            color: screen === 'doctorForm' ? 'white' : '#333',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          Doctor
        </button>
        <button
          onClick={() => setScreen('adminPatientList')}
          style={{
            padding: '6px 10px',
            fontSize: '10px',
            background: screen === 'adminPatientList' ? '#5B8DEF' : '#e0e0e0',
            color: screen === 'adminPatientList' ? 'white' : '#333',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          Admin List
        </button>
        <button
          onClick={() => setScreen('adminBeds')}
          style={{
            padding: '6px 10px',
            fontSize: '10px',
            background: screen === 'adminBeds' ? '#5B8DEF' : '#e0e0e0',
            color: screen === 'adminBeds' ? 'white' : '#333',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          Admin Beds
        </button>
        <button
          onClick={() => setScreen('nurseHome')}
          style={{
            padding: '6px 10px',
            fontSize: '10px',
            background: screen === 'nurseHome' ? '#5B8DEF' : '#e0e0e0',
            color: screen === 'nurseHome' ? 'white' : '#333',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 600
          }}
        >
          Nurse Home
        </button>
      </div>
    </div>
  );
};

export default HospitalBedManagementApp;
