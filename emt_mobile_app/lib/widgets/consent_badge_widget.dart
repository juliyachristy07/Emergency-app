import 'package:flutter/material.dart';
import '../models/consent_state_machine.dart';

class ConsentBadgeWidget extends StatelessWidget {
  final String state;
  final String? justification;
  final bool showJustification;

  const ConsentBadgeWidget({
    super.key,
    required this.state,
    this.justification,
    this.showJustification = false,
  });

  @override
  Widget build(BuildContext context) {
    if (state == ConsentStates.patientConsented) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: Colors.green.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.greenAccent.withValues(alpha: 0.4)),
        ),
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.shield_rounded, color: Colors.greenAccent, size: 14),
            SizedBox(width: 4),
            Text('Patient Consented', style: TextStyle(fontSize: 11, color: Colors.greenAccent, fontWeight: FontWeight.bold)),
          ],
        ),
      );
    }

    if (state == ConsentStates.impliedEmergencyConsent) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.amber.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.amberAccent),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.warning_amber_rounded, color: Colors.amberAccent, size: 14),
                SizedBox(width: 4),
                Text('⚠️ EMERGENCY OVERRIDE (Implied Consent)', style: TextStyle(fontSize: 10, color: Colors.amberAccent, fontWeight: FontWeight.bold)),
              ],
            ),
          ),
          if (showJustification && justification != null && justification!.isNotEmpty) ...[
            const SizedBox(height: 4),
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: Colors.amber.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: Colors.amber.withValues(alpha: 0.3)),
              ),
              child: Text(
                'Clinical Rationale: "$justification"',
                style: const TextStyle(fontSize: 10, color: Colors.amberAccent, fontStyle: FontStyle.italic),
              ),
            ),
          ],
        ],
      );
    }

    if (state == ConsentStates.declined) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: Colors.red.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.redAccent.withValues(alpha: 0.4)),
        ),
        child: const Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.block_rounded, color: Colors.redAccent, size: 14),
            SizedBox(width: 4),
            Text('Declined (Blocked)', style: TextStyle(fontSize: 11, color: Colors.redAccent, fontWeight: FontWeight.bold)),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.grey.withValues(alpha: 0.2),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white24),
      ),
      child: const Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.access_time_rounded, color: Colors.grey, size: 14),
          SizedBox(width: 4),
          Text('Pending Evaluation', style: TextStyle(fontSize: 11, color: Colors.grey)),
        ],
      ),
    );
  }
}
