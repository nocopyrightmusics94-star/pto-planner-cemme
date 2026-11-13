import { describe, it, expect, beforeEach } from 'vitest';
import {
  StorageIntegritaSimulator,
  calcolaSigilloIntegrita,
  verificaSigilloIntegrita,
  UtenzaValidata,
} from './module-loader.js';

describe('Storage Integrity & Anti-Tampering Suite (Tiers 1, 2, 3, 4)', () => {
  let storage: StorageIntegritaSimulator;

  beforeEach(() => {
    storage = new StorageIntegritaSimulator();
  });

  // =========================================================================
  // TIER 1: FEATURE COVERAGE (>=5 tests)
  // =========================================================================
  describe('Tier 1: Storage Sealing & Verification Fundamentals', () => {
    it('T1-STORAGE-1: setItemSigillato creates sealed envelope with data and HMAC signature', async () => {
      const data = { id: 'test_record', valore: 12345 };
      await storage.setItemSigillato('cemme_test_v2', data);

      const raw = storage.getRaw('cemme_test_v2');
      expect(raw).toBeDefined();

      const parsedEnvelope = JSON.parse(raw!);
      expect(parsedEnvelope).toHaveProperty('d');
      expect(parsedEnvelope).toHaveProperty('s');
      expect(parsedEnvelope.s).toMatch(/^[0-9a-f]{64}$/i);
    });

    it('T1-STORAGE-2: getItemVerificato recovers exact untampered data with manomesso=false', async () => {
      const original = { utente: 'm.rossi', ferieResidue: 22.5, autorizzato: true };
      await storage.setItemSigillato('chiave_1', original);

      const result = await storage.getItemVerificato<typeof original>('chiave_1');
      expect(result.manomesso).toBe(false);
      expect(result.valore).toEqual(original);
    });

    it('T1-STORAGE-3: getItemVerificato returns null for non-existent storage keys', async () => {
      const result = await storage.getItemVerificato('chiave_inesistente');
      expect(result.manomesso).toBe(false);
      expect(result.valore).toBeNull();
    });

    it('T1-STORAGE-4: modifying payload string inside envelope triggers manomesso=true', async () => {
      const original = { id: 'req_01', stato: 'in_attesa' };
      await storage.setItemSigillato('richiesta', original);

      // Raw envelope manipulation: change 'in_attesa' to 'approvata' without updating HMAC
      const raw = storage.getRaw('richiesta')!;
      const tampered = raw.replace('in_attesa', 'approvata');
      storage.manomettiGrezzo('richiesta', tampered);

      const result = await storage.getItemVerificato('richiesta');
      expect(result.manomesso).toBe(true);
      expect(result.valore).toBeNull();
    });

    it('T1-STORAGE-5: updating data with setItemSigillato resigns and remains valid', async () => {
      await storage.setItemSigillato('saldo', { ore: 10 });
      let res = await storage.getItemVerificato<{ ore: number }>('saldo');
      expect(res.valore?.ore).toBe(10);

      // Lawful update (e.g. employee spent 2 hours)
      await storage.setItemSigillato('saldo', { ore: 8 });
      res = await storage.getItemVerificato<{ ore: number }>('saldo');
      expect(res.manomesso).toBe(false);
      expect(res.valore?.ore).toBe(8);
    });
  });

  // =========================================================================
  // TIER 2: BOUNDARY & CORNER CASES (>=5 tests)
  // =========================================================================
  describe('Tier 2: Specific Tampering Scenarios & Envelope Boundary Corruptions', () => {
    it('T2-TAMPER-1: detects single numeric character manipulation in vacation balance', async () => {
      const record = { utenteId: 'm.rossi', saldoFerieGiorni: 10 };
      await storage.setItemSigillato('saldi', record);

      // Attacker changes 10 to 90
      const envelope = JSON.parse(storage.getRaw('saldi')!);
      envelope.d = envelope.d.replace('"saldoFerieGiorni":10', '"saldoFerieGiorni":90');
      storage.manomettiGrezzo('saldi', JSON.stringify(envelope));

      const res = await storage.getItemVerificato('saldi');
      expect(res.manomesso).toBe(true);
      expect(res.valore).toBeNull();
    });

    it('T2-TAMPER-2: detects vertical role manipulation in user accounts table', async () => {
      const users: Array<Partial<UtenzaValidata>> = [
        { identificativo: 'm.rossi', ruolo: 'dipendente' },
      ];
      await storage.setItemSigillato('cemme_utenze_v2', users);

      // Attacker changes role to titolare
      const raw = storage.getRaw('cemme_utenze_v2')!;
      const tampered = raw.replace('dipendente', 'titolare');
      storage.manomettiGrezzo('cemme_utenze_v2', tampered);

      const res = await storage.getItemVerificato('cemme_utenze_v2');
      expect(res.manomesso).toBe(true);
    });

    it('T2-TAMPER-3: detects injection of extra unsealed properties', async () => {
      const settings = { darkMode: true, theme: 'corporate' };
      await storage.setItemSigillato('settings', settings);

      const raw = storage.getRaw('settings')!;
      const parsedEnvelope = JSON.parse(raw);
      const innerData = JSON.parse(parsedEnvelope.d);
      innerData.backdoor = true;
      parsedEnvelope.d = JSON.stringify(innerData);
      storage.manomettiGrezzo('settings', JSON.stringify(parsedEnvelope));

      const res = await storage.getItemVerificato('settings');
      expect(res.manomesso).toBe(true);
    });

    it('T2-TAMPER-4: handles malformed envelope JSON string gracefully', async () => {
      storage.manomettiGrezzo('broken_key', '{"d":"broken json without closing');
      const res = await storage.getItemVerificato('broken_key');
      expect(res.manomesso).toBe(true);
      expect(res.valore).toBeNull();
    });

    it('T2-TAMPER-5: handles envelope with missing signature or missing data field', async () => {
      storage.manomettiGrezzo('no_sig', JSON.stringify({ d: '{"some":"data"}' }));
      const res1 = await storage.getItemVerificato('no_sig');
      expect(res1.manomesso).toBe(true);

      storage.manomettiGrezzo('no_data', JSON.stringify({ s: 'a'.repeat(64) }));
      const res2 = await storage.getItemVerificato('no_data');
      expect(res2.manomesso).toBe(true);
    });
  });

  // =========================================================================
  // TIER 3: CROSS-FEATURE COMBINATIONS
  // =========================================================================
  describe('Tier 3: Multi-Collection Storage Persistence & Tamper Isolation', () => {
    it('T3-STORAGE-1: Multi-collection integrity seals isolate tampering to the modified key only', async () => {
      const utenze = [{ id: 'u1', nome: 'Mario' }];
      const assenze = [{ id: 'a1', data: '2026-07-01' }];
      const richieste = [{ id: 'r1', stato: 'in_attesa' }];

      // Seal all 3 collections
      await storage.setItemSigillato('cemme_utenze_v2', utenze);
      await storage.setItemSigillato('cemme_assenze_v2', assenze);
      await storage.setItemSigillato('cemme_richieste_v2', richieste);

      // Tamper ONLY with 'cemme_richieste_v2'
      const rawReq = storage.getRaw('cemme_richieste_v2')!;
      storage.manomettiGrezzo('cemme_richieste_v2', rawReq.replace('in_attesa', 'approvata'));

      // 1. Utenze and Assenze must remain intact and valid
      const resUtenze = await storage.getItemVerificato('cemme_utenze_v2');
      const resAssenze = await storage.getItemVerificato('cemme_assenze_v2');
      expect(resUtenze.manomesso).toBe(false);
      expect(resAssenze.manomesso).toBe(false);

      // 2. Richieste must be flagged as tampered
      const resRichieste = await storage.getItemVerificato('cemme_richieste_v2');
      expect(resRichieste.manomesso).toBe(true);
    });
  });

  // =========================================================================
  // TIER 4: REAL-WORLD APPLICATION SCENARIOS
  // =========================================================================
  describe('Tier 4: Adversarial LocalStorage Exploit Simulations', () => {
    it('T4-ATTACK-1: DevTools LocalStorage PTO balance tampering triggers tamper alert and quarantine fallback', async () => {
      // Nominal state setup
      const initialPTO = { utenteId: 'm.rossi', orePermessoRimanenti: 4 };
      await storage.setItemSigillato('cemme_saldo_m.rossi', initialPTO);

      // Attacker attempts exploit: opens DevTools and changes 4 to 80
      const envelope = JSON.parse(storage.getRaw('cemme_saldo_m.rossi')!);
      envelope.d = envelope.d.replace('"orePermessoRimanenti":4', '"orePermessoRimanenti":80');
      storage.manomettiGrezzo('cemme_saldo_m.rossi', JSON.stringify(envelope));

      // Application loads state:
      const verification = await storage.getItemVerificato<{ orePermessoRimanenti: number }>(
        'cemme_saldo_m.rossi'
      );

      // Verify defense: Tamper is detected, forged value 80 is never trusted
      expect(verification.manomesso).toBe(true);
      expect(verification.valore).toBeNull();
    });

    it('T4-ATTACK-2: Session hijacking attempt via active session identity replacement is blocked', async () => {
      // Standard employee session
      const activeSession = {
        identificativo: 'm.rossi',
        ruolo: 'dipendente',
        tokenSessione: '1234567890abcdef1234567890abcdef',
      };
      await storage.setItemSigillato('cemme_sessione_attiva_v2', activeSession);

      // Attacker modifies active session to impersonate 'titolare'
      const envelope = JSON.parse(storage.getRaw('cemme_sessione_attiva_v2')!);
      envelope.d = envelope.d
        .replace('"identificativo":"m.rossi"', '"identificativo":"titolare"')
        .replace('"ruolo":"dipendente"', '"ruolo":"titolare"');
      storage.manomettiGrezzo('cemme_sessione_attiva_v2', JSON.stringify(envelope));

      // Application auth loader:
      const authResult = await storage.getItemVerificato('cemme_sessione_attiva_v2');
      expect(authResult.manomesso).toBe(true);
      expect(authResult.valore).toBeNull(); // Forces clean re-login
    });
  });
});
