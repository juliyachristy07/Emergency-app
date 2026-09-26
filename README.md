# Emergence App — Consent & Photo-Sharing Module

**Person B's Hospital Coordination Module (Ambulance-to-Hospital Handoff Protocol)**

The **Emergence Module B Architecture** pairs a **Flutter Mobile App for EMTs** in ambulances with a **React Web Command Dashboard for Receiving Hospital Triage Teams**, linked by a real-time consent-gated Express API server.

---

## 📱 Mobile (Flutter) vs Desktop Web Architecture

```
                               ┌──────────────────────────────────────────┐
                               │     EMT Smartphone / Mobile Tablet       │
                               │        (Flutter / Dart Mobile App)       │
                               └────────────────────┬─────────────────────┘
                                                    │
                                   Field Media & Consent Decision API
                                                    │
                                                    ▼
                               ┌──────────────────────────────────────────┐
                               │   Express Backend API & HIPAA Audit Log  │
                               │             (Node.js Server)             │
                               └────────────────────┬─────────────────────┘
                                                    │
                                  Triage Sync & Auto-Expiry Access Control
                                                    │
                                                    ▼
                               ┌──────────────────────────────────────────┐
                               │     Hospital Triage Command Center       │
                               │        (React / Vite Web Dashboard)      │
                               └──────────────────────────────────────────┘
```

---

## 🌟 Features

### 🚑 EMT Mobile App (Flutter / Dart)
- **Field Photo Capture**: Instant preset capture & camera uploader for `injury`, `vitals`, `identification`, and `scene` photos.
- **Consent State Machine Controls**:
  - `Patient Consented` (Explicit verbal/written consent)
  - `Implied Emergency Consent` (Emergency override for unconscious/incapacitated patients with mandatory clinical justification input)
  - `Declined` (Triggers fallback mode)
- **Minimal Necessary Sharing**: Multi-select toggle grid to deselect specific photos before dispatch.
- **Backend API Synchronization**: Transmits structured request payload with attached consent-gated photos.

### 🏥 Hospital Triage Command Dashboard (React / Vite Web)
- **Inline Photo Rendering**: Displays consent-approved photos inline with incoming requests without breaking accept/decline/timeout/reassign UI.
- **Emergency Override Visual Flags**: Prominent amber warning badges and justification banners for implied consent overrides.
- **Auto-Expiry Access Control**: Photo access automatically revokes (`HTTP 403`) when a case is accepted or reassigned.
- **Text-Only Fallback**: If consent is declined, zero photos transmit; structured vitals and text assessment proceed through triage escalation.
- **HIPAA Audit Trail Vault**: Searchable, queryable immutable audit log with JSON export and JSON Schema viewer.

---

## 🚀 Running the System

### 1. Start Backend API Server
```bash
node server/index.js
# Backend running on http://localhost:3001
```

### 2. Start Hospital Web Dashboard (React)
```bash
npm run dev
# Dashboard running on http://localhost:3000
```

### 3. Run EMT Mobile App (Flutter)
```bash
cd emt_mobile_app

# Run on Chrome/Web
flutter run -d chrome

# Run on Windows Desktop
flutter run -d windows

# Build Mobile Web Bundle
flutter build web
```

### 4. Run Unit Tests
```bash
# Backend State Machine Vitest Suite
npm run test

# Flutter App Dart Analyzer
cd emt_mobile_app
dart analyze lib/main.dart
```

---

## 📂 Repository Structure

```
Emergence-app/
├── package.json                     # Node server & React web configuration
├── vite.config.js                   # Vite dev server with proxy to backend
├── server/
│   ├── index.js                     # Express API server entrypoint
│   ├── models/
│   │   ├── ConsentStateMachine.js   # Consent lifecycle & transition rules
│   │   ├── AuditLog.js              # Immutable audit trail logger
│   │   └── Store.js                 # Database store & auto-expiry hooks
│   ├── routes/
│   │   ├── photos.js                # Upload, tag, stream & access revocation
│   │   ├── consent.js               # Consent update endpoint
│   │   ├── requests.js              # Handoff request payload transmission
│   │   └── audit.js                 # Compliance log query interface
│   └── schemas/
│       └── consentSchemas.js        # JSON Schemas specification
├── src/                             # Hospital Command Web Dashboard (React)
│   ├── components/
│   │   ├── EmtModule.jsx            # EMT web station view
│   │   ├── HospitalDashboard.jsx    # Hospital triage dashboard
│   │   ├── AuditPortal.jsx          # HIPAA compliance audit vault
│   │   ├── SchemaViewer.jsx         # JSON Schemas viewer
│   │   ├── PhotoModal.jsx           # Photo stream modal with view audit logging
│   │   └── ConsentBadge.jsx         # Emergency override visual badges
│   └── services/
│       └── api.js                   # Web API service
├── emt_mobile_app/                  # EMT Mobile Application (Flutter / Dart)
│   ├── pubspec.yaml                 # Flutter packages configuration
│   └── lib/
│       ├── main.dart                # Flutter Mobile App UI & State Control
│       ├── models/                  # Dart models (Consent, Photo, Payload)
│       └── services/                # HTTP API Client for Node server
└── tests/
    └── consentStateMachine.test.js  # Vitest state machine unit tests
```

---

## ⚖️ License
MIT
