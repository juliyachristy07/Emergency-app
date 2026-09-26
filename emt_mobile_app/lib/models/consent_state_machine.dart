/// Consent State Machine Implementation in Dart
/// State Machine Lifecycle:
/// pending -> patient_consented | implied_emergency_consent | declined

class ConsentStates {
  static const String pending = 'pending';
  static const String patientConsented = 'patient_consented';
  static const String impliedEmergencyConsent = 'implied_emergency_consent';
  static const String declined = 'declined';
}

class PhotoCategories {
  static const String injury = 'injury';
  static const String vitals = 'vitals';
  static const String identification = 'identification';
  static const String scene = 'scene';

  static const List<String> allCategories = [injury, vitals, identification, scene];
}

class ConsentStateMachine {
  static bool isValidTransition(String currentState, String targetState) {
    if (currentState == targetState) return true;

    final allowed = {
      ConsentStates.pending: [
        ConsentStates.patientConsented,
        ConsentStates.impliedEmergencyConsent,
        ConsentStates.declined,
      ],
      ConsentStates.patientConsented: [
        ConsentStates.declined,
        ConsentStates.impliedEmergencyConsent,
      ],
      ConsentStates.impliedEmergencyConsent: [
        ConsentStates.patientConsented,
        ConsentStates.declined,
      ],
      ConsentStates.declined: [
        ConsentStates.patientConsented,
        ConsentStates.impliedEmergencyConsent,
      ],
    };

    return allowed[currentState]?.contains(targetState) ?? false;
  }

  static bool canTransmit(String consentState) {
    return consentState == ConsentStates.patientConsented ||
        consentState == ConsentStates.impliedEmergencyConsent;
  }

  static String evaluateGlobalConsent(List<String> states) {
    if (states.isEmpty) return ConsentStates.declined;
    if (states.contains(ConsentStates.impliedEmergencyConsent)) {
      return ConsentStates.impliedEmergencyConsent;
    }
    if (states.every((s) => s == ConsentStates.patientConsented)) {
      return ConsentStates.patientConsented;
    }
    if (states.every((s) => s == ConsentStates.declined)) {
      return ConsentStates.declined;
    }
    return ConsentStates.patientConsented;
  }
}
