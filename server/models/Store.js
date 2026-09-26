import { ConsentStateMachine, CONSENT_STATES, PHOTO_CATEGORIES } from './ConsentStateMachine.js';
import { AuditLogService } from './AuditLog.js';

// In-Memory Database Store for backend APIs
let photosStore = [];
let requestsStore = [];

/**
 * Seed realistic initial demo data
 */
export function initializeStore() {
  photosStore = [
    {
      photoId: 'PHT-2001',
      requestId: 'REQ-1001',
      category: PHOTO_CATEGORIES.INJURY,
      filename: 'trauma_leg_site.jpg',
      mimeType: 'image/jpeg',
      timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
      dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="100%" height="100%" fill="%231e293b"/><text x="50%" y="40%" dominant-baseline="middle" text-anchor="middle" fill="%23ef4444" font-size="20" font-family="monospace" font-weight="bold">INJURY SITE PHOTO</text><text x="50%" y="60%" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-size="14" font-family="sans-serif">Right Leg Laceration & Fracture</text></svg>',
      consentState: CONSENT_STATES.IMPLIED_EMERGENCY_CONSENT,
      consentRecord: {
        consentState: CONSENT_STATES.IMPLIED_EMERGENCY_CONSENT,
        previousState: CONSENT_STATES.PENDING,
        emtId: 'EMT-402 (Paramedic Davis)',
        timestamp: new Date(Date.now() - 14 * 60000).toISOString(),
        justification: 'Patient unconscious post head trauma (GCS 8). Immediate trauma team alert needed.',
        isEmergencyOverride: true
      },
      isSelected: true,
      accessActive: true
    },
    {
      photoId: 'PHT-2002',
      requestId: 'REQ-1001',
      category: PHOTO_CATEGORIES.VITALS,
      filename: 'monitor_vitals_ecg.jpg',
      mimeType: 'image/jpeg',
      timestamp: new Date(Date.now() - 12 * 60000).toISOString(),
      dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="100%" height="100%" fill="%230f172a"/><path d="M 20 150 L 80 150 L 100 80 L 120 220 L 140 150 L 200 150 L 220 100 L 240 200 L 260 150 L 380 150" stroke="%2322c55e" stroke-width="4" fill="none"/><text x="50%" y="80%" dominant-baseline="middle" text-anchor="middle" fill="%2322c55e" font-size="16" font-family="monospace">HR: 124 bpm | BP: 92/60</text></svg>',
      consentState: CONSENT_STATES.IMPLIED_EMERGENCY_CONSENT,
      consentRecord: {
        consentState: CONSENT_STATES.IMPLIED_EMERGENCY_CONSENT,
        previousState: CONSENT_STATES.PENDING,
        emtId: 'EMT-402 (Paramedic Davis)',
        timestamp: new Date(Date.now() - 11 * 60000).toISOString(),
        justification: 'Patient unconscious post head trauma (GCS 8). Monitor screenshot captured.',
        isEmergencyOverride: true
      },
      isSelected: true,
      accessActive: true
    },
    {
      photoId: 'PHT-2003',
      requestId: 'REQ-1001',
      category: PHOTO_CATEGORIES.IDENTIFICATION,
      filename: 'drivers_license.jpg',
      mimeType: 'image/jpeg',
      timestamp: new Date(Date.now() - 10 * 60000).toISOString(),
      dataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"><rect width="100%" height="100%" fill="%23334155"/><rect x="30" y="30" width="340" height="240" rx="15" fill="%23475569" stroke="%23cbd5e1" stroke-width="2"/><circle cx="100" cy="120" r="40" fill="%2394a3b8"/><text x="170" y="100" fill="%23ffffff" font-size="16" font-family="sans-serif" font-weight="bold">DRIVER LICENSE</text><text x="170" y="130" fill="%23e2e8f0" font-size="14" font-family="sans-serif">DOB: 04/12/1981</text></svg>',
      consentState: CONSENT_STATES.DECLINED,
      consentRecord: {
        consentState: CONSENT_STATES.DECLINED,
        previousState: CONSENT_STATES.PENDING,
        emtId: 'EMT-402 (Paramedic Davis)',
        timestamp: new Date(Date.now() - 9 * 60000).toISOString(),
        justification: null,
        isEmergencyOverride: false
      },
      isSelected: false,
      accessActive: false
    }
  ];

  requestsStore = [
    {
      requestId: 'REQ-1001',
      emtId: 'EMT-402',
      ambulanceId: 'AMB-12',
      patientSummary: {
        age: 45,
        gender: 'Male',
        condition: 'Severe Multi-Trauma (MVA)',
        consciousnessLevel: 'Unconscious (GCS 8)',
        vitals: {
          heartRate: 124,
          bp: '92/60',
          spO2: 91,
          respRate: 26
        }
      },
      etaMinutes: 6,
      targetHospitalId: 'HOSP-CENTRAL-ER',
      targetHospitalName: 'St. Jude Central Emergency Hospital',
      status: 'pending_acceptance',
      consentSummary: {
        consentState: CONSENT_STATES.IMPLIED_EMERGENCY_CONSENT,
        previousState: CONSENT_STATES.PENDING,
        emtId: 'EMT-402',
        timestamp: new Date(Date.now() - 11 * 60000).toISOString(),
        justification: 'Patient unconscious post head trauma (GCS 8). Emergency override active.',
        isEmergencyOverride: true
      },
      photos: [photosStore[0], photosStore[1]],
      escalationHistory: [
        {
          hospitalId: 'HOSP-CENTRAL-ER',
          hospitalName: 'St. Jude Central Emergency Hospital',
          action: 'DISPATCH_SENT',
          timestamp: new Date(Date.now() - 10 * 60000).toISOString()
        }
      ]
    }
  ];

  // Seed initial audit log entries
  AuditLogService.clearLogs();
  photosStore.forEach(p => {
    AuditLogService.logEvent({
      photoId: p.photoId,
      requestId: p.requestId,
      consentStatus: p.consentState,
      senderId: p.consentRecord.emtId,
      recipientHospitalId: 'HOSP-CENTRAL-ER',
      eventType: 'CAPTURE',
      metadata: { category: p.category, filename: p.filename }
    });

    AuditLogService.logEvent({
      photoId: p.photoId,
      requestId: p.requestId,
      consentStatus: p.consentState,
      senderId: p.consentRecord.emtId,
      recipientHospitalId: 'HOSP-CENTRAL-ER',
      eventType: 'CONSENT_UPDATE',
      metadata: { justification: p.consentRecord.justification }
    });
  });

  AuditLogService.logEvent({
    requestId: 'REQ-1001',
    consentStatus: CONSENT_STATES.IMPLIED_EMERGENCY_CONSENT,
    senderId: 'EMT-402',
    recipientHospitalId: 'HOSP-CENTRAL-ER',
    eventType: 'TRANSMIT',
    metadata: { photoCount: 2, note: 'Transmitted via emergency override' }
  });
}

