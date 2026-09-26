export type Gender = 'Male' | 'Female' | 'Other';

export interface PatientData {
  patientId: string;
  name: string;
  age: number;
  gender: Gender;
}

export interface VitalsData {
  patientId: string;
  heartRate: number;
  spo2: number;
  timestamp: string;
}

export type ConsciousnessLevel = 'Alert' | 'Confused' | 'Unresponsive';

export type BleedingLevel = 'None' | 'Mild' | 'Severe';

export type InjuryMechanism = 'Road Accident' | 'Fall' | 'Burn' | 'Assault' | 'Other';

export interface TriageInput {
  consciousness: ConsciousnessLevel;
  bleeding: BleedingLevel;
  painLevel: number; // 0 to 10
  injuryMechanism: InjuryMechanism;
}

export type UrgencyLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface TriageCalculationResult {
  urgencyLevel: UrgencyLevel;
  totalScore: number;
  maxPossibleScore: number;
  riskFactors: string[];
  recommendations: string[];
  calculatedAt: string;
  disclaimer: string;
}

export type ApiStatus = 'connected' | 'connecting' | 'disconnected' | 'error';
