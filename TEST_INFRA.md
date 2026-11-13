# Test Infrastructure & Security Testing Methodology
**Project:** PTO Planner gemello — C. Emme Impianti S.r.l.  
**Track:** Senior Security QA and E2E Test Engineering  
**Version:** 1.0.0 (Hardened Enterprise Suite)  
**Date:** 2026-11-13  

---

## 1. Executive Summary

This document formalizes the testing architecture, invocation lifecycle, pass/fail semantics, and 4-Tier Security Verification Methodology for the **PTO Planner gemello** application. 

Because the application is a client-side Single Page Application handling sensitive employee workforce schedules, personal telephone numbers, and special category medical data (GDPR Art. 9 / INPS telematic protocols), security verification cannot rely solely on happy-path UI tests. The security test infrastructure is specifically engineered to validate:
- Cryptographic correctness (AES-GCM 256, PBKDF2-SHA256, HMAC-SHA256).
- Strict runtime boundary validation via Zod schemas.
- Anti-tampering and state integrity detection in client-side persistence (`localStorage`).
- Role-Based Access Control (RBAC) and horizontal/vertical privilege escalation resistance.
- Brute-force lockout and session expiration dynamics.
- Safe serialization, validation, and rejection of malicious backup imports.

---

## 2. Test Architecture & Execution Framework

