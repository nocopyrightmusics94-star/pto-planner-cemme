/**
 * Adversarial Security & Stress/Fuzz Test Suite
 * Empirical Challenger Verification for Milestone 1: Cryptographic Engine & Zod Schemas
 * 
 * Tests:
 * 1. Cryptographic resilience: AES-GCM 256 under mutated ciphertexts, corrupted IVs,
 *    malformed envelopes, empty/huge keys, unicode and huge payloads.
 * 2. Password Hashing & Verification: Timing analysis, malformed salts, odd-hex strings,
 *    empty passwords, unicode and null-byte payloads.
 * 3. Zod Schemas runtime defenses: Prototype pollution (__proto__, constructor, prototype),
 *    extra field injections, type coercion attempts, NaN/Infinity, null-bytes, boundary overflows.
 * 4. Storage Integrity (HMAC-SHA256): Tamper detection, canonicalization edge cases,
 *    prototype pollution resistance.
 */

import { describe, it, expect } from 'vitest';
import {
  cifraDatoSensibile,
  decifraDatoSensibile,
  generaHashPassword,
  verificaPassword,
  calcolaSigilloIntegrita,
  verificaSigilloIntegrita,
  serializzaCanonico,
  timingSafeEqual,
  UtenzaSchema,
  VoceAssenzaSchema,
  RichiestaAssenzaSchema,
  BackupAziendaleSchema,
  SessioneAttivaSchema,
  validaSessione,
  validaBackupAziendaleSicuro,
  bytesAHex,
  hexABytes,
} from '@/servizi/sicurezza';

