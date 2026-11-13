# Project: PTO Planner gemello — Enterprise Cybersecurity Hardening

## Architecture
- **Environment**: Client-side Single Page Application (React 18, Vite 5, TypeScript 5, Tailwind CSS).
- **Security Posture**: Zero-Trust Client Defense-in-Depth. Because there is currently no dedicated remote backend server, all client-side storage, state mutations, and access controls are secured using industry-standard Web Cryptography, schema validation, and storage integrity enforcement.
- **Data Flow**:
  1. User credentials -> Salted PBKDF2-SHA256 Hash -> Verification against stored hash.
  2. Active Session -> Cryptographic Session Token + Expiry Timestamp (idle timeout) -> Session Validator.
  3. Sensitive Medical Protocol Data (GDPR Art. 9) -> Web Crypto AES-GCM 256-bit Encryption -> Encrypted Storage -> Decrypted strictly for authorized roles.
  4. LocalStorage State -> HMAC-SHA256 Integrity Seal -> Verified on every read; mutations resign state.
  5. Backup Imports -> Strict Zod Schema Parsing & Sanitization -> HMAC re-signing -> Storage.
  6. UI Layer -> React Error Boundary + Form Input Constraints (`maxLength`) + Content Security Policy (CSP).

## Feature Inventory
| # | Feature / Remediation | Description | Milestone | Source |
|---|-----------------------|-------------|-----------|--------|
| F01 | Cryptographic Core & Key Derivation | Web Crypto API wrappers for AES-GCM 256 encryption, PBKDF2-SHA256 hashing, and HMAC-SHA256 signatures | M1 | Survey 2 & 1 |
| F02 | Zod Runtime Schema Validation | Strict validation schemas for Utenza, Richiesta, Assenza, Sessione, and Backup | M1 | Survey 2 & 3 |
| F03 | TypeScript Type Alignment & Build Fix | Fix `ferie_mezza` discrepancies and unused parameters to ensure clean `npm run build` | M1 | Survey 1, 2, 3 |
| F04 | Password Hashing & Migration | Salted PBKDF2-SHA256 password hashing replacing plaintext `chiaveAccesso` | M2 | Survey 1 & 2 |
| F05 | Hardcoded Credential Remediation | Eliminate hardcoded admin password restore, require first-login change or secure generation | M2 | Survey 1 & 3 |
| F06 | Session Hardening & Inactivity Timeout | Cryptographic session tokens with idle timeout and session expiration | M2 | Survey 1 |
| F07 | Strict RBAC & Function-Level Authorization | Verify caller role and user identity in all service mutations (`accettaRichiesta`, etc.) | M2 | Survey 1 & 2 |
| F08 | Rate Limiting & Brute Force Defense | Progressive lockout counter for failed login attempts | M2 | Survey 1 |
| F09 | Password Input Masking | Mask inputs with `type="password"` and enforce current password verification | M2 | Survey 1 & 3 |
| F10 | GDPR Medical Data Encryption | AES-GCM 256 encryption for INPS protocols and medical reasons in storage | M3 | Survey 2 |
| F11 | Medical Data Role-Based Masking | Restrict visibility of colleague sickness details to titolare/responsabile | M3 | Survey 2 |
| F12 | Secure Backup Export/Import & RBAC Guard | Restrict backup tool to titolare and validate imported JSON with Zod | M3 | Survey 1, 2, 3 |
| F13 | Input Length Constraints & DoS Defense | Enforce `maxLength` and numerical bounds on all form inputs | M3 | Survey 3 |
| F14 | React Error Boundary & Crash Protection | Resilient Error Boundary catching render faults without leaking stack traces | M3 | Survey 2 & 3 |
| F15 | Content Security Policy (CSP) & Headers | CSP, Permissions-Policy, Clickjacking protection in HTML, Vite, and Vercel configs | M3 | Survey 2 & 3 |
| F16 | E2E Security Test Suite (Tiers 1-4) | Comprehensive test suite verifying crypto, auth, RBAC, tamper defense, and backups | M4 | Methodology |
| F17 | Adversarial Hardening (Tier 5) & Forensic Audit | Fuzz testing, tamper injections, and zero-tolerance forensic integrity audit | M5 | Integrity Policy |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Cryptographic Core, Zod Schemas & Build Remediation | Implement `src/servizi/sicurezza/` (Web Crypto AES-GCM, PBKDF2 hashing, HMAC integrity, Zod schemas) and fix TypeScript build errors | none | IN_PROGRESS |
| M2 | Secure Authentication, Session Hardening & RBAC Enforcement | Migrate passwords to PBKDF2 hashes, implement session expiration, rate limiting, and function-level access control on all state mutations | M1 | PLANNED |
| M3 | GDPR Medical Privacy, Secure Backup & Client Attack Surface Hardening | AES-GCM encryption of medical protocols, role-based medical masking, Zod-validated backups, input `maxLength`, Error Boundary, CSP headers | M1, M2 | PLANNED |
| M4 | E2E Security Test Suite (Tiers 1-4) | Build automated test suite for crypto primitives, auth logic, RBAC enforcement, tamper rejection, and backup validation (`TEST_READY.md`) | M1, M2, M3 | PLANNED |
| M5 | Adversarial Hardening (Tier 5) & Forensic Integrity Audit | Adversarial fuzzing/stress testing, zero-tolerance integrity audit via `teamwork_auditor` | M4 | PLANNED |

