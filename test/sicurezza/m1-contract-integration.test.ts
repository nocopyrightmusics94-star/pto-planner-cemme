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

  // =========================================================================
  // 5. REMEDIATION VERIFICATION SUITE (GATE 1 REMEDIATIONS)
  // =========================================================================
  describe('Gate 1 Remediation Specific Verifications', () => {
    it('REMED-1: VoceAssenzaSchema validates chiusura_aziendale and optional nomeUtente', () => {
      const validClosure = {
        id: 'voce_chiusura_1',
        utenzaId: 'titolare',
        nomeUtente: 'Mario Rossi',
        data: '2026-08-15',
        tipo: 'chiusura_aziendale' as const,
        quantita: 1,
        stato: 'approvata' as const,
        dataAggiornamento: '2026-06-01T10:00:00Z',
      };
      const result = SecurityImpl.VoceAssenzaSchema.safeParse(validClosure);
      expect(result.success).toBe(true);
    });

    it('REMED-2: RichiestaAssenzaSchema validates revocata status, dataRevoca and motivoRevoca', () => {
      const validRevokedReq = {
        id: 'richiesta_revocata_1',
        utenzaId: 'u123',
        nomeRichiedente: 'Luigi Dipendente',
        tipo: 'ferie_intera' as const,
        dataInizio: '2026-07-01',
        dataFine: '2026-07-05',
        dateCoinvolte: ['2026-07-01', '2026-07-02', '2026-07-03', '2026-07-04', '2026-07-05'],
        giorniTotaliLavorativi: 5,
        stato: 'revocata' as const,
        dataInvio: '2026-05-01T08:00:00Z',
        dataRevoca: '2026-06-15T10:00:00Z',
        motivoRevoca: 'Esigenze di servizio sopravvenute',
      };
      const result = SecurityImpl.RichiestaAssenzaSchema.safeParse(validRevokedReq);
      expect(result.success).toBe(true);
    });

    it('REMED-3: validaBackupAziendaleSicuro passes real backup with closures and revocations', () => {
      const enterpriseBackup = {
        azienda: 'C. Emme Impianti S.r.l.',
        versione: '3.0',
        dataEsportazione: '2026-11-13T12:00:00Z',
        utenze: [
          {
            identificativo: 'admin',
            nomeCompleto: 'Admin Aziendale',
            chiaveAccesso: 'secret_hash',
            ruolo: 'titolare' as const,
            dataCreazione: '2026-01-01T00:00:00Z',
          },
        ],
        assenze: [
          {
            id: 'chiusura_ferragosto',
            utenzaId: 'admin',
            nomeUtente: 'Admin Aziendale',
            data: '2026-08-15',
            tipo: 'chiusura_aziendale' as const,
            quantita: 1,
            stato: 'approvata' as const,
            dataAggiornamento: '2026-01-01T00:00:00Z',
          },
        ],
        richieste: [
          {
            id: 'req_rev_1',
            utenzaId: 'admin',
            nomeRichiedente: 'Admin Aziendale',
            tipo: 'ferie_intera' as const,
            dataInizio: '2026-07-01',
            dataFine: '2026-07-01',
            dateCoinvolte: ['2026-07-01'],
            giorniTotaliLavorativi: 1,
            stato: 'revocata' as const,
            dataInvio: '2026-01-01T00:00:00Z',
            dataRevoca: '2026-06-01T00:00:00Z',
            motivoRevoca: 'Annullamento concordato',
          },
        ],
      };

      const result = SecurityImpl.validaBackupAziendaleSicuro(JSON.stringify(enterpriseBackup));
      expect(result.successo).toBe(true);
      expect(result.dati?.assenze[0].tipo).toBe('chiusura_aziendale');
      expect(result.dati?.richieste[0].stato).toBe('revocata');
    });

    it('REMED-4: validaSessione rejects future and anomalous ultimoAccesso timestamps', () => {
      const now = 1773400000000;
      const baseSession: SecurityImpl.SessioneAttiva = {
        identificativo: 'operatore',
        ruolo: 'dipendente',
        tokenSessione: '0123456789abcdef0123456789abcdef',
        timestampCreazione: now - 60000,
        ultimoAccesso: now - 10000,
      };

      expect(SecurityImpl.validaSessione(baseSession, now).valida).toBe(true);

      // Future ultimoAccesso
      const futureAccess = { ...baseSession, ultimoAccesso: now + 5000 };
      const resFuture = SecurityImpl.validaSessione(futureAccess, now);
      expect(resFuture.valida).toBe(false);
      expect(resFuture.motivo).toBe('Timestamp sessione nel futuro o anomalo');

      // Anomalous ultimoAccesso prior to creation
      const preCreationAccess = { ...baseSession, ultimoAccesso: now - 120000 };
      const resPreCreation = SecurityImpl.validaSessione(preCreationAccess, now);
      expect(resPreCreation.valida).toBe(false);
      expect(resPreCreation.motivo).toBe('Timestamp sessione nel futuro o anomalo');
    });

    it('REMED-5: serializzaCanonico filters undefined keys and maintains HMAC invariance across JSON roundtrip', async () => {
      const objectWithUndef = {
        id: 'record_123',
        nome: 'Elemento Test',
        dettagli: undefined,
        note: undefined,
        valore: 42,
      };

      const canonical = SecurityImpl.serializzaCanonico(objectWithUndef);
      expect(canonical).toBe('{"id":"record_123","nome":"Elemento Test","valore":42}');

      const sealBeforeStorage = await SecurityImpl.calcolaSigilloIntegrita(objectWithUndef);
      const storageSerialized = JSON.stringify(objectWithUndef);
      const restoredFromStorage = JSON.parse(storageSerialized);
      const sealMatches = await SecurityImpl.verificaSigilloIntegrita(restoredFromStorage, sealBeforeStorage);
      expect(sealMatches).toBe(true);
    });

    it('REMED-6: hexABytes strictly validates salt hex characters and odd length', () => {
      // Non-hex characters
      expect(() => SecurityImpl.hexABytes('z'.repeat(32))).toThrow('Stringa esadecimale non valida per il salt');
      expect(() => SecurityImpl.hexABytes('1234g56789abcdef')).toThrow('Stringa esadecimale non valida per il salt');

      // Odd length
      expect(() => SecurityImpl.hexABytes('123')).toThrow(/lunghezza dispari/);
    });

    it('REMED-7: decifraDatoSensibile gracefully catches malformed base64 input', async () => {
      const malformedBase64Envelope = JSON.stringify({
        c: '*** Not Valid Base64 ***',
        iv: '123456789012',
        s: '1234567890123456',
        v: '1.0',
      });

      await expect(SecurityImpl.decifraDatoSensibile(malformedBase64Envelope)).rejects.toThrow(
        'Decifratura fallita: chiave errata o payload manomesso'
      );
    });
  });
});
