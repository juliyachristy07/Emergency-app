import React, { useState, useEffect } from 'react';
import { Code2, Copy, Check } from 'lucide-react';
import { fetchSchemas } from '../services/api';

export function SchemaViewer() {
  const [schemas, setSchemas] = useState(null);
  const [activeTab, setActiveTab] = useState('consentObject');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchSchemas().then(res => {
      if (res.success) setSchemas(res.schemas);
    });
  }, []);

  const handleCopy = () => {
    if (!schemas || !schemas[activeTab]) return;
    navigator.clipboard.writeText(JSON.stringify(schemas[activeTab], null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!schemas) {
    return <div className="p-8 text-center text-slate-400">Loading data schemas...</div>;
  }

  const tabLabels = {
    consentObject: 'Consent Object (JSON)',
    photoMetadata: 'Photo Metadata Schema',
    hospitalRequestPayload: 'Hospital Request Payload',
    auditLogEntry: 'Audit Log Entry Schema'
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 rounded-xl">
              <Code2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-100">Official Data Schemas & API Specifications</h2>
              <p className="text-xs text-slate-400">
                JSON Schemas defining Consent state machine objects, photo metadata, attached request payload structure, & compliance logs.
              </p>
            </div>
          </div>

          <button
            onClick={handleCopy}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-xs font-semibold rounded-xl transition flex items-center gap-2"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-cyan-400" />}
            <span>{copied ? 'Copied JSON!' : 'Copy Active Schema'}</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto">
        {Object.keys(tabLabels).map(key => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition border-t border-x ${
              activeTab === key
                ? 'bg-slate-900 border-slate-700 text-cyan-400 border-b-transparent'
                : 'bg-slate-950/60 border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tabLabels[key]}
          </button>
        ))}
      </div>

      {/* JSON Viewer */}
      <div className="bg-slate-950 border border-slate-800 rounded-b-2xl rounded-tr-2xl p-6 overflow-x-auto">
        <pre className="text-xs font-mono text-cyan-300 leading-relaxed">
          {JSON.stringify(schemas[activeTab], null, 2)}
        </pre>
      </div>
    </div>
  );
}
