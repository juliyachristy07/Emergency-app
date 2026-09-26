import 'dart:async';
import 'package:flutter/material.dart';
import '../models/request_payload_model.dart';
import '../models/photo_model.dart';
import '../models/consent_state_machine.dart';
import '../services/api_service.dart';
import '../widgets/consent_badge_widget.dart';

class HospitalDashboardScreen extends StatefulWidget {
  const HospitalDashboardScreen({super.key});

  @override
  State<HospitalDashboardScreen> createState() => _HospitalDashboardScreenState();
}

class _HospitalDashboardScreenState extends State<HospitalDashboardScreen> {
  List<HospitalRequestPayload> requests = [];
  bool isLoading = false;
  int countdown = 45;
  Timer? _countdownTimer;
  Timer? _pollTimer;
  String? actionMessage;
  bool isError = false;

  @override
  void initState() {
    super.initState();
    _loadRequests();
    _startCountdown();
    _pollTimer = Timer.periodic(const Duration(seconds: 4), (_) => _loadRequests());
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    _pollTimer?.cancel();
    super.dispose();
  }

  void _startCountdown() {
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) {
        setState(() {
          countdown = countdown > 0 ? countdown - 1 : 45;
        });
      }
    });
  }

  Future<void> _loadRequests() async {
    final list = await ApiService.fetchRequests();
    if (mounted) {
      setState(() {
        requests = list;
      });
    }
  }

  Future<void> _handleAction(String requestId, String action) async {
    setState(() => isLoading = true);
    final res = await ApiService.handleHospitalAction(requestId: requestId, action: action);
    setState(() => isLoading = false);

    if (res['success'] == true) {
      setState(() {
        actionMessage = res['message'];
        isError = false;
      });
      _loadRequests();
    } else {
      setState(() {
        actionMessage = res['error'] ?? 'Action failed';
        isError = true;
      });
    }
  }

  void _showPhotoStreamDialog(PhotoRecord photo) async {
    // Invoke stream endpoint to log VIEWED audit event
    final streamRes = await ApiService.streamPhoto(photo.photoId);
    if (!mounted) return;

    final isAccessActive = streamRes['success'] == true;

    showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          backgroundColor: const Color(0xFF0F172A),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: const BorderSide(color: Color(0xFF1E293B))),
          title: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(photo.filename, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
              IconButton(icon: const Icon(Icons.close, size: 18), onPressed: () => Navigator.pop(ctx)),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ConsentBadgeWidget(
                state: photo.consentState,
                showJustification: true,
                justification: photo.justification,
              ),
              const SizedBox(height: 12),
              isAccessActive
                  ? Container(
                      height: 200,
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: Colors.black45,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: const Color(0xFF1E293B)),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.camera_alt_rounded, size: 48, color: Colors.cyanAccent),
                          const SizedBox(height: 8),
                          Text('Tag: ${photo.category.toUpperCase()}', style: const TextStyle(fontSize: 12, color: Colors.cyanAccent, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 4),
                          const Text('● View event logged in HIPAA audit trail', style: TextStyle(fontSize: 10, color: Colors.greenAccent)),
                        ],
                      ),
                    )
                  : Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.red.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: Colors.redAccent.withValues(alpha: 0.4)),
                      ),
                      child: const Column(
                        children: [
                          Icon(Icons.lock_rounded, size: 40, color: Colors.redAccent),
                          SizedBox(height: 8),
                          Text('ACCESS REVOKED / EXPIRED', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.redAccent)),
                          SizedBox(height: 4),
                          Text('Photo access auto-expired upon case closure or reassignment.', style: TextStyle(fontSize: 10, color: Colors.white70), textAlign: TextAlign.center),
                        ],
                      ),
                    ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Close', style: TextStyle(color: Colors.white70)),
            )
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: RefreshIndicator(
        onRefresh: _loadRequests,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          physics: const AlwaysScrollableScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Top Hospital Info Bar
              Card(
                elevation: 0,
                color: const Color(0xFF0F172A),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: const BorderSide(color: Color(0xFF1E293B))),
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.local_hospital_rounded, color: Colors.cyanAccent, size: 28),
                          SizedBox(width: 10),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('ST. JUDE TRIAGE COMMAND', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white)),
                              Text('Level 1 Trauma Unit | HOSP-CENTRAL-ER', style: TextStyle(fontSize: 10, color: Colors.grey)),
                            ],
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.black45,
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: Colors.amberAccent.withValues(alpha: 0.5)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.timer_outlined, color: Colors.amberAccent, size: 14),
                            const SizedBox(width: 4),
                            Text('TIMEOUT: ${countdown}s', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.amberAccent)),
                          ],
                        ),
                      )
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),

              if (actionMessage != null) ...[
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: isError ? Colors.red.withValues(alpha: 0.2) : Colors.green.withValues(alpha: 0.2),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: isError ? Colors.redAccent : Colors.greenAccent),
                  ),
                  child: Text(actionMessage!, style: const TextStyle(fontSize: 12, color: Colors.white)),
                ),
                const SizedBox(height: 16),
              ],

              // Incoming Transfer Requests
              const Text('INCOMING AMBULANCE TRANSFERS', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white70)),
              const SizedBox(height: 8),

              if (requests.isEmpty)
                Container(
                  padding: const EdgeInsets.all(32),
                  alignment: Alignment.center,
                  decoration: BoxDecoration(border: Border.all(color: const Color(0xFF1E293B)), borderRadius: BorderRadius.circular(12)),
                  child: const Text('No incoming transfers currently pending.', style: TextStyle(color: Colors.grey, fontSize: 12)),
                )
              else
                ...requests.map((req) {
                  final isEmergency = req.consentSummary?['consentState'] == ConsentStates.impliedEmergencyConsent;
                  final isFallbackMode = req.photos.isEmpty;

                  return Card(
                    elevation: 0,
                    margin: const EdgeInsets.only(bottom: 16),
                    color: const Color(0xFF0F172A),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: const BorderSide(color: Color(0xFF1E293B))),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Header
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(color: Colors.red.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(12)),
                                    child: Text(req.ambulanceId, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.redAccent)),
                                  ),
                                  const SizedBox(width: 8),
                                  Text(req.requestId, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                                ],
                              ),
                              Text('ETA: ${req.etaMinutes} MINS', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.amberAccent)),
                            ],
                          ),
                          const SizedBox(height: 10),

                          // Emergency Override Banner
                          if (isEmergency) ...[
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: Colors.amber.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: Colors.amberAccent.withValues(alpha: 0.5)),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Row(
                                    children: [
                                      Icon(Icons.warning_amber_rounded, color: Colors.amberAccent, size: 16),
                                      SizedBox(width: 6),
                                      Text('⚠️ IMPLIED EMERGENCY CONSENT OVERRIDE ACTIVE', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.amberAccent)),
                                    ],
                                  ),
                                  if (req.consentSummary?['justification'] != null) ...[
                                    const SizedBox(height: 4),
                                    Text('Clinical Justification: "${req.consentSummary!['justification']}"', style: const TextStyle(fontSize: 10, color: Colors.white70, fontStyle: FontStyle.italic)),
                                  ]
                                ],
                              ),
                            ),
                            const SizedBox(height: 10),
                          ],

                          // Fallback Mode Banner
                          if (isFallbackMode && req.status == 'pending_acceptance') ...[
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: Colors.grey.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: Colors.white24),
                              ),
                              child: const Row(
                                children: [
                                  Icon(Icons.text_snippet_rounded, color: Colors.grey, size: 16),
                                  SizedBox(width: 6),
                                  Expanded(
                                    child: Text('TEXT-ONLY FALLBACK MODE ACTIVE: Patient declined media transmission. Structured vitals & text payload transmitted.', style: TextStyle(fontSize: 10, color: Colors.white70)),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 10),
                          ],

                          // Clinical Vitals Row
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(color: Colors.black26, borderRadius: BorderRadius.circular(8)),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceAround,
                              children: [
                                Text('${req.patientSummary.gender}, ${req.patientSummary.age}y', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                                Text('HR: ${req.patientSummary.heartRate} bpm', style: const TextStyle(fontSize: 11, color: Colors.greenAccent)),
                                Text('BP: ${req.patientSummary.bp}', style: const TextStyle(fontSize: 11, color: Colors.greenAccent)),
                                Text('SpO2: ${req.patientSummary.spO2}%', style: const TextStyle(fontSize: 11, color: Colors.cyanAccent)),
                              ],
                            ),
                          ),
                          const SizedBox(height: 12),

                          // Inline Photos Gallery
                          const Text('INLINE TRANSMITTED PHOTOS & CONSENT BADGES', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
                          const SizedBox(height: 6),

                          req.photos.isEmpty
                              ? const Text('No photos attached to handoff payload.', style: TextStyle(fontSize: 11, color: Colors.grey, fontStyle: FontStyle.italic))
                              : Wrap(
                                  spacing: 8,
                                  runSpacing: 8,
                                  children: req.photos.map((p) {
                                    return GestureDetector(
                                      onTap: () => _showPhotoStreamDialog(p),
                                      child: Container(
                                        width: 140,
                                        padding: const EdgeInsets.all(8),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFF090D16),
                                          borderRadius: BorderRadius.circular(8),
                                          border: Border.all(color: const Color(0xFF1E293B)),
                                        ),
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(p.filename, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold), overflow: TextOverflow.ellipsis),
                                            const SizedBox(height: 4),
                                            Container(
                                              height: 50,
                                              width: double.infinity,
                                              color: Colors.black45,
                                              child: const Icon(Icons.photo_size_select_actual_rounded, color: Colors.cyanAccent, size: 24),
                                            ),
                                            const SizedBox(height: 4),
                                            ConsentBadgeWidget(state: p.consentState),
                                          ],
                                        ),
                                      ),
                                    );
                                  }).toList(),
                                ),
                          const SizedBox(height: 14),

                          // Action Buttons
                          Row(
                            children: [
                              Expanded(
                                child: ElevatedButton.icon(
                                  style: ElevatedButton.styleFrom(backgroundColor: Colors.green.shade800),
                                  icon: const Icon(Icons.check_circle_rounded, size: 16),
                                  label: const Text('ACCEPT HANDOFF', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                                  onPressed: req.status == 'accepted' ? null : () => _handleAction(req.requestId, 'accept'),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: OutlinedButton.icon(
                                  style: OutlinedButton.styleFrom(foregroundColor: Colors.redAccent, side: const BorderSide(color: Colors.redAccent)),
                                  icon: const Icon(Icons.cancel_rounded, size: 16),
                                  label: const Text('DECLINE & ESCALATE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                                  onPressed: req.status == 'accepted' ? null : () => _handleAction(req.requestId, 'decline'),
                                ),
                              ),
                            ],
                          )
                        ],
                      ),
                    ),
                  );
                }),
            ],
          ),
        ),
      ),
    );
  }
}
