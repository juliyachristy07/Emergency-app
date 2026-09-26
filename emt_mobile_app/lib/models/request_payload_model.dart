import 'photo_model.dart';

class PatientSummary {
  final int age;
  final String gender;
  final String condition;
  final String consciousnessLevel;
  final int heartRate;
  final String bp;
  final int spO2;
  final int respRate;

  PatientSummary({
    required this.age,
    required this.gender,
    required this.condition,
    required this.consciousnessLevel,
    required this.heartRate,
    required this.bp,
    required this.spO2,
    required this.respRate,
  });

  factory PatientSummary.fromJson(Map<String, dynamic> json) {
    final vitals = json['vitals'] as Map<String, dynamic>? ?? {};
    return PatientSummary(
      age: json['age'] ?? 45,
      gender: json['gender'] ?? 'Male',
      condition: json['condition'] ?? 'Severe Trauma',
      consciousnessLevel: json['consciousnessLevel'] ?? 'Unconscious (GCS 8)',
      heartRate: vitals['heartRate'] ?? 120,
      bp: vitals['bp'] ?? '90/60',
      spO2: vitals['spO2'] ?? 92,
      respRate: vitals['respRate'] ?? 24,
    );
  }
}

class HospitalRequestPayload {
  final String requestId;
  final String emtId;
  final String ambulanceId;
  final PatientSummary patientSummary;
  final int etaMinutes;
  String targetHospitalId;
  String targetHospitalName;
  String status;
  final Map<String, dynamic>? consentSummary;
  final List<PhotoRecord> photos;

  HospitalRequestPayload({
    required this.requestId,
    required this.emtId,
    required this.ambulanceId,
    required this.patientSummary,
    required this.etaMinutes,
    required this.targetHospitalId,
    required this.targetHospitalName,
    required this.status,
    this.consentSummary,
    required this.photos,
  });

  factory HospitalRequestPayload.fromJson(Map<String, dynamic> json) {
    final photosList = (json['photos'] as List? ?? [])
        .map((p) => PhotoRecord.fromJson(p))
        .toList();

    return HospitalRequestPayload(
      requestId: json['requestId'] ?? '',
      emtId: json['emtId'] ?? 'EMT-402',
      ambulanceId: json['ambulanceId'] ?? 'AMB-12',
      patientSummary: PatientSummary.fromJson(json['patientSummary'] ?? {}),
      etaMinutes: json['etaMinutes'] ?? 5,
      targetHospitalId: json['targetHospitalId'] ?? 'HOSP-CENTRAL-ER',
      targetHospitalName: json['targetHospitalName'] ?? 'St. Jude Central ER',
      status: json['status'] ?? 'pending_acceptance',
      consentSummary: json['consentSummary'] as Map<String, dynamic>?,
      photos: photosList,
    );
  }
}
