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

export const CATEGORY_LABELS = {
  [PHOTO_CATEGORIES.INJURY]: '🩹 Injury Site',
  [PHOTO_CATEGORIES.VITALS]: '📊 Vitals Monitor',
  [PHOTO_CATEGORIES.IDENTIFICATION]: '🪪 Identification',
  [PHOTO_CATEGORIES.SCENE]: '🚔 Incident Scene'
};
