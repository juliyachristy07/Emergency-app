import React from 'react';
import {
  Brain,
  Droplet,
  Gauge,
  ShieldAlert,
  Flame,
  Car,
  UserX,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import type {
  TriageInput,
  ConsciousnessLevel,
  BleedingLevel,
  InjuryMechanism,
} from '../types/triage';

interface TriageFormProps {
  formData: TriageInput;
  onChange: (updated: TriageInput) => void;
  onSubmit: (e: React.FormEvent) => void;
  isCalculating: boolean;
}

export const TriageForm: React.FC<TriageFormProps> = ({
  formData,
  onChange,
  onSubmit,
  isCalculating,
}) => {
  const consciousnessOptions: { label: ConsciousnessLevel; desc: string }[] = [
    { label: 'Alert', desc: 'Eyes open, oriented, follows commands' },
    { label: 'Confused', desc: 'Disoriented to time/place, slow response' },
    { label: 'Unresponsive', desc: 'No eye opening, does not track or respond' },
  ];

  const bleedingOptions: { label: BleedingLevel; desc: string; color: string }[] = [
    { label: 'None', desc: 'No visible hemorrhage', color: 'border-slate-700' },
    { label: 'Mild', desc: 'Capillary/venous oozing, controllable', color: 'border-amber-500/50' },
    { label: 'Severe', desc: 'Arterial spurting or major uncontrolled bleed', color: 'border-rose-500/60' },
  ];

  const mechanismOptions: { label: InjuryMechanism; icon: React.ReactNode }[] = [
    { label: 'Road Accident', icon: <Car className="w-4 h-4" /> },
    { label: 'Fall', icon: <UserX className="w-4 h-4" /> },
    { label: 'Burn', icon: <Flame className="w-4 h-4" /> },
    { label: 'Assault', icon: <ShieldAlert className="w-4 h-4" /> },
    { label: 'Other', icon: <HelpCircle className="w-4 h-4" /> },
  ];

  const getPainColor = (val: number) => {
    if (val === 0) return 'text-slate-400';
    if (val <= 3) return 'text-emerald-400';
    if (val <= 6) return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <form
      onSubmit={onSubmit}
      className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between"
    >
      {/* Top accent light */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" />

      <div>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white tracking-wide">
                Triage Clinical Assessment
              </h2>
              <p className="text-xs text-slate-400">Paramedic Field Evaluation Inputs</p>
            </div>
          </div>
          <span className="text-[11px] font-mono text-slate-500 bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-700/60">
            Form Protocol v1.0
          </span>
        </div>

        <div className="space-y-5">
          {/* Consciousness Selection */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-2">
              <Brain className="w-4 h-4 text-indigo-400" />
              <span>Consciousness State (AVPU)</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {consciousnessOptions.map(({ label, desc }) => {
                const selected = formData.consciousness === label;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => onChange({ ...formData, consciousness: label })}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selected
                        ? label === 'Unresponsive'
                          ? 'bg-rose-950/40 border-rose-500 text-white ring-1 ring-rose-500'
                          : label === 'Confused'
                          ? 'bg-amber-950/40 border-amber-500 text-white ring-1 ring-amber-500'
                          : 'bg-indigo-950/40 border-indigo-500 text-white ring-1 ring-indigo-500'
                        : 'bg-slate-800/40 border-slate-700/70 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-semibold text-xs mb-1 flex items-center justify-between">
                      <span>{label}</span>
                      {selected && (
                        <span className="w-2 h-2 rounded-full bg-current animate-ping" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bleeding Selection */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-2">
              <Droplet className="w-4 h-4 text-rose-400" />
              <span>External Hemorrhage / Bleeding</span>
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {bleedingOptions.map(({ label, desc }) => {
                const selected = formData.bleeding === label;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => onChange({ ...formData, bleeding: label })}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selected
                        ? label === 'Severe'
                          ? 'bg-rose-950/50 border-rose-500 text-white ring-1 ring-rose-500'
                          : label === 'Mild'
                          ? 'bg-amber-950/40 border-amber-500 text-white ring-1 ring-amber-500'
                          : 'bg-emerald-950/40 border-emerald-500 text-white ring-1 ring-emerald-500'
                        : 'bg-slate-800/40 border-slate-700/70 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="font-semibold text-xs mb-0.5">{label}</div>
                    <p className="text-[11px] text-slate-400 truncate">{desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pain Scale (0 to 10) */}
          <div className="bg-slate-800/40 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                <Gauge className="w-4 h-4 text-amber-400" />
                <span>Pain Level Scale (0 - 10)</span>
              </label>
              <div className="flex items-baseline gap-1">
                <span className={`text-xl font-bold font-mono ${getPainColor(formData.painLevel)}`}>
                  {formData.painLevel}
                </span>
                <span className="text-xs text-slate-500">/ 10</span>
              </div>
            </div>

            <input
              type="range"
              min={0}
              max={10}
              step={1}
              value={formData.painLevel}
              onChange={(e) => onChange({ ...formData, painLevel: Number(e.target.value) })}
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />

            <div className="flex justify-between text-[10px] text-slate-500 mt-1 font-mono">
              <span>0 (No Pain)</span>
              <span>3 (Mild)</span>
              <span>6 (Moderate)</span>
              <span>8 (Severe)</span>
              <span>10 (Worst Possible)</span>
            </div>
          </div>

          {/* Injury Mechanism */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 mb-2">
              <ShieldAlert className="w-4 h-4 text-orange-400" />
              <span>Injury Mechanism</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {mechanismOptions.map(({ label, icon }) => {
                const selected = formData.injuryMechanism === label;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => onChange({ ...formData, injuryMechanism: label })}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-xs font-medium transition-all ${
                      selected
                        ? 'bg-orange-600 text-white border-orange-500 shadow-md shadow-orange-950/40'
                        : 'bg-slate-800/40 border-slate-700/70 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {icon}
                    <span className="text-center">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <div className="mt-6 pt-4 border-t border-slate-800">
        <button
          type="submit"
          disabled={isCalculating}
          className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg shadow-blue-900/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 active:scale-[0.99]"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isCalculating ? 'Evaluating Vitals & Risk...' : 'Calculate / Update Triage'}</span>
        </button>
      </div>
    </form>
  );
};
