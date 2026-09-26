import 'consent_state_machine.dart';

class PhotoRecord {
  final String photoId;
  final String requestId;
  String category;
  final String filename;
  final String timestamp;
  final String dataUrl;
  String consentState;
  String? justification;
  final String emtId;
  bool isSelected;
  bool accessActive;

  PhotoRecord({
    required this.photoId,
    required this.requestId,
    required this.category,
    required this.filename,
    required this.timestamp,
    required this.dataUrl,
    this.consentState = ConsentStates.pending,
    this.justification,
    required this.emtId,
    this.isSelected = true,
    this.accessActive = true,
  });

  factory PhotoRecord.fromJson(Map<String, dynamic> json) {
    final consentRec = json['consentRecord'] as Map<String, dynamic>?;
    return PhotoRecord(
      photoId: json['photoId'] ?? '',
      requestId: json['requestId'] ?? '',
      category: json['category'] ?? PhotoCategories.injury,
      filename: json['filename'] ?? 'capture.jpg',
      timestamp: json['timestamp'] ?? DateTime.now().toIso8601String(),
      dataUrl: json['dataUrl'] ?? '',
      consentState: json['consentState'] ?? ConsentStates.pending,
      justification: consentRec?['justification'] ?? json['justification'],
      emtId: json['emtId'] ?? consentRec?['emtId'] ?? 'EMT-402',
      isSelected: json['isSelected'] ?? true,
      accessActive: json['accessActive'] ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'photoId': photoId,
      'requestId': requestId,
      'category': category,
      'filename': filename,
      'timestamp': timestamp,
      'dataUrl': dataUrl,
      'consentState': consentState,
      'consentRecord': {
        'consentState': consentState,
        'previousState': null,
        'emtId': emtId,
        'timestamp': timestamp,
        'justification': justification,
        'isEmergencyOverride': consentState == ConsentStates.impliedEmergencyConsent,
      },
      'isSelected': isSelected,
      'accessActive': accessActive,
    };
  }
}
