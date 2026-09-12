# DevCommandCenter

> **Unified Developer Context, Deployment & Identity Manager**  
> IEEE 830-1998 Compliant Architecture with Client-Side Zero-Knowledge AES-256-GCM Encryption, Supabase PostgreSQL Strict Multi-Tenant Row Level Security (RLS), and Cross-Platform Mobile Hardware Biometrics.

---

## 1. System Overview

**DevCommandCenter** solves multi-stack developer context fragmentation by unifying:
1. **Dedicated Identity & Email Accounts (`FR-ACC`)**: Track dedicated Google, Outlook, and custom provider accounts with parent recovery email linkages to eliminate account lockouts.
2. **Zero-Knowledge Credential Vault (`FR-ACC-02`, `FR-PRJ-03`)**: Passwords, SMTP app tokens, 2FA backup codes, and test API keys are encrypted on the client device via **AES-256-GCM** (PBKDF2 HMAC-SHA256, 100,000+ iterations). Plaintext secrets are **never** transmitted to Supabase.
3. **Dual-Tier Deployment Topology (`FR-PRJ-02`)**: Independently logs Frontend (e.g., Vercel, Cloudflare) and Backend (e.g., Railway, Render, Supabase) deployment accounts, production URLs, and administrative console links.
4. **Local Execution Runbooks (`FR-PRJ-04`)**: Interactive Markdown-compatible runbooks with single-touch copy-to-clipboard actions and toast feedback for CLI start commands (`docker compose up`, `npm run dev`).
5. **Airtight Multi-Tenant Isolation (`TC-RLS-01`)**: PostgreSQL Row Level Security enforces `auth.uid() = user_id` across `SELECT`, `INSERT`, `UPDATE`, and `DELETE`. Cross-tenant linking of identity accounts is strictly blocked by database-level constraints.
6. **Hardware-Backed Mobile Security Shell (`FR-SEC-01..03`)**: Android Keystore hardware key binding, `BiometricPrompt` authentication gating (`BIOMETRIC_STRONG | DEVICE_CREDENTIAL`), OS screenshot prevention (`FLAG_SECURE`), and in-memory heap auto-wipe on `onPause()` or after 5 minutes of inactivity.
7. **One-Click Data Portability (`FR-SYN-02`)**: Full client-side JSON export of all projects, deployments, and encrypted vaults without vendor lock-in.

---

## 2. Monorepo Structure

```text
dev-command-center/
├── package.json                         # Monorepo workspace configuration
├── packages/
│   ├── shared-types/                    # Domain entities, DTOs & export schemas
│   │   ├── src/schema.ts
│   │   └── src/index.ts
│   └── crypto-core/                     # WebCrypto zero-knowledge AES-256-GCM engine
│       ├── src/
│       │   ├── constants.ts             # PBKDF2 (100k iter), 256-bit key, 12-byte IV
│       │   ├── kdf.ts                   # PBKDF2 HMAC-SHA256 key derivation
│       │   ├── cipher.ts                # Authenticated AES-GCM encrypt/decrypt
│       │   ├── serialization.ts         # Encrypted payload envelope serialization
│       │   └── index.ts
│       └── tests/
│           └── crypto.test.ts           # 6 automated cryptographic tests
├── apps/
│   ├── web/                             # Next.js 14 App Router Command Center
│   │   ├── src/app/                     # Dashboard, globals.css, layout
│   │   ├── src/components/              # RunbookViewer, ProjectCard, AccountCard, Modals
│   │   ├── src/context/                 # CryptoContext, DataContext, ToastContext
│   │   └── src/lib/supabaseClient.ts    # Supabase cloud client & realtime broker
│   └── mobile/                          # Android hardware-backed biometric client
│       ├── app/src/main/
│       │   ├── AndroidManifest.xml      # Biometric & FLAG_SECURE declarations
│       │   └── java/com/devcommandcenter/
│       │       ├── MainActivity.kt      # FLAG_SECURE & lifecycle auto-wipe
│       │       └── security/
│       │           ├── BiometricAuthManager.kt    # BiometricPrompt gate
│       │           ├── KeystoreKeyManager.kt      # Android Keystore hardware key
│       │           ├── MemoryAutoWipeManager.kt   # onPause heap zeroizer
│       │           └── AesGcmCipherEngine.kt      # Cross-platform decryption
│       └── app/build.gradle.kts
├── supabase/
│   ├── migrations/
│   │   ├── 20260911000001_create_accounts.sql
│   │   ├── 20260911000002_create_projects.sql
│   │   └── 20260911000003_rls_and_realtime.sql
│   └── tests/
│       └── rls_multi_tenant_isolation.test.sql
└── tests/
    └── e2e/
        └── test_matrix.test.ts          # TC-SEC-01, TC-MOB-01, TC-SYN-01, TC-RLS-01
```

---

## 3. Quick Start & Execution

### Prerequisites
- Node.js >= 20.0.0
- npm >= 10.0.0

### Installation
```bash
npm install
```

### Run Cryptographic Test Suite
```bash
npm test --workspace=@dev-command-center/crypto-core
```

### Run Acceptance & Test Matrix (TC-SEC-01, TC-MOB-01, TC-SYN-01, TC-RLS-01)
```bash
npm run test:matrix
```

### Launch Web Client Locally
```bash
npm run dev:web
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 4. Acceptance Test Matrix (IEEE 830)

| Test ID | Requirement | Methodology | Result |
| :--- | :--- | :--- | :--- |
| **TC-SEC-01** | Zero-Knowledge Storage | Raw row payload inspection after adding credentials | **PASS** — Pure ciphertext strings (`v:1`, `kdf:PBKDF2-SHA256`); zero plaintext leakage. |
| **TC-MOB-01** | Biometric Authentication Gate | Attempt to view credentials without biometric challenge | **PASS** — Cryptographic operation rejected unless authenticated. |
| **TC-SYN-01** | Cross-Platform Sync Latency | Measure end-to-end WebSocket replication latency | **PASS** — Realtime sync latency $< 1000\text{ms}$. |
| **TC-RLS-01** | Multi-Tenant Data Isolation | User B queries User A project UUID using public key | **PASS** — Returns 0 records; cross-tenant link and mutation attempts blocked. |

---

## 5. Security & Zero-Knowledge Architecture

1. **Passphrase Isolation**: Master passphrases are never persisted to disk, `localStorage`, or sent over HTTP/WSS. They reside strictly in volatile heap memory.
2. **In-Memory Auto-Wipe**: Both the Web Client (15-min idle timer / Lock button) and Android Mobile Client (`onPause()` lifecycle hook / 5-min idle timer) clear decrypted keys from heap memory.
3. **Screen Leak Prevention**: Mobile client enforces `WindowManager.LayoutParams.FLAG_SECURE`, preventing OS task switcher capture and screenshots of sensitive runbooks or tokens.
