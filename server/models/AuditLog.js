/**
 * Immutable Audit Trail Service
 * Log per photo: consent status, sender, recipient hospital, view timestamp(s)
 * Queryable by compliance officers.
 */

let auditLogStorage = [];

export class AuditLogService {
  /**
   * Log an immutable audit event
   */
  static logEvent({
    photoId = 'N/A',
    requestId = 'N/A',
    consentStatus = 'N/A',
    senderId = 'EMT-UNKNOWN',
    recipientHospitalId = 'ALL_HOSPITALS',
    eventType,
    metadata = {}
  }) {
    const entry = {
      logId: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      photoId,
      requestId,
      consentStatus,
      senderId,
      recipientHospitalId,
      eventType,
      timestamp: new Date().toISOString(),
      metadata
    };

    // Immutable store append
    auditLogStorage.push(Object.freeze(entry));
    return entry;
  }

  /**
   * Query audit logs with flexible filters
   */
  static queryLogs({ photoId, requestId, emtId, hospitalId, consentStatus, eventType, startDate, endDate }) {
    return auditLogStorage.filter(log => {
      if (photoId && log.photoId !== photoId) return false;
      if (requestId && log.requestId !== requestId) return false;
      if (emtId && log.senderId !== emtId) return false;
      if (hospitalId && log.recipientHospitalId !== hospitalId) return false;
      if (consentStatus && log.consentStatus !== consentStatus) return false;
      if (eventType && log.eventType !== eventType) return false;

      if (startDate && new Date(log.timestamp) < new Date(startDate)) return false;
      if (endDate && new Date(log.timestamp) > new Date(endDate)) return false;

      return true;
    }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  /**
   * Reset store (for testing)
   */
  static clearLogs() {
    auditLogStorage = [];
  }
}
