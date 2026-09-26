import React from 'react';
import { ShieldCheck, AlertTriangle, ShieldX, Clock } from 'lucide-react';
import { CONSENT_STATES } from '../state/ConsentStateMachine';

export function ConsentBadge({ state, showJustification = false, justification }) {
  switch (state) {
    case CONSENT_STATES.PATIENT_CONSENTED:
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Patient Consented</span>
        </div>
      );

    case CONSENT_STATES.IMPLIED_EMERGENCY_CONSENT:
      return (
        <div className="flex flex-col gap-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/10 animate-pulse">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="uppercase tracking-wider">⚠️ EMERGENCY OVERRIDE (Implied Consent)</span>
          </div>
          {showJustification && justification && (
            <div className="text-xs italic bg-amber-950/40 text-amber-200/90 border-l-2 border-amber-500 px-2.5 py-1 rounded-r mt-0.5">
              <span className="font-semibold not-italic text-amber-400">Clinical Justification: </span>
              "{justification}"
            </div>
          )}
        </div>
      );

    case CONSENT_STATES.DECLINED:
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
          <ShieldX className="w-3.5 h-3.5 text-rose-400" />
          <span>Consent Declined (Transmission Blocked)</span>
        </div>
      );

    case CONSENT_STATES.PENDING:
    default:
      return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-700/60 text-slate-300 border border-slate-600">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Pending Evaluation</span>
        </div>
      );
  }
}
