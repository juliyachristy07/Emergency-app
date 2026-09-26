/**
 * JSON Schema Definitions for Consent & Photo-Sharing Module
 * Integrates with existing Hospital Request Payload structure.
 */

export const CONSENT_OBJECT_SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "ConsentObject",
  type: "object",
  required: ["consentState", "emtId", "timestamp", "isEmergencyOverride"],
  properties: {
    consentState: {
      type: "string",
      enum: ["pending", "patient_consented", "implied_emergency_consent", "declined"],
      description: "Current state in the consent state machine"
    },
    previousState: {
      type: ["string", "null"],
      enum: ["pending", "patient_consented", "implied_emergency_consent", "declined", null]
    },
    emtId: {
      type: "string",
      description: "ID of the EMT logging the consent decision"
    },
    timestamp: {
      type: "string",
      format: "date-time",
      description: "ISO 8601 timestamp of consent decision"
    },
    justification: {
      type: ["string", "null"],
      description: "Mandatory clinical justification required for implied_emergency_consent"
    },
    isEmergencyOverride: {
      type: "boolean",
      description: "Flag indicating whether this is an emergency override"
    }
  }
};

export const PHOTO_METADATA_SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "PhotoMetadata",
  type: "object",
  required: ["photoId", "category", "timestamp", "consentState", "isSelected", "accessActive"],
  properties: {
    photoId: {
      type: "string",
      description: "Unique identifier for the photo"
    },
    category: {
      type: "string",
      enum: ["injury", "vitals", "identification", "scene"],
      description: "Standardized medical photo category tag"
    },
    filename: {
      type: "string",
      description: "Original or generated file name"
    },
    mimeType: {
      type: "string",
      default: "image/jpeg"
    },
    timestamp: {
      type: "string",
      format: "date-time",
      description: "Auto-timestamp captured at creation"
    },
    consentState: {
      type: "string",
      enum: ["pending", "patient_consented", "implied_emergency_consent", "declined"]
    },
    consentRecord: CONSENT_OBJECT_SCHEMA,
    isSelected: {
      type: "boolean",
      description: "EMT pre-send deselect flag (Minimal Necessary Sharing rule)"
    },
    accessActive: {
      type: "boolean",
      description: "Current photo access status for receiving hospital (Auto-Expiry rule)"
    },
    url: {
      type: "string",
      description: "Stream URL for secure authenticated photo rendering"
    }
  }
};

export const HOSPITAL_REQUEST_PAYLOAD_SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "HospitalRequestPayload",
  type: "object",
  required: [
    "requestId",
    "emtId",
    "ambulanceId",
    "patientSummary",
    "etaMinutes",
    "targetHospitalId",
    "status",
    "consentSummary",
    "photos"
  ],
  properties: {
    requestId: { type: "string" },
    emtId: { type: "string" },
    ambulanceId: { type: "string" },
    patientSummary: {
      type: "object",
      required: ["condition", "vitals"],
      properties: {
        age: { type: "integer" },
        gender: { type: "string" },
        condition: { type: "string" },
        consciousnessLevel: { type: "string" },
        vitals: {
          type: "object",
          properties: {
            heartRate: { type: "integer" },
            bp: { type: "string" },
            spO2: { type: "integer" },
            respRate: { type: "integer" }
          }
        }
      }
    },
    etaMinutes: { type: "integer" },
    targetHospitalId: { type: "string" },
    status: {
      type: "string",
      enum: ["pending_acceptance", "accepted", "declined", "timed_out", "reassigned"]
    },
    consentSummary: CONSENT_OBJECT_SCHEMA,
    photos: {
      type: "array",
      items: PHOTO_METADATA_SCHEMA,
      description: "Consent-approved photos attached to hospital handoff payload"
    },
    escalationHistory: {
      type: "array",
      items: {
        type: "object",
        properties: {
          hospitalId: { type: "string" },
          action: { type: "string" },
          timestamp: { type: "string" },
          reason: { type: "string" }
        }
      }
    }
  }
};

export const AUDIT_LOG_ENTRY_SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "AuditLogEntry",
  type: "object",
  required: [
    "logId",
    "photoId",
    "requestId",
    "consentStatus",
    "senderId",
    "recipientHospitalId",
    "eventType",
    "timestamp"
  ],
  properties: {
    logId: { type: "string" },
    photoId: { type: "string" },
    requestId: { type: "string" },
    consentStatus: { type: "string" },
    senderId: { type: "string" },
    recipientHospitalId: { type: "string" },
    eventType: {
      type: "string",
      enum: [
        "CAPTURE",
        "TAG_UPDATE",
        "CONSENT_UPDATE",
        "TRANSMIT",
        "VIEWED",
        "ACCESS_REVOKED",
        "DESELECTED",
        "FALLBACK_TRIGGERED"
      ]
    },
    timestamp: { type: "string", format: "date-time" },
    metadata: { type: "object" }
  }
};
