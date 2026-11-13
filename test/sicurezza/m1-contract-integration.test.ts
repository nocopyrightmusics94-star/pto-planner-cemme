/**
 * Integration Test Suite directly verifying `src/servizi/sicurezza` implementation module
 * Confirms that production code in `src/servizi/sicurezza/` adheres strictly to M1 interface contracts.
 */
import { describe, it, expect } from 'vitest';
import * as SecurityImpl from '@/servizi/sicurezza';

describe('Production Module Integration Suite (src/servizi/sicurezza)', () => {
  // =========================================================================
  // 1. PBKDF2 HASHING IN PRODUCTION MODULE
  // =========================================================================
  describe('Production Hashing Module (hashing.ts)', () => {
    it('M1-IMPL-HASH-1: exports required functions and constants', () => {
      expect(typeof SecurityImpl.generaHashPassword).toBe('function');
      expect(typeof SecurityImpl.verificaPassword).toBe('function');
      expect(typeof SecurityImpl.timingSafeEqual).toBe('function');
      expect(SecurityImpl.ITERAZIONI_PBKDF2).toBeGreaterThanOrEqual(100000);
    });

    it('M1-IMPL-HASH-2: generates hash and salt conforming to format specs', async () => {
      const res = await SecurityImpl.generaHashPassword('CemmePass2026!');
      expect(res.hash).toMatch(/^[0-9a-f]{64}$/i);
      expect(res.salt).toMatch(/^[0-9a-f]{32}$/i);
      expect(res.iterazioni).toBe(SecurityImpl.ITERAZIONI_PBKDF2);
    });

    it('M1-IMPL-HASH-3: verifies matching password and rejects incorrect password', async () => {
      const pass = 'SuperSecret2026!';
      const res = await SecurityImpl.generaHashPassword(pass);

      const isValid = await SecurityImpl.verificaPassword(pass, res.hash, res.salt);
      expect(isValid).toBe(true);

      const isInvalid = await SecurityImpl.verificaPassword('WrongPassword', res.hash, res.salt);
      expect(isInvalid).toBe(false);
    });
  });

  // =========================================================================
  // 2. AES-GCM 256 ENCRYPTION IN PRODUCTION MODULE
  // =========================================================================
  describe('Production Cryptography Module (crittografia.ts)', () => {
    it('M1-IMPL-CRYPTO-1: exports encryption and decryption functions', () => {
      expect(typeof SecurityImpl.cifraDatoSensibile).toBe('function');
      expect(typeof SecurityImpl.decifraDatoSensibile).toBe('function');
    });

    it('M1-IMPL-CRYPTO-2: encrypts sensitive protocol and decrypts back to original', async () => {
      const sensitiveText = 'Protocollo-INPS-998877';
      const cipher = await SecurityImpl.cifraDatoSensibile(sensitiveText);

      expect(cipher).toContain('"c":');
      expect(cipher).toContain('"iv":');
      expect(cipher).not.toContain(sensitiveText);

      const decrypted = await SecurityImpl.decifraDatoSensibile(cipher);
      expect(decrypted).toBe(sensitiveText);
    });

    it('M1-IMPL-CRYPTO-3: encrypting same text produces distinct IVs (semantic security)', async () => {
      const text = 'SameProtocol';
      const c1 = await SecurityImpl.cifraDatoSensibile(text);
      const c2 = await SecurityImpl.cifraDatoSensibile(text);
      expect(c1).not.toBe(c2);
    });

    it('M1-IMPL-CRYPTO-4: tampered ciphertext safely throws decryption error', async () => {
      const validCipher = await SecurityImpl.cifraDatoSensibile('Secret');
      const parsed = JSON.parse(validCipher);
      parsed.c = 'tamperedBase64==';

      await expect(SecurityImpl.decifraDatoSensibile(JSON.stringify(parsed))).rejects.toThrow();
    });
  });

  // =========================================================================
  // 3. HMAC-SHA256 INTEGRITY IN PRODUCTION MODULE
  // =========================================================================
  describe('Production Integrity Module (integrita.ts)', () => {
    it('M1-IMPL-HMAC-1: exports seal calculation and verification functions', () => {
      expect(typeof SecurityImpl.calcolaSigilloIntegrita).toBe('function');
      expect(typeof SecurityImpl.verificaSigilloIntegrita).toBe('function');
      expect(typeof SecurityImpl.serializzaCanonico).toBe('function');
    });

    it('M1-IMPL-HMAC-2: calculates deterministic seal and verifies authentic data', async () => {
      const payload = { id: 'ferie_1', stato: 'approvata', utente: 'm.rossi' };
      const sigillo = await SecurityImpl.calcolaSigilloIntegrita(payload);

      expect(sigillo).toMatch(/^[0-9a-f]{64}$/i);
      const isValid = await SecurityImpl.verificaSigilloIntegrita(payload, sigillo);
      expect(isValid).toBe(true);
    });

    it('M1-IMPL-HMAC-3: detects payload property tampering', async () => {
      const original = { id: 'ferie_1', stato: 'in_attesa' };
      const sigillo = await SecurityImpl.calcolaSigilloIntegrita(original);

      const tampered = { ...original, stato: 'approvata' };
      const isValid = await SecurityImpl.verificaSigilloIntegrita(tampered, sigillo);
      expect(isValid).toBe(false);
    });

    it('M1-IMPL-HMAC-4: canonical serialization handles unordered keys', async () => {
      const obj1 = { z: 1, a: 'test', m: true };
      const obj2 = { a: 'test', m: true, z: 1 };

      const sig1 = await SecurityImpl.calcolaSigilloIntegrita(obj1);
      const isValid = await SecurityImpl.verificaSigilloIntegrita(obj2, sig1);
      expect(isValid).toBe(true);
    });
  });

  // =========================================================================
  // 4. ZOD SCHEMAS IN PRODUCTION MODULE
  // =========================================================================
  describe('Production Schemas Module (schemi.ts)', () => {
    it('M1-IMPL-SCHEMA-1: exports all required schemas and validation helpers', () => {
      expect(SecurityImpl.UtenzaSchema).toBeDefined();
      expect(SecurityImpl.VoceAssenzaSchema).toBeDefined();
      expect(SecurityImpl.RichiestaAssenzaSchema).toBeDefined();
      expect(SecurityImpl.BackupAziendaleSchema).toBeDefined();
      expect(typeof SecurityImpl.validaBackupAziendaleSicuro).toBe('function');
    });

    it('M1-IMPL-SCHEMA-2: validates conforming utenza and rejects invalid roles', () => {
      const valid = {
        identificativo: 'm.rossi',
        nomeCompleto: 'Mario Rossi',
        chiaveAccesso: 'hashed_password',
        ruolo: 'dipendente' as const,
        dataCreazione: '2026-01-01T00:00:00Z',
      };
      expect(SecurityImpl.UtenzaSchema.safeParse(valid).success).toBe(true);

      const invalid = { ...valid, ruolo: 'hacker' };
      expect(SecurityImpl.UtenzaSchema.safeParse(invalid).success).toBe(false);
    });

    it('M1-IMPL-SCHEMA-3: validaBackupAziendaleSicuro parses valid JSON and rejects malformed', () => {
      const validBackupJson = JSON.stringify({
        azienda: 'C. Emme Impianti S.r.l.',
        versione: '3.0',
        dataEsportazione: '2026-11-13T10:00:00Z',
        utenze: [
          {
            identificativo: 'titolare',
            nomeCompleto: 'Direzione',
            chiaveAccesso: 'secret',
            ruolo: 'titolare',
            dataCreazione: '2026-01-01T00:00:00Z',
          },
        ],
        assenze: [],
        richieste: [],
      });

      const resValid = SecurityImpl.validaBackupAziendaleSicuro(validBackupJson);
      expect(resValid.successo).toBe(true);
      expect(resValid.dati).toBeDefined();

      const resInvalid = SecurityImpl.validaBackupAziendaleSicuro('{ invalid json');
      expect(resInvalid.successo).toBe(false);
      expect(resInvalid.errore).toBeDefined();
    });
  });
});
