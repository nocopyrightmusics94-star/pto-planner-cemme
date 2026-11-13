import { describe, it, expect } from 'vitest';
import {
  UtenzaSchema,
  VoceAssenzaSchema,
  RichiestaAssenzaSchema,
  BackupAziendaleSchema,
  calcolaSigilloIntegrita,
  verificaSigilloIntegrita,
  cifraDatoSensibile,
  decifraDatoSensibile,
  generaHashPassword,
} from './module-loader.js';

describe('Backup Validation & Zod Schema Integrity Suite (Tiers 1, 2, 3, 4)', () => {
  // Sample valid models for testing
  const validUtenza = {
    identificativo: 'm.rossi',
    nomeCompleto: 'Mario Rossi',
    chiaveAccessoHash: 'a'.repeat(64),
    salt: 'b'.repeat(32),
    ruolo: 'dipendente' as const,
    dataCreazione: '2026-01-15T08:30:00.000Z',
    reparto: 'Impianti Elettrici',
    telefono: '+39 081 1234567',
  };

  const validVoce = {
    id: 'm.rossi_2026-06-10',
    richiestaId: 'req_001',
    utenzaId: 'm.rossi',
    data: '2026-06-10',
    tipo: 'ferie_intera' as const,
    quantita: 8,
    stato: 'approvata' as const,
    note: 'Ferie estive concordate',
    dataAggiornamento: '2026-05-01T10:00:00.000Z',
  };

  const validRichiesta = {
    id: 'req_001',
    utenzaId: 'm.rossi',
    nomeRichiedente: 'Mario Rossi',
    reparto: 'Impianti Elettrici',
    tipo: 'ferie_intera' as const,
    dataInizio: '2026-06-10',
    dataFine: '2026-06-12',
    dateCoinvolte: ['2026-06-10', '2026-06-11', '2026-06-12'],
    giorniTotaliLavorativi: 3,
    stato: 'approvata' as const,
    dataInvio: '2026-05-01T09:00:00.000Z',
    dataDecisione: '2026-05-02T14:00:00.000Z',
    notaTitolare: 'Approvato come da piano ferie',
  };

  // =========================================================================
  // TIER 1: FEATURE COVERAGE (>=5 tests per feature)
  // =========================================================================
  describe('Tier 1: Zod Runtime Schema Validation', () => {
    it('T1-ZOD-1: UtenzaSchema accepts conforming employee object', () => {
      const parsed = UtenzaSchema.safeParse(validUtenza);
      expect(parsed.success).toBe(true);
    });

    it('T1-ZOD-2: VoceAssenzaSchema accepts conforming calendar absence', () => {
      const parsed = VoceAssenzaSchema.safeParse(validVoce);
      expect(parsed.success).toBe(true);
    });

    it('T1-ZOD-3: RichiestaAssenzaSchema accepts conforming leave request', () => {
      const parsed = RichiestaAssenzaSchema.safeParse(validRichiesta);
      expect(parsed.success).toBe(true);
    });

    it('T1-ZOD-4: BackupAziendaleSchema validates complete company backup container', () => {
      const backup = {
        azienda: 'C. Emme Impianti S.r.l.' as const,
        versione: '3.0',
        dataEsportazione: '2026-11-13T10:00:00.000Z',
        sigillo: 'c'.repeat(64),
        utenze: [validUtenza],
        assenze: [validVoce],
        richieste: [validRichiesta],
      };
      const parsed = BackupAziendaleSchema.safeParse(backup);
      expect(parsed.success).toBe(true);
    });

    it('T1-ZOD-5: UtenzaSchema rejects invalid user roles', () => {
      const invalid = { ...validUtenza, ruolo: 'hacker_super_admin' };
      const parsed = UtenzaSchema.safeParse(invalid);
      expect(parsed.success).toBe(false);
      if (!parsed.success) {
        expect(parsed.error.issues[0].message).toMatch(/Ruolo utente non autorizzato|Invalid enum|Invalid option/i);
      }
    });

    it('T1-ZOD-6: VoceAssenzaSchema rejects invalid date format and non-numeric quantity', () => {
      const invalidDate = { ...validVoce, data: '10/06/2026' }; // wrong format
      expect(VoceAssenzaSchema.safeParse(invalidDate).success).toBe(false);

      const invalidQuantita = { ...validVoce, quantita: -5 };
      expect(VoceAssenzaSchema.safeParse(invalidQuantita).success).toBe(false);
    });
  });

  // =========================================================================
  // TIER 2: BOUNDARY & CORNER CASES (>=5 tests)
  // =========================================================================
  describe('Tier 2: Boundary & Corner Cases — Malformed Payloads & Pollution', () => {
    it('T2-PAYLOAD-1: rejects payloads with missing mandatory fields', () => {
      const missingId = { ...validUtenza };
      delete (missingId as Record<string, unknown>).identificativo;
      const res1 = UtenzaSchema.safeParse(missingId);
      expect(res1.success).toBe(false);

      const missingData = { ...validVoce };
      delete (missingData as Record<string, unknown>).data;
      const res2 = VoceAssenzaSchema.safeParse(missingData);
      expect(res2.success).toBe(false);
    });

    it('T2-PAYLOAD-2: strict schemas reject unexpected extra properties (prototype pollution / injections)', () => {
      const injectedUtenza = {
        ...validUtenza,
        isSuperAdmin: true,
        extraMaliciousProp: 'malicious_code',
      };
      const res = UtenzaSchema.safeParse(injectedUtenza);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].code).toBe('unrecognized_keys');
      }
    });

    it('T2-PAYLOAD-3: rejects prototype pollution attributes (__proto__, constructor)', () => {
      const rawJson = `{"identificativo":"m.rossi","nomeCompleto":"Mario Rossi","chiaveAccessoHash":"${'a'.repeat(
        64
      )}","salt":"${'b'.repeat(
        32
      )}","ruolo":"dipendente","dataCreazione":"2026-01-15T08:30:00.000Z","__proto__":{"isAdmin":true}}`;
      const parsedJson = JSON.parse(rawJson);

      const res = UtenzaSchema.safeParse(parsedJson);
      // Because .strict() is enabled, unrecognized keys fail
      expect(res.success).toBe(false);
    });

    it('T2-PAYLOAD-4: rejects out-of-bounds dates and quantities in requests', () => {
      // 0 days is invalid (must be >= 1)
      const zeroDates = { ...validRichiesta, dateCoinvolte: [] };
      expect(RichiestaAssenzaSchema.safeParse(zeroDates).success).toBe(false);

      // Over 366 days in single request
      const tooManyDates = { ...validRichiesta, dateCoinvolte: new Array(400).fill('2026-06-10') };
      expect(RichiestaAssenzaSchema.safeParse(tooManyDates).success).toBe(false);

      // Excessive daily hours (> 24h)
      const excessiveHours = { ...validRichiesta, orePermessoPerGiorno: 25 };
      expect(RichiestaAssenzaSchema.safeParse(excessiveHours).success).toBe(false);
    });

    it('T2-PAYLOAD-5: enforces company name exact literal match on backup import', () => {
      const wrongCompanyBackup = {
        azienda: 'Competitor S.p.A.', // Not C. Emme Impianti S.r.l.
        versione: '3.0',
        dataEsportazione: '2026-11-13T10:00:00.000Z',
        sigillo: 'c'.repeat(64),
        utenze: [validUtenza],
        assenze: [validVoce],
        richieste: [validRichiesta],
      };
      const res = BackupAziendaleSchema.safeParse(wrongCompanyBackup);
      expect(res.success).toBe(false);
    });
  });

  // =========================================================================
  // TIER 3: CROSS-FEATURE COMBINATIONS
  // =========================================================================
  describe('Tier 3: Backup Lifecycle & HMAC Seal Integration', () => {
    it('T3-BACKUP-1: Export -> JSON Stringify -> JSON Parse -> Zod Validate -> HMAC Seal -> Restore Roundtrip', async () => {
      // 1. Prepare raw company dataset
      const rawData = {
        azienda: 'C. Emme Impianti S.r.l.' as const,
        versione: '3.0',
        dataEsportazione: new Date().toISOString(),
        utenze: [validUtenza],
        assenze: [validVoce],
        richieste: [validRichiesta],
      };

      // 2. Compute HMAC seal over data contents
      const sigillo = await calcolaSigilloIntegrita(rawData);
      const backupSealed = { ...rawData, sigillo };

      // 3. Serialize to JSON (simulating export download)
      const exportedJsonString = JSON.stringify(backupSealed, null, 2);

      // 4. Simulate restore: read JSON string
      const parsedFromFile = JSON.parse(exportedJsonString);

      // 5. Validate with Zod schema
      const zodValidation = BackupAziendaleSchema.safeParse(parsedFromFile);
      expect(zodValidation.success).toBe(true);

      // 6. Verify HMAC signature on imported data
      const { sigillo: sigilloEstratto, ...datiDaVerificare } = parsedFromFile;
      const sigilloValido = await verificaSigilloIntegrita(datiDaVerificare, sigilloEstratto);
      expect(sigilloValido).toBe(true);
    });

    it('T3-BACKUP-2: Backup with encrypted medical data survives restore and allows authorized decryption', async () => {
      const inpsProtocol = 'INPS-CERT-9876543210';
      const encryptedProtocol = await cifraDatoSensibile(inpsProtocol);

      const medicalRequest = {
        ...validRichiesta,
        id: 'req_med_01',
        tipo: 'malattia' as const,
        numeroProtocollo: encryptedProtocol,
      };

      const backup = {
        azienda: 'C. Emme Impianti S.r.l.' as const,
        versione: '3.0',
        dataEsportazione: new Date().toISOString(),
        sigillo: 'd'.repeat(64),
        utenze: [validUtenza],
        assenze: [validVoce],
        richieste: [medicalRequest],
      };

      // Re-sign with accurate seal
      const { sigillo: _, ...corpo } = backup;
      backup.sigillo = await calcolaSigilloIntegrita(corpo);

      // Verify validation passes
      const validated = BackupAziendaleSchema.parse(backup);
      expect(validated.richieste[0].numeroProtocollo).toBe(encryptedProtocol);

      // Decrypt medical field after restore
      const decrypted = await decifraDatoSensibile(validated.richieste[0].numeroProtocollo!);
      expect(decrypted).toBe(inpsProtocol);
    });
  });

  // =========================================================================
  // TIER 4: REAL-WORLD APPLICATION SCENARIOS
  // =========================================================================
  describe('Tier 4: Malicious Backup Injection Scenarios', () => {
    it('T4-ATTACK-1: Malicious backup injection with elevated titolare user is caught by schema or signature check', async () => {
      const attackerBackup = {
        azienda: 'C. Emme Impianti S.r.l.',
        versione: '3.0',
        dataEsportazione: '2026-11-13T10:00:00.000Z',
        sigillo: '0'.repeat(64), // Fake seal
        utenze: [
          {
            identificativo: 'hacker_admin',
            nomeCompleto: 'Rogue Admin',
            chiaveAccessoHash: 'f'.repeat(64),
            salt: 'e'.repeat(32),
            ruolo: 'titolare', // Attempting to inject new titolare
            dataCreazione: '2026-11-13T10:00:00.000Z',
          },
        ],
        assenze: [],
        richieste: [],
      };

      // Signature verification fails
      const { sigillo, ...corpo } = attackerBackup;
      const isValidSig = await verificaSigilloIntegrita(corpo, sigillo);
      expect(isValidSig).toBe(false);
    });

    it('T4-ATTACK-2: Corrupted backup that would trigger client TypeError is blocked before storage commit', () => {
      // In VULN-04, a backup with absence missing `data` or with null crashed the calendar
      const poisonousBackup = {
        azienda: 'C. Emme Impianti S.r.l.',
        versione: '3.0',
        dataEsportazione: '2026-11-13T10:00:00.000Z',
        sigillo: 'a'.repeat(64),
        utenze: [validUtenza],
        assenze: [
          {
            id: 'corrupt_absence_1',
            utenzaId: 'm.rossi',
            // data is missing!
            tipo: 'ferie_intera',
            quantita: 8,
            stato: 'approvata',
            dataAggiornamento: '2026-05-01T10:00:00.000Z',
          },
        ],
        richieste: [],
      };

      const result = BackupAziendaleSchema.safeParse(poisonousBackup);
      expect(result.success).toBe(false);
    });

    it('T4-ATTACK-3: Injection of script tags / HTML in user attributes is constrained by regex schema', () => {
      const xssUtenza = {
        ...validUtenza,
        identificativo: '<script>alert(1)</script>', // Not allowed by [a-z0-9._-]
      };

      const result = UtenzaSchema.safeParse(xssUtenza);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('lettere minuscole');
      }
    });
  });
});