### 2.1 Test Runner & Environment
- **Test Runner:** [Vitest](https://vitest.dev/) (v5.1+), deeply integrated with Vite 6 and TypeScript 5.
- **Runtime Environment:** Node.js v20+ / v24+ with native Web Crypto API (`globalThis.crypto.subtle`, `crypto.getRandomValues`).
- **Isolation Model:** Hermetic in-memory isolation per test suite. Each test sets up clean mock storage states and operates independently without cross-test leakage.
- **Assertion Engine:** Vitest / Chai assertions (`expect`, `describe`, `it`, `beforeEach`, `vi`).

### 2.2 Directory Layout

```
PTO Planner gemello/
├── TEST_INFRA.md                    # Test infrastructure, runner and methodology (this file)
├── TEST_READY.md                    # Verification readiness certificate and test summary
├── vitest.config.ts                 # Vitest runner configuration
├── package.json                     # Scripts: "test": "vitest run"
├── src/
│   ├── servizi/
│   │   ├── sicurezza/
│   │   │   ├── crittografia.ts     # AES-GCM 256-bit encryption/decryption
│   │   │   ├── hashing.ts          # Salted PBKDF2-SHA256 password hashing
│   │   │   ├── integrita.ts        # HMAC-SHA256 storage tamper detection
│   │   │   ├── schemi.ts           # Zod runtime schemas
│   │   │   └── index.ts            # Security barrel export
│   │   └── gestore-archiviazione.ts # Core storage with RBAC, crypto & integrity
└── test/
    └── sicurezza/
        ├── crypto.test.ts          # Tier 1 & Tier 2: Crypto, Hashing, Signatures
        ├── rbac.test.ts            # Tier 1, 2, 3 & 4: RBAC, Session & Auth tests
        ├── storage-tamper.test.ts  # Tier 2, 3 & 4: Storage integrity & Tamper detection
        └── backup-validation.test.ts # Tier 1, 2, 3 & 4: Zod schemas & Backup injection
```

---

## 3. Four-Tier Security Testing Methodology

The test suite is structured around a rigorous 4-Tier pyramid designed to provide exhaustive depth from unit cryptographic primitives to full real-world attack simulations.

```
                 ▲
                / \
               /   \   Tier 4: Real-World Adversarial Attack Scenarios
              /     \  (Privilege escalation, brute-force lockout, storage injection)
             /-------\
            /         \   Tier 3: Cross-Feature State & Combinations
           /           \  (Auth + Session + RBAC, Backup roundtrips, Encrypted storage)
          /-------------\
         /               \   Tier 2: Boundary, Robustness & Corner Cases
        /                 \  (Max/empty strings, 1-char tampering, malformed JSON, timeouts)
       /-------------------\
      /                     \   Tier 1: Core Security Feature Coverage
     /                       \  (PBKDF2 derivation, AES-GCM, HMAC seals, Zod schemas)
    /-------------------------\
```

### Tier 1: Core Feature Verification (>= 5 tests per feature)
Verifies the nominal functional contracts of security primitives:
1. **PBKDF2 Password Hashing & Verification**:
   - Correct salt derivation using CSPRNG.
   - Distinct salts for identical passwords producing completely distinct hashes.
   - Exact hash verification success matching original password.
   - Clean rejection of incorrect passwords.
   - Iteration count adherence (>= 100,000 iterations).
2. **AES-GCM 256-bit Encryption & Decryption**:
   - Confidentiality: ciphertext does not contain plaintext substring.
   - Authenticity: successful round-trip decrypts back to exact original plaintext.
   - Random Initialization Vector (IV): encrypting identical plaintext twice produces distinct payloads.
   - Key sensitivity: attempting decryption with wrong key throws cryptographic error.
   - Tamper sensitivity: modifying a single byte in ciphertext fails authentication tag check.
3. **HMAC-SHA256 Integrity Seals**:
   - Valid deterministic signature generation across objects.
   - Verification returns `true` for authentic untampered data.
   - Verification returns `false` if content is modified.
   - Key dependency: different signing keys produce differing signatures.
   - Timing-safe comparison to prevent side-channel timing leaks.
4. **Zod Runtime Schemas**:
   - Valid `Utenza` objects parse cleanly.
   - Valid `VoceAssenza` objects parse cleanly.
   - Valid `RichiestaAssenza` objects parse cleanly.
   - Valid `BackupAziendale` objects parse cleanly.
   - Invalid objects throw descriptive `ZodError` containing path and validation issue.

---

### Tier 2: Boundary, Robustness & Corner Cases (>= 5 tests per feature)
Tests the limits and edge conditions where real-world vulnerabilities often arise:
1. **String & Password Boundaries**:
   - Empty password string handling.
   - Single character and ultra-short inputs.
   - Unicode, emoji, and non-ASCII characters (`Password🔑🔒123!`).
   - Maximum length stress (passwords up to 2,048 characters).
   - Trailing/leading whitespace trimming and normalization.
2. **Cryptographic Boundaries**:
   - Empty string encryption and decryption.
   - Massive multi-line medical diagnostic notes (long INPS certificate explanations, 10,000+ characters).
   - Special control characters (`\x00`, `\r\n`, tabs, HTML tags).
   - Tampered HMAC seal by exactly 1 single hex character (e.g. `a` -> `b`).
   - Truncated or lengthened HMAC tags.
3. **Malformed & Malicious JSON Payloads**:
   - Payloads with missing mandatory fields (e.g. `identificativo` missing).
   - Prototype pollution attempts (`__proto__`, `constructor`, `prototype`).
   - Type mismatch injection (numbers where strings expected, strings where numbers expected).
   - Out-of-bounds dates (e.g. `9999-99-99`, `invalid-date`).
   - Negative PTO quantities or excessive hours (> 24 hours).
4. **Session Timeout & Inactivity Boundaries**:
   - Session timestamp just before expiry (active/valid).
   - Session timestamp at exact expiry boundary (invalidated).
   - Session timestamp past expiry (rejection and automatic logout).
   - Future/tampered clock timestamps.
   - Missing or corrupted session token formats.

---

### Tier 3: Cross-Feature State & Combinations
Verifies integration between security sub-systems:
1. **Authentication + Session Generation + RBAC Validation**:
   - Full flow: credential verification -> cryptographic session token issuance -> role check for `titolare` vs `dipendente`.
   - Ensure session expiry propagates through RBAC checks.
2. **Backup Export -> JSON Serialization -> Zod Validation -> HMAC Sealing -> Restore**:
   - Export full company state into sealed JSON structure.
   - Parse and validate schema with Zod.
   - Verify HMAC checksum tag.
   - Re-import into fresh storage without data loss or corruption.
3. **Medical Data Encryption + Storage Persistence + Role-Based Masking**:
   - Submitting sick leave encrypts INPS protocol number with AES-GCM before storage.
   - Authorized retrieval by `titolare` decrypts and displays protocol number.
   - Retrieval by standard colleague (`dipendente`) strictly masks or strips medical fields.

---

### Tier 4: Real-World Adversarial Application Scenarios
Simulates realistic exploitation attempts:
1. **Vertical Privilege Escalation Simulation**:
   - Standard employee (`dipendente`) attempts to elevate their own role to `titolare` by direct manipulation of `localStorage` (`cemme_utenze_v2` or `cemme_sessione_attiva_v2`).
   - Storage integrity check detects unsigned modification and invalidates the session or resets state.
2. **Brute-Force Authentication Lockout Simulation**:
   - Automated script submits consecutive incorrect passwords.
   - Lockout threshold is reached (e.g. 5 failed attempts); account or client session is placed in timed lockout.
   - Further attempts with correct password are rejected during lockout window.
3. **LocalStorage PTO Tampering Simulation**:
   - Malicious actor directly modifies their approved vacation days from 0 to 20 in `cemme_assenze_v2` or modifies leave status to `approvata` in `cemme_richieste_v2`.
   - HMAC integrity validation triggers a tamper alert, rejects state read, and quarantines corrupted records.
4. **Malicious Backup Restore Injection**:
   - Attacker crafts a poisoned backup JSON containing an injected root administrator account or rogue scripts.
   - Restore routine parses via Zod, detects unauthorized extra fields or schema violations, and refuses to import.

---

## 4. Runner Invocation & Commands

### 4.1 Running All Tests
```powershell
# Run entire security suite once
npm test

# Equivalent direct vitest invocation
npx vitest run
```

### 4.2 Running Specific Test Suites
```powershell
# Run only crypto & hashing tests
npx vitest run test/sicurezza/crypto.test.ts

# Run only RBAC & privilege tests
npx vitest run test/sicurezza/rbac.test.ts

# Run only storage tamper tests
npx vitest run test/sicurezza/storage-tamper.test.ts

# Run only backup validation tests
npx vitest run test/sicurezza/backup-validation.test.ts
```

### 4.3 Running with Watch Mode (Development)
```powershell
npx vitest
```

---

## 5. Pass / Fail Semantics

- **Success (Exit Code 0):** All assertions pass across all 4 tiers without uncaught exceptions or timeouts.
- **Failure (Exit Code 1):** Any assertion fails, or an unhandled exception is thrown during test execution.
- **Flakiness Policy:** Tests must be 100% deterministic. No test may rely on arbitrary network latency or unpinned random seeds without fixed assertions.
- **Isolation Policy:** Every test must restore any global state or mock storage in `beforeEach` / `afterEach`.

---

## 6. Maintenance & Extensibility

When adding new security features to PTO Planner:
1. Identify the feature's security tier (Tier 1 primitive, Tier 2 boundary, Tier 3 combination, Tier 4 attack simulation).
2. Add at least 5 targeted unit/functional tests in the corresponding `test/sicurezza/` file.
3. Verify 100% pass rate via `npm test`.
4. Update `TEST_READY.md` coverage table.
