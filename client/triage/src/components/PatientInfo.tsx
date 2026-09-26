import React, { useState } from 'react';
import { User, IdCard, Calendar, Users, Edit3, Check } from 'lucide-react';
import type { PatientData } from '../types/triage';

interface PatientInfoProps {
  patient: PatientData;
  onUpdatePatient: (updated: PatientData) => void;
}

export const PatientInfo: React.FC<PatientInfoProps> = ({ patient, onUpdatePatient }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<PatientData>(patient);

  const handleSave = () => {
    onUpdatePatient(formData);
    setIsEditing(false);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      {/* Top accent light */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400" />

      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white tracking-wide">Patient Information</h2>
            <p className="text-xs text-slate-400">Ambulance Intake & Identification</p>
          </div>
        </div>

        <button
          onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            isEditing
              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
          }`}
        >
          {isEditing ? (
            <>
              <Check className="w-3.5 h-3.5" />
              <span>Save</span>
            </>
          ) : (
            <>
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </>
          )}
        </button>
      </div>

      {isEditing ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Patient ID</label>
            <input
              type="text"
              value={formData.patientId}
              onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Age</label>
            <input
              type="number"
              min={0}
              max={130}
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) || 0 })}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Gender</label>
            <select
              value={formData.gender}
              onChange={(e) =>
                setFormData({ ...formData, gender: e.target.value as PatientData['gender'] })
              }
              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-800/50 border border-slate-800/80 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <IdCard className="w-3.5 h-3.5 text-blue-400" />
              <span>Patient ID</span>
            </div>
            <p className="text-base font-bold text-white tracking-wide font-mono">
              {patient.patientId}
            </p>
          </div>

          <div className="bg-slate-800/50 border border-slate-800/80 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <span>Full Name</span>
            </div>
            <p className="text-base font-bold text-white truncate">{patient.name}</p>
          </div>

          <div className="bg-slate-800/50 border border-slate-800/80 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              <span>Age</span>
            </div>
            <p className="text-base font-bold text-white">{patient.age} yrs</p>
          </div>

          <div className="bg-slate-800/50 border border-slate-800/80 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
              <Users className="w-3.5 h-3.5 text-teal-400" />
              <span>Gender</span>
            </div>
            <p className="text-base font-bold text-white">{patient.gender}</p>
          </div>
        </div>
      )}
    </div>
  );
};
