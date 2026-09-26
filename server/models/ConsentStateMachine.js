/**
 * Consent State Machine Implementation
 * 
 * Valid States:
 * - pending: Photo captured, awaiting consent evaluation
 * - patient_consented: Patient explicitly provided consent
 * - implied_emergency_consent: Patient unconscious/incapacitated (Emergency Override)
 * - declined: Patient refused photo transmission
 */

export const CONSENT_STATES = {
  PENDING: 'pending',
  PATIENT_CONSENTED: 'patient_consented',
  IMPLIED_EMERGENCY_CONSENT: 'implied_emergency_consent',
  DECLINED: 'declined'
};

export const PHOTO_CATEGORIES = {
  INJURY: 'injury',
  VITALS: 'vitals',
  IDENTIFICATION: 'identification',
  SCENE: 'scene'
};

export class ConsentStateMachine {
  /**
   * Validate if a state transition is allowed
   */
  static isValidTransition(currentState, targetState) {
    if (currentState === targetState) return true;

    const allowedTransitions = {
      [CONSENT_STATES.PENDING]: [
        CONSENT_STATES.PATIENT_CONSENTED,
        CONSENT_STATES.IMPLIED_EMERGENCY_CONSENT,
        CONSENT_STATES.DECLINED
      ],
      [CONSENT_STATES.PATIENT_CONSENTED]: [
        CONSENT_STATES.DECLINED,
        CONSENT_STATES.IMPLIED_EMERGENCY_CONSENT // Patient loses consciousness mid-transit
      ],
      [CONSENT_STATES.IMPLIED_EMERGENCY_CONSENT]: [
        CONSENT_STATES.PATIENT_CONSENTED, // Patient regains consciousness & confirms
        CONSENT_STATES.DECLINED
      ],
      [CONSENT_STATES.DECLINED]: [
        CONSENT_STATES.PATIENT_CONSENTED, // Patient changes mind before send
        CONSENT_STATES.IMPLIED_EMERGENCY_CONSENT // Condition deteriorates to unconsciousness
      ]
    };

    return allowedTransitions[currentState]?.includes(targetState) ?? false;
  }

  /**
   * Create a consent decision log record with strict validation
   */
  static createConsentRecord({ currentState, targetState, emtId, justification, timestamp = new Date().toISOString() }) {
    if (!this.isValidTransition(currentState, targetState)) {
      throw new Error(`Invalid consent transition from '${currentState}' to '${targetState}'.`);
    }

    if (!emtId || emtId.trim() === '') {
      throw new Error('EMT ID is required for all consent state modifications.');
    }

    // Rule: Emergency override REQUIRES explicit justification
    if (targetState === CONSENT_STATES.IMPLIED_EMERGENCY_CONSENT) {
      if (!justification || justification.trim().length < 5) {
        throw new Error('Emergency override (implied_emergency_consent) requires a valid clinical justification (e.g., patient unconscious, GCS < 8).');
      }
    }

    return {
      consentState: targetState,
      previousState: currentState,
      emtId,
      timestamp,
      justification: targetState === CONSENT_STATES.IMPLIED_EMERGENCY_CONSENT ? justification.trim() : (justification || null),
      isEmergencyOverride: targetState === CONSENT_STATES.IMPLIED_EMERGENCY_CONSENT
    };
  }

  /**
   * Determine if photos with the given consent state can be transmitted
   */
  static canTransmit(consentState) {
    return (
      consentState === CONSENT_STATES.PATIENT_CONSENTED ||
      consentState === CONSENT_STATES.IMPLIED_EMERGENCY_CONSENT
    );
  }

  /**
   * Helper to evaluate global request consent fallback state
   */
  static evaluateGlobalConsent(photosConsentStates) {
    if (!photosConsentStates || photosConsentStates.length === 0) {
      return CONSENT_STATES.DECLINED;
    }

    if (photosConsentStates.some(s => s === CONSENT_STATES.IMPLIED_EMERGENCY_CONSENT)) {
      return CONSENT_STATES.IMPLIED_EMERGENCY_CONSENT;
    }

    if (photosConsentStates.every(s => s === CONSENT_STATES.PATIENT_CONSENTED)) {
      return CONSENT_STATES.PATIENT_CONSENTED;
    }

    if (photosConsentStates.every(s => s === CONSENT_STATES.DECLINED)) {
      return CONSENT_STATES.DECLINED;
    }

    return CONSENT_STATES.PATIENT_CONSENTED;
  }
}
