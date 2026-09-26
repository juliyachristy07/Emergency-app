import express from 'express';
import { getPhotos, getPhotoById, savePhoto, revokePhotoAccessForRequest } from '../models/Store.js';
import { CONSENT_STATES, PHOTO_CATEGORIES } from '../models/ConsentStateMachine.js';
import { AuditLogService } from '../models/AuditLog.js';

const router = express.Router();

/**
 * 1. POST /api/photos/upload
 * EMT uploads photo in the field. Initial state: pending. Auto-timestamp added.
 */
router.post('/upload', (req, res) => {
  try {
    const { requestId = 'REQ-1001', category = PHOTO_CATEGORIES.INJURY, filename, dataUrl, emtId = 'EMT-402' } = req.body;

    const photoId = `PHT-${Date.now()}`;
    const timestamp = new Date().toISOString();

    const photo = {
      photoId,
      requestId,
      category: Object.values(PHOTO_CATEGORIES).includes(category) ? category : PHOTO_CATEGORIES.INJURY,
      filename: filename || `capture_${photoId}.jpg`,
      mimeType: 'image/jpeg',
      timestamp,
      dataUrl: dataUrl || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="%231e293b"/><text x="50%" y="50%" fill="%23e2e8f0" font-family="sans-serif" text-anchor="middle">EMT CAPTURED MEDIA</text></svg>',
      consentState: CONSENT_STATES.PENDING,
      consentRecord: {
        consentState: CONSENT_STATES.PENDING,
        previousState: null,
        emtId,
        timestamp,
        justification: null,
        isEmergencyOverride: false
      },
      isSelected: true, // Default selected for minimal sharing evaluation
      accessActive: true
    };

    savePhoto(photo);

    AuditLogService.logEvent({
      photoId,
      requestId,
      consentStatus: CONSENT_STATES.PENDING,
      senderId: emtId,
      eventType: 'CAPTURE',
      metadata: { category: photo.category, filename: photo.filename }
    });

    res.status(201).json({ success: true, photo });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * 1b. PUT /api/photos/:photoId/tag
 * EMT tags or changes category tag
 */
router.put('/:photoId/tag', (req, res) => {
  try {
    const { photoId } = req.params;
    const { category, isSelected } = req.body;
    const photo = getPhotoById(photoId);

    if (!photo) {
      return res.status(404).json({ success: false, error: 'Photo not found.' });
    }

    if (category && Object.values(PHOTO_CATEGORIES).includes(category)) {
      photo.category = category;
    }

    if (typeof isSelected === 'boolean') {
      photo.isSelected = isSelected;
      AuditLogService.logEvent({
        photoId,
        requestId: photo.requestId,
        consentStatus: photo.consentState,
        senderId: photo.consentRecord.emtId,
        eventType: photo.isSelected ? 'SELECTED' : 'DESELECTED',
        metadata: { category: photo.category }
      });
    }

    savePhoto(photo);
    res.json({ success: true, photo });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * 5 & 6. GET /api/photos/:photoId/stream
 * Hospital dashboard views inline photo.
 * Check access active flag (Auto-expiry rule).
 * Logs VIEWED timestamp into immutable audit log.
 */
router.get('/:photoId/stream', (req, res) => {
  const { photoId } = req.params;
  const { viewerId = 'HOSP-CENTRAL-ER', hospitalName = 'St. Jude Central ER' } = req.query;
  const photo = getPhotoById(photoId);

  if (!photo) {
    return res.status(404).json({ success: false, error: 'Photo not found' });
  }

  // Access validation (Auto-expiry check)
  if (!photo.accessActive) {
    AuditLogService.logEvent({
      photoId,
      requestId: photo.requestId,
      consentStatus: photo.consentState,
      senderId: photo.consentRecord.emtId,
      recipientHospitalId: viewerId,
      eventType: 'VIEW_ATTEMPT_DENIED_EXPIRED',
      metadata: { reason: 'Photo access auto-expired or case closed' }
    });

    return res.status(403).json({
      success: false,
      error: 'ACCESS_REVOKED: Photo access has expired because the case was closed or reassigned.'
    });
  }

  // Log view event to immutable audit log
  AuditLogService.logEvent({
    photoId,
    requestId: photo.requestId,
    consentStatus: photo.consentState,
    senderId: photo.consentRecord.emtId,
    recipientHospitalId: viewerId,
    eventType: 'VIEWED',
    metadata: { viewerId, hospitalName, timestamp: new Date().toISOString() }
  });

  // Always return JSON payload containing photo details & dataUrl
  res.json({ success: true, photo });
});

/**
 * 6. POST /api/photos/revoke-access
 * Manually or programmatically revoke hospital photo access
 */
router.post('/revoke-access', (req, res) => {
  const { requestId, reason } = req.body;
  if (!requestId) {
    return res.status(400).json({ success: false, error: 'requestId is required' });
  }

  revokePhotoAccessForRequest(requestId, reason || 'Manual revocation requested');
  res.json({ success: true, message: `Photo access revoked for request ${requestId}` });
});

export default router;
