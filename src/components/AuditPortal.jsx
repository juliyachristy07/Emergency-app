import React, { useState, useEffect } from 'react';
import { Shield, Search, Filter, RefreshCw, FileSpreadsheet, Eye, Lock, CheckCircle2 } from 'lucide-react';
import { fetchAuditLogs } from '../services/api';

export function AuditPortal() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  // Search & Filter state
  const [photoIdFilter, setPhotoIdFilter] = useState('');
  const [requestIdFilter, setRequestIdFilter] = useState('');
  const [consentStatusFilter, setConsentStatusFilter] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('');

  const loadLogs = async () => {
    setLoading(true);
    try {
      const queryParams = {};
      if (photoIdFilter) queryParams.photoId = photoIdFilter;
      if (requestIdFilter) queryParams.requestId = requestIdFilter;
      if (consentStatusFilter) queryParams.consentStatus = consentStatusFilter;
      if (eventTypeFilter) queryParams.eventType = eventTypeFilter;

      const res = await fetchAuditLogs(queryParams);
      if (res.success) {
        setLogs(res.logs);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [photoIdFilter, requestIdFilter, consentStatusFilter, eventTypeFilter]);

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `hipaa_audit_log_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/20 border border-purple-500/40 text-purple-400 rounded-xl">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                HIPAA & Medical Compliance Audit Log Vault
                <span className="px-2.5 py-0.5 text-xs font-mono bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded-full">
                  IMMUTABLE LOG
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Auditable records per photo: Consent state machine events, EMT sender, recipient hospital, view timestamps, & auto-expiry events.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadLogs}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition"
              title="Refresh Audit Records"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleExportJSON}
              className="px-4 py-2 bg-purple-900/40 hover:bg-purple-900/60 text-purple-200 border border-purple-600/40 text-xs font-semibold rounded-xl transition flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4 text-purple-400" /> Export JSON Audit Log
            </button>
          </div>
        </div>
      </div>

      {/* Query & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
          <Filter className="w-4 h-4 text-purple-400" /> Audit Log Query & Search Interface
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="text-[11px] text-slate-400 font-medium">Filter by Photo ID</label>
            <input
              type="text"
              placeholder="e.g. PHT-2001..."
              value={photoIdFilter}
              onChange={e => setPhotoIdFilter(e.target.value)}
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:border-purple-500 outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 font-medium">Filter by Request ID</label>
            <input
              type="text"
              placeholder="e.g. REQ-1001..."
              value={requestIdFilter}
              onChange={e => setRequestIdFilter(e.target.value)}
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:border-purple-500 outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 font-medium">Consent Status</label>
            <select
              value={consentStatusFilter}
              onChange={e => setConsentStatusFilter(e.target.value)}
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-purple-500 outline-none"
            >
              <option value="">All Consent States</option>
              <option value="patient_consented">patient_consented</option>
              <option value="implied_emergency_consent">implied_emergency_consent</option>
              <option value="declined">declined</option>
              <option value="pending">pending</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 font-medium">Event Type</label>
            <select
              value={eventTypeFilter}
              onChange={e => setEventTypeFilter(e.target.value)}
              className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-purple-500 outline-none"
            >
              <option value="">All Event Types</option>
              <option value="CAPTURE">CAPTURE</option>
              <option value="CONSENT_UPDATE">CONSENT_UPDATE</option>
              <option value="TRANSMIT">TRANSMIT</option>
              <option value="VIEWED">VIEWED</option>
              <option value="ACCESS_REVOKED">ACCESS_REVOKED</option>
              <option value="FALLBACK_TRIGGERED">FALLBACK_TRIGGERED</option>
              <option value="CASE_ACCEPTED">CASE_ACCEPTED</option>
              <option value="ESCALATED">ESCALATED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200">
            Immutable Log Records ({logs.length} entries found)
          </h3>
          <span className="text-xs text-slate-500 font-mono">Sorted: Newest First</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Event Type</th>
                <th className="px-4 py-3">Photo ID</th>
                <th className="px-4 py-3">Request ID</th>
                <th className="px-4 py-3">Consent Status</th>
                <th className="px-4 py-3">Sender (EMT)</th>
                <th className="px-4 py-3">Recipient Hospital</th>
                <th className="px-4 py-3">Metadata & Justification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No matching audit log records found for the active filter parameters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isViewed = log.eventType === 'VIEWED';
                  const isRevoked = log.eventType === 'ACCESS_REVOKED';
                  const isEmergency = log.consentStatus === 'implied_emergency_consent';

                  return (
                    <tr key={log.logId} className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3 font-mono text-slate-400 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>

                      <td className="px-4 py-3 font-bold font-mono">
                        <span className={`px-2 py-0.5 rounded text-[10px] ${
                          isViewed
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : isRevoked
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : log.eventType === 'TRANSMIT'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        }`}>
                          {log.eventType}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-mono text-cyan-400 font-semibold">{log.photoId}</td>
                      <td className="px-4 py-3 font-mono text-slate-300">{log.requestId}</td>

                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          isEmergency
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : log.consentStatus === 'patient_consented'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {log.consentStatus}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-slate-300 truncate max-w-[140px]">{log.senderId}</td>
                      <td className="px-4 py-3 text-cyan-300 truncate max-w-[140px]">{log.recipientHospitalId}</td>

                      <td className="px-4 py-3 text-slate-400 max-w-[280px]">
                        {log.metadata ? (
                          <div className="truncate text-[11px]" title={JSON.stringify(log.metadata)}>
                            {log.metadata.justification ? (
                              <span className="text-amber-300 italic font-mono">"{log.metadata.justification}"</span>
                            ) : log.metadata.reason ? (
                              <span className="text-rose-300 font-mono">{log.metadata.reason}</span>
                            ) : (
                              JSON.stringify(log.metadata)
                            )}
                          </div>
                        ) : '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
