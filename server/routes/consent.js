import express from 'express';
import { ConsentStateMachine, CONSENT_STATES } from '../models/ConsentStateMachine.js';
import { getPhotoById, savePhoto, getPhotos } from '../models/Store.js';
import { AuditLogService } from '../models/AuditLog.js';

const router = express.Router();

/**
 * 2. POST /api/consent/update
 * Updates consent state for a specific photo or globally for a set of photos.
 * Validates transition & mandatory emergency justification.
 * Logs decision in immutable audit log.
 */
router.post('/update', (req, res) => {
  try {
    const { photoId, requestId, targetState, emtId = 'EMT-402', justification } = req.body;

    if (!targetState) {
      return res.status(400).json({ success: false, error: 'targetState is required.' });
    }

    if (photoId) {
      const photo = getPhotoById(photoId);
      if (!photo) {
        return res.status(404).json({ success: false, error: 'Photo not found.' });
      }

      const currentState = photo.consentState;
      const consentRecord = ConsentStateMachine.createConsentRecord({
        currentState,
        targetState,
        emtId,
        justification
      });

      photo.consentState = targetState;
      photo.consentRecord = consentRecord;

      savePhoto(photo);

      AuditLogService.logEvent({
        photoId,
        requestId: photo.requestId,
        consentStatus: targetState,
        senderId: emtId,
        eventType: 'CONSENT_UPDATE',
        metadata: {
          previousState: currentState,
          justification: consentRecord.justification,
          isEmergencyOverride: consentRecord.isEmergencyOverride
        }
      });

      return res.json({ success: true, photo, consentRecord });
    }

    // Bulk consent update for a request
    if (requestId) {
      const photos = getPhotos(requestId);
      const updatedPhotos = photos.map(photo => {
        const currentState = photo.consentState;
        const consentRecord = ConsentStateMachine.createConsentRecord({
          currentState,
          targetState,
          emtId,
          justification
        });

        photo.consentState = targetState;
        photo.consentRecord = consentRecord;
        savePhoto(photo);

        AuditLogService.logEvent({
          photoId: photo.photoId,
          requestId,
          consentStatus: targetState,
          senderId: emtId,
          eventType: 'CONSENT_UPDATE',
          metadata: {
            previousState: currentState,
            justification: consentRecord.justification,
            isEmergencyOverride: consentRecord.isEmergencyOverride
          }
        });

        return photo;
      });

      return res.json({ success: true, count: updatedPhotos.length, photos: updatedPhotos });
    }

    return res.status(400).json({ success: false, error: 'Either photoId or requestId is required.' });

  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

export default router;