## Interface Contracts
### `src/servizi/sicurezza/crittografia.ts`
```typescript
export async function cifraDatoSensibile(testoInChiaro: string, chiaveSegreta?: string): Promise<string>;
export async function decifraDatoSensibile(testoCifrato: string, chiaveSegreta?: string): Promise<string>;
```

### `src/servizi/sicurezza/hashing.ts`
```typescript
export interface HashPasswordResult {
  hash: string;
  salt: string;
  iterazioni: number;
}
export async function generaHashPassword(passwordInChiaro: string, saltEsistente?: string): Promise<HashPasswordResult>;
export async function verificaPassword(passwordInChiaro: string, hashMemorizzato: string, salt: string): Promise<boolean>;
```

### `src/servizi/sicurezza/integrita.ts`
```typescript
export async function calcolaSigilloIntegrita(dati: unknown): Promise<string>;
export async function verificaSigilloIntegrita(dati: unknown, sigillo: string): Promise<boolean>;
```

### `src/servizi/sicurezza/schemi.ts`
```typescript
export const UtenzaSchema: z.ZodType<Utenza>;
export const VoceAssenzaSchema: z.ZodType<VoceAssenza>;
export const RichiestaAssenzaSchema: z.ZodType<RichiestaAssenza>;
export const BackupAziendaleSchema: z.ZodType<BackupAziendale>;
```

## Code Layout
```
src/
├── servizi/
│   ├── sicurezza/
│   │   ├── index.ts                # Unified security module export
│   │   ├── crittografia.ts         # Web Crypto AES-GCM 256 encryption/decryption
│   │   ├── hashing.ts              # PBKDF2-SHA256 password hashing & verification
│   │   ├── integrita.ts            # HMAC-SHA256 storage tamper detection
│   │   └── schemi.ts               # Zod schemas for runtime validation
│   └── gestore-archiviazione.ts    # Secure storage with RBAC, encryption & integrity
├── contesti/
│   └── ContestoPianificatore.tsx   # React context with session timeout & RBAC filtering
├── componenti/
│   ├── ErrorBoundary.tsx           # React Error Boundary defense-in-depth
│   ├── ModuloAccesso.tsx           # Hardened login with lockout & password masking
│   ├── GestioneUtenzeModal.tsx     # Secure user management with masked password inputs
│   ├── CopiaSicurezzaModal.tsx     # RBAC-restricted & Zod-validated backup
│   └── BarraNavigazione.tsx        # RBAC navigation hiding administrative tools
├── tipi/
│   └── index.ts                    # Synchronized TypeScript types
test/
├── sicurezza/
│   ├── crypto.test.ts              # Crypto & Hashing tests
│   ├── rbac.test.ts                # Auth & RBAC access control tests
│   ├── storage-tamper.test.ts      # Storage integrity & tampering tests
│   └── backup-validation.test.ts   # Backup schema & injection tests
```
