import 'package:flutter/material.dart';
import 'models/consent_state_machine.dart';
import 'models/photo_model.dart';
import 'services/api_service.dart';

void main() {
  runApp(const EMTMobileApp());
}

class EMTMobileApp extends StatelessWidget {
  const EMTMobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'EMT Field Handoff - Emergence',
      debugShowCheckedModeBanner: false,
      theme: ThemeData.dark().copyWith(
        scaffoldBackgroundColor: const Color(0xFF020617),
        cardColor: const Color(0xFF0F172A),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFFDC2626),
          secondary: Color(0xFF06B6D4),
          surface: Color(0xFF0F172A),
        ),
      ),
      home: const EMTHomeScreen(),
    );
  }
}

class EMTHomeScreen extends StatefulWidget {
  const EMTHomeScreen({super.key});

  @override
  State<EMTHomeScreen> createState() => _EMTHomeScreenState();
}

class _EMTHomeScreenState extends State<EMTHomeScreen> {
  final String emtId = 'EMT-402 (Paramedic Davis)';
  final String ambulanceId = 'AMB-12';
  final String requestId = 'REQ-1001';
  final String targetHospitalId = 'HOSP-CENTRAL-ER';

  String condition = 'Severe Multi-Trauma (MVA)';
  String consciousnessLevel = 'Unconscious (GCS 8)';
  int heartRate = 124;
  String bp = '92/60';
  int spO2 = 91;
  int etaMinutes = 6;

  List<PhotoRecord> photos = [];
  bool isLoading = false;
  String? activePhotoId;
  String selectedConsentState = ConsentStates.pending;
  final TextEditingController justificationController = TextEditingController();

  String? statusMessage;
  bool isStatusError = false;

  @override
  void initState() {
    super.initState();
    _loadInitialData();
  }

  Future<void> _loadInitialData() async {
    setState(() => isLoading = true);
    final fetched = await ApiService.fetchPhotos(requestId);
    setState(() {
      isLoading = false;
      photos = fetched;
      if (photos.isNotEmpty) {
        activePhotoId = photos.first.photoId;
        selectedConsentState = photos.first.consentState;
        justificationController.text = photos.first.justification ?? '';
      }
    });
  }

  Future<void> _capturePreset(String category, String title, String colorHex, String detail) async {
    setState(() => isLoading = true);
    final dataUrl =
        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="100%" height="100%" fill="%230f172a"/><text x="50%" y="50%" fill="%23f8fafc" font-size="18" text-anchor="middle">${Uri.encodeComponent(title)}</text></svg>';

    final photo = await ApiService.uploadPhoto(
      requestId: requestId,
      category: category,
      filename: '${category}_${DateTime.now().millisecondsSinceEpoch.toString().substring(8)}.jpg',
      dataUrl: dataUrl,
      emtId: emtId,
    );

    setState(() => isLoading = false);
    if (photo != null) {
      setState(() {
        photos.insert(0, photo);
        activePhotoId = photo.photoId;
        selectedConsentState = photo.consentState;
        justificationController.clear();
        statusMessage = 'Captured $title! Tagged as $category';
        isStatusError = false;
      });
    }
  }

  Future<void> _applyConsentState(String targetState, {bool isBulk = false}) async {
    if (targetState == ConsentStates.impliedEmergencyConsent) {
      if (justificationController.text.trim().length < 5) {
        setState(() {
          statusMessage = '⚠️ Clinical justification required for Emergency Override!';
          isStatusError = true;
        });
        return;
      }
    }

    setState(() => isLoading = true);
    final ok = await ApiService.updateConsent(
      photoId: isBulk ? null : activePhotoId,
      requestId: isBulk ? requestId : null,
      targetState: targetState,
      emtId: emtId,
      justification: justificationController.text.trim(),
    );
    setState(() => isLoading = false);

    if (ok) {
      setState(() {
        selectedConsentState = targetState;
        statusMessage = 'Consent updated to $targetState and logged.';
        isStatusError = false;
        for (var p in photos) {
          if (isBulk || p.photoId == activePhotoId) {
            p.consentState = targetState;
            p.justification = justificationController.text.trim();
          }
        }
      });
    }
  }