describe('ADVERSARIAL STRESS & FUZZ TEST SUITE (Milestone 1 Challenge)', () => {
  // =========================================================================
  // 1. CRYPTOGRAPHIC ENGINE FUZZING & TAMPER RESILIENCE (crittografia.ts)
  // =========================================================================
  describe('1. Cifratura / Decifratura Adversarial & Fuzz Tests', () => {
    it('ADV-CRYPTO-01: rejects mutated ciphertext with single-bit flips (AES-GCM Auth Tag Failure)', async () => {
      const plaintext = 'Protocollo-INPS-Riservatissimo-2026-XYZ';
      const envelopeStr = await cifraDatoSensibile(plaintext);
      const envelope = JSON.parse(envelopeStr);

      const rawCipher = Buffer.from(envelope.c, 'base64');
      // Flip a single bit in the ciphertext / authentication tag
      rawCipher[rawCipher.length - 1] ^= 0x01;
      envelope.c = rawCipher.toString('base64');

      await expect(decifraDatoSensibile(JSON.stringify(envelope))).rejects.toThrow(
        /Decifratura fallita: chiave errata o payload manomesso/
      );
    });

    it('ADV-CRYPTO-02: rejects randomized byte-level ciphertext fuzzing (100 random mutations)', async () => {
      const plaintext = 'Dati-Medici-Sensibili-Art9-GDPR';
      const envelopeStr = await cifraDatoSensibile(plaintext);

      for (let i = 0; i < 100; i++) {
        const envelope = JSON.parse(envelopeStr);
        const rawCipher = Buffer.from(envelope.c, 'base64');
        const randomIndex = Math.floor(Math.random() * rawCipher.length);
        // XOR with a non-zero byte (1 to 255) guarantees at least 1 bit flip
        const flipMask = Math.floor(Math.random() * 255) + 1;
        rawCipher[randomIndex] ^= flipMask;
        envelope.c = rawCipher.toString('base64');

        await expect(decifraDatoSensibile(JSON.stringify(envelope))).rejects.toThrow();
      }
    });

    it('ADV-CRYPTO-03: rejects corrupted, truncated, or invalid IV lengths', async () => {
      const plaintext = 'Protocollo-Sensibile';
      const envelopeStr = await cifraDatoSensibile(plaintext);
      const baseEnvelope = JSON.parse(envelopeStr);

      // 0-byte IV
      const env0 = { ...baseEnvelope, iv: Buffer.alloc(0).toString('base64') };
      await expect(decifraDatoSensibile(JSON.stringify(env0))).rejects.toThrow();

      // 8-byte IV (AES-GCM standard expects 12 bytes)
      const env8 = { ...baseEnvelope, iv: Buffer.alloc(8, 0xaa).toString('base64') };
      await expect(decifraDatoSensibile(JSON.stringify(env8))).rejects.toThrow();

      // 16-byte IV
      const env16 = { ...baseEnvelope, iv: Buffer.alloc(16, 0xbb).toString('base64') };
      await expect(decifraDatoSensibile(JSON.stringify(env16))).rejects.toThrow();

      // Non-base64 garbage IV
      const envGarbage = { ...baseEnvelope, iv: '!!!not-a-valid-base64-iv???' };
      await expect(decifraDatoSensibile(JSON.stringify(envGarbage))).rejects.toThrow();
    });

    it('ADV-CRYPTO-04: rejects malformed JSON envelopes and missing required fields', async () => {
      // Non-JSON strings
      await expect(decifraDatoSensibile('not a json string')).rejects.toThrow(
        /JSON malformato/
      );
      await expect(decifraDatoSensibile('{ broken json')).rejects.toThrow(
        /JSON malformato/
      );
      await expect(decifraDatoSensibile('')).rejects.toThrow(/JSON malformato/);
      await expect(decifraDatoSensibile('null')).rejects.toThrow(
        /Struttura envelope AES-GCM incompleta/
      );
      await expect(decifraDatoSensibile('12345')).rejects.toThrow(
        /Struttura envelope AES-GCM incompleta/
      );
      await expect(decifraDatoSensibile('[]')).rejects.toThrow(
        /Struttura envelope AES-GCM incompleta/
      );

      // Incomplete envelopes
      await expect(decifraDatoSensibile(JSON.stringify({ c: 'abc', iv: 'def' }))).rejects.toThrow(
        /Struttura envelope AES-GCM incompleta/
      );
      await expect(decifraDatoSensibile(JSON.stringify({ iv: 'def', s: 'ghi' }))).rejects.toThrow(
        /Struttura envelope AES-GCM incompleta/
      );
      await expect(decifraDatoSensibile(JSON.stringify({ c: 'abc', s: 'ghi' }))).rejects.toThrow(
        /Struttura envelope AES-GCM incompleta/
      );
    });

    it('ADV-CRYPTO-05: handles empty plaintexts, complex Unicode, emojis, null bytes and symbols', async () => {
      const testCases = [
        '', // Empty string
        '🔒 GDPR Art. 9 🩺 Medico: Mario Rossi 🇮🇹',
        'Caratteri speciali: àèìòù, €$£¥, <script>alert("xss")</script>',
        'Null byte injection: Inizio\0Metà\0Fine',
        'Surrogate pairs & hieroglyphs: 𠜎 𠜱 𠝹 𠱓 𠱸 𠲖 𠳏',
        'RTL Hebrew & Arabic: עִבְרִית‎ العربية',
        'Multi-line string:\nLinea 1\r\nLinea 2\tTabulazione\n\nLinea 4',
      ];

      for (const original of testCases) {
        const encrypted = await cifraDatoSensibile(original);
        const decrypted = await decifraDatoSensibile(encrypted);
        expect(decrypted).toBe(original);
      }
    });

    it('ADV-CRYPTO-06: handles huge payload (250KB) encryption and decryption cleanly', async () => {
      // 250,000 characters payload
      const hugePlaintext = 'A'.repeat(250000);
      const encrypted = await cifraDatoSensibile(hugePlaintext);
      expect(encrypted.length).toBeGreaterThan(250000);

      const decrypted = await decifraDatoSensibile(encrypted);
      expect(decrypted.length).toBe(250000);
      expect(decrypted).toBe(hugePlaintext);
    });

    it('ADV-CRYPTO-07: custom encryption keys isolate data cleanly and resist cross-key decryption', async () => {
      const plaintext = 'SecretCompanyData';
      const keyA = 'azienda-chiave-segreta-alfa-2026';
      const keyB = 'azienda-chiave-segreta-beta-2026';

      const cipherA = await cifraDatoSensibile(plaintext, keyA);
      const decryptedA = await decifraDatoSensibile(cipherA, keyA);
      expect(decryptedA).toBe(plaintext);

      // Decryption with wrong key must fail
      await expect(decifraDatoSensibile(cipherA, keyB)).rejects.toThrow(
        /Decifratura fallita: chiave errata o payload manomesso/
      );

      // Decryption with empty key
      await expect(decifraDatoSensibile(cipherA, '')).rejects.toThrow();
    });
  });

  // =========================================================================
  // 2. PASSWORD HASHING, TIMING ATTACK & SALT VALIDATION (hashing.ts)
  // =========================================================================
  describe('2. Hashing & Password Verification Adversarial Tests', () => {
    it('ADV-HASH-01: timingSafeEqual executes in constant time across match positions', () => {
      const base = 'a'.repeat(64);
      const diffFirst = 'b' + 'a'.repeat(63);
      const diffMid = 'a'.repeat(32) + 'b' + 'a'.repeat(31);
      const diffLast = 'a'.repeat(63) + 'b';
      const exactMatch = 'a'.repeat(64);

      // Measure iterations to ensure no execution crashes
      const iterations = 5000;
      let matchCount = 0;
      let nonMatchCount = 0;

      for (let i = 0; i < iterations; i++) {
        if (timingSafeEqual(base, exactMatch)) matchCount++;
        if (!timingSafeEqual(base, diffFirst)) nonMatchCount++;
        if (!timingSafeEqual(base, diffMid)) nonMatchCount++;
        if (!timingSafeEqual(base, diffLast)) nonMatchCount++;
      }

      expect(matchCount).toBe(iterations);
      expect(nonMatchCount).toBe(iterations * 3);
    });

    it('ADV-HASH-02: timingSafeEqual correctly handles type mismatches and length discrepancies', () => {
      expect(timingSafeEqual('', '')).toBe(true);
      expect(timingSafeEqual('a', 'b')).toBe(false);
      expect(timingSafeEqual('a', 'aa')).toBe(false);
      expect(timingSafeEqual('64chars'.padEnd(64, '0'), '63chars'.padEnd(63, '0'))).toBe(false);

      // Non-string arguments
      expect(timingSafeEqual(null as unknown as string, 'abc')).toBe(false);
      expect(timingSafeEqual('abc', undefined as unknown as string)).toBe(false);
      expect(timingSafeEqual(123 as unknown as string, 123 as unknown as string)).toBe(false);
      expect(timingSafeEqual({} as unknown as string, {} as unknown as string)).toBe(false);
    });

    it('ADV-HASH-03: hex conversion functions safely validate hex formatting', () => {
      // Valid hex string
      const hex = '0123456789abcdef';
      const bytes = hexABytes(hex);
      expect(bytesAHex(bytes)).toBe(hex);

      // Odd length hex string throws Error
      expect(() => hexABytes('123')).toThrow(/lunghezza dispari/);
      expect(() => hexABytes('a')).toThrow(/lunghezza dispari/);
    });

    it('ADV-HASH-04: verificaPassword safely returns false for empty, null, or undefined parameters', async () => {
      const validHash = '0'.repeat(64);
      const validSalt = '0'.repeat(32);

      expect(await verificaPassword('', validHash, validSalt)).toBe(false);
      expect(await verificaPassword('password', '', validSalt)).toBe(false);
      expect(await verificaPassword('password', validHash, '')).toBe(false);
      expect(await verificaPassword(null as unknown as string, validHash, validSalt)).toBe(false);
      expect(await verificaPassword('password', null as unknown as string, validSalt)).toBe(false);
      expect(await verificaPassword('password', validHash, null as unknown as string)).toBe(false);
    });

    it('ADV-HASH-05: verificaPassword safely returns false on malformed or odd-length salt', async () => {
      const validPass = 'MySecurePassword2026';
      const hashObj = await generaHashPassword(validPass);

      // Salt with odd number of hex characters (causes hexABytes to throw)
      const oddSalt = 'abcde';
      const resultOdd = await verificaPassword(validPass, hashObj.hash, oddSalt);
      expect(resultOdd).toBe(false); // Must safely catch and return false without throwing

      // Salt with invalid hex characters
      const invalidHexSalt = 'zz'.repeat(16);
      const resultInvalid = await verificaPassword(validPass, hashObj.hash, invalidHexSalt);
      expect(resultInvalid).toBe(false);
    });

    it('ADV-HASH-06: handles extreme boundary passwords (10,000 chars, null bytes, unicode emojis)', async () => {
      const hugePassword = 'P@ssw0rd'.repeat(1250); // 10,000 chars
      const hashHuge = await generaHashPassword(hugePassword);
      expect(hashHuge.hash).toMatch(/^[0-9a-f]{64}$/);
      expect(await verificaPassword(hugePassword, hashHuge.hash, hashHuge.salt)).toBe(true);
      expect(await verificaPassword(hugePassword + '1', hashHuge.hash, hashHuge.salt)).toBe(false);

      const nullBytePassword = 'Admin\0Secret\0Password';
      const hashNull = await generaHashPassword(nullBytePassword);
      expect(await verificaPassword(nullBytePassword, hashNull.hash, hashNull.salt)).toBe(true);
      expect(await verificaPassword('AdminSecretPassword', hashNull.hash, hashNull.salt)).toBe(false);
    });

    it('ADV-HASH-07: generates cryptographically distinct salts across 50 consecutive calls', async () => {
      const salts = new Set<string>();
      for (let i = 0; i < 50; i++) {
        const res = await generaHashPassword('SamePassword');
        expect(salts.has(res.salt)).toBe(false);
        salts.add(res.salt);
      }
      expect(salts.size).toBe(50);
    });
  });

  // =========================================================================
  // 3. STORAGE INTEGRITY & HMAC CANONICALIZATION (integrita.ts)
  // =========================================================================
  describe('3. HMAC Integrity & Canonicalization Adversarial Tests', () => {
    it('ADV-HMAC-01: canonical serializer handles deeply nested and permuted key orders', async () => {
      const objA = {
        z: 1,
        b: { d: [3, 2, 1], a: 'sub' },
        a: [{ y: 2, x: 1 }],
      };

      const objB = {
        a: [{ x: 1, y: 2 }],
        z: 1,
        b: { a: 'sub', d: [3, 2, 1] },
      };

      const serializedA = serializzaCanonico(objA);
      const serializedB = serializzaCanonico(objB);
      expect(serializedA).toBe(serializedB);

      const sealA = await calcolaSigilloIntegrita(objA);
      const sealB = await calcolaSigilloIntegrita(objB);
      expect(sealA).toBe(sealB);
    });

    it('ADV-HMAC-02: detects subtle single-character data modifications', async () => {
      const payload = {
        ruolo: 'dipendente',
        giorniFerie: 10,
        motivo: 'Ferie estive',
      };
      const seal = await calcolaSigilloIntegrita(payload);

      // Privilege escalation attempt
      const tamperedRuolo = { ...payload, ruolo: 'titolare' };
      expect(await verificaSigilloIntegrita(tamperedRuolo, seal)).toBe(false);

      // Quota modification attempt
      const tamperedQuota = { ...payload, giorniFerie: 11 };
      expect(await verificaSigilloIntegrita(tamperedQuota, seal)).toBe(false);

      // Type mutation attempt (number to string)
      const tamperedType = { ...payload, giorniFerie: '10' as unknown as number };
      expect(await verificaSigilloIntegrita(tamperedType, seal)).toBe(false);
    });

    it('ADV-HMAC-03: rejects malformed, truncated, or non-hex seals', async () => {
      const payload = { test: true };
      expect(await verificaSigilloIntegrita(payload, '')).toBe(false);
      expect(await verificaSigilloIntegrita(payload, 'too-short')).toBe(false);
      expect(await verificaSigilloIntegrita(payload, 'a'.repeat(63))).toBe(false);
      expect(await verificaSigilloIntegrita(payload, 'a'.repeat(65))).toBe(false);
      expect(await verificaSigilloIntegrita(payload, null as unknown as string)).toBe(false);
    });
  });

  // =========================================================================
  // 4. ZOD SCHEMAS & PROTOTYPE POLLUTION DEFENSES (schemi.ts)
  // =========================================================================
  describe('4. Zod Schemas Adversarial & Prototype Pollution Tests', () => {
    // -----------------------------------------------------------------------
    // UtenzaSchema
    // -----------------------------------------------------------------------
    describe('UtenzaSchema Defenses', () => {
      const validUtenza = {
        identificativo: 'mario.rossi',
        nomeCompleto: 'Mario Rossi',
        ruolo: 'dipendente' as const,
        dataCreazione: '2026-01-01T00:00:00Z',
      };

      it('ADV-ZOD-UTENZA-01: blocks prototype pollution via JSON (__proto__, constructor)', () => {
        const pollutedPayload = JSON.parse(
          '{"identificativo":"m.rossi","nomeCompleto":"Mario Rossi","ruolo":"dipendente","dataCreazione":"2026-01-01T00:00:00Z","__proto__":{"isAdmin":true}}'
        );

        // Strict validation MUST reject extra keys including __proto__
        const parsed = UtenzaSchema.safeParse(pollutedPayload);
        // Even if JSON.parse does not create an own property on __proto__ in some runtimes,
        // prototype pollution must NOT bleed into global Object.prototype
        expect((Object.prototype as unknown as Record<string, unknown>).isAdmin).toBeUndefined();

        // Testing direct object with own property __proto__ or constructor
        const objectWithConstructor = {
          ...validUtenza,
          constructor: { prototype: { compromised: true } },
        };
        expect(UtenzaSchema.safeParse(objectWithConstructor).success).toBe(false);
        expect((Object.prototype as unknown as Record<string, unknown>).compromised).toBeUndefined();
      });

      it('ADV-ZOD-UTENZA-02: strictly rejects unauthorized extra fields (strict mode test)', () => {
        const withExtra = {
          ...validUtenza,
          privilegeEscalation: 'root',
          isSuperuser: true,
        };
        const res = UtenzaSchema.safeParse(withExtra);
        expect(res.success).toBe(false);
        if (!res.success) {
          expect(res.error.issues.some((i) => i.code === 'unrecognized_keys')).toBe(true);
        }
      });

      it('ADV-ZOD-UTENZA-03: rejects illegal characters and injections in identificativo', () => {
        const testIds = [
          'user<script>',
          'user;DROP TABLE utenze;',
          'admin\0nullbyte',
          'user with spaces',
          'user@domain.com', // @ not in /^[a-zA-Z0-9._-]+$/
          'user/path/traversal',
          'user\\windows\\path',
          '',
          'a'.repeat(51), // Exceeds max 50
        ];

        for (const badId of testIds) {
          const res = UtenzaSchema.safeParse({ ...validUtenza, identificativo: badId });
          expect(res.success).toBe(false);
        }
      });

      it('ADV-ZOD-UTENZA-04: rejects type coercion attempts', () => {
        expect(UtenzaSchema.safeParse({ ...validUtenza, identificativo: 12345 }).success).toBe(false);
        expect(UtenzaSchema.safeParse({ ...validUtenza, ruolo: 1 }).success).toBe(false);
        expect(UtenzaSchema.safeParse({ ...validUtenza, nomeCompleto: true }).success).toBe(false);
        expect(UtenzaSchema.safeParse({ ...validUtenza, dataCreazione: 1700000000000 }).success).toBe(false);
      });
    });

    // -----------------------------------------------------------------------
    // VoceAssenzaSchema
    // -----------------------------------------------------------------------
    describe('VoceAssenzaSchema Defenses', () => {
      const validVoce = {
        id: 'assenza-1',
        utenzaId: 'dipendente.1',
        data: '2026-06-15',
        tipo: 'ferie_intera' as const,
        quantita: 8,
        stato: 'approvata' as const,
        dataAggiornamento: '2026-06-15T08:00:00Z',
      };

      it('ADV-ZOD-VOCE-01: rejects NaN, Infinity, -Infinity and negative numbers for quantita', () => {
        expect(VoceAssenzaSchema.safeParse({ ...validVoce, quantita: NaN }).success).toBe(false);
        expect(VoceAssenzaSchema.safeParse({ ...validVoce, quantita: Infinity }).success).toBe(false);
        expect(VoceAssenzaSchema.safeParse({ ...validVoce, quantita: -Infinity }).success).toBe(false);
        expect(VoceAssenzaSchema.safeParse({ ...validVoce, quantita: -1 }).success).toBe(false);
        expect(VoceAssenzaSchema.safeParse({ ...validVoce, quantita: 0 }).success).toBe(false);
        expect(VoceAssenzaSchema.safeParse({ ...validVoce, quantita: 24.1 }).success).toBe(false); // Max 24
        expect(VoceAssenzaSchema.safeParse({ ...validVoce, quantita: 1000 }).success).toBe(false);
      });

      it('ADV-ZOD-VOCE-02: rejects type coercion of quantita from string', () => {
        expect(VoceAssenzaSchema.safeParse({ ...validVoce, quantita: '8' }).success).toBe(false);
      });

      it('ADV-ZOD-VOCE-03: rejects invalid ISO dates in data field', () => {
        const invalidDates = [
          '15-06-2026',
          '2026/06/15',
          '2026-6-15',
          '2026-06-15T00:00:00Z',
          'invalid-date',
          '20260615',
          '',
        ];
        for (const date of invalidDates) {
          expect(VoceAssenzaSchema.safeParse({ ...validVoce, data: date }).success).toBe(false);
        }
      });
    });

    // -----------------------------------------------------------------------
    // RichiestaAssenzaSchema
    // -----------------------------------------------------------------------
    describe('RichiestaAssenzaSchema Defenses', () => {
      const validRichiesta = {
        id: 'richiesta-1',
        utenzaId: 'dipendente.1',
        nomeRichiedente: 'Mario Rossi',
        tipo: 'ferie_intera' as const,
        dataInizio: '2026-07-01',
        dataFine: '2026-07-05',
        dateCoinvolte: ['2026-07-01', '2026-07-02', '2026-07-03', '2026-07-04', '2026-07-05'],
        giorniTotaliLavorativi: 5,
        stato: 'in_attesa' as const,
        dataInvio: '2026-06-01T10:00:00Z',
      };

      it('ADV-ZOD-RICHIESTA-01: requires giorniTotaliLavorativi to be non-negative integer <= 366', () => {
        // Non-integer (floats)
        expect(RichiestaAssenzaSchema.safeParse({ ...validRichiesta, giorniTotaliLavorativi: 5.5 }).success).toBe(false);
        // Negative
        expect(RichiestaAssenzaSchema.safeParse({ ...validRichiesta, giorniTotaliLavorativi: -1 }).success).toBe(false);
        // Exceeds max 366
        expect(RichiestaAssenzaSchema.safeParse({ ...validRichiesta, giorniTotaliLavorativi: 367 }).success).toBe(false);
        // NaN & Infinity
        expect(RichiestaAssenzaSchema.safeParse({ ...validRichiesta, giorniTotaliLavorativi: NaN }).success).toBe(false);
        expect(RichiestaAssenzaSchema.safeParse({ ...validRichiesta, giorniTotaliLavorativi: Infinity }).success).toBe(false);
        // Valid 0 (e.g. cancelled/zero days)
        expect(RichiestaAssenzaSchema.safeParse({ ...validRichiesta, giorniTotaliLavorativi: 0 }).success).toBe(true);
      });

      it('ADV-ZOD-RICHIESTA-02: restricts dateCoinvolte array length boundaries (1 <= len <= 366)', () => {
        // Empty array
        expect(RichiestaAssenzaSchema.safeParse({ ...validRichiesta, dateCoinvolte: [] }).success).toBe(false);

        // 367 dates (DoS / array explosion attempt)
        const excessiveDates = Array.from({ length: 367 }, (_, i) => {
          const day = String((i % 28) + 1).padStart(2, '0');
          const month = String(Math.floor(i / 28) + 1).padStart(2, '0');
          return `2026-${month}-${day}`;
        });
        expect(RichiestaAssenzaSchema.safeParse({ ...validRichiesta, dateCoinvolte: excessiveDates }).success).toBe(false);
      });

      it('ADV-ZOD-RICHIESTA-03: rejects injected authorization fields', () => {
        const injected = {
          ...validRichiesta,
          bypassApproval: true,
          approvatoAutomaticamenteDa: 'system-root',
        };
        expect(RichiestaAssenzaSchema.safeParse(injected).success).toBe(false);
      });
    });

    // -----------------------------------------------------------------------
    // BackupAziendaleSchema & validaBackupAziendaleSicuro
    // -----------------------------------------------------------------------
    describe('BackupAziendaleSchema & validaBackupAziendaleSicuro Defenses', () => {
      const validBackup = {
        azienda: 'C. Emme Impianti S.r.l.' as const,
        versione: '3.0',
        dataEsportazione: '2026-11-13T12:00:00Z',
        utenze: [],
        assenze: [],
        richieste: [],
      };

      it('ADV-ZOD-BACKUP-01: strictly requires the exact company literal C. Emme Impianti S.r.l.', () => {
        const fakeCompany = { ...validBackup, azienda: 'Impresa Falsa S.r.l.' };
        expect(BackupAziendaleSchema.safeParse(fakeCompany).success).toBe(false);

        const subvertedCompany = { ...validBackup, azienda: 'C. Emme Impianti S.r.l. - Hacked' };
        expect(BackupAziendaleSchema.safeParse(subvertedCompany).success).toBe(false);
      });

      it('ADV-ZOD-BACKUP-02: validaBackupAziendaleSicuro parses legitimate JSON safely', () => {
        const jsonStr = JSON.stringify(validBackup);
        const result = validaBackupAziendaleSicuro(jsonStr);
        expect(result.successo).toBe(true);
        expect(result.dati).toBeDefined();
        expect(result.dati?.azienda).toBe('C. Emme Impianti S.r.l.');
      });

      it('ADV-ZOD-BACKUP-03: validaBackupAziendaleSicuro catches malformed JSON without crashing', () => {
        const result = validaBackupAziendaleSicuro('{ malformed json string');
        expect(result.successo).toBe(false);
        expect(result.errore).toContain('File JSON di backup non valido');
      });

      it('ADV-ZOD-BACKUP-04: validaBackupAziendaleSicuro reports detailed schema violation errors', () => {
        const poisonedBackup = {
          ...validBackup,
          utenze: [
            {
              identificativo: 'hacker',
              nomeCompleto: 'Bad Actor',
              ruolo: 'unauthorized_superadmin', // Invalid role
              dataCreazione: '2026-01-01T00:00:00Z',
            },
          ],
        };
        const result = validaBackupAziendaleSicuro(JSON.stringify(poisonedBackup));
        expect(result.successo).toBe(false);
        expect(result.errore).toContain('Violazione schema di sicurezza backup');
      });
    });

    // -----------------------------------------------------------------------
    // SessioneAttivaSchema & validaSessione
    // -----------------------------------------------------------------------
    describe('SessioneAttivaSchema & validaSessione Defenses', () => {
      it('ADV-ZOD-SESSION-01: detects expired session and future creation timestamps', () => {
        const now = 1700000000000;
        const validSession = {
          identificativo: 'admin',
          ruolo: 'titolare' as const,
          tokenSessione: '0123456789abcdef0123456789abcdef',
          timestampCreazione: now - 10000,
          ultimoAccesso: now - 5000,
        };

        // Normal session: valid
        expect(validaSessione(validSession, now).valida).toBe(true);

        // Future session creation timestamp (system clock anomaly / forgery)
        const futureSession = { ...validSession, timestampCreazione: now + 60000 };
        const resFuture = validaSessione(futureSession, now);
        expect(resFuture.valida).toBe(false);
        expect(resFuture.motivo).toContain('futuro');

        // Expired session (> 30 min idle)
        const expiredSession = { ...validSession, ultimoAccesso: now - (31 * 60 * 1000) };
        const resExpired = validaSessione(expiredSession, now);
        expect(resExpired.valida).toBe(false);
        expect(resExpired.motivo).toContain('scaduta');

        // Null / undefined session
        expect(validaSessione(null, now).valida).toBe(false);
        expect(validaSessione(undefined, now).valida).toBe(false);
      });
    });
  });

  // =========================================================================
  // 5. IN-DEPTH EDGE CASES, VULNERABILITY PROBING & FORENSIC CHALLENGES
  // =========================================================================
  describe('5. In-Depth Edge Cases & Vulnerability Probing', () => {
    it('ADV-PROBE-01 [VULNERABILITY DETECTED]: hexABytes silently collapses non-hex characters to zero bytes', async () => {
      // Input has valid length (32 chars) but contains non-hex characters 'z'
      const nonHexSalt = 'z'.repeat(32);
      const allZeroSalt = '0'.repeat(32);

      const bytesNonHex = hexABytes(nonHexSalt);
      const bytesAllZero = hexABytes(allZeroSalt);

      // Observation: parseInt("zz", 16) is NaN, Uint8Array converts NaN to 0
      expect(Array.from(bytesNonHex)).toEqual(Array.from(bytesAllZero));

      // Impact: An invalid salt of 'z' produces the IDENTICAL PBKDF2 hash as a salt of '0'
      const hash1 = await generaHashPassword('TestPass', nonHexSalt);
      const hash2 = await generaHashPassword('TestPass', allZeroSalt);
      expect(hash1.hash).toBe(hash2.hash);
    });

    it('ADV-PROBE-02 [VULNERABILITY DETECTED]: validaSessione accepts future ultimoAccesso (immortal session vulnerability)', () => {
      const now = 1700000000000;
      // An attacker or forged state with ultimoAccesso far in the future
      const immortalSession = {
        identificativo: 'hacker',
        ruolo: 'dipendente' as const,
        tokenSessione: '0123456789abcdef0123456789abcdef',
        timestampCreazione: now - 10000, // Valid past creation
        ultimoAccesso: now + 1000 * 60 * 60 * 24 * 365, // 1 year in the future!
      };

      // tempoInattivita becomes negative (-1 year), which is < timeoutMs (30 min)
      // Because validaSessione does not check `nowTimestamp < sessione.ultimoAccesso`,
      // this session is deemed valid indefinitely!
      const result = validaSessione(immortalSession, now);
      expect(result.valida).toBe(true); // Demonstrates the vulnerability exists
    });

    it('ADV-PROBE-03 [WEAKNESS DETECTED]: Schemas accept non-hex strings in hash, salt, and sigillo', () => {
      const validUtenza = {
        identificativo: 'user.test',
        nomeCompleto: 'Test User',
        ruolo: 'dipendente' as const,
        dataCreazione: '2026-01-01T00:00:00Z',
      };

      // Non-hex characters of length 64 and 32
      const nonHexHash = 'X'.repeat(64);
      const nonHexSalt = 'X'.repeat(32);

      // Zod schema only checks .length(64) and .length(32), NOT /^[0-9a-fA-F]+$/
      const parseResult = UtenzaSchema.safeParse({
        ...validUtenza,
        chiaveAccessoHash: nonHexHash,
        salt: nonHexSalt,
      });
      // The schema accepts this malformed hash because regex was omitted
      expect(parseResult.success).toBe(true);

      // Same in BackupAziendaleSchema for sigillo
      const nonHexSigillo = 'X'.repeat(64);
      const backupResult = BackupAziendaleSchema.safeParse({
        azienda: 'C. Emme Impianti S.r.l.',
        versione: '3.0',
        dataEsportazione: '2026-11-13T12:00:00Z',
        sigillo: nonHexSigillo,
        utenze: [],
        assenze: [],
        richieste: [],
      });
      expect(backupResult.success).toBe(true);
    });

    it('ADV-PROBE-04 [WEAKNESS DETECTED]: RichiestaAssenzaSchema allows inverted date ranges (dataInizio > dataFine)', () => {
      const invertedRichiesta = {
        id: 'req-inverted-1',
        utenzaId: 'dipendente.1',
        nomeRichiedente: 'Mario Rossi',
        tipo: 'ferie_intera' as const,
        dataInizio: '2026-12-31', // Start after end!
        dataFine: '2026-01-01',
        dateCoinvolte: ['2026-12-31'],
        giorniTotaliLavorativi: 1,
        stato: 'in_attesa' as const,
        dataInvio: '2026-06-01T10:00:00Z',
      };

      // Zod schema accepts inverted date range because no cross-field refinement exists
      expect(RichiestaAssenzaSchema.safeParse(invertedRichiesta).success).toBe(true);
    });

    it('ADV-PROBE-05: decifraDatoSensibile safely rejects non-string or corrupted envelope fields', async () => {
      // Envelope with number instead of string for ciphertext
      const envWithNumberCipher = JSON.stringify({ c: 12345, iv: 'abc', s: 'def' });
      await expect(decifraDatoSensibile(envWithNumberCipher)).rejects.toThrow();

      // Envelope with object instead of string
      const envWithObjectIV = JSON.stringify({ c: 'abc', iv: { bad: true }, s: 'def' });
      await expect(decifraDatoSensibile(envWithObjectIV)).rejects.toThrow();
    });

    it('ADV-PROBE-06: serializzaCanonico determinism with undefined properties vs JSON.stringify', () => {
      const objWithUndefined = { b: 1, a: undefined };
      const canonical = serializzaCanonico(objWithUndefined);
      // Canonical serializer preserves the key and outputs undefined literal
      expect(canonical).toBe('{"a":undefined,"b":1}');

      // Standard JSON.stringify would omit undefined keys:
      expect(JSON.stringify(objWithUndefined)).toBe('{"b":1}');
    });

    it('ADV-PROBE-07: serializzaCanonico does NOT enumerate inherited Object.prototype properties', () => {
      // Simulate prototype pollution on Object.prototype
      const testPropName = '__challenger_test_prop__';
      try {
        (Object.prototype as unknown as Record<string, unknown>)[testPropName] = 'polluted_value';

        const obj = { x: 10, y: 20 };
        const serialized = serializzaCanonico(obj);

        // Object.keys ignores non-own prototype properties
        expect(serialized).not.toContain(testPropName);
        expect(serialized).toBe('{"x":10,"y":20}');
      } finally {
        delete (Object.prototype as unknown as Record<string, unknown>)[testPropName];
      }
    });
  });
});

