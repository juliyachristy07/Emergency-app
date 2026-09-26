import React, { useState } from 'react';
import {
  Heart,
  Activity,
  Wind,
  Clock,
  Wifi,
  WifiOff,
  RefreshCw,
  Send,
  Sliders,
  AlertTriangle,
} from 'lucide-react';
import type { VitalsData, ApiStatus } from '../types/triage';

interface VitalsCardProps {
  vitals: VitalsData;
  apiStatus: ApiStatus;
  errorMessage?: string | null;
  onRefresh: () => void;
  onSimulateVitals: (heartRate: number, spo2: number) => Promise<void>;
  isLoading: boolean;
}

export const VitalsCard: React.FC<VitalsCardProps> = ({
  vitals,
  apiStatus,
  errorMessage,
  onRefresh,
  onSimulateVitals,
  isLoading,
}) => {
  const [showSimulator, setShowSimulator] = useState(false);
  const [customHR, setCustomHR] = useState<number>(vitals.heartRate);
  const [customSpo2, setCustomSpo2] = useState<number>(vitals.spo2);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Status determinations
  const isHrAbnormal = vitals.heartRate < 60 || vitals.heartRate > 100;
  const isHrCritical = vitals.heartRate < 50 || vitals.heartRate > 125;
  const isSpo2Low = vitals.spo2 < 95;
  const isSpo2Critical = vitals.spo2 <= 90;

  const handleSimulatePreset = async (hr: number, o2: number) => {
    setIsSubmitting(true);
    setCustomHR(hr);
    setCustomSpo2(o2);
    try {
      await onSimulateVitals(hr, o2);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSimulateVitals(customHR, customSpo2);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimestamp = (iso: string) => {
    try {
      const date = new Date(iso);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return iso;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
      {/* Top accent light */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-400" />

      {/* Header bar */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white tracking-wide flex items-center gap-2">
              Live Vitals Monitor
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
                Simulated Telemetry
              </span>
            </h2>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
              <span className="flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                {formatTimestamp(vitals.timestamp)}
              </span>
              <span className="flex items-center gap-1">
                {apiStatus === 'connected' && (
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Wifi className="w-3.5 h-3.5" /> API Connected (Port 5000)
                  </span>
                )}
                {apiStatus === 'connecting' && (
                  <span className="flex items-center gap-1 text-amber-400">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Syncing...
                  </span>
                )}
                {(apiStatus === 'disconnected' || apiStatus === 'error') && (
                  <span className="flex items-center gap-1 text-rose-400">
                    <WifiOff className="w-3.5 h-3.5" /> Offline / Error
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSimulator(!showSimulator)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              showSimulator
                ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-900/30'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title="Toggle vitals simulator"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Simulate Vitals</span>
          </button>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all disabled:opacity-50"
            title="Refresh latest from API"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={onRefresh}
            className="underline hover:text-white font-medium ml-2"
          >
            Retry
          </button>
        </div>
      )}

      {/* Vitals Display Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        {/* Heart Rate Card */}
        <div
          className={`rounded-2xl p-5 border relative overflow-hidden transition-all ${
            isHrCritical
              ? 'bg-rose-950/30 border-rose-500/50 shadow-lg shadow-rose-950/30'
              : isHrAbnormal
              ? 'bg-amber-950/20 border-amber-500/40'
              : 'bg-slate-800/60 border-slate-700/60'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Heart className={`w-5 h-5 ${vitals.heartRate > 0 ? 'animate-bounce' : ''}`} />
              </span>
              <span className="text-sm font-semibold text-slate-300">Heart Rate</span>
            </div>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                isHrCritical
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : isHrAbnormal
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}
            >
              {vitals.heartRate > 100
                ? 'Tachycardia'
                : vitals.heartRate < 60
                ? 'Bradycardia'
                : 'Normal'}
            </span>
          </div>

          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-4xl sm:text-5xl font-extrabold tracking-tight font-mono text-white">
              {vitals.heartRate}
            </span>
            <span className="text-sm font-medium text-slate-400">bpm</span>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-700/50">
            <span>Target: 60 - 100</span>
            <span className="font-mono text-[11px] text-slate-400">Sensor: Optic PPG</span>
          </div>
        </div>

        {/* SpO2 Oxygen Card */}
        <div
          className={`rounded-2xl p-5 border relative overflow-hidden transition-all ${
            isSpo2Critical
              ? 'bg-rose-950/30 border-rose-500/50 shadow-lg shadow-rose-950/30'
              : isSpo2Low
              ? 'bg-amber-950/20 border-amber-500/40'
              : 'bg-slate-800/60 border-slate-700/60'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Wind className="w-5 h-5" />
              </span>
              <span className="text-sm font-semibold text-slate-300">Blood Oxygen (SpO2)</span>
            </div>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                isSpo2Critical
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : isSpo2Low
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              }`}
            >
              {isSpo2Critical
                ? 'Severe Hypoxia'
                : isSpo2Low
                ? 'Mild Hypoxia'
                : 'Optimal'}
            </span>
          </div>

          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-4xl sm:text-5xl font-extrabold tracking-tight font-mono text-cyan-400">
              {vitals.spo2}
            </span>
            <span className="text-sm font-medium text-slate-400">%</span>
          </div>

          {/* Progress bar visual */}
          <div className="w-full bg-slate-950/80 rounded-full h-2 mt-3 overflow-hidden border border-slate-700/40">
            <div
              className={`h-full transition-all duration-500 ${
                isSpo2Critical
                  ? 'bg-rose-500'
                  : isSpo2Low
                  ? 'bg-amber-400'
                  : 'bg-cyan-400'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, vitals.spo2))}%` }}
            />
          </div>

          <div className="mt-2.5 flex items-center justify-between text-xs text-slate-400">
            <span>Target: &ge; 95%</span>
            <span className="font-mono text-[11px] text-slate-400">Pulse Oximeter</span>
          </div>
        </div>
      </div>

      {/* Simulator Drawer */}
      {showSimulator && (
        <div className="bg-slate-950/70 border border-blue-900/40 rounded-xl p-4 mt-2">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-400">
              <Sliders className="w-3.5 h-3.5" />
              <span>Telemetry Testing Sandbox (Updates Backend &amp; Triage)</span>
            </div>
            <span className="text-[11px] text-slate-400">POST /api/vitals</span>
          </div>

          {/* Preset Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSimulatePreset(75, 98)}
              className="px-2.5 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-center transition"
            >
              Normal (75 bpm, 98%)
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSimulatePreset(115, 93)}
              className="px-2.5 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-amber-900/40 text-amber-300 border border-slate-700 text-center transition"
            >
              Moderate (115 bpm, 93%)
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSimulatePreset(138, 86)}
              className="px-2.5 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-rose-900/40 text-rose-300 border border-slate-700 text-center transition"
            >
              Critical (138 bpm, 86%)
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSimulatePreset(46, 91)}
              className="px-2.5 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-purple-900/40 text-purple-300 border border-slate-700 text-center transition"
            >
              Bradycardia (46 bpm, 91%)
            </button>
          </div>

          {/* Custom values form */}
          <form onSubmit={handleCustomSubmit} className="flex flex-wrap items-end gap-3 pt-2 border-t border-slate-800">
            <div className="flex-1 min-w-[120px]">
              <label className="block text-[11px] text-slate-400 mb-1">Heart Rate (bpm)</label>
              <input
                type="number"
                min={20}
                max={250}
                value={customHR}
                onChange={(e) => setCustomHR(Number(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            <div className="flex-1 min-w-[120px]">
              <label className="block text-[11px] text-slate-400 mb-1">SpO2 (%)</label>
              <input
                type="number"
                min={50}
                max={100}
                value={customSpo2}
                onChange={(e) => setCustomSpo2(Number(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>Post to API</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
