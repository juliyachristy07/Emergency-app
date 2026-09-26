import 'package:flutter/material.dart';
import '../models/audit_log_model.dart';
import '../services/api_service.dart';

class AuditLogScreen extends StatefulWidget {
  const AuditLogScreen({super.key});

  @override
  State<AuditLogScreen> createState() => _AuditLogScreenState();
}

class _AuditLogScreenState extends State<AuditLogScreen> {
  List<AuditLogEntry> logs = [];
  bool isLoading = false;
  String photoIdFilter = '';
  String consentStatusFilter = '';
  String eventTypeFilter = '';

  @override
  void initState() {
    super.initState();
    _loadLogs();
  }

  Future<void> _loadLogs() async {
    setState(() => isLoading = true);
    final fetched = await ApiService.fetchAuditLogs(
      photoId: photoIdFilter,
      consentStatus: consentStatusFilter,
      eventType: eventTypeFilter,
    );
    setState(() {
      isLoading = false;
      logs = fetched;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Card(
              elevation: 0,
              color: const Color(0xFF0F172A),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12), side: const BorderSide(color: Color(0xFF1E293B))),
              child: Padding(
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.shield_rounded, color: Colors.purpleAccent, size: 24),
                        SizedBox(width: 8),
                        Text('HIPAA & COMPLIANCE AUDIT VAULT', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Colors.white)),
                      ],
                    ),
                    const SizedBox(height: 6),
                    const Text('Immutable log per photo: consent status, EMT sender, recipient hospital, view timestamps, & auto-expiry events.', style: TextStyle(fontSize: 10, color: Colors.grey)),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Filters
            Row(
              children: [
                Expanded(
                  child: TextField(
                    style: const TextStyle(fontSize: 12),
                    decoration: const InputDecoration(
                      hintText: 'Filter by Photo ID...',
                      isDense: true,
                      border: OutlineInputBorder(),
                    ),
                    onChanged: (val) {
                      photoIdFilter = val;
                      _loadLogs();
                    },
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: const Icon(Icons.refresh, color: Colors.cyanAccent),
                  onPressed: _loadLogs,
                ),
              ],
            ),
            const SizedBox(height: 16),

            Text('AUDIT LOG RECORDS (${logs.length})', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white70)),
            const SizedBox(height: 8),

            isLoading
                ? const Center(child: CircularProgressIndicator())
                : logs.isEmpty
                    ? Container(
                        padding: const EdgeInsets.all(32),
                        alignment: Alignment.center,
                        decoration: BoxDecoration(border: Border.all(color: const Color(0xFF1E293B)), borderRadius: BorderRadius.circular(12)),
                        child: const Text('No matching audit records found.', style: TextStyle(color: Colors.grey, fontSize: 12)),
                      )
                    : ListView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: logs.length,
                        itemBuilder: (ctx, idx) {
                          final log = logs[idx];
                          final isViewed = log.eventType == 'VIEWED';
                          final isRevoked = log.eventType == 'ACCESS_REVOKED';

                          return Card(
                            elevation: 0,
                            margin: const EdgeInsets.only(bottom: 8),
                            color: const Color(0xFF090D16),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8), side: const BorderSide(color: Color(0xFF1E293B))),
                            child: ListTile(
                              dense: true,
                              title: Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(log.eventType, style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: isViewed ? Colors.cyanAccent : isRevoked ? Colors.redAccent : Colors.purpleAccent)),
                                  Text(log.photoId, style: const TextStyle(fontSize: 10, color: Colors.cyanAccent, fontFamily: 'monospace')),
                                ],
                              ),
                              subtitle: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const SizedBox(height: 4),
                                  Text('Consent: ${log.consentStatus} | Sender: ${log.senderId}', style: const TextStyle(fontSize: 10, color: Colors.grey)),
                                  Text('Time: ${DateTime.tryParse(log.timestamp)?.toLocal().toString() ?? log.timestamp}', style: const TextStyle(fontSize: 9, color: Colors.grey)),
                                  if (log.metadata?['justification'] != null)
                                    Text('Justification: "${log.metadata!['justification']}"', style: const TextStyle(fontSize: 9, color: Colors.amberAccent, fontStyle: FontStyle.italic)),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
          ],
        ),
      ),
    );
  }
}
