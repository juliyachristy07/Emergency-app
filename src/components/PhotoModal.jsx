import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, Eye, Calendar, UserCheck, Lock } from 'lucide-react';
import { ConsentBadge } from './ConsentBadge';
import { streamPhoto } from '../services/api';

export function PhotoModal({ photo, onClose, hospitalId = 'HOSP-CENTRAL-ER' }) {
  const [accessError, setAccessError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!photo) return;

    // Trigger backend stream endpoint which logs the audit VIEWED event
    streamPhoto(photo.photoId, { viewerId: hospitalId })
      .then(res => {
        setLoading(false);
        if (!res.success) {
          setAccessError(res.error || 'Photo access has expired or been revoked.');
        }
      })
      .catch(err => {
        setLoading(false);
        setAccessError('Failed to fetch photo content: Access active state validation failed.');
      });
  }, [photo, hospitalId]);

  if (!photo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <span className="text-xl">📷</span>
            <div>
              <h3 className="text-base font-semibold text-slate-100">{photo.filename}</h3>
              <p className="text-xs text-slate-400">ID: {photo.photoId} | Tag: <span className="uppercase text-cyan-400 font-mono">{photo.category}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-950/50 p-3 rounded-xl border border-slate-800">
            <ConsentBadge
              state={photo.consentState}
              showJustification={true}
              justification={photo.consentRecord?.justification}
            />

            <div className="flex items-center gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                {new Date(photo.timestamp).toLocaleTimeString()}
              </span>
              <span className="flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                {photo.consentRecord?.emtId || 'EMT-402'}
              </span>
            </div>
          </div>

          {/* Image preview or access error alert */}
          {accessError ? (
            <div className="flex flex-col items-center justify-center p-12 bg-rose-950/20 border border-rose-800/40 rounded-xl text-center">
              <Lock className="w-12 h-12 text-rose-500 mb-3" />
              <h4 className="text-lg font-bold text-rose-300 mb-1">Access Revoked / Expired</h4>
              <p className="text-sm text-rose-400/80 max-w-md">{accessError}</p>
              <p className="text-xs text-slate-500 mt-4">Per HIPAA minimal necessary and auto-expiry guidelines, hospital access is disabled after case resolution or reassignment.</p>
            </div>
          ) : (
            <div className="relative flex justify-center bg-slate-950 rounded-xl border border-slate-800/80 overflow-hidden min-h-[300px]">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 text-slate-400 text-sm">
                  Verifying consent audit log & streaming media...
                </div>
              )}
              {photo.dataUrl ? (
                <img
                  src={photo.dataUrl}
                  alt={photo.filename}
                  className="max-h-[500px] w-auto object-contain rounded-lg shadow-md"
                />
              ) : (
                <div className="p-12 text-slate-400 text-center">Image binary stream renderer</div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <Eye className="w-3.5 h-3.5" /> View event logged in immutable compliance audit trail
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
