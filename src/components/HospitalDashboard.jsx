import React, { useState, useEffect } from 'react';
import { Building2, Clock, CheckCircle2, XCircle, ArrowRightLeft, AlertTriangle, Eye, ShieldCheck, ShieldAlert, FileText, Lock } from 'lucide-react';
import { fetchRequests, handleHospitalAction } from '../services/api';
import { ConsentBadge } from './ConsentBadge';
import { PhotoModal } from './PhotoModal';
import { CONSENT_STATES } from '../state/ConsentStateMachine';

export function HospitalDashboard({ onSwitchView }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);

  // 45-second live countdown timer simulation
  const [countdown, setCountdown] = useState(45);

  const loadRequests = async () => {
    try {
      const res = await fetchRequests();
      if (res.success) {
        setRequests(res.requests);
      }
    } catch (err) {
      console.error('Failed to load hospital requests:', err);
    }
  };

  useEffect(() => {
    loadRequests();
    const interval = setInterval(() => {
      loadRequests();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Timer tick down
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAction = async (requestId, action, extraParams = {}) => {
    setLoading(true);
    const res = await handleHospitalAction(requestId, { action, ...extraParams });
    setLoading(false);

    if (res.success) {
      setActionMessage({ type: 'success', text: res.message });
      loadRequests();
    } else {
      setActionMessage({ type: 'error', text: res.error || 'Action failed' });
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Hospital Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 rounded-xl">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                St. Jude Central Emergency Hospital — Triage & Handoff Command
              </h2>
              <p className="text-xs text-slate-400">
                Hospital ID: <span className="font-mono text-cyan-400">HOSP-CENTRAL-ER</span> | Trauma Response Level: <span className="text-emerald-400 font-semibold">Level 1 Trauma Unit</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-amber-400">
              <Clock className="w-4 h-4 text-amber-500 animate-spin" />
              <span>DECISION TIMEOUT: {countdown}s</span>
            </div>

            <button
              onClick={() => onSwitchView && onSwitchView('emt')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
            >
              🚑 EMT Field Station
            </button>
          </div>
        </div>
      </div>

      {/* Action Notification */}
      {actionMessage && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-sm transition-all ${
          actionMessage.type === 'error'
            ? 'bg-rose-950/40 border-rose-600 text-rose-200'
            : 'bg-emerald-950/40 border-emerald-600 text-emerald-200'
        }`}>
          <span>{actionMessage.text}</span>
          <button onClick={() => setActionMessage(null)} className="text-xs font-bold opacity-70 hover:opacity-100">✕</button>
        </div>
      )}

      {/* Incoming Requests Feed */}
      <div className="space-y-6">
        {requests.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-400">
            No active incoming ambulance transfer requests at this moment.
          </div>
        ) : (
          requests.map((req) => {
            const isEmergencyOverride = req.consentSummary?.consentState === CONSENT_STATES.IMPLIED_EMERGENCY_CONSENT;
            const isDeclinedFallback = req.photos?.length === 0;

            return (
              <div
                key={req.requestId}
                className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl transition hover:border-slate-700"
              >
                {/* Request Banner Header */}
                <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-red-600/20 border border-red-500/40 text-red-400 font-bold text-xs rounded-full animate-pulse">
                      INCOMING AMBULANCE (AMB-12)
                    </span>
                    <h3 className="text-lg font-bold text-slate-100">{req.requestId}</h3>
                    <span className="text-xs text-slate-400 font-mono">ETA: <strong className="text-amber-400 text-sm">{req.etaMinutes} MINS</strong></span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      req.status === 'accepted'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : req.status === 'declined' || req.status === 'timed_out'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                    }`}>
                      Status: {req.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Body: Patient Vitals & Inline Photo Gallery */}
                <div className="p-6 space-y-6">
                  
                  {/* Emergency Override Banner Alert */}
                  {isEmergencyOverride && (
                    <div className="bg-amber-950/40 border-l-4 border-amber-500 p-4 rounded-r-xl flex items-start gap-3">
                      <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-bold text-amber-300 uppercase tracking-wide">
                          ⚠️ EMERGENCY CONSENT OVERRIDE ACTIVE (IMPLIED CONSENT)
                        </h4>
                        <p className="text-xs text-amber-200/90 mt-0.5">
                          Patient condition evaluated as incapacitated / unconscious. EMT Davis applied clinical override per HIPAA emergency prep guidelines.
                        </p>
                        {req.consentSummary?.justification && (
                          <div className="mt-2 text-xs font-mono text-amber-100 bg-amber-900/40 px-3 py-1.5 rounded border border-amber-600/30">
                            <strong>JUSTIFICATION: </strong>"{req.consentSummary.justification}"
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Fallback Notice Banner */}
                  {isDeclinedFallback && req.status === 'pending_acceptance' && (
                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-start gap-3 text-slate-300">
                      <FileText className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <span className="font-bold text-slate-100">TEXT-ONLY FALLBACK MODE ACTIVE: </span>
                        Patient declined media sharing. Per Fallback Rule #7, zero photos were transmitted. Structured clinical vitals and text assessment continue normally through triage escalation.
                      </div>
                    </div>
                  )}

                  {/* Patient Clinical Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                      <div className="text-xs text-slate-400 font-medium">Patient Info</div>
                      <div className="text-sm font-bold text-slate-200 mt-1">{req.patientSummary.gender}, {req.patientSummary.age} yrs</div>
                      <div className="text-xs text-slate-400 mt-0.5">{req.patientSummary.consciousnessLevel}</div>
                    </div>

                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                      <div className="text-xs text-slate-400 font-medium">Chief Complaint</div>
                      <div className="text-sm font-bold text-red-400 mt-1">{req.patientSummary.condition}</div>
                      <div className="text-xs text-slate-500 mt-0.5">EMT ID: {req.emtId}</div>
                    </div>

                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                      <div className="text-xs text-slate-400 font-medium">Heart Rate & BP</div>
                      <div className="text-sm font-bold font-mono text-emerald-400 mt-1">
                        {req.patientSummary.vitals.heartRate} bpm | {req.patientSummary.vitals.bp}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">SpO2: {req.patientSummary.vitals.spO2}%</div>
                    </div>

                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl">
                      <div className="text-xs text-slate-400 font-medium">Attached Photos</div>
                      <div className="text-sm font-bold text-cyan-400 mt-1">
                        {req.photos?.length || 0} Media File(s)
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">Consent-gated transmission</div>
                    </div>
                  </div>

                  {/* Inline Media Rendering Section (Integrated into Accept/Decline/Timeout UI) */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                      <span>🖼️ Inline Transmitted Medical Photos & Consent Badges</span>
                    </h4>

                    {req.photos && req.photos.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {req.photos.map((photo) => (
                          <div
                            key={photo.photoId}
                            onClick={() => photo.accessActive && setSelectedPhoto(photo)}
                            className={`p-4 bg-slate-950 border rounded-xl flex flex-col justify-between transition ${
                              photo.accessActive
                                ? 'border-slate-800 hover:border-cyan-500/50 cursor-pointer group'
                                : 'border-slate-800/50 opacity-60 cursor-not-allowed'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-bold text-slate-200 truncate">{photo.filename}</span>
                                <span className="px-2 py-0.5 text-[10px] font-mono bg-slate-900 text-cyan-400 rounded border border-slate-700">
                                  {photo.category}
                                </span>
                              </div>

                              {/* Media Stream Thumbnail */}
                              <div className="relative h-40 w-full bg-slate-900 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center my-2">
                                {photo.accessActive ? (
                                  <>
                                    <img
                                      src={photo.dataUrl}
                                      alt={photo.filename}
                                      className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                                    />
                                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-xs font-bold text-white gap-1.5">
                                      <Eye className="w-4 h-4 text-cyan-400" /> Click to Inspect & Log View Event
                                    </div>
                                  </>
                                ) : (
                                  <div className="flex flex-col items-center justify-center text-center p-3 text-rose-400">
                                    <Lock className="w-8 h-8 text-rose-500 mb-1" />
                                    <span className="text-xs font-bold">ACCESS REVOKED</span>
                                    <span className="text-[10px] text-slate-500 mt-0.5">Auto-expired on case resolution</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="mt-2 space-y-2">
                              {/* Consent Badge */}
                              <ConsentBadge
                                state={photo.consentState}
                                showJustification={false}
                              />
                              <div className="text-[10px] text-slate-500 flex items-center justify-between">
                                <span>Captured: {new Date(photo.timestamp).toLocaleTimeString()}</span>
                                <span className={photo.accessActive ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                                  {photo.accessActive ? '● Access Active' : '○ Access Expired'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center bg-slate-950 border border-slate-800 rounded-xl text-slate-500 text-sm">
                        No photos attached. Either patient declined media transmission or EMT deselected media. Fallback vitals/text data processed.
                      </div>
                    )}
                  </div>

                  {/* Accept / Decline / Reassign Action Bar */}
                  <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
                    <div className="text-xs text-slate-400">
                      Case Status: <strong className="text-slate-200">{req.status}</strong> | Target: <span className="text-cyan-400">{req.targetHospitalName}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => handleAction(req.requestId, 'accept')}
                        disabled={loading || req.status === 'accepted'}
                        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-slate-950 font-bold text-xs rounded-xl transition shadow-lg shadow-emerald-600/20 flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>ACCEPT HANDOFF (Auto-Revokes Photo Access)</span>
                      </button>

                      <button
                        onClick={() => handleAction(req.requestId, 'decline')}
                        disabled={loading || req.status === 'accepted'}
                        className="px-4 py-2.5 bg-rose-950/60 hover:bg-rose-900 border border-rose-700/50 text-rose-200 font-bold text-xs rounded-xl transition flex items-center gap-2"
                      >
                        <XCircle className="w-4 h-4 text-rose-400" />
                        <span>DECLINE & ESCALATE</span>
                      </button>

                      <button
                        onClick={() => handleAction(req.requestId, 'reassign')}
                        disabled={loading || req.status === 'accepted'}
                        className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold text-xs rounded-xl border border-slate-700 transition flex items-center gap-2"
                      >
                        <ArrowRightLeft className="w-4 h-4 text-cyan-400" />
                        <span>REASSIGN HOSPITAL</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Expanded Photo Preview Modal */}
      {selectedPhoto && (
        <PhotoModal
          photo={selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          hospitalId="HOSP-CENTRAL-ER"
        />
      )}
    </div>
  );
}
