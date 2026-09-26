import type {
  TriageInput,
  VitalsData,
  UrgencyLevel,
  TriageCalculationResult,
} from '../types/triage';

export const MEDICAL_DISCLAIMER =
  'This scoring system is ONLY a software prototype/demo for the project. It is NOT a medically validated triage protocol and must NOT be presented as a clinical diagnosis or real emergency medical decision system.';

/**
 * Calculates a demonstration triage urgency score based on patient vitals and triage assessment.
 * Demonstrates vital sign thresholding, consciousness evaluation, trauma mechanics, and pain.
 */
export function calculateTriageUrgency(
  vitals: Pick<VitalsData, 'heartRate' | 'spo2'>,
  triageInput: TriageInput
): TriageCalculationResult {
  let score = 0;
  const maxPossibleScore = 24;
  const riskFactors: string[] = [];
  const recommendations: string[] = [];

  const { heartRate, spo2 } = vitals;
  const { consciousness, bleeding, painLevel, injuryMechanism } = triageInput;

  // 1. Evaluate Heart Rate (Normal: 60 - 100 bpm)
  if (heartRate < 50 || heartRate > 120) {
    score += 4;
    riskFactors.push(`Critical Heart Rate: ${heartRate} bpm (Significant arrhythmia risk)`);
    recommendations.push('Immediate ECG rhythm assessment & cardiac monitoring');
  } else if ((heartRate >= 50 && heartRate < 60) || (heartRate > 100 && heartRate <= 120)) {
    score += 2;
    riskFactors.push(`Abnormal Heart Rate: ${heartRate} bpm (Tachycardia / Bradycardia)`);
    recommendations.push('Continuous heart rate monitoring required');
  }

  // 2. Evaluate Oxygen Saturation (SpO2) (Normal: >= 95%)
  if (spo2 <= 90) {
    score += 5;
    riskFactors.push(`Severe Hypoxia: SpO2 at ${spo2}% (Below critical 90% threshold)`);
    recommendations.push('High-flow supplemental oxygen delivery immediately (Non-Rebreather Mask)');
  } else if (spo2 >= 91 && spo2 <= 94) {
    score += 3;
    riskFactors.push(`Mild Hypoxemia: SpO2 at ${spo2}%`);
    recommendations.push('Administer nasal cannula supplemental oxygen as tolerated');
  }

  // 3. Evaluate Consciousness Level
  if (consciousness === 'Unresponsive') {
    score += 6;
    riskFactors.push('Patient is Unresponsive (Immediate airway compromise threat)');
    recommendations.push('Establish and secure airway; prepare suction and advanced airway support');
  } else if (consciousness === 'Confused') {
    score += 3;
    riskFactors.push('Patient is Confused / Disoriented (Altered mental status)');
    recommendations.push('Check blood glucose, assess pupil reactivity, maintain gentle re-orientation');
  }

  // 4. Evaluate Bleeding Severity
  if (bleeding === 'Severe') {
    score += 5;
    riskFactors.push('Severe / Uncontrolled External Bleeding (Hemorrhagic shock danger)');
    recommendations.push('Apply direct firm pressure, pressure bandages, or tourniquet if extremity trauma');
  } else if (bleeding === 'Mild') {
    score += 2;
    riskFactors.push('Active Mild Bleeding');
    recommendations.push('Cleanse, dress wound with sterile compression dressing');
  }

  // 5. Evaluate Pain Level (0 to 10)
  const clampedPain = Math.max(0, Math.min(10, Math.round(painLevel)));
  if (clampedPain >= 7) {
    score += 2;
    riskFactors.push(`Severe Pain reported (${clampedPain}/10)`);
    recommendations.push('Consider paramedic analgesic protocol for pain management');
  } else if (clampedPain >= 4) {
    score += 1;
    riskFactors.push(`Moderate Pain reported (${clampedPain}/10)`);
  }

  // 6. Evaluate Injury Mechanism
  switch (injuryMechanism) {
    case 'Road Accident':
      score += 2;
      riskFactors.push('High-Energy Collision: Road Traffic Accident');
      recommendations.push('Maintain cervical spine immobilization until trauma cleared');
      break;
    case 'Burn':
      score += 2;
      riskFactors.push('Thermal / Chemical Burn Injury');
      recommendations.push('Cool thermal injury with saline, prevent hypothermia, cover with sterile wrap');
      break;
    case 'Fall':
      score += 1;
      riskFactors.push('Blunt Trauma: Fall incident');
      break;
    case 'Assault':
      score += 1;
      riskFactors.push('Penetrating / Blunt Assault');
      break;
    case 'Other':
    default:
      break;
  }

  // Clinical emergency overrides for immediate high risk
  const isEmergencyOverride =
    consciousness === 'Unresponsive' ||
    (bleeding === 'Severe' && spo2 <= 91) ||
    spo2 <= 85 ||
    (heartRate > 140 || heartRate < 40);

  let urgencyLevel: UrgencyLevel;
  if (isEmergencyOverride || score >= 11) {
    urgencyLevel = 'CRITICAL';
  } else if (score >= 7) {
    urgencyLevel = 'HIGH';
  } else if (score >= 3) {
    urgencyLevel = 'MODERATE';
  } else {
    urgencyLevel = 'LOW';
  }

  if (recommendations.length === 0) {
    recommendations.push('Patient currently stable; continue routine ambulance transit monitoring');
  }

  return {
    urgencyLevel,
    totalScore: score,
    maxPossibleScore,
    riskFactors,
    recommendations,
    calculatedAt: new Date().toLocaleTimeString(),
    disclaimer: MEDICAL_DISCLAIMER,
  };
}
