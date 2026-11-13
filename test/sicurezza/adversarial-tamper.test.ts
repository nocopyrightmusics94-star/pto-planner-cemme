import { describe, it, expect } from 'vitest';
import {
  calcolaSigilloIntegrita,
  verificaSigilloIntegrita,
  serializzaCanonico,
  DEFAULT_INTEGRITY_SECRET,
} from '@/servizi/sicurezza/integrita';
import {
  generaTokenSessione,
  validaSessione,
  SessioneAttivaSchema,
  SESSION_INACTIVITY_TIMEOUT_MS,
} from '@/servizi/sicurezza/schemi';
import { SessioneAttiva } from '@/tipi';

describe('Adversarial Verification Suite: Storage Tamper, Canonicalization & Boundaries', () => {
  // =========================================================================
  // 1. CANONICAL SERIALIZATION & KEY PERMUTATION INVARIANCE
  // =========================================================================
  describe('Adversarial Challenge 1: Key Permutation & Canonical Serialization Invariance', () => {
    it('ADV-KEY-1: Flat object with 15 keys across 50 random permutations produces identical HMAC', async () => {
      const keys = [
        'identificativo', 'ruolo', 'email', 'nomeCompleto', 'attivo',
        'saldoFerie', 'permessiOre', 'dataCreazione', 'ultimoAccesso',
        'reparto', 'telefono', 'note', 'versione', 'priorita', 'status'
      ];

      const baseValues: Record<string, unknown> = {
        identificativo: 'u_10928',
        ruolo: 'responsabile',
        email: 'luigi@cemmeimpianti.it',
        nomeCompleto: 'Luigi Responsabile',
        attivo: true,
        saldoFerie: 24.5,
        permessiOre: 12,
        dataCreazione: '2026-01-10T08:00:00.000Z',
        ultimoAccesso: 1773400000000,
        reparto: 'Impianti Elettrici',
        telefono: '+39 02 1234567',
        note: 'Supervisore cantiere Nord',
        versione: '2.0.1',
        priorita: 1,
        status: 'approvato',
      };

      // Base seal
      const baseSeal = await calcolaSigilloIntegrita(baseValues);
      expect(baseSeal).toHaveLength(64);

      // Generate 50 permutations with shuffled key insertion orders
      for (let i = 0; i < 50; i++) {
        const shuffledKeys = [...keys].sort(() => Math.random() - 0.5);
        const permutedObj: Record<string, unknown> = {};
        for (const k of shuffledKeys) {
          permutedObj[k] = baseValues[k];
        }

        const permutedCanonical = serializzaCanonico(permutedObj);
        const permutedSeal = await calcolaSigilloIntegrita(permutedObj);

        // Verification must be 100% identical and verify against base seal
        expect(permutedCanonical).toBe(serializzaCanonico(baseValues));
        expect(permutedSeal).toBe(baseSeal);
        const isValid = await verificaSigilloIntegrita(permutedObj, baseSeal);
        expect(isValid).toBe(true);
      }
    });

    it('ADV-KEY-2: Deeply nested hierarchy (4 levels) with randomized key orders produces identical HMAC', async () => {
      const createNestedHierarchy = (orderSeed: number) => {
        // Alternating key insertion order based on seed
        const flip = orderSeed % 2 === 0;

        const level4 = flip
          ? { zeta: 'end', alpha: 100, beta: true }
          : { alpha: 100, beta: true, zeta: 'end' };

        const level3 = flip
          ? { subObj: level4, delta: [3, 2, 1], gamma: 'mid' }
          : { gamma: 'mid', delta: [3, 2, 1], subObj: level4 };

        const level2 = flip
          ? { innerTree: level3, theta: null, kappa: 42.195 }
          : { kappa: 42.195, theta: null, innerTree: level3 };

        const root = flip
          ? { data: level2, id: 'req_deep_99', timestamp: '2026-11-13' }
          : { timestamp: '2026-11-13', id: 'req_deep_99', data: level2 };

        return root;
      };

      const referenceObj = createNestedHierarchy(0);
      const referenceSeal = await calcolaSigilloIntegrita(referenceObj);

      for (let seed = 1; seed <= 20; seed++) {
        const permuted = createNestedHierarchy(seed);
        const seal = await calcolaSigilloIntegrita(permuted);

        expect(serializzaCanonico(permuted)).toBe(serializzaCanonico(referenceObj));
        expect(seal).toBe(referenceSeal);
        const ok = await verificaSigilloIntegrita(permuted, referenceSeal);
        expect(ok).toBe(true);
      }
    });

    it('ADV-KEY-3: Arrays containing objects with shuffled keys produce identical seal, but array order matters', async () => {
      const itemA1 = { id: 1, role: 'admin', active: true };
      const itemA2 = { role: 'admin', active: true, id: 1 }; // shuffled keys

      const itemB1 = { id: 2, role: 'user', active: false };
      const itemB2 = { active: false, id: 2, role: 'user' }; // shuffled keys

      const list1 = [itemA1, itemB1];
      const list2 = [itemA2, itemB2];

      const seal1 = await calcolaSigilloIntegrita(list1);
      const seal2 = await calcolaSigilloIntegrita(list2);

      expect(seal1).toBe(seal2);
      expect(await verificaSigilloIntegrita(list2, seal1)).toBe(true);

      // BUT if array order is swapped [itemB, itemA], seal MUST differ!
      const swappedList = [itemA1, itemB1].reverse();
      const swappedSeal = await calcolaSigilloIntegrita(swappedList);
      expect(swappedSeal).not.toBe(seal1);
      expect(await verificaSigilloIntegrita(swappedList, seal1)).toBe(false);
    });
  });

  // =========================================================================
  // 2. SINGLE-BIT & SINGLE-CHARACTER DEEP TAMPER DETECTION
  // =========================================================================
  describe('Adversarial Challenge 2: Single-Bit & Single-Char Tamper Detection', () => {
    it('ADV-TAMPER-1: Detects single-character modifications in any deeply nested property', async () => {
      const originalRecord = {
        azienda: 'C. Emme Impianti S.r.l.',
        utenze: [
          {
            identificativo: 'admin',
            ruolo: 'titolare',
            permessi: { approvaTutto: true, visualizzaSalari: true },
          },
          {
            identificativo: 'operatore1',
            ruolo: 'dipendente',
            permessi: { approvaTutto: false, visualizzaSalari: false },
          },
        ],
        richieste: [
          {
            id: 'req_101',
            richiedente: 'operatore1',
            giorni: 5,
            stato: 'in_attesa',
            protocolloMedico: 'PROT-MED-2026-991',
          },
        ],
      };

      const originalSeal = await calcolaSigilloIntegrita(originalRecord);
      expect(await verificaSigilloIntegrita(originalRecord, originalSeal)).toBe(true);

      // Adversarial mutations: 10 distinct subtle mutations
      const mutations: Array<{ name: string; mutate: (clone: typeof originalRecord) => void }> = [
        {
          name: 'Privilege escalation: dipendente -> titolare',
          mutate: (c) => { c.utenze[1].ruolo = 'titolare'; },
        },
        {
          name: 'Boolean flip: approvaTutto false -> true',
          mutate: (c) => { c.utenze[1].permessi.approvaTutto = true; },
        },
        {
          name: 'Unauthorized approval: stato in_attesa -> approvata',
          mutate: (c) => { c.richieste[0].stato = 'approvata'; },
        },
        {
          name: 'Vacation days tampering: 5 -> 6',
          mutate: (c) => { c.richieste[0].giorni = 6; },
        },
        {
          name: 'Vacation days float tampering: 5 -> 5.0001',
          mutate: (c) => { c.richieste[0].giorni = 5.0001; },
        },
        {
          name: 'Medical protocol 1 char alteration: 991 -> 992',
          mutate: (c) => { c.richieste[0].protocolloMedico = 'PROT-MED-2026-992'; },
        },
        {
          name: 'Subtle company name change: dot removal',
          mutate: (c) => { c.azienda = 'C. Emme Impianti S.rl.'; },
        },
        {
          name: 'Trailing whitespace added to user id',
          mutate: (c) => { c.utenze[0].identificativo = 'admin '; },
        },
        {
          name: 'Inject extra unauthorized property',
          mutate: (c) => { (c.richieste[0] as Record<string, unknown>).forzato = true; },
        },
        {
          name: 'Array item removal',
          mutate: (c) => { c.utenze.pop(); },
        },
      ];

      for (const m of mutations) {
        const cloned = JSON.parse(JSON.stringify(originalRecord));
        m.mutate(cloned);

        const isTamperAccepted = await verificaSigilloIntegrita(cloned, originalSeal);
        expect(isTamperAccepted, `Failed to detect tamper in scenario: ${m.name}`).toBe(false);
      }
    });

    it('ADV-TAMPER-2: Systematic single-character corruption across serialized string', async () => {
      const payload = {
        id: 'cemme-sys-01',
        valori: [10, 20, 30, 40],
        config: { attivo: true, soglia: 99.5, desc: 'Sistema Monitoraggio Ferie' },
      };

      const canonStr = serializzaCanonico(payload);
      const originalSeal = await calcolaSigilloIntegrita(payload);

      // Verify authentic
      expect(await verificaSigilloIntegrita(payload, originalSeal)).toBe(true);

      // Systematic sweep: tamper 30 random positions in the canonical string
      let detectedCount = 0;
      const testedPositions = 30;

      for (let step = 0; step < testedPositions; step++) {
        const idx = Math.floor(Math.random() * canonStr.length);
        const originalChar = canonStr.charAt(idx);
        // Replace with a different char (flip case or replace with 'X')
        const replacementChar = originalChar === 'X' ? 'Y' : 'X';
        const tamperedStr =
          canonStr.substring(0, idx) + replacementChar + canonStr.substring(idx + 1);

        // Try to verify tampered string directly
        const isValid = await verificaSigilloIntegrita(tamperedStr, originalSeal);
        if (!isValid) {
          detectedCount++;
        }
      }

      // Detection rate MUST be 100%
      expect(detectedCount).toBe(testedPositions);
    });

    it('ADV-TAMPER-3: HMAC seal boundary validations (case insensitivity, length, corruption)', async () => {
      const data = { token: 'secret-sample', active: true };
      const validSeal = await calcolaSigilloIntegrita(data);

      // 1. Uppercase version of the valid seal must still verify (hex is case-insensitive)
      expect(await verificaSigilloIntegrita(data, validSeal.toUpperCase())).toBe(true);
      expect(await verificaSigilloIntegrita(data, validSeal.toLowerCase())).toBe(true);

      // 2. Single hex character flipped in seal
      const flippedChar = validSeal[0] === 'a' ? 'b' : 'a';
      const corruptedSeal = flippedChar + validSeal.substring(1);
      expect(await verificaSigilloIntegrita(data, corruptedSeal)).toBe(false);

      // 3. Truncated seal (63 chars)
      expect(await verificaSigilloIntegrita(data, validSeal.substring(0, 63))).toBe(false);

      // 4. Extended seal (65 chars)
      expect(await verificaSigilloIntegrita(data, validSeal + '0')).toBe(false);

      // 5. Empty or malformed seals
      expect(await verificaSigilloIntegrita(data, '')).toBe(false);
      expect(await verificaSigilloIntegrita(data, null as unknown as string)).toBe(false);
      expect(await verificaSigilloIntegrita(data, undefined as unknown as string)).toBe(false);
      expect(await verificaSigilloIntegrita(data, 'zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz')).toBe(false);
    });
  });

  // =========================================================================
  // 3. COMPLEX VALUES & TYPE BOUNDARY STRESS TESTS
  // =========================================================================
  describe('Adversarial Challenge 3: Complex Values & Type Boundaries', () => {
    it('ADV-TYPE-1: Type collisions and coercion checks (1 vs "1" vs true, etc.)', async () => {
      // Different types must NEVER produce the same seal
      const variants: Array<{ desc: string; val: unknown }> = [
        { desc: 'number 1', val: { val: 1 } },
        { desc: 'string "1"', val: { val: '1' } },
        { desc: 'boolean true', val: { val: true } },
        { desc: 'number 0', val: { val: 0 } },
        { desc: 'string "0"', val: { val: '0' } },
        { desc: 'boolean false', val: { val: false } },
        { desc: 'null', val: { val: null } },
        { desc: 'string "null"', val: { val: 'null' } },
        { desc: 'empty string', val: { val: '' } },
      ];

      const seals = new Map<string, string>();
      for (const item of variants) {
        const seal = await calcolaSigilloIntegrita(item.val);
        expect(seals.has(seal), `Collision detected between ${seals.get(seal)} and ${item.desc}`).toBe(false);
        seals.set(seal, item.desc);
      }
    });

    it('ADV-TYPE-2: Deeply nested arrays and empty structures', async () => {
      const emptyStructures = [
        {},
        [],
        { a: {} },
        { a: [] },
        [[[[[[]]]]]],
        [[[[[42]]]]],
      ];

      for (const struct of emptyStructures) {
        const seal = await calcolaSigilloIntegrita(struct);
        expect(seal).toHaveLength(64);
        expect(await verificaSigilloIntegrita(struct, seal)).toBe(true);
      }
    });

    it('ADV-TYPE-3: Unicode, emoji, and special character resilience', async () => {
      const unicodeData = {
        azienda: 'C. Emme Impianti S.r.l. — Società Unipersonale',
        motivo: 'Ferie estive ☀️🏖️ a Cortina d’Ampezzo; € 1.500,00 anticipo',
        simboli: '«—» \t \n \r \\ / " \' <script>alert(1)</script>',
        lingue: '日本語 • Русский • العربية • 中文',
      };

      const seal = await calcolaSigilloIntegrita(unicodeData);
      expect(seal).toHaveLength(64);
      expect(await verificaSigilloIntegrita(unicodeData, seal)).toBe(true);
    });

    it('ADV-TYPE-4: Undefined properties behavior examination', async () => {
      // Analyze behavior when properties are explicitly undefined
      const withUndefined = { a: 1, b: undefined };
      const withoutUndefined = { a: 1 };

      const canonWith = serializzaCanonico(withUndefined);
      const canonWithout = serializzaCanonico(withoutUndefined);

      // Document exact canonicalization output
      // In JS, serializzaCanonico({ a: 1, b: undefined }) produces:
      // '{"a":1,"b":undefined}'
      expect(canonWith).toContain('"b":undefined');
      expect(canonWithout).toBe('{"a":1}');

      // Sealing with undefined:
      const sealWith = await calcolaSigilloIntegrita(withUndefined);
      const sealWithout = await calcolaSigilloIntegrita(withoutUndefined);
      expect(sealWith).not.toBe(sealWithout);
    });

    it('ADV-TYPE-5: Circular reference behavior examination', async () => {
      const circularObj: Record<string, unknown> = { id: 'root' };
      circularObj.self = circularObj;

      // When passed to serializzaCanonico / calcolaSigilloIntegrita,
      // it should throw (stack overflow / RangeError) rather than hang indefinitely
      await expect(calcolaSigilloIntegrita(circularObj)).rejects.toThrow();
    });
  });

  // =========================================================================
  // 4. SESSION TOKEN GENERATION & EXPIRATION EDGE CASES
  // =========================================================================
  describe('Adversarial Challenge 4: Session Tokens & Expiration Boundaries', () => {
    it('ADV-SESSION-1: generaTokenSessione produces unique 256-bit cryptographically random tokens', () => {
      const generatedTokens = new Set<string>();
      const sampleSize = 1000;

      for (let i = 0; i < sampleSize; i++) {
        const token = generaTokenSessione();
        expect(token).toMatch(/^[0-9a-f]{64}$/);
        expect(generatedTokens.has(token)).toBe(false);
        generatedTokens.add(token);
      }

      expect(generatedTokens.size).toBe(sampleSize);
    });

    it('ADV-SESSION-2: validaSessione exact boundary conditions (timeoutMs vs timeoutMs + 1)', () => {
      const now = 1773400000000;
      const timeout = SESSION_INACTIVITY_TIMEOUT_MS; // 30 min (1800000 ms)

      const sessioneBase: SessioneAttiva = {
        identificativo: 'm.rossi',
        ruolo: 'dipendente',
        tokenSessione: 'a'.repeat(64),
        timestampCreazione: now - 3600000, // 1 hour ago
        ultimoAccesso: now - timeout, // exactly 30 minutes ago
      };

      // Exactly at timeout boundary: tempoInattivita = timeout -> not > timeout, so still valid
      const resExact = validaSessione(sessioneBase, now, timeout);
      expect(resExact.valida).toBe(true);

      // Exceeded by 1 millisecond: tempoInattivita = timeout + 1 -> expired!
      const sessioneScaduta = { ...sessioneBase, ultimoAccesso: now - timeout - 1 };
      const resScaduta = validaSessione(sessioneScaduta, now, timeout);
      expect(resScaduta.valida).toBe(false);
      expect(resScaduta.motivo).toMatch(/inattività/i);
    });

    it('ADV-SESSION-3: Future timestamps and system clock anomaly rejection', () => {
      const now = 1773400000000;

      // Creation timestamp in future
      const futureSession: SessioneAttiva = {
        identificativo: 'm.rossi',
        ruolo: 'dipendente',
        tokenSessione: 'a'.repeat(64),
        timestampCreazione: now + 5000,
        ultimoAccesso: now + 5000,
      };

      const resFuture = validaSessione(futureSession, now);
      expect(resFuture.valida).toBe(false);
      expect(resFuture.motivo).toMatch(/futuro/i);
    });

    it('ADV-SESSION-4: Tampered or invalid session structures rejected by Zod', () => {
      const now = Date.now();

      // Missing token
      const missingToken = {
        identificativo: 'm.rossi',
        ruolo: 'dipendente',
        timestampCreazione: now - 1000,
        ultimoAccesso: now - 500,
      };
      expect(validaSessione(missingToken as unknown as SessioneAttiva).valida).toBe(false);

      // Short token (< 16 chars)
      const shortToken = {
        identificativo: 'm.rossi',
        ruolo: 'dipendente',
        tokenSessione: 'too-short',
        timestampCreazione: now - 1000,
        ultimoAccesso: now - 500,
      };
      expect(validaSessione(shortToken as unknown as SessioneAttiva).valida).toBe(false);

      // Unauthorized role
      const hackerRole = {
        identificativo: 'm.rossi',
        ruolo: 'admin_root',
        tokenSessione: 'a'.repeat(32),
        timestampCreazione: now - 1000,
        ultimoAccesso: now - 500,
      };
      expect(validaSessione(hackerRole as unknown as SessioneAttiva).valida).toBe(false);

      // Injected unexpected properties (prototype pollution / extra props)
      const injectedProp = {
        identificativo: 'm.rossi',
        ruolo: 'dipendente',
        tokenSessione: 'a'.repeat(32),
        timestampCreazione: now - 1000,
        ultimoAccesso: now - 500,
        maliciousBackdoor: true,
      };
      expect(validaSessione(injectedProp as unknown as SessioneAttiva).valida).toBe(false);
    });

    it('ADV-SESSION-5: Edge condition of ultimoAccesso ahead of nowTimestamp or Infinity', () => {
      const now = 1773400000000;
      // Creation is in past, but attacker tampers ultimoAccesso to be in the far future (+ 1 year)
      const tamperedUltimoAccesso: SessioneAttiva = {
        identificativo: 'm.rossi',
        ruolo: 'dipendente',
        tokenSessione: 'a'.repeat(64),
        timestampCreazione: now - 60000,
        ultimoAccesso: now + 365 * 24 * 3600 * 1000,
      };

      const resFutureAccess = validaSessione(tamperedUltimoAccesso, now);
      // Notice: In the current implementation:
      // tempoInattivita = now - ultimoAccesso is negative (-31536000000).
      // Since negative is NOT > timeoutMs (1800000), validaSessione considers it valid!
      // This is a documented edge case: future ultimoAccesso bypasses inactivity timeout.
      expect(resFutureAccess.valida).toBe(true);

      // What about ultimoAccesso before timestampCreazione?
      const tamperedPreCreation: SessioneAttiva = {
        identificativo: 'm.rossi',
        ruolo: 'dipendente',
        tokenSessione: 'a'.repeat(64),
        timestampCreazione: now - 10000,
        ultimoAccesso: now - 20000, // accessed before creation!
      };
      const resPreCreation = validaSessione(tamperedPreCreation, now);
      // Valid because now - ultimoAccesso = 20000 <= 1800000
      expect(resPreCreation.valida).toBe(true);
    });

    it('ADV-STORAGE-UNDEF: Storage roundtrip with optional undefined property', async () => {
      // If an object has an optional property set to undefined:
      const originalRecord: { id: string; reparto?: string } = {
        id: 'u_100',
        reparto: undefined,
      };

      // 1. Calculate seal directly on in-memory object:
      const sealOnInMemory = await calcolaSigilloIntegrita(originalRecord);

      // 2. Simulate standard JSON storage persistence (e.g., localStorage.setItem('k', JSON.stringify(obj))):
      const storedJson = JSON.stringify(originalRecord); // '{"id":"u_100"}' - drops `reparto`
      const loadedFromStorage = JSON.parse(storedJson); // { id: 'u_100' }

      // 3. Verify seal against loaded object:
      const isValid = await verificaSigilloIntegrita(loadedFromStorage, sealOnInMemory);

      // Because serializzaCanonico({ id: 'u_100', reparto: undefined }) emitted '"reparto":undefined',
      // while serializzaCanonico({ id: 'u_100' }) emits '{"id":"u_100"}',
      // the HMAC seal calculated before storage does NOT match the HMAC seal calculated after JSON storage roundtrip!
      expect(serializzaCanonico(originalRecord)).toBe('{"id":"u_100","reparto":undefined}');
      expect(serializzaCanonico(loadedFromStorage)).toBe('{"id":"u_100"}');
      expect(isValid).toBe(false);
    });

    it('ADV-ARRAY-UNDEF: Array containing undefined elements produces non-standard JSON', () => {
      // Array with undefined:
      const arrayWithUndef = [undefined, 1];
      const canon = serializzaCanonico(arrayWithUndef);
      // [undefined, 1].map(serializzaCanonico) -> [undefined, "1"]
      // [undefined, "1"].join(',') -> ",1"
      // Result: "[,1]"
      expect(canon).toBe('[,1]');

      // Notice: "[,1]" is invalid JSON syntax, but it is deterministic.
      // And [undefined] produces "[]" which collides with empty array []
      const canonSingleUndef = serializzaCanonico([undefined]);
      const canonEmpty = serializzaCanonico([]);
      expect(canonSingleUndef).toBe('[]');
      expect(canonEmpty).toBe('[]');
    });
  });
});
