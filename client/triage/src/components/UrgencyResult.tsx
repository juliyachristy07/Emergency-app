import React from 'react';
import {
  AlertTriangle,
  AlertOctagon,
  CheckCircle,
  Clock,
  ShieldCheck,
  Stethoscope,
  Info,
} from 'lucide-react';
import type { TriageCalculationResult, UrgencyLevel } from '../types/triage';

interface UrgencyResultProps {
  result: TriageCalculationResult | null;
}

export const UrgencyResult: React.FC<UrgencyResultProps> = ({ result }) => {
  if (!result) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center text-center min-h-[300px]">
        <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-slate-500 mb-3">
          <Stethoscope className="w-7 h-7" />
        </div>
        <h3 className="text-base font-semibold text-slate-300 mb-1">
          Awaiting Triage Assessment
        </h3>
        <p className="text-xs text-slate-400 max-w-sm">
          Select clinical signs and review live vitals, then click &ldquo;Calculate / Update Triage&rdquo; to evaluate the prototype urgency level.
        </p>
      </div>
    );
  }

  const { urgencyLevel, totalScore, maxPossibleScore, riskFactors, recommendations, calculatedAt, disclaimer } =
    result;

  const getUrgencyConfig = (level: UrgencyLevel) => {
    switch (level) {
      case 'CRITICAL':
        return {
          bg: 'bg-rose-950/40',
          border: 'border-rose-500/70',
          accent: 'from-rose-600 to-red-600',
          badgeBg: 'bg-rose-600 text-white',
          textColor: 'text-rose-400',
          icon: <AlertOctagon className="w-7 h-7 text-rose-400 animate-pulse" />,
          description: 'Immediate resuscitation / emergency intervention required. Notify trauma/ICU team immediately.',
        };
      case 'HIGH':
        return {
          bg: 'bg-orange-950/30',
          border: 'border-orange-500/60',
          accent: 'from-orange-500 to-amber-600',
          badgeBg: 'bg-orange-600 text-white',
          textColor: 'text-orange-400',
          icon: <AlertTriangle className="w-7 h-7 text-orange-400" />,
          description: 'Urgent treatment priority. Patient has unstable vitals or high-risk trauma indicators.',
        };
      case 'MODERATE':
        return {
          bg: 'bg-amber-950/30',
          border: 'border-amber-500/60',
          accent: 'from-amber-500 to-yellow-500',
          badgeBg: 'bg-amber-500 text-slate-950',
          textColor: 'text-amber-400',
          icon: <Info className="w-7 h-7 text-amber-400" />,
          description: 'Observation required. Potentially serious but stable vital thresholds detected.',
        };
      case 'LOW':
      default:
        return {
          bg: 'bg-emerald-950/30',
          border: 'border-emerald-500/60',
          accent: 'from-emerald-500 to-teal-500',
          badgeBg: 'bg-emerald-600 text-white',
          textColor: 'text-emerald-400',
          icon: <CheckCircle className="w-7 h-7 text-emerald-400" />,
          description: 'Non-urgent baseline. Patient vitals and symptoms indicate low immediate risk.',
        };
    }
  };

  const config = getUrgencyConfig(urgencyLevel);

  return (
    <div
      className={`bg-slate-900 border ${config.border} rounded-2xl p-6 shadow-xl relative overflow-hidden transition-all duration-300`}
    >
      {/* Top accent light based on urgency */}
      <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${config.accent}`} />

      {/* Header with Title and Timestamp */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Automated Decision Support
          </span>
          <h2 className="text-xl font-bold text-white tracking-wide">
            Prototype Triage Support Result
          </h2>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Assessed at {calculatedAt}</span>
        </div>
      </div>

      {/* Main Urgency Badge & Score Display */}
      <div
        className={`${config.bg} border ${config.border} rounded-2xl p-5 mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
      >
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-700/60 shrink-0">
            {config.icon}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-2xl font-black tracking-wider px-3 py-1 rounded-xl ${config.badgeBg}`}>
                {urgencyLevel}
              </span>
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Priority Status
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-md">{config.description}</p>
          </div>
        </div>

        <div className="sm:text-right shrink-0 border-t sm:border-t-0 sm:border-l border-slate-700/60 pt-3 sm:pt-0 sm:pl-5">
          <span className="text-[11px] text-slate-400 block font-medium">Demo Risk Score</span>
          <div className="flex items-baseline sm:justify-end gap-1">
            <span className={`text-3xl font-black font-mono ${config.textColor}`}>
              {totalScore}
            </span>
            <span className="text-xs text-slate-500 font-mono">/ {maxPossibleScore}</span>
          </div>
        </div>
      </div>

      {/* Risk Factors and Paramedic Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        {/* Identified Risk Factors */}
        <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Contributing Risk Factors</span>
          </h4>
          {riskFactors.length > 0 ? (
            <ul className="space-y-1.5">
              {riskFactors.map((factor, idx) => (
                <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                  <span>{factor}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400 italic">No elevated risk factors detected.</p>
          )}
        </div>

        {/* Action Recommendations */}
        <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Recommended Paramedic Actions</span>
          </h4>
          <ul className="space-y-1.5">
            {recommendations.map((rec, idx) => (
              <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Mandatory Medical Disclaimer */}
      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-start gap-2.5 text-xs">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="font-semibold text-amber-200">MEDICAL DISCLAIMER: </strong>
          {disclaimer}
        </div>
      </div>
    </div>
  );
};
