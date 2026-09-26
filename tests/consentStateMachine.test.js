import { describe, it, expect } from 'vitest';
import { ConsentStateMachine, CONSENT_STATES } from '../server/models/ConsentStateMachine.js';

describe('Consent State Machine Lifecycle & Rules', () => {
  it('should allow valid transition from pending to patient_consented', () => {
    const isValid = ConsentStateMachine.isValidTransition(
      CONSENT_STATES.PENDING,
      CONSENT_STATES.PATIENT_CONSENTED
    );
    expect(isValid).toBe(true);
  });

  it('should allow transition from pending to implied_emergency_consent', () => {
    const isValid = ConsentStateMachine.isValidTransition(
      CONSENT_STATES.PENDING,
      CONSENT_STATES.IMPLIED_EMERGENCY_CONSENT
    );
    expect(isValid).toBe(true);
  });

  it('should allow transition from pending to declined', () => {
    const isValid = ConsentStateMachine.isValidTransition(
      CONSENT_STATES.PENDING,
      CONSENT_STATES.DECLINED
    );
    expect(isValid).toBe(true);
  });

  it('should require a clinical justification for implied_emergency_consent', () => {
    expect(() => {
      ConsentStateMachine.createConsentRecord({
        currentState: CONSENT_STATES.PENDING,
        targetState: CONSENT_STATES.IMPLIED_EMERGENCY_CONSENT,
        emtId: 'EMT-402',
        justification: '' // Empty justification should throw error
      });
    }).toThrow(/Emergency override \(implied_emergency_consent\) requires a valid clinical justification/);
  });

  it('should successfully create consent record when emergency override justification is provided', () => {
    const record = ConsentStateMachine.createConsentRecord({
      currentState: CONSENT_STATES.PENDING,
      targetState: CONSENT_STATES.IMPLIED_EMERGENCY_CONSENT,
      emtId: 'EMT-402',
      justification: 'Patient unconscious, GCS 8, severe head trauma'
    });

    expect(record.consentState).toBe(CONSENT_STATES.IMPLIED_EMERGENCY_CONSENT);
    expect(record.isEmergencyOverride).toBe(true);
    expect(record.justification).toBe('Patient unconscious, GCS 8, severe head trauma');
  });

  it('should evaluate canTransmit correctly for each consent state', () => {
    expect(ConsentStateMachine.canTransmit(CONSENT_STATES.PATIENT_CONSENTED)).toBe(true);
    expect(ConsentStateMachine.canTransmit(CONSENT_STATES.IMPLIED_EMERGENCY_CONSENT)).toBe(true);
    expect(ConsentStateMachine.canTransmit(CONSENT_STATES.PENDING)).toBe(false);
    expect(ConsentStateMachine.canTransmit(CONSENT_STATES.DECLINED)).toBe(false);
  });

  it('should fallback to DECLINED global state if all photos are declined', () => {
    const globalState = ConsentStateMachine.evaluateGlobalConsent([
      CONSENT_STATES.DECLINED,
      CONSENT_STATES.DECLINED
    ]);
    expect(globalState).toBe(CONSENT_STATES.DECLINED);
  });

  it('should mark global state as implied_emergency_consent if any photo uses emergency override', () => {
    const globalState = ConsentStateMachine.evaluateGlobalConsent([
      CONSENT_STATES.PATIENT_CONSENTED,
      CONSENT_STATES.IMPLIED_EMERGENCY_CONSENT
    ]);
    expect(globalState).toBe(CONSENT_STATES.IMPLIED_EMERGENCY_CONSENT);
  });
});
