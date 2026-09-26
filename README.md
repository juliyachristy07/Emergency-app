# Emergence App — Consent & Photo-Sharing Module

**Person B's Hospital Coordination Module (Ambulance-to-Hospital Handoff Protocol)**

The **Consent & Photo-Sharing Module** enables EMTs in the field to share patient photos (injury site, vitals monitor screenshots, identification cards, and incident scenes) with receiving hospital triage teams prior to ambulance arrival. Every photo transmission is consent-gated, auditable, and compliant with HIPAA minimal necessary sharing guidelines.

---

## 🌟 Key Features

1. **Capture & Category Tagging**:
   - Live camera capture simulation and custom image file uploader.
   - Standardized medical category tagging (`injury` | `vitals` | `identification` | `scene`).
   - Auto-timestamp recorded upon media creation.

2. **Consent State Machine**:
   - **States**: `pending` -> `patient_consented` | `implied_emergency_consent` | `declined`.
   - **Implied Emergency Consent (Override)**: Permitted for unconscious or incapacitated patients. Requires mandatory clinical justification input (e.g., `"Patient unconscious post head trauma, GCS 8"`) and is visually flagged across all dashboards.
   - Full audit tracking for every state transition logging EMT ID, timestamp, prior state, target state, and justification.

3. **Minimal Necessary Sharing**:
   - Pre-send deselection grid allowing EMTs to exclude specific photos before dispatch.
   - Transmits only approved photos matching active transfer requirements.

4. **Hospital Dashboard Inline Integration**:
   - Renders photos inline with incoming requests without disrupting existing accept/decline/timeout UI.
   - Interactive photo stream modal logging viewer timestamp events.
   - 45-second decision countdown timer and real-time triage status updates.

5. **Auto-Expiry Access Control**:
   - Hospital photo access automatically revokes (`accessActive: false`) when a case closes (Accept) or is reassigned to another facility.
   - Subsequent view attempts yield `HTTP 403 Access Revoked`.

6. **Fallback Mode**:
   - If consent is `declined`, zero photos transmit. Structured clinical vitals and text assessment continue through standard triage escalation logic.

7. **HIPAA Audit Vault & Schema Documentation**:
   - Immutable audit trail queryable by Photo ID, Request ID, Consent Status, Event Type, and Date Range.
   - Export audit logs to JSON format.
   - Exposes JSON Schemas for `ConsentObject`, `PhotoMetadata`, `HospitalRequestPayload`, and `AuditLogEntry`.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation
```bash
# Install dependencies
npm install
```

### Running Locally
```bash
# Start backend server (Port 3001)
npm run server

# Start frontend application (Port 3000)
npm run dev
```

### Running Unit Tests
```bash
# Run Vitest suite
npm run test
```

### Production Build
```bash
# Build Vite production bundle
npm run build
```

---

## 📂 Project Architecture

```
Emergence-app/
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── index.html
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── index.css
│   ├── components/
│   │   ├── EmtModule.jsx            # EMT photo capture, tagging & consent state machine panel
│   │   ├── HospitalDashboard.jsx    # Hospital triage dashboard, accept/decline & auto-expiry
│   │   ├── AuditPortal.jsx          # Compliance audit trail & query interface
│   │   ├── SchemaViewer.jsx         # Live JSON schemas specification viewer
│   │   ├── PhotoModal.jsx           # Photo stream modal with view audit logging
│   │   └── ConsentBadge.jsx         # Emergency override visual badges
│   ├── services/
│   │   └── api.js                   # API service connector
│   └── state/
│       └── ConsentStateMachine.js   # Client consent state machine definitions
├── server/
│   ├── index.js                     # Express server setup
│   ├── models/
│   │   ├── ConsentStateMachine.js   # Core state machine logic & transition rules
│   │   ├── AuditLog.js              # Immutable audit trail logger
│   │   └── Store.js                 # In-memory database & auto-expiry hooks
│   ├── routes/
│   │   ├── photos.js                # Upload, tag, stream & access revocation
│   │   ├── consent.js               # Consent state update endpoint
│   │   ├── requests.js              # Request transmission & hospital decision logic
│   │   └── audit.js                 # Audit log search & JSON schema delivery
│   └── schemas/
│       └── consentSchemas.js        # JSON Schemas for consent & request payload
└── tests/
    └── consentStateMachine.test.js  # Vitest unit tests for state machine
```

---

## ⚖️ License
MIT
