import React, { useState } from 'react';
import { ShieldCheck, HeartPulse, Building2, ScrollText, Code2, RotateCcw } from 'lucide-react';
import { EmtModule } from './components/EmtModule';
import { HospitalDashboard } from './components/HospitalDashboard';
import { AuditPortal } from './components/AuditPortal';
import { SchemaViewer } from './components/SchemaViewer';
import { resetStore } from './services/api';

export function App() {
  const [activeTab, setActiveTab] = useState('emt');
  const [resetMessage, setResetMessage] = useState(null);

  const handleResetDemo = async () => {
    await resetStore();
    setResetMessage('Store reset to clean demo state.');
    setTimeout(() => setResetMessage(null), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Main Navigation Header */}
      <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo & Title */}
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-600/20 border border-red-500/40 text-red-400 rounded-xl">
                <HeartPulse className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h1 className="text-base font-bold text-slate-100 tracking-tight flex items-center gap-2">
                  EMERGENCE <span className="text-xs px-2 py-0.5 bg-slate-800 text-cyan-400 border border-slate-700 rounded-md font-mono">Module B</span>
                </h1>
                <p className="text-[11px] text-slate-400">Consent-Gated Photo-Sharing & Hospital Coordination System</p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setActiveTab('emt')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  activeTab === 'emt'
                    ? 'bg-red-600/20 text-red-300 border border-red-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <span>🚑 EMT Field</span>
              </button>

              <button
                onClick={() => setActiveTab('hospital')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  activeTab === 'hospital'
                    ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <span>🏥 Hospital Triage</span>
              </button>

              <button
                onClick={() => setActiveTab('audit')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  activeTab === 'audit'
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <span>📜 Compliance Audit</span>
              </button>

              <button
                onClick={() => setActiveTab('schemas')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  activeTab === 'schemas'
                    ? 'bg-slate-800 text-slate-100 border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <span>📋 Schemas</span>
              </button>

              <button
                onClick={handleResetDemo}
                className="ml-2 p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-800 rounded-xl border border-slate-700 transition"
                title="Reset Demo Scenario State"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </nav>
          </div>
        </div>
      </header>

      {resetMessage && (
        <div className="bg-cyan-950 text-cyan-200 border-b border-cyan-800 text-xs px-4 py-2 text-center animate-fadeIn">
          {resetMessage}
        </div>
      )}

      {/* Main App Content View */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        {activeTab === 'emt' && (
          <EmtModule
            onRequestTransmitted={() => setActiveTab('hospital')}
            onSwitchView={setActiveTab}
          />
        )}
        {activeTab === 'hospital' && (
          <HospitalDashboard
            onSwitchView={setActiveTab}
          />
        )}
        {activeTab === 'audit' && <AuditPortal />}
        {activeTab === 'schemas' && <SchemaViewer />}
      </main>

      {/* Footer Status Bar */}
      <footer className="bg-slate-900 border-t border-slate-800 py-3 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-center justify-between gap-2">
          <span>Person B's Hospital Coordination Module — Ambulance-to-Hospital Handoff Protocol</span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" /> HIPAA Compliance Engine & Consent Gate Active
          </span>
        </div>
      </footer>
    </div>
  );
}

export default App;
