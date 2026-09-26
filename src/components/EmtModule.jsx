import React, { useState, useEffect } from 'react';
import { Camera, Upload, Tag, AlertTriangle, Send, CheckCircle2, ShieldCheck, ShieldX, RefreshCw, Trash2, Eye } from 'lucide-react';
import { CONSENT_STATES, PHOTO_CATEGORIES, CATEGORY_LABELS } from '../state/ConsentStateMachine';
import { ConsentBadge } from './ConsentBadge';
import { uploadPhoto, tagPhoto, updateConsent, transmitRequest, fetchRequests } from '../services/api';

export function EmtModule({ onRequestTransmitted, onSwitchView }) {
  const [emtId, setEmtId] = useState('EMT-402 (Paramedic Davis)');
  const [ambulanceId, setAmbulanceId] = useState('AMB-12');
  const [requestId, setRequestId] = useState('REQ-1001');
  const [targetHospitalId, setTargetHospitalId] = useState('HOSP-CENTRAL-ER');
  const [etaMinutes, setEtaMinutes] = useState(7);

  // Patient vitals state
  const [patientData, setPatientData] = useState({
    age: 45,
    gender: 'Male',
    condition: 'Severe Trauma / Subdural Hematoma',
    consciousnessLevel: 'Unconscious (GCS 8)',
    heartRate: 122,
    bp: '90/60',
    spO2: 92,
    respRate: 26
  });

  // Local photos list
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Selected photo for consent state machine editing
  const [activePhotoId, setActivePhotoId] = useState(null);
  const [selectedConsentState, setSelectedConsentState] = useState(CONSENT_STATES.PENDING);
  const [justificationInput, setJustificationInput] = useState('');

  // Load existing photos for REQ-1001 on mount
  const loadExistingData = async () => {
    try {
      const res = await fetchRequests();
      if (res.success && res.requests.length > 0) {
        const req = res.requests.find(r => r.requestId === requestId) || res.requests[0];
        if (req && req.photos) {
          setPhotos(req.photos);
          if (req.photos.length > 0) {
            setActivePhotoId(req.photos[0].photoId);
            setSelectedConsentState(req.photos[0].consentState);
            setJustificationInput(req.photos[0].consentRecord?.justification || '');
          }
        }
      }
    } catch (err) {
      console.error('Failed to load EMT data:', err);
    }
  };

  useEffect(() => {
    loadExistingData();
  }, []);

  // Quick preset capture simulators
  const handleSimulateCapture = async (category, label, color, svgText) => {
    setLoading(true);
    const dataUrl = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="100%" height="100%" fill="%230f172a"/><rect x="20" y="20" width="360" height="260" rx="10" fill="${encodeURIComponent(color)}" opacity="0.2" stroke="${encodeURIComponent(color)}" stroke-width="3"/><text x="50%" y="45%" fill="%23f8fafc" font-size="18" font-family="sans-serif" font-weight="bold" text-anchor="middle">${encodeURIComponent(label)}</text><text x="50%" y="62%" fill="%2394a3b8" font-size="13" font-family="monospace" text-anchor="middle">${encodeURIComponent(svgText)}</text></svg>`;

    const res = await uploadPhoto({
      requestId,
      category,
      filename: `${category}_capture_${Date.now().toString().slice(-4)}.jpg`,
      dataUrl,
      emtId
    });

    setLoading(false);
    if (res.success) {
      setPhotos(prev => [res.photo, ...prev]);
      setActivePhotoId(res.photo.photoId);
      setSelectedConsentState(res.photo.consentState);
      setJustificationInput('');
      setStatusMessage({ type: 'success', text: `Captured ${label} photo! Tagged: ${category}` });
    }
  };

  // Handle custom local file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      setLoading(true);
      const res = await uploadPhoto({
        requestId,
        category: PHOTO_CATEGORIES.INJURY,
        filename: file.name,
        dataUrl: evt.target.result,
        emtId
      });
      setLoading(false);
      if (res.success) {
        setPhotos(prev => [res.photo, ...prev]);
        setActivePhotoId(res.photo.photoId);
        setSelectedConsentState(res.photo.consentState);
        setStatusMessage({ type: 'success', text: `Uploaded ${file.name}` });
      }
    };
    reader.readAsDataURL(file);
  };

  // Update photo tag / category
  const handleTagCategory = async (photoId, newCategory) => {
    const res = await tagPhoto(photoId, { category: newCategory });
    if (res.success) {
      setPhotos(prev => prev.map(p => p.photoId === photoId ? res.photo : p));
      setStatusMessage({ type: 'info', text: `Updated category tag to '${newCategory}'` });
    }
  };

  // Toggle selection for Minimal Necessary Sharing
  const handleToggleSelection = async (photoId, currentSelected) => {
    const res = await tagPhoto(photoId, { isSelected: !currentSelected });
    if (res.success) {
      setPhotos(prev => prev.map(p => p.photoId === photoId ? res.photo : p));
    }
  };

  // Apply Consent State Machine update
  const handleApplyConsent = async (targetState, isBulk = false) => {
    if (targetState === CONSENT_STATES.IMPLIED_EMERGENCY_CONSENT) {
      if (!justificationInput || justificationInput.trim().length < 5) {
        setStatusMessage({
          type: 'error',
          text: '⚠️ EMERGENCY OVERRIDE REQUIREMENT: You must provide a clinical justification for implied emergency consent (e.g. "Patient unconscious, GCS 8").'
        });
        return;
      }
    }

    setLoading(true);
    const payload = isBulk
      ? { requestId, targetState, emtId, justification: justificationInput }
      : { photoId: activePhotoId, targetState, emtId, justification: justificationInput };

    const res = await updateConsent(payload);
    setLoading(false);

    if (res.success) {
      if (isBulk && res.photos) {
        setPhotos(res.photos);
      } else if (res.photo) {
        setPhotos(prev => prev.map(p => p.photoId === activePhotoId ? res.photo : p));
      }
      setSelectedConsentState(targetState);
      setStatusMessage({
        type: 'success',
        text: `Consent state updated to '${targetState}' and logged in audit trail.`
      });
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'Failed to update consent state.' });
    }
  };

  // Transmit Request to Hospital
  const handleTransmit = async () => {
    setLoading(true);
    const res = await transmitRequest({
      requestId,
      emtId,
      ambulanceId,
      patientSummary: {
        age: patientData.age,
        gender: patientData.gender,
        condition: patientData.condition,
        consciousnessLevel: patientData.consciousnessLevel,
        vitals: {
          heartRate: Number(patientData.heartRate),
          bp: patientData.bp,
          spO2: Number(patientData.spO2),
          respRate: Number(patientData.respRate)
        }
      },
      etaMinutes: Number(etaMinutes),
      targetHospitalId
    });
    setLoading(false);

    if (res.success) {
      setStatusMessage({
        type: 'success',
        text: res.message
      });
      if (onRequestTransmitted) onRequestTransmitted();
    } else {
      setStatusMessage({ type: 'error', text: res.error || 'Transmission failed.' });
    }
  };

  const activePhoto = photos.find(p => p.photoId === activePhotoId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & EMT Status */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-500/20 border border-red-500/40 text-red-400 rounded-xl">
              <Camera className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                Ambulance Dispatch Station ({ambulanceId})
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full">
                  LIVE FIELD LINK
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                EMT Operator: <span className="text-slate-200 font-medium">{emtId}</span> | Target Hospital: <span className="text-cyan-400 font-medium">St. Jude Emergency Care</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onSwitchView && onSwitchView('hospital')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold rounded-xl border border-cyan-500/30 transition flex items-center gap-2"
            >
              <Eye className="w-4 h-4" /> View Receiving Hospital Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {statusMessage && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-sm transition-all ${
          statusMessage.type === 'error'
            ? 'bg-rose-950/40 border-rose-600 text-rose-200'
            : statusMessage.type === 'success'
            ? 'bg-emerald-950/40 border-emerald-600 text-emerald-200'
            : 'bg-cyan-950/40 border-cyan-600 text-cyan-200'
        }`}>
          <div className="flex items-center gap-2">
            {statusMessage.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />}
            {statusMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-xs opacity-70 hover:opacity-100 font-bold px-2">✕</button>
        </div>
      )}

      {/* Main Grid: Patient Summary & Capture Engine */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Patient Clinical Info & Vitals */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-base font-bold text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-800">
            <span>📋 Patient Profile & Vitals</span>
          </h3>

          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 font-medium">Condition & Assessment</label>
              <input
                type="text"
                value={patientData.condition}
                onChange={e => setPatientData({ ...patientData, condition: e.target.value })}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 outline-none"
              />
            </div>

            <div>
              <label className="text-xs text-slate-400 font-medium">Consciousness Level</label>
              <select
                value={patientData.consciousnessLevel}
                onChange={e => setPatientData({ ...patientData, consciousnessLevel: e.target.value })}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 outline-none"
              >
                <option value="Unconscious (GCS 8)">Unconscious / Incapacitated (GCS 8)</option>
                <option value="Semiconscious (GCS 12)">Semiconscious / Confused (GCS 12)</option>
                <option value="Alert & Oriented x4">Alert & Oriented x4 (GCS 15)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-xs text-slate-400 font-medium">Heart Rate (BPM)</label>
                <input
                  type="number"
                  value={patientData.heartRate}
                  onChange={e => setPatientData({ ...patientData, heartRate: e.target.value })}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-emerald-400 focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium">Blood Pressure</label>
                <input
                  type="text"
                  value={patientData.bp}
                  onChange={e => setPatientData({ ...patientData, bp: e.target.value })}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-emerald-400 focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium">SpO2 (%)</label>
                <input
                  type="number"
                  value={patientData.spO2}
                  onChange={e => setPatientData({ ...patientData, spO2: e.target.value })}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-cyan-400 focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium">ETA to Hospital (min)</label>
                <input
                  type="number"
                  value={etaMinutes}
                  onChange={e => setEtaMinutes(e.target.value)}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-mono text-amber-400 focus:border-cyan-500 outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Center & Right Column: Capture, Tagging & Consent Gate */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
              <span>📷 Step 1: Capture & Category Tagging</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">REQ: {requestId}</span>
          </div>

          {/* Quick Capture Presets */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => handleSimulateCapture(PHOTO_CATEGORIES.INJURY, 'Laceration / Fracture', '#ef4444', 'Leg Laceration & Trauma Site')}
              className="p-3 bg-red-950/20 hover:bg-red-950/40 border border-red-800/40 rounded-xl text-left transition group"
            >
              <div className="text-xl mb-1">🩹</div>
              <div className="text-xs font-bold text-red-300 group-hover:text-red-200">Capture Injury</div>
              <div className="text-[10px] text-red-400/70">Category: injury</div>
            </button>

            <button
              onClick={() => handleSimulateCapture(PHOTO_CATEGORIES.VITALS, 'ECG Monitor Screenshot', '#22c55e', 'HR 122 | BP 90/60 | SpO2 92%')}
              className="p-3 bg-emerald-950/20 hover:bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-left transition group"
            >
              <div className="text-xl mb-1">📊</div>
              <div className="text-xs font-bold text-emerald-300 group-hover:text-emerald-200">Capture Vitals</div>
              <div className="text-[10px] text-emerald-400/70">Category: vitals</div>
            </button>

            <button
              onClick={() => handleSimulateCapture(PHOTO_CATEGORIES.IDENTIFICATION, 'Patient ID Card', '#0284c7', 'Driver License / Medical Card')}
              className="p-3 bg-sky-950/20 hover:bg-sky-950/40 border border-sky-800/40 rounded-xl text-left transition group"
            >
              <div className="text-xl mb-1">🪪</div>
              <div className="text-xs font-bold text-sky-300 group-hover:text-sky-200">Capture ID</div>
              <div className="text-[10px] text-sky-400/70">Category: identification</div>
            </button>

            <label className="p-3 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-left transition cursor-pointer flex flex-col justify-center">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 mb-1">
                <Upload className="w-4 h-4 text-cyan-400" /> Upload File
              </div>
              <div className="text-[10px] text-slate-400">Custom camera / image</div>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {/* Captured Photos Grid */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Captured Photos ({photos.length}) — Minimal Necessary Sharing Selector
              </h4>
              <span className="text-[11px] text-slate-500">Uncheck photo to deselect from payload before dispatch</span>
            </div>

            {photos.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl text-slate-500 text-sm">
                No photos captured yet. Click a preset above to capture media in the field.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {photos.map((photo) => {
                  const isActive = photo.photoId === activePhotoId;
                  return (
                    <div
                      key={photo.photoId}
                      onClick={() => {
                        setActivePhotoId(photo.photoId);
                        setSelectedConsentState(photo.consentState);
                        setJustificationInput(photo.consentRecord?.justification || '');
                      }}
                      className={`relative p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between ${
                        isActive
                          ? 'bg-slate-800/90 border-cyan-500 shadow-lg ring-1 ring-cyan-500/50'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          {/* Deselect / Minimal necessary sharing checkbox */}
                          <input
                            type="checkbox"
                            checked={photo.isSelected}
                            onChange={(e) => {
                              e.stopPropagation();
                              handleToggleSelection(photo.photoId, photo.isSelected);
                            }}
                            className="w-4 h-4 rounded text-cyan-500 bg-slate-900 border-slate-700 focus:ring-cyan-500"
                            title="Include in transmission payload"
                          />
                          <span className="text-xs font-semibold text-slate-200 truncate max-w-[120px]">
                            {photo.filename}
                          </span>
                        </div>

                        {/* Category tag dropdown */}
                        <select
                          value={photo.category}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleTagCategory(photo.photoId, e.target.value);
                          }}
                          className="text-[11px] bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-cyan-300 font-mono"
                        >
                          <option value="injury">injury</option>
                          <option value="vitals">vitals</option>
                          <option value="identification">identification</option>
                          <option value="scene">scene</option>
                        </select>
                      </div>

                      {/* Image Thumbnail */}
                      <div className="relative h-28 w-full bg-slate-900 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center my-1">
                        {photo.dataUrl ? (
                          <img src={photo.dataUrl} alt={photo.filename} className="h-full w-full object-cover" />
                        ) : (
                          <div className="text-slate-600 text-xs font-mono">MEDIA BINARY</div>
                        )}
                        {!photo.isSelected && (
                          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-[1px] flex items-center justify-center text-xs font-bold text-amber-400">
                            DESELECTED (OFF PAYLOAD)
                          </div>
                        )}
                      </div>

                      {/* Consent status footer */}
                      <div className="mt-2 flex items-center justify-between text-[11px]">
                        <ConsentBadge state={photo.consentState} />
                        <span className="text-slate-500 font-mono">
                          {new Date(photo.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Consent State Machine Control Panel */}
          {activePhoto && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4 shadow-inner">
              <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <span>🔒 Step 2: Consent State Machine Control Panel</span>
                  <span className="text-xs text-cyan-400 font-mono">Target: {activePhoto.filename}</span>
                </h4>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>Apply to:</span>
                  <button
                    onClick={() => handleApplyConsent(selectedConsentState, false)}
                    className="px-2.5 py-1 bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-500/40 rounded font-medium text-xs transition"
                  >
                    Active Photo Only
                  </button>
                  <button
                    onClick={() => handleApplyConsent(selectedConsentState, true)}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded font-medium text-xs transition"
                  >
                    All Case Photos
                  </button>
                </div>
              </div>

              {/* State Selection Radios */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Patient Consented */}
                <button
                  onClick={() => {
                    setSelectedConsentState(CONSENT_STATES.PATIENT_CONSENTED);
                    handleApplyConsent(CONSENT_STATES.PATIENT_CONSENTED);
                  }}
                  className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
                    activePhoto.consentState === CONSENT_STATES.PATIENT_CONSENTED
                      ? 'bg-emerald-950/40 border-emerald-500 text-emerald-200 ring-1 ring-emerald-500/50'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold">Patient Consented</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Explicit verbal or written permission granted by patient.</div>
                  </div>
                </button>

                {/* 2. Implied Emergency Consent (Override) */}
                <button
                  onClick={() => {
                    setSelectedConsentState(CONSENT_STATES.IMPLIED_EMERGENCY_CONSENT);
                  }}
                  className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
                    activePhoto.consentState === CONSENT_STATES.IMPLIED_EMERGENCY_CONSENT
                      ? 'bg-amber-950/50 border-amber-500 text-amber-200 ring-1 ring-amber-500/50'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-amber-300">Implied Emergency Consent</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Emergency override for unconscious / incapacitated patients.</div>
                  </div>
                </button>

                {/* 3. Consent Declined */}
                <button
                  onClick={() => {
                    setSelectedConsentState(CONSENT_STATES.DECLINED);
                    handleApplyConsent(CONSENT_STATES.DECLINED);
                  }}
                  className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
                    activePhoto.consentState === CONSENT_STATES.DECLINED
                      ? 'bg-rose-950/40 border-rose-500 text-rose-200 ring-1 ring-rose-500/50'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <ShieldX className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-rose-300">Declined</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">Patient refused media sharing. Triggers text-only fallback.</div>
                  </div>
                </button>
              </div>

              {/* Justification Input Form (Mandatory for Emergency Override) */}
              {selectedConsentState === CONSENT_STATES.IMPLIED_EMERGENCY_CONSENT && (
                <div className="bg-amber-950/30 border border-amber-500/40 rounded-xl p-4 space-y-3 animate-fadeIn">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>EMERGENCY OVERRIDE AUDIT JUSTIFICATION (REQUIRED)</span>
                  </div>
                  <p className="text-xs text-amber-200/80">
                    Federal medical privacy standards mandate a documented clinical rationale when applying implied emergency consent.
                  </p>
                  <textarea
                    rows={2}
                    value={justificationInput}
                    onChange={e => setJustificationInput(e.target.value)}
                    placeholder="Enter clinical reason (e.g. Patient unconscious post motor vehicle accident, GCS 8, severe trauma requiring emergency surgical prep)..."
                    className="w-full bg-slate-900 border border-amber-500/40 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-amber-500 placeholder:text-slate-600"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleApplyConsent(CONSENT_STATES.IMPLIED_EMERGENCY_CONSENT)}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-lg transition shadow-md shadow-amber-600/20"
                    >
                      Confirm Emergency Override & Log Decision
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Transmit Action Section */}
          <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs text-slate-400">
              <span className="font-bold text-slate-200">Transmission Payload Status: </span>
              {photos.filter(p => p.isSelected && (p.consentState === CONSENT_STATES.PATIENT_CONSENTED || p.consentState === CONSENT_STATES.IMPLIED_EMERGENCY_CONSENT)).length} photo(s) approved for attached handoff payload.
            </div>

            <button
              onClick={handleTransmit}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-red-600/25 flex items-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>DISPATCH HANDOFF PAYLOAD TO HOSPITAL</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
