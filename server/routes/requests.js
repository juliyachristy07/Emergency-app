import express from 'express';
import { getRequests, getRequestById, saveRequest, getPhotos, revokePhotoAccessForRequest } from '../models/Store.js';
import { ConsentStateMachine, CONSENT_STATES } from '../models/ConsentStateMachine.js';
import { AuditLogService } from '../models/AuditLog.js';

const router = express.Router();

/**
 * GET /api/requests
 * List incoming requests for hospital dashboard
 */
router.get('/', (req, res) => {
  const requests = getRequests();
  res.json({ success: true, requests });
});

/**
 * GET /api/requests/:requestId
 */
router.get('/:requestId', (req, res) => {
  const reqObj = getRequestById(req.params.requestId);
  if (!reqObj) {
    return res.status(404).json({ success: false, error: 'Request not found' });
  }
  res.json({ success: true, request: reqObj });
});

/**
 * 3, 4, 7. POST /api/requests/transmit
 * Transmits request with consent-gated photos attached.
 * Enforces Minimal Necessary Sharing & Fallback logic.
 */
router.post('/transmit', (req, res) => {
  try {
    const {
      requestId = `REQ-${Date.now()}`,
      emtId = 'EMT-402',
      ambulanceId = 'AMB-12',
      patientSummary,
      etaMinutes = 7,
      targetHospitalId = 'HOSP-CENTRAL-ER',
      targetHospitalName = 'St. Jude Central Emergency Hospital'
    } = req.body;

    const allPhotosForReq = getPhotos(requestId);

    // Filter photos based on Minimal Necessary Sharing (isSelected == true) AND Consent Gate
    const eligiblePhotos = allPhotosForReq.filter(photo => {
      // Must be selected by EMT
      if (!photo.isSelected) {
        AuditLogService.logEvent({
          photoId: photo.photoId,
          requestId,
          consentStatus: photo.consentState,
          senderId: emtId,
          recipientHospitalId: targetHospitalId,
          eventType: 'DESELECTED',
          metadata: { note: 'Photo excluded by EMT pre-send deselection' }
        });
        return false;
      }

      // MUST pass consent state machine check
      const canTransmit = ConsentStateMachine.canTransmit(photo.consentState);
      if (!canTransmit) {
        AuditLogService.logEvent({
          photoId: photo.photoId,
          requestId,
          consentStatus: photo.consentState,
          senderId: emtId,
          recipientHospitalId: targetHospitalId,
          eventType: 'TRANSMISSION_BLOCKED',
          metadata: { reason: `Consent state '${photo.consentState}' blocks photo transmission.` }
        });
      }
      return canTransmit;
    });

    // Evaluate global consent state
    const photoConsentStates = allPhotosForReq.map(p => p.consentState);
    const globalConsentState = ConsentStateMachine.evaluateGlobalConsent(photoConsentStates);

    const overridePhoto = allPhotosForReq.find(p => p.consentState === CONSENT_STATES.IMPLIED_EMERGENCY_CONSENT);

    const consentSummary = {
      consentState: globalConsentState,
      previousState: null,
      emtId,
      timestamp: new Date().toISOString(),
      justification: overridePhoto ? overridePhoto.consentRecord.justification : null,
      isEmergencyOverride: globalConsentState === CONSENT_STATES.IMPLIED_EMERGENCY_CONSENT
    };

    // Construct standardized hospital request payload
    const requestPayload = {
      requestId,
      emtId,
      ambulanceId,
      patientSummary: patientSummary || {
        age: 48,
        gender: 'Female',
        condition: 'Trauma / Suspected Fractures',
        consciousnessLevel: 'Alert & Oriented x4',
        vitals: { heartRate: 98, bp: '124/82', spO2: 98, respRate: 18 }
      },
      etaMinutes,
      targetHospitalId,
      targetHospitalName,
      status: 'pending_acceptance',
      consentSummary,
      photos: eligiblePhotos, // Empty [] if consent declined or zero photos pass gate (Fallback)
      escalationHistory: [
        {
          hospitalId: targetHospitalId,
          hospitalName: targetHospitalName,
          action: 'TRANSMITTED',
          timestamp: new Date().toISOString()
        }
      ]
    };

    saveRequest(requestPayload);

    // Audit log transmission
    AuditLogService.logEvent({
      requestId,
      consentStatus: globalConsentState,
      senderId: emtId,
      recipientHospitalId: targetHospitalId,
      eventType: eligiblePhotos.length > 0 ? 'TRANSMIT' : 'FALLBACK_TRIGGERED',
      metadata: {
        attachedPhotosCount: eligiblePhotos.length,
        totalPhotos: allPhotosForReq.length,
        fallbackMode: eligiblePhotos.length === 0,
        note: eligiblePhotos.length === 0 ? 'Fallback active: Vitals & text data transmitted without media.' : 'Transmitted attached photos'
      }
    });

    res.json({
      success: true,
      message: eligiblePhotos.length > 0
        ? `Request transmitted with ${eligiblePhotos.length} consent-approved photos.`
        : 'Request transmitted in fallback mode (vitals/text data only; zero photos attached per consent rules).',
      request: requestPayload
    });

  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * 4 & 6. POST /api/requests/:requestId/action
 * Handles hospital dashboard actions: accept | decline | reassign
 * Enforces Auto-Expiry upon acceptance or reassignment.
 */
router.post('/:requestId/action', (req, res) => {
  try {
    const { requestId } = req.params;
    const { action, hospitalId = 'HOSP-CENTRAL-ER', nextHospitalId, nextHospitalName } = req.body;

    const request = getRequestById(requestId);
    if (!request) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    if (action === 'accept') {
      request.status = 'accepted';
      request.escalationHistory.push({
        hospitalId,
        action: 'ACCEPTED',
        timestamp: new Date().toISOString()
      });

      // Auto-Expiry requirement: Revoke photo access when case closes
      revokePhotoAccessForRequest(requestId, 'Case accepted by hospital (Closed)');

      AuditLogService.logEvent({
        requestId,
        consentStatus: request.consentSummary.consentState,
        senderId: hospitalId,
        recipientHospitalId: hospitalId,
        eventType: 'CASE_ACCEPTED',
        metadata: { note: 'Hospital accepted handoff. Photo access auto-revoked.' }
      });

      saveRequest(request);
      return res.json({ success: true, request, message: 'Request accepted. Photo access auto-revoked.' });
    }

    if (action === 'decline' || action === 'timeout') {
      request.status = action === 'timeout' ? 'timed_out' : 'declined';
      
      // Auto-escalate to next hospital
      const nextHospId = nextHospitalId || 'HOSP-METRO-TRAUMA';
      const nextHospName = nextHospitalName || 'Metro Regional Trauma Center';

      // Revoke previous hospital access
      revokePhotoAccessForRequest(requestId, `Request ${action} by ${hospitalId}, escalating to ${nextHospId}`);

      request.escalationHistory.push({
        hospitalId,
        action: action.toUpperCase(),
        timestamp: new Date().toISOString(),
        escalatedTo: nextHospId
      });

      // Update target hospital and re-activate photos for NEW target hospital
      request.targetHospitalId = nextHospId;
      request.targetHospitalName = nextHospName;
      request.status = 'pending_acceptance';

      // Re-enable photos for the newly assigned hospital if consent permitted
      if (request.photos && request.photos.length > 0) {
        request.photos.forEach(p => {
          if (ConsentStateMachine.canTransmit(p.consentState)) {
            p.accessActive = true;
          }
        });
      }

      saveRequest(request);

      AuditLogService.logEvent({
        requestId,
        consentStatus: request.consentSummary.consentState,
        senderId: hospitalId,
        recipientHospitalId: nextHospId,
        eventType: 'ESCALATED',
        metadata: { from: hospitalId, to: nextHospId, reason: action }
      });

      return res.json({ success: true, request, message: `Request ${action}. Escalated to ${nextHospName}.` });
    }

    if (action === 'reassign') {
      const newHospId = nextHospitalId || 'HOSP-ST-MARY';
      const newHospName = nextHospitalName || 'St. Mary Specialized Trauma Unit';

      revokePhotoAccessForRequest(requestId, `Reassigned from ${hospitalId} to ${newHospId}`);

      request.targetHospitalId = newHospId;
      request.targetHospitalName = newHospName;
      request.status = 'pending_acceptance';

      request.escalationHistory.push({
        hospitalId,
        action: 'REASSIGNED',
        timestamp: new Date().toISOString(),
        reassignedTo: newHospId
      });

      // Re-enable access for new target hospital
      if (request.photos) {
        request.photos.forEach(p => {
          if (ConsentStateMachine.canTransmit(p.consentState)) {
            p.accessActive = true;
          }
        });
      }

      saveRequest(request);

      AuditLogService.logEvent({
        requestId,
        consentStatus: request.consentSummary.consentState,
        senderId: hospitalId,
        recipientHospitalId: newHospId,
        eventType: 'REASSIGNED',
        metadata: { from: hospitalId, to: newHospId }
      });

      return res.json({ success: true, request, message: `Request reassigned to ${newHospName}.` });
    }

    return res.status(400).json({ success: false, error: 'Invalid action.' });

  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

export default router;
