class AuditLogEntry {
  final String logId;
  final String photoId;
  final String requestId;
  final String consentStatus;
  final String senderId;
  final String recipientHospitalId;
  final String eventType;
  final String timestamp;
  final Map<String, dynamic>? metadata;

  AuditLogEntry({
    required this.logId,
    required this.photoId,
    required this.requestId,
    required this.consentStatus,
    required this.senderId,
    required this.recipientHospitalId,
    required this.eventType,
    required this.timestamp,
    this.metadata,
  });

  factory AuditLogEntry.fromJson(Map<String, dynamic> json) {
    return AuditLogEntry(
      logId: json['logId'] ?? '',
      photoId: json['photoId'] ?? 'N/A',
      requestId: json['requestId'] ?? 'N/A',
      consentStatus: json['consentStatus'] ?? 'N/A',
      senderId: json['senderId'] ?? 'N/A',
      recipientHospitalId: json['recipientHospitalId'] ?? 'N/A',
      eventType: json['eventType'] ?? 'UNKNOWN',
      timestamp: json['timestamp'] ?? DateTime.now().toIso8601String(),
      metadata: json['metadata'] as Map<String, dynamic>?,
    );
  }
}
