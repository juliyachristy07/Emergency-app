import 'dart:convert';
import 'package:flutter/material.dart';
import '../services/api_service.dart';

class SchemasScreen extends StatefulWidget {
  const SchemasScreen({super.key});

  @override
  State<SchemasScreen> createState() => _SchemasScreenState();
}

class _SchemasScreenState extends State<SchemasScreen> {
  Map<String, dynamic> schemas = {};
  bool isLoading = false;
  String activeSchemaKey = 'consentObject';

  @override
  void initState() {
    super.initState();
    _loadSchemas();
  }

  Future<void> _loadSchemas() async {
    setState(() => isLoading = true);
    final fetched = await ApiService.fetchSchemas();
    setState(() {
      isLoading = false;
      schemas = fetched;
    });
  }

  @override
  Widget build(BuildContext context) {
    const labels = {
      'consentObject': 'Consent Object',
      'photoMetadata': 'Photo Metadata',
      'hospitalRequestPayload': 'Hospital Payload',
      'auditLogEntry': 'Audit Log Entry',
    };

    return Scaffold(
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('OFFICIAL JSON DATA SCHEMAS SPECIFICATION', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.cyanAccent)),
            const SizedBox(height: 10),
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: labels.keys.map((key) {
                  final isSelected = activeSchemaKey == key;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text(labels[key]!, style: TextStyle(fontSize: 11, color: isSelected ? Colors.cyanAccent : Colors.grey)),
                      selected: isSelected,
                      selectedColor: Colors.cyan.withValues(alpha: 0.2),
                      backgroundColor: const Color(0xFF0F172A),
                      onSelected: (_) => setState(() => activeSchemaKey = key),
                    ),
                  );
                }).toList(),
              ),
            ),
            const SizedBox(height: 12),
            Expanded(
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFF090D16),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFF1E293B)),
                ),
                child: SingleChildScrollView(
                  child: Text(
                    schemas[activeSchemaKey] != null
                        ? const JsonEncoder.withIndent('  ').convert(schemas[activeSchemaKey])
                        : 'Loading JSON schema...',
                    style: const TextStyle(fontSize: 11, fontFamily: 'monospace', color: Colors.cyanAccent),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