// Store Accessors & Mutators
export function getPhotos(requestId) {
  if (requestId) {
    return photosStore.filter(p => p.requestId === requestId);
  }
  return photosStore;
}

export function getPhotoById(photoId) {
  return photosStore.find(p => p.photoId === photoId);
}

export function savePhoto(photo) {
  const existingIdx = photosStore.findIndex(p => p.photoId === photo.photoId);
  if (existingIdx >= 0) {
    photosStore[existingIdx] = photo;
  } else {
    photosStore.push(photo);
  }
  return photo;
}

export function getRequests() {
  return requestsStore;
}

export function getRequestById(requestId) {
  return requestsStore.find(r => r.requestId === requestId);
}

export function saveRequest(req) {
  const existingIdx = requestsStore.findIndex(r => r.requestId === req.requestId);
  if (existingIdx >= 0) {
    requestsStore[existingIdx] = req;
  } else {
    requestsStore.push(req);
  }
  return req;
}

/**
 * Revoke hospital access to all photos for a case (Auto-Expiry Rule)
 */
export function revokePhotoAccessForRequest(requestId, reason = 'Case closed or reassigned') {
  const req = getRequestById(requestId);
  if (!req) return;

  const affectedPhotos = photosStore.filter(p => p.requestId === requestId);
  affectedPhotos.forEach(photo => {
    photo.accessActive = false;
    AuditLogService.logEvent({
      photoId: photo.photoId,
      requestId,
      consentStatus: photo.consentState,
      senderId: req.emtId,
      recipientHospitalId: req.targetHospitalId,
      eventType: 'ACCESS_REVOKED',
      metadata: { reason }
    });
  });

  // Also update photos inside request object
  if (req.photos) {
    req.photos.forEach(p => p.accessActive = false);
  }
}

// Initialize on module load
initializeStore();
