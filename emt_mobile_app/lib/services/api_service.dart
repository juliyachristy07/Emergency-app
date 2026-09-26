import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../models/photo_model.dart';
import '../models/request_payload_model.dart';
import '../models/audit_log_model.dart';

class ApiService {
  static String get baseUrl {
    if (kIsWeb) return 'http://localhost:3001/api';
    if (defaultTargetPlatform == TargetPlatform.android) {
      return 'http://10.0.2.2:3001/api';
    }
    return 'http://localhost:3001/api';
  }

  static Future<Map<String, dynamic>> checkHealth() async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/health'));
      return jsonDecode(res.body);
    } catch (e) {
      return {'status': 'offline', 'error': e.toString()};
    }
  }

  static Future<List<HospitalRequestPayload>> fetchRequests() async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/requests'));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final list = (data['requests'] as List? ?? []);
        return list.map((r) => HospitalRequestPayload.fromJson(r)).toList();
      }
    } catch (e) {
      debugPrint('Error fetching requests: $e');
    }
    return [];
  }

  static Future<List<PhotoRecord>> fetchPhotos(String requestId) async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/requests/$requestId'));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final photosJson = data['request']['photos'] as List? ?? [];
        return photosJson.map((p) => PhotoRecord.fromJson(p)).toList();
      }
    } catch (e) {
      debugPrint('Error fetching photos: $e');
    }
    return [];
  }

  static Future<PhotoRecord?> uploadPhoto({
    required String requestId,
    required String category,
    required String filename,
    required String dataUrl,
    required String emtId,
  }) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/photos/upload'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'requestId': requestId,
          'category': category,
          'filename': filename,
          'dataUrl': dataUrl,
          'emtId': emtId,
        }),
      );
      if (res.statusCode == 201 || res.statusCode == 200) {
        final data = jsonDecode(res.body);
        return PhotoRecord.fromJson(data['photo']);
      }
    } catch (e) {
      debugPrint('Error uploading photo: $e');
    }
    return null;
  }

  static Future<bool> updateConsent({
    String? photoId,
    String? requestId,
    required String targetState,
    required String emtId,
    String? justification,
  }) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/consent/update'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'photoId': photoId,
          'requestId': requestId,
          'targetState': targetState,
          'emtId': emtId,
          'justification': justification,
        }),
      );
      final data = jsonDecode(res.body);
      return data['success'] == true;
    } catch (e) {
      debugPrint('Error updating consent: $e');
      return false;
    }
  }

  static Future<bool> tagPhoto({
    required String photoId,
    String? category,
    bool? isSelected,
  }) async {
    try {
      final res = await http.put(
        Uri.parse('$baseUrl/photos/$photoId/tag'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          if (category != null) 'category': category,
          if (isSelected != null) 'isSelected': isSelected,
        }),
      );
      final data = jsonDecode(res.body);
      return data['success'] == true;
    } catch (e) {
      debugPrint('Error tagging photo: $e');
      return false;
    }
  }

  static Future<Map<String, dynamic>> transmitPayload({
    required String requestId,
    required String emtId,
    required String ambulanceId,
    required Map<String, dynamic> patientSummary,
    required int etaMinutes,
    required String targetHospitalId,
  }) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/requests/transmit'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'requestId': requestId,
          'emtId': emtId,
          'ambulanceId': ambulanceId,
          'patientSummary': patientSummary,
          'etaMinutes': etaMinutes,
          'targetHospitalId': targetHospitalId,
        }),
      );
      return jsonDecode(res.body);
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }

  static Future<Map<String, dynamic>> streamPhoto(String photoId, {String viewerId = 'HOSP-CENTRAL-ER'}) async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/photos/$photoId/stream?viewerId=$viewerId'));
      if (res.statusCode == 200) {
        return jsonDecode(res.body);
      } else {
        return {'success': false, 'error': 'Access Revoked (HTTP ${res.statusCode})'};
      }
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }

  static Future<Map<String, dynamic>> handleHospitalAction({
    required String requestId,
    required String action,
    String hospitalId = 'HOSP-CENTRAL-ER',
  }) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/requests/$requestId/action'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'action': action,
          'hospitalId': hospitalId,
        }),
      );
      return jsonDecode(res.body);
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }

  static Future<List<AuditLogEntry>> fetchAuditLogs({
    String? photoId,
    String? requestId,
    String? consentStatus,
    String? eventType,
  }) async {
    try {
      final queryParams = <String, String>{};
      if (photoId != null && photoId.isNotEmpty) queryParams['photoId'] = photoId;
      if (requestId != null && requestId.isNotEmpty) queryParams['requestId'] = requestId;
      if (consentStatus != null && consentStatus.isNotEmpty) queryParams['consentStatus'] = consentStatus;
      if (eventType != null && eventType.isNotEmpty) queryParams['eventType'] = eventType;

      final uri = Uri.parse('$baseUrl/audit/logs').replace(queryParameters: queryParams);
      final res = await http.get(uri);
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final list = (data['logs'] as List? ?? []);
        return list.map((l) => AuditLogEntry.fromJson(l)).toList();
      }
    } catch (e) {
      debugPrint('Error fetching audit logs: $e');
    }
    return [];
  }

  static Future<Map<String, dynamic>> fetchSchemas() async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/audit/schemas'));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        return data['schemas'] as Map<String, dynamic>? ?? {};
      }
    } catch (e) {
      debugPrint('Error fetching schemas: $e');
    }
    return {};
  }
}
