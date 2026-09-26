import React, { useState, useEffect } from 'react';
import {
  Ambulance,
  HeartPulse,
  Radio,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import type {
  PatientData,
  VitalsData,
  TriageInput,
  TriageCalculationResult,
  ApiStatus,
} from '../types/triage';
import { PatientInfo } from '../components/PatientInfo';
import { VitalsCard } from '../components/VitalsCard';
import { TriageForm } from '../components/TriageForm';
import { UrgencyResult } from '../components/UrgencyResult';
import { fetchVitals, updateVitals } from '../services/vitalsApi';
import { calculateTriageUrgency } from '../utils/triageScore';

const INITIAL_PATIENT: PatientData = {
  patientId: 'P001',
  name: 'Robert Vance',
  age: 44,
  gender: 'Male',
};

const INITIAL_VITALS: VitalsData = {
  patientId: 'P001',
  heartRate: 112,
  spo2: 93,
  timestamp: new Date().toISOString(),
};

const INITIAL_TRIAGE_INPUT: TriageInput = {
  consciousness: 'Alert',
  bleeding: 'Mild',
  painLevel: 6,
  injuryMechanism: 'Road Accident',
};

export const TriageDashboard: React.FC = () => {
  // State for active patient
  const [patient, setPatient] = useState<PatientData>(INITIAL_PATIENT);

  // State for vitals
  const [vitals, setVitals] = useState<VitalsData>(INITIAL_VITALS);

  // State for API connection and loading
  const [apiStatus, setApiStatus] = useState<ApiStatus>('connecting');
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoadingVitals, setIsLoadingVitals] = useState<boolean>(true);

  // State for triage input form
  const [triageInput, setTriageInput] = useState<TriageInput>(INITIAL_TRIAGE_INPUT);

  // State for triage calculation result initialized with baseline
  const [triageResult, setTriageResult] = useState<TriageCalculationResult | null>(() =>
    calculateTriageUrgency(
      { heartRate: INITIAL_VITALS.heartRate, spo2: INITIAL_VITALS.spo2 },
      INITIAL_TRIAGE_INPUT
    )
  );
  const [isCalculating, setIsCalculating] = useState<boolean>(false);

  // Function for manual refresh
  const handleManualRefresh = async () => {
    setIsLoadingVitals(true);
    try {
      const data = await fetchVitals();
      setVitals(data);
      setApiStatus('connected');
      setApiError(null);
    } catch (err: unknown) {
      setApiStatus('error');
      if (err instanceof Error) {
        setApiError(`Backend API connection error: ${err.message}`);
      } else {
        setApiError('Unable to connect to backend on port 5000.');
      }
    } finally {
      setIsLoadingVitals(false);
    }
  };

  // Initial data loading on mount
  useEffect(() => {
    let isCancelled = false;

    async function initialFetch() {
      try {
        const data = await fetchVitals();
        if (!isCancelled) {
          setVitals(data);
          setApiStatus('connected');
          setApiError(null);
          setIsLoadingVitals(false);
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          setApiStatus('error');
          setIsLoadingVitals(false);
          if (err instanceof Error) {
            setApiError(`Backend API connection error: ${err.message}`);
          } else {
            setApiError('Unable to connect to backend on port 5000.');
          }
        }
      }
    }

    initialFetch();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Handle simulating/updating vitals via POST API
  const handleSimulateVitals = async (heartRate: number, spo2: number) => {
    setApiError(null);
    try {
      const response = await updateVitals({
        patientId: patient.patientId,
        heartRate,
        spo2,
      });
      setVitals(response.data);
      setApiStatus('connected');

      // Auto update triage result with newly simulated vitals
      const updatedScore = calculateTriageUrgency(
        { heartRate: response.data.heartRate, spo2: response.data.spo2 },
        triageInput
      );
      setTriageResult(updatedScore);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setApiError(`Failed to update vitals: ${err.message}`);
      } else {
        setApiError('Unknown error updating vitals.');
      }
    }
  };

  // Handle Triage calculation submit
  const handleCalculateTriage = (e: React.FormEvent) => {
    e.preventDefault();
    setIsCalculating(true);

    setTimeout(() => {
      const result = calculateTriageUrgency(
        { heartRate: vitals.heartRate, spo2: vitals.spo2 },
        triageInput
      );
      setTriageResult(result);
      setIsCalculating(false);
    }, 200);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Navigation / Telemetry Header */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-rose-900/40">
              <Ambulance className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-wide">
                  Emergency Medical Services
                </h1>
                <span className="text-[10px] font-mono uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded-full font-bold">
                  Unit 402 - Transit
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Software Patient Triage &amp; Telemetry Module
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="hidden sm:flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/80 text-slate-300 font-mono">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Telemetry: Active</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700/80 text-slate-300 font-mono">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-6 flex-1 space-y-6">
        {/* Section 1: Patient Information Card */}
        <section aria-label="Patient Information">
          <PatientInfo
            patient={patient}
            onUpdatePatient={(updated) => setPatient(updated)}
          />
        </section>

        {/* Section 2: Vitals & Triage Form Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6" aria-label="Clinical Data">
          {/* Left Column: Live Vitals Monitor (5 cols on lg) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <VitalsCard
              vitals={vitals}
              apiStatus={apiStatus}
              errorMessage={apiError}
              onRefresh={handleManualRefresh}
              onSimulateVitals={handleSimulateVitals}
              isLoading={isLoadingVitals}
            />

            {/* Quick Helper Info Card */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 text-xs text-slate-400 space-y-2">
              <div className="flex items-center gap-2 text-slate-300 font-semibold">
                <HeartPulse className="w-4 h-4 text-blue-400" />
                <span>Paramedic Triage Guidelines</span>
              </div>
              <p>
                Continuous optical pulse and pulse oximeter data streams to the ambulance tablet in real-time.
                Simulate different emergency states using the &ldquo;Simulate Vitals&rdquo; drawer above to test critical triage protocols.
              </p>
            </div>
          </div>

          {/* Right Column: Triage Input Form (7 cols on lg) */}
          <div className="lg:col-span-7">
            <TriageForm
              formData={triageInput}
              onChange={(updated) => setTriageInput(updated)}
              onSubmit={handleCalculateTriage}
              isCalculating={isCalculating}
            />
          </div>
        </section>

        {/* Section 3: Urgency Result Card */}
        <section aria-label="Triage Assessment Result">
          <UrgencyResult result={triageResult} />
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 px-4 sm:px-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Ambulance Telemetry &amp; Patient Triage System &bull; Software Module Prototype</span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
            Educational &amp; Prototype Demonstration Only
          </span>
        </div>
      </footer>
    </div>
  );
};
