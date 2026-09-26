import express from 'express';
import { AuditLogService } from '../models/AuditLog.js';
import {
  CONSENT_OBJECT_SCHEMA,
  PHOTO_METADATA_SCHEMA,
  HOSPITAL_REQUEST_PAYLOAD_SCHEMA,
  AUDIT_LOG_ENTRY_SCHEMA
} from '../schemas/consentSchemas.js';

const router = express.Router();

/**
 * 5. GET /api/audit-logs
 * Immutable audit trail query endpoint for compliance review.
 */
router.get('/logs', (req, res) => {
  const { photoId, requestId, emtId, hospitalId, consentStatus, eventType, startDate, endDate } = req.query;

  const logs = AuditLogService.queryLogs({
    photoId,
    requestId,
    emtId,
    hospitalId,
    consentStatus,
    eventType,
    startDate,
    endDate
  });

  res.json({ success: true, count: logs.length, logs });
});

/**
 * GET /api/audit/schemas
 * Exposes data schemas for consent object, photo metadata, request payload, audit log.
 */
router.get('/schemas', (req, res) => {
  res.json({
    success: true,
    schemas: {
      consentObject: CONSENT_OBJECT_SCHEMA,
      photoMetadata: PHOTO_METADATA_SCHEMA,
      hospitalRequestPayload: HOSPITAL_REQUEST_PAYLOAD_SCHEMA,
      auditLogEntry: AUDIT_LOG_ENTRY_SCHEMA
    }
  });
});

export default router;