  Future<void> _transmitPayload() async {
    setState(() => isLoading = true);
    final res = await ApiService.transmitPayload(
      requestId: requestId,
      emtId: emtId,
      ambulanceId: ambulanceId,
      patientSummary: {
        'age': 45,
        'gender': 'Male',
        'condition': condition,
        'consciousnessLevel': consciousnessLevel,
        'vitals': {
          'heartRate': heartRate,
          'bp': bp,
          'spO2': spO2,
          'respRate': 24,
        }
      },
      etaMinutes: etaMinutes,
      targetHospitalId: targetHospitalId,
    );
    setState(() => isLoading = false);

    if (res['success'] == true) {
      setState(() {
        statusMessage = res['message'];
        isStatusError = false;
      });
    } else {
      setState(() {
        statusMessage = res['error'] ?? 'Transmission failed.';
        isStatusError = true;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final activePhoto = photos.firstWhere(
      (p) => p.photoId == activePhotoId,
      orElse: () => photos.isNotEmpty ? photos.first : PhotoRecord(photoId: '', requestId: '', category: 'injury', filename: '', timestamp: '', dataUrl: '', emtId: emtId),
    );

    return Scaffold(
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F172A),
        elevation: 2,
        title: Row(
          children: [
            const Icon(Icons.medical_services_rounded, color: Colors.redAccent, size: 24),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('EMT MOBILE FIELD HANDOFF ($ambulanceId)', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                const Text('St. Jude ER Link | Active Transfer', style: TextStyle(fontSize: 11, color: Colors.cyanAccent)),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadInitialData,
          )
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status Notification Toast
            if (statusMessage != null) ...[
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: isStatusError ? Colors.red.withOpacity(0.2) : Colors.green.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: isStatusError ? Colors.redAccent : Colors.greenAccent),
                ),
                child: Row(
                  children: [
                    Icon(isStatusError ? Icons.warning_amber_rounded : Icons.check_circle_rounded,
                        color: isStatusError ? Colors.redAccent : Colors.greenAccent, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(statusMessage!, style: const TextStyle(fontSize: 12, color: Colors.white)),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, size: 16),
                      onPressed: () => setState(() => statusMessage = null),
                    )
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],

            // Section 1: Patient Assessment Card
            Card(
              elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: const BorderSide(color: Color(0xFF1E293B))),
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('📋 PATIENT CLINICAL ASSESSMENT', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.cyanAccent)),
                    const SizedBox(height: 10),
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Condition', style: TextStyle(fontSize: 11, color: Colors.grey)),
                              Text(condition, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.redAccent)),
                            ],
                          ),
                        ),
                        DropdownButton<String>(
                          value: consciousnessLevel,
                          dropdownColor: const Color(0xFF0F172A),
                          items: const [
                            DropdownMenuItem(value: 'Unconscious (GCS 8)', child: Text('Unconscious (GCS 8)', style: TextStyle(fontSize: 12))),
                            DropdownMenuItem(value: 'Alert & Oriented x4', child: Text('Alert & Oriented x4', style: TextStyle(fontSize: 12))),
                          ],
                          onChanged: (val) => setState(() => consciousnessLevel = val!),
                        )
                      ],
                    ),
                    const Divider(color: Color(0xFF1E293B)),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _vitalStat('HR', '$heartRate bpm', Colors.greenAccent),
                        _vitalStat('BP', bp, Colors.greenAccent),
                        _vitalStat('SpO2', '$spO2%', Colors.cyanAccent),
                        _vitalStat('ETA', '$etaMinutes mins', Colors.amberAccent),
                      ],
                    )
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Section 2: Quick Capture Presets
            const Text('📷 STEP 1: CAPTURE & TAG MEDIA', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white70)),
            const SizedBox(height: 8),
            GridView.count(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisCount: 2,
              childAspectRatio: 2.5,
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
              children: [
                _presetButton('🩹 Injury Site', 'injury', Colors.redAccent, () => _capturePreset('injury', 'Injury Laceration', '#ef4444', 'Leg Fracture')),
                _presetButton('📊 Vitals Monitor', 'vitals', Colors.greenAccent, () => _capturePreset('vitals', 'Monitor Screenshot', '#22c55e', 'HR 124 | BP 92/60')),
                _presetButton('🪪 Patient ID', 'identification', Colors.lightBlueAccent, () => _capturePreset('identification', 'Driver License', '#0284c7', 'ID Card')),
                _presetButton('🚔 Incident Scene', 'scene', Colors.purpleAccent, () => _capturePreset('scene', 'Vehicle Crash', '#a855f7', 'Collision Scene')),
              ],
            ),
            const SizedBox(height: 16),

            // Section 3: Captured Media List & Deselection Grid
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('CAPTURED PHOTOS (${photos.length})', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white70)),
                const Text('Minimal Necessary Sharing', style: TextStyle(fontSize: 10, color: Colors.grey)),
              ],
            ),
            const SizedBox(height: 8),
            SizedBox(
              height: 130,
              child: photos.isEmpty
                  ? Container(
                      alignment: Alignment.center,
                      decoration: BoxDecoration(border: Border.all(color: const Color(0xFF1E293B)), borderRadius: BorderRadius.circular(10)),
                      child: const Text('No media captured yet.', style: TextStyle(color: Colors.grey, fontSize: 12)),
                    )
                  : ListView.builder(
                      scrollDirection: Axis.horizontal,
                      itemCount: photos.length,
                      itemBuilder: (ctx, idx) {
                        final p = photos[idx];
                        final isSelected = p.photoId == activePhotoId;
                        return GestureDetector(
                          onTap: () {
                            setState(() {
                              activePhotoId = p.photoId;
                              selectedConsentState = p.consentState;
                              justificationController.text = p.justification ?? '';
                            });
                          },
                          child: Container(
                            width: 140,
                            margin: const EdgeInsets.only(right: 10),
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(
                              color: isSelected ? const Color(0xFF1E293B) : const Color(0xFF0F172A),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: isSelected ? Colors.cyanAccent : const Color(0xFF1E293B), width: isSelected ? 2 : 1),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Checkbox(
                                      value: p.isSelected,
                                      activeColor: Colors.cyanAccent,
                                      onChanged: (val) async {
                                        setState(() => p.isSelected = val ?? true);
                                        await ApiService.tagPhoto(photoId: p.photoId, isSelected: p.isSelected);
                                      },
                                    ),
                                    Text(p.category.toUpperCase(), style: const TextStyle(fontSize: 9, color: Colors.cyanAccent, fontWeight: FontWeight.bold)),
                                  ],
                                ),
                                Container(
                                  height: 40,
                                  width: double.infinity,
                                  color: Colors.black26,
                                  child: Icon(Icons.image, color: isSelected ? Colors.cyanAccent : Colors.grey, size: 28),
                                ),
                                const SizedBox(height: 4),
                                Text(p.consentState.replaceAll('_', ' '), style: TextStyle(fontSize: 9, color: p.consentState == ConsentStates.impliedEmergencyConsent ? Colors.amberAccent : Colors.greenAccent)),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
            ),
            const SizedBox(height: 16),

            // Section 4: Consent State Machine Control Panel
            if (activePhoto.photoId.isNotEmpty) ...[
              Card(
                elevation: 0,
                color: const Color(0xFF090D16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: const BorderSide(color: Color(0xFF1E293B))),
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('🔒 STEP 2: CONSENT STATE MACHINE CONTROL', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.cyanAccent)),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          Expanded(
                            child: _consentStateChoice(
                              label: 'Consented',
                              stateKey: ConsentStates.patientConsented,
                              color: Colors.greenAccent,
                              icon: Icons.shield,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: _consentStateChoice(
                              label: 'Emergency Override',
                              stateKey: ConsentStates.impliedEmergencyConsent,
                              color: Colors.amberAccent,
                              icon: Icons.warning_amber_rounded,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: _consentStateChoice(
                              label: 'Declined',
                              stateKey: ConsentStates.declined,
                              color: Colors.redAccent,
                              icon: Icons.block,
                            ),
                          ),
                        ],
                      ),

                      // Emergency Justification Form
                      if (selectedConsentState == ConsentStates.impliedEmergencyConsent) ...[
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: Colors.amber.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Colors.amber.withOpacity(0.4)),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('⚠️ EMERGENCY OVERRIDE JUSTIFICATION (MANDATORY)', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.amberAccent)),
                              const SizedBox(height: 6),
                              TextField(
                                controller: justificationController,
                                style: const TextStyle(fontSize: 12),
                                decoration: const InputDecoration(
                                  hintText: 'e.g. Patient unconscious post head trauma, GCS 8',
                                  border: OutlineInputBorder(),
                                  isDense: true,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],

                      const SizedBox(height: 10),
                      ElevatedButton.icon(
                        style: ElevatedButton.styleFrom(backgroundColor: Colors.cyan.shade800, minimumSize: const Size.fromHeight(40)),
                        icon: const Icon(Icons.save, size: 16),
                        label: const Text('Apply Consent Decision to Case', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                        onPressed: () => _applyConsentState(selectedConsentState, isBulk: true),
                      )
                    ],
                  ),
                ),
              ),
            ],
            const SizedBox(height: 20),

            // Section 5: Dispatch Button
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFDC2626),
                minimumSize: const Size.fromHeight(50),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              icon: const Icon(Icons.send_rounded),
              label: const Text('DISPATCH HANDOFF PAYLOAD TO HOSPITAL', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
              onPressed: isLoading ? null : _transmitPayload,
            ),
          ],
        ),
      ),
    );
  }

  Widget _vitalStat(String label, String val, Color color) {
    return Column(
      children: [
        Text(label, style: const TextStyle(fontSize: 10, color: Colors.grey)),
        const SizedBox(height: 2),
        Text(val, style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: color)),
      ],
    );
  }

  Widget _presetButton(String label, String cat, Color color, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        decoration: BoxDecoration(
          color: color.withOpacity(0.15),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: color.withOpacity(0.4)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: color)),
            Text('Tag: $cat', style: const TextStyle(fontSize: 9, color: Colors.grey)),
          ],
        ),
      ),
    );
  }

  Widget _consentStateChoice({required String label, required String stateKey, required Color color, required IconData icon}) {
    final isSelected = selectedConsentState == stateKey;
    return InkWell(
      onTap: () {
        setState(() => selectedConsentState = stateKey);
      },
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 6),
        decoration: BoxDecoration(
          color: isSelected ? color.withOpacity(0.2) : Colors.black26,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: isSelected ? color : Colors.white10),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 18),
            const SizedBox(height: 4),
            Text(label, style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: isSelected ? color : Colors.grey), textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
}
