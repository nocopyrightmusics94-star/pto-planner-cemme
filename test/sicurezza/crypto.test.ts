import { describe, it, expect } from 'vitest';
import {
  generaHashPassword,
  verificaPassword,
  cifraDatoSensibile,
  decifraDatoSensibile,
  calcolaSigilloIntegrita,
  verificaSigilloIntegrita,
  timingSafeEqual,
  PBKDF2_ITERATIONS,
} from './module-loader.js';

describe('Cryptographic Core & Hashing Suite (Tiers 1, 2, 3)', () => {
  // =========================================================================
  // TIER 1: FEATURE COVERAGE (>=5 tests per feature)
  // =========================================================================
  describe('Tier 1: PBKDF2 Password Hashing & Verification', () => {
    it('T1-PBKDF2-1: generates standard 64-char hex hash and 32-char hex salt', async () => {
      const result = await generaHashPassword('PasswordSicura2026!');
      expect(result).toHaveProperty('hash');
      expect(result).toHaveProperty('salt');
      expect(result).toHaveProperty('iterazioni');
      expect(result.hash).toMatch(/^[0-9a-f]{64}$/i);
      expect(result.salt).toMatch(/^[0-9a-f]{32}$/i);
      expect(result.iterazioni).toBeGreaterThanOrEqual(100000);
    });

    it('T1-PBKDF2-2: identical passwords generate completely different salts and hashes', async () => {
      const pass = 'IdenticalPassword123';
      const hash1 = await generaHashPassword(pass);
      const hash2 = await generaHashPassword(pass);

      expect(hash1.salt).not.toBe(hash2.salt);
      expect(hash1.hash).not.toBe(hash2.hash);
    });

    it('T1-PBKDF2-3: verification succeeds when provided with the correct password and salt', async () => {
      const pass = 'CorrettaPassphrase#2026';
      const generated = await generaHashPassword(pass);
      const isValid = await verificaPassword(pass, generated.hash, generated.salt);
      expect(isValid).toBe(true);
    });

    it('T1-PBKDF2-4: verification fails when provided with an incorrect password', async () => {
      const pass = 'MasterKeyPassword123';
      const wrongPass = 'MasterKeyPassword124';
      const generated = await generaHashPassword(pass);
      const isValid = await verificaPassword(wrongPass, generated.hash, generated.salt);
      expect(isValid).toBe(false);
    });

    it('T1-PBKDF2-5: verification rejects mismatched salt even with correct password', async () => {
      const pass = 'ValidPasswordToTest';
      const generated = await generaHashPassword(pass);
      const fakeSalt = '0123456789abcdef0123456789abcdef';
      const isValid = await verificaPassword(pass, generated.hash, fakeSalt);
      expect(isValid).toBe(false);
    });
  });

  describe('Tier 1: AES-GCM 256 Encryption & Decryption', () => {
    it('T1-AES-1: encryption generates non-plaintext envelope with IV, salt, and ciphertext', async () => {
      const plain = 'Certificato Medico INPS: Protocollo #9876543210';
      const cipher = await cifraDatoSensibile(plain);

      expect(cipher).not.toContain(plain);
      const envelope = JSON.parse(cipher);
      expect(envelope).toHaveProperty('c');
      expect(envelope).toHaveProperty('iv');
      expect(envelope).toHaveProperty('s');
      expect(envelope.v).toBe('1.0');
    });

    it('T1-AES-2: decryption successfully recovers exact original plaintext', async () => {
      const original = 'Diagnosi riservata: riposo medico prescritto per 5 giorni';
      const encrypted = await cifraDatoSensibile(original);
      const decrypted = await decifraDatoSensibile(encrypted);
      expect(decrypted).toBe(original);
    });

    it('T1-AES-3: encrypting same plaintext twice produces distinct IVs and ciphertexts (semantic security)', async () => {
      const text = 'Identical Medical String';
      const cipher1 = await cifraDatoSensibile(text);
      const cipher2 = await cifraDatoSensibile(text);

      const parsed1 = JSON.parse(cipher1);
      const parsed2 = JSON.parse(cipher2);

      expect(parsed1.iv).not.toBe(parsed2.iv);
      expect(parsed1.c).not.toBe(parsed2.c);
    });

    it('T1-AES-4: decryption fails with descriptive error when using incorrect decryption key', async () => {
      const original = 'Dati sensibili riservati alla direzione';
      const encrypted = await cifraDatoSensibile(original, 'chiave-segreta-azienda-1');

      await expect(
        decifraDatoSensibile(encrypted, 'chiave-segreta-azienda-sbagliata')
      ).rejects.toThrow(/Decifratura fallita|chiave errata/i);
    });

    it('T1-AES-5: decryption fails when ciphertext bytes are tampered with (GCM authentication tag check)', async () => {
      const original = 'Messaggio integro non manomesso';
      const encrypted = await cifraDatoSensibile(original);
      const parsed = JSON.parse(encrypted);

      // Tamper ciphertext base64 by flipping bytes
      const tamperedBytes = Buffer.from(parsed.c, 'base64');
      tamperedBytes[0] ^= 0xff;
      parsed.c = tamperedBytes.toString('base64');

      await expect(decifraDatoSensibile(JSON.stringify(parsed))).rejects.toThrow(
        /Decifratura fallita|chiave errata o payload manomesso/i
      );
    });
  });

  describe('Tier 1: HMAC-SHA256 Integrity Seals', () => {
    it('T1-HMAC-1: generates deterministic 64-character hex signature', async () => {
      const payload = { id: 'ferie_123', stato: 'in_attesa', utente: 'm.rossi' };
      const sig1 = await calcolaSigilloIntegrita(payload);
      const sig2 = await calcolaSigilloIntegrita(payload);

      expect(sig1).toMatch(/^[0-9a-f]{64}$/i);
      expect(sig1).toBe(sig2);
    });

    it('T1-HMAC-2: verification passes for authentic and unaltered data', async () => {
      const payload = { richiesta: 'ferie_2026', giorni: 3, approvato: false };
      const sig = await calcolaSigilloIntegrita(payload);
      const isValid = await verificaSigilloIntegrita(payload, sig);
      expect(isValid).toBe(true);
    });

    it('T1-HMAC-3: verification fails when payload property is modified', async () => {
      const payload = { richiesta: 'ferie_2026', giorni: 3, approvato: false };
      const sig = await calcolaSigilloIntegrita(payload);

      // Attacker attempts to change approvato to true
      const tamperedPayload = { ...payload, approvato: true };
      const isValid = await verificaSigilloIntegrita(tamperedPayload, sig);
      expect(isValid).toBe(false);
    });

    it('T1-HMAC-4: verification fails when evaluated against different secret key', async () => {
      const payload = { balance: 24, user: 'l.verdi' };
      const sig = await calcolaSigilloIntegrita(payload, 'chiave-segreta-1');
      const isValid = await verificaSigilloIntegrita(payload, sig, 'chiave-segreta-2');
      expect(isValid).toBe(false);
    });

    it('T1-HMAC-5: verification is order-independent for object keys (canonical JSON)', async () => {
      const objA = { alpha: 1, beta: 'val', gamma: true };
      const objB = { gamma: true, alpha: 1, beta: 'val' };

      const sigA = await calcolaSigilloIntegrita(objA);
      const isValid = await verificaSigilloIntegrita(objB, sigA);
      expect(isValid).toBe(true);
    });
  });

  // =========================================================================
  // TIER 2: BOUNDARY & CORNER CASES (>=5 tests per feature)
  // =========================================================================
  describe('Tier 2: Boundary & Corner Cases — Passwords & Strings', () => {
    it('T2-PASS-1: handles single character passwords properly', async () => {
      const shortPass = 'A';
      const hashRes = await generaHashPassword(shortPass);
      expect(await verificaPassword(shortPass, hashRes.hash, hashRes.salt)).toBe(true);
      expect(await verificaPassword('B', hashRes.hash, hashRes.salt)).toBe(false);
    });

    it('T2-PASS-2: handles Unicode, accented and emoji passwords', async () => {
      const unicodePass = 'Pàsswörd_Sicurà_2026_🔑🔒🇮🇹';
      const hashRes = await generaHashPassword(unicodePass);
      expect(await verificaPassword(unicodePass, hashRes.hash, hashRes.salt)).toBe(true);
      expect(await verificaPassword('Pàsswörd_Sicurà_2026_🔑🔒', hashRes.hash, hashRes.salt)).toBe(
        false
      );
    });

    it('T2-PASS-3: handles maximum length passwords (2,048 chars) without memory overflow or crashing', async () => {
      const longPass = 'A'.repeat(2048);
      const hashRes = await generaHashPassword(longPass);
      expect(await verificaPassword(longPass, hashRes.hash, hashRes.salt)).toBe(true);
      expect(await verificaPassword(longPass + 'B', hashRes.hash, hashRes.salt)).toBe(false);
    });

    it('T2-PASS-4: distinguishes trailing and leading whitespace in password comparison', async () => {
      const basePass = 'SecretPassword';
      const trailingPass = 'SecretPassword ';
      const leadingPass = ' SecretPassword';

      const hashRes = await generaHashPassword(basePass);
      expect(await verificaPassword(trailingPass, hashRes.hash, hashRes.salt)).toBe(false);
      expect(await verificaPassword(leadingPass, hashRes.hash, hashRes.salt)).toBe(false);
    });

    it('T2-PASS-5: verification rejects empty password and empty hash arguments gracefully', async () => {
      expect(await verificaPassword('', '', '')).toBe(false);
      expect(await verificaPassword('Pass', '', 'salt')).toBe(false);
      expect(await verificaPassword('', 'hash', 'salt')).toBe(false);
    });
  });

  describe('Tier 2: Boundary & Corner Cases — Encryption & Integrity', () => {
    it('T2-CRYPTO-1: encrypts and decrypts empty string without error', async () => {
      const emptyStr = '';
      const cipher = await cifraDatoSensibile(emptyStr);
      const recovered = await decifraDatoSensibile(cipher);
      expect(recovered).toBe(emptyStr);
    });

    it('T2-CRYPTO-2: encrypts and decrypts extensive multi-line medical diagnostic notes (15,000+ chars)', async () => {
      const longMedicalRecord =
        'CERTIFICATO INPS TELEMATICO #1234567890\n' +
        'Prescrizione di giorni 15 di riposo assoluto.\n' +
        'Note cliniche dettagliate: '.padEnd(15000, 'X') +
        '\nFirma Telematica Medico Curante Dr. Rossi';

      const cipher = await cifraDatoSensibile(longMedicalRecord);
      const recovered = await decifraDatoSensibile(cipher);
      expect(recovered).toBe(longMedicalRecord);
    });

    it('T2-CRYPTO-3: handles special control characters (null bytes, newlines, HTML tags, quotes)', async () => {
      const controlChars = 'Text with \0 null byte, \r\n newline, \t tab, <script>alert("xss")</script> and quotes "\'';
      const cipher = await cifraDatoSensibile(controlChars);
      const recovered = await decifraDatoSensibile(cipher);
      expect(recovered).toBe(controlChars);
    });

    it('T2-CRYPTO-4: tampered HMAC seal by 1 single character modification fails verification', async () => {
      const data = { saldoFerie: 25.5, id: 'u101' };
      const originalSig = await calcolaSigilloIntegrita(data);

      // Modify the last char of the hex string (e.g., 'a' -> 'b')
      const lastChar = originalSig.slice(-1);
      const replacement = lastChar === '0' ? '1' : '0';
      const tamperedSig = originalSig.slice(0, -1) + replacement;

      expect(await verificaSigilloIntegrita(data, tamperedSig)).toBe(false);
    });

    it('T2-CRYPTO-5: truncated and lengthened HMAC seals fail verification', async () => {
      const data = { test: true };
      const sig = await calcolaSigilloIntegrita(data);

      const truncated = sig.slice(0, 63); // 63 chars instead of 64
      const lengthened = sig + 'ab'; // 66 chars

      expect(await verificaSigilloIntegrita(data, truncated)).toBe(false);
      expect(await verificaSigilloIntegrita(data, lengthened)).toBe(false);
      expect(await verificaSigilloIntegrita(data, '')).toBe(false);
    });
  });

  // =========================================================================
  // TIER 3: CROSS-FEATURE COMBINATIONS
  // =========================================================================
  describe('Tier 3: Cryptographic Integration Combinations', () => {
    it('T3-COMBI-1: Medical certificate AES encryption combined with HMAC tamper seal', async () => {
      const certificato = {
        richiestaId: 'req_malattia_2026_01',
        protocolloInps: 'INPS-PROT-9988776655',
        diagnosi: 'Affezione respiratoria acuta, giorni 3 di prognosi',
      };

      // 1. Encrypt sensitive fields
      const protocolloCifrato = await cifraDatoSensibile(certificato.protocolloInps);
      const diagnosiCifrata = await cifraDatoSensibile(certificato.diagnosi);

      // 2. Wrap into stored object
      const recordArchiviato = {
        richiestaId: certificato.richiestaId,
        protocolloCifrato,
        diagnosiCifrata,
      };

      // 3. Compute HMAC seal over the encrypted record
      const seal = await calcolaSigilloIntegrita(recordArchiviato);

      // 4. Verify seal succeeds
      expect(await verificaSigilloIntegrita(recordArchiviato, seal)).toBe(true);

      // 5. Decrypt and verify payload fidelity
      const decProt = await decifraDatoSensibile(recordArchiviato.protocolloCifrato);
      const decDiag = await decifraDatoSensibile(recordArchiviato.diagnosiCifrata);

      expect(decProt).toBe(certificato.protocolloInps);
      expect(decDiag).toBe(certificato.diagnosi);
    });

    it('T3-COMBI-2: Tampering with encrypted payload invalidates both HMAC seal and AES decryption', async () => {
      const secretMedicalData = 'INPS-CERT-CONFIDENTIAL';
      const cipher = await cifraDatoSensibile(secretMedicalData);

      const record = { id: 'm1', payload: cipher };
      const seal = await calcolaSigilloIntegrita(record);

      // Attacker tampers with the cipher string
      const tamperedRecord = { id: 'm1', payload: cipher.replace(/"c":\s*"[^"]+"/, '"c":"tamperedBase64=="') };

      // HMAC detects tamper immediately
      expect(await verificaSigilloIntegrita(tamperedRecord, seal)).toBe(false);

      // Decryption also rejects invalid/tampered ciphertext
      await expect(decifraDatoSensibile(tamperedRecord.payload)).rejects.toThrow();
    });
  });
});
