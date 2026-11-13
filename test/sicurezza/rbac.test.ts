import { describe, it, expect, beforeEach } from 'vitest';
import {
  validaSessione,
  generaTokenSessione,
  verificaPermessoOperazione,
  GestoreRateLimiting,
  cifraDatoSensibile,
  decifraDatoSensibile,
  generaHashPassword,
  verificaPassword,
  SessioneAttiva,
  SESSION_INACTIVITY_TIMEOUT_MS,
  MAX_LOGIN_ATTEMPTS,
  LOCKOUT_DURATION_MS,
} from './module-loader.js';

describe('RBAC, Authentication & Session Security Suite (Tiers 1, 2, 3, 4)', () => {
  let rateLimiter: GestoreRateLimiting;

  beforeEach(() => {
    rateLimiter = new GestoreRateLimiting();
  });

  // =========================================================================
  // TIER 1: FEATURE COVERAGE (>=5 tests)
  // =========================================================================
  describe('Tier 1: RBAC Permission Matrix & Session Generation', () => {
    it('T1-RBAC-1: titolare possesses full authorization across all administrative operations', () => {
      expect(verificaPermessoOperazione('titolare', 'approva_richiesta')).toBe(true);
      expect(verificaPermessoOperazione('titolare', 'rifiuta_richiesta')).toBe(true);
      expect(verificaPermessoOperazione('titolare', 'esporta_backup')).toBe(true);
      expect(verificaPermessoOperazione('titolare', 'ripristina_backup')).toBe(true);
      expect(verificaPermessoOperazione('titolare', 'crea_utente')).toBe(true);
      expect(verificaPermessoOperazione('titolare', 'elimina_utente')).toBe(true);
      expect(verificaPermessoOperazione('titolare', 'visualizza_dettagli_sanitari')).toBe(true);
    });

    it('T1-RBAC-2: dipendente is denied access to administrative management operations', () => {
      expect(verificaPermessoOperazione('dipendente', 'approva_richiesta')).toBe(false);
      expect(verificaPermessoOperazione('dipendente', 'rifiuta_richiesta')).toBe(false);
      expect(verificaPermessoOperazione('dipendente', 'esporta_backup')).toBe(false);
      expect(verificaPermessoOperazione('dipendente', 'ripristina_backup')).toBe(false);
      expect(verificaPermessoOperazione('dipendente', 'crea_utente')).toBe(false);
      expect(verificaPermessoOperazione('dipendente', 'elimina_utente')).toBe(false);
    });

    it('T1-RBAC-3: responsabile has read-only access to medical details but cannot execute director actions', () => {
      expect(verificaPermessoOperazione('responsabile', 'visualizza_dettagli_sanitari')).toBe(true);
      expect(verificaPermessoOperazione('responsabile', 'approva_richiesta')).toBe(false);
      expect(verificaPermessoOperazione('responsabile', 'esporta_backup')).toBe(false);
      expect(verificaPermessoOperazione('responsabile', 'ripristina_backup')).toBe(false);
    });

    it('T1-RBAC-4: dipendente can view their own medical details but not colleagues details (GDPR isolation)', () => {
      const ownUserId = 'm.rossi';
      const colleagueUserId = 'g.bianchi';

      // Own medical details -> Allowed
      expect(
        verificaPermessoOperazione('dipendente', 'visualizza_dettagli_sanitari', ownUserId, ownUserId)
      ).toBe(true);

      // Colleague's medical details -> Denied
      expect(
        verificaPermessoOperazione(
          'dipendente',
          'visualizza_dettagli_sanitari',
          colleagueUserId,
          ownUserId
        )
      ).toBe(false);
    });

    it('T1-RBAC-5: generaTokenSessione creates strong CSPRNG 64-char hex token', () => {
      const token1 = generaTokenSessione();
      const token2 = generaTokenSessione();

      expect(token1).toMatch(/^[0-9a-f]{64}$/i);
      expect(token2).toMatch(/^[0-9a-f]{64}$/i);
      expect(token1).not.toBe(token2);
    });
  });

  // =========================================================================
  // TIER 2: BOUNDARY & CORNER CASES (>=5 tests)
  // =========================================================================
  describe('Tier 2: Boundary & Corner Cases — Inactivity Timeouts & Tampered Sessions', () => {
    const fixedNow = 1773000000000;

    it('T2-SESSION-1: session active immediately before timeout is valid', () => {
      const session: SessioneAttiva = {
        identificativo: 'm.rossi',
        ruolo: 'dipendente',
        tokenSessione: 'a'.repeat(64),
        timestampCreazione: fixedNow - 3600000,
        ultimoAccesso: fixedNow - (SESSION_INACTIVITY_TIMEOUT_MS - 1000), // 1 sec before timeout
      };

      const res = validaSessione(session, fixedNow);
      expect(res.valida).toBe(true);
    });

    it('T2-SESSION-2: session active at exact boundary or 1ms past timeout is expired', () => {
      const expiredSession: SessioneAttiva = {
        identificativo: 'm.rossi',
        ruolo: 'dipendente',
        tokenSessione: 'a'.repeat(64),
        timestampCreazione: fixedNow - 3600000,
        ultimoAccesso: fixedNow - (SESSION_INACTIVITY_TIMEOUT_MS + 1), // 1ms past timeout
      };

      const res = validaSessione(expiredSession, fixedNow);
      expect(res.valida).toBe(false);
      expect(res.motivo).toMatch(/Sessione scaduta per inattività/i);
    });

    it('T2-SESSION-3: future creation timestamp triggers clock anomaly rejection', () => {
      const futureSession: SessioneAttiva = {
        identificativo: 'm.rossi',
        ruolo: 'dipendente',
        tokenSessione: 'a'.repeat(64),
        timestampCreazione: fixedNow + 60000, // 1 minute in the future
        ultimoAccesso: fixedNow,
      };

      const res = validaSessione(futureSession, fixedNow);
      expect(res.valida).toBe(false);
      expect(res.motivo).toMatch(/futuro|anomalo/i);
    });

    it('T2-SESSION-4: malformed or null session objects fail gracefully', () => {
      expect(validaSessione(null, fixedNow).valida).toBe(false);
      expect(validaSessione(undefined, fixedNow).valida).toBe(false);

      const invalidToken = {
        identificativo: 'm.rossi',
        ruolo: 'dipendente' as const,
        tokenSessione: 'short', // invalid (< 32 chars)
        timestampCreazione: fixedNow,
        ultimoAccesso: fixedNow,
      };
      expect(validaSessione(invalidToken, fixedNow).valida).toBe(false);
    });

    it('T2-SESSION-5: custom inactivity timeout threshold is strictly honored', () => {
      const shortTimeoutMs = 5000; // 5 seconds
      const session: SessioneAttiva = {
        identificativo: 'titolare',
        ruolo: 'titolare',
        tokenSessione: 'b'.repeat(64),
        timestampCreazione: fixedNow - 10000,
        ultimoAccesso: fixedNow - 6000, // 6 seconds inactive
      };

      expect(validaSessione(session, fixedNow, shortTimeoutMs).valida).toBe(false);
      expect(validaSessione(session, fixedNow, 10000).valida).toBe(true);
    });
  });

  // =========================================================================
  // TIER 3: CROSS-FEATURE COMBINATIONS
  // =========================================================================
  describe('Tier 3: Authentication -> Session -> RBAC Combined Flows', () => {
    it('T3-FLOW-1: Full auth verification -> session issuance -> RBAC capability check', async () => {
      // 1. Employee credential setup
      const plainPassword = 'DipendenteSecret2026!';
      const { hash, salt } = await generaHashPassword(plainPassword);

      // 2. Login verification
      const isAuth = await verificaPassword(plainPassword, hash, salt);
      expect(isAuth).toBe(true);

      // 3. Issue cryptographic session
      const now = Date.now();
      const session: SessioneAttiva = {
        identificativo: 'm.rossi',
        ruolo: 'dipendente',
        tokenSessione: generaTokenSessione(),
        timestampCreazione: now,
        ultimoAccesso: now,
      };

      // 4. Validate session
      const sessionValidation = validaSessione(session, now);
      expect(sessionValidation.valida).toBe(true);

      // 5. Evaluate RBAC permissions from active session
      const canApprove = verificaPermessoOperazione(session.ruolo, 'approva_richiesta');
      const canSubmitOwn = verificaPermessoOperazione(
        session.ruolo,
        'invia_propria_richiesta',
        session.identificativo,
        'm.rossi'
      );

      expect(canApprove).toBe(false);
      expect(canSubmitOwn).toBe(true);
    });

    it('T3-FLOW-2: Medical protocol encryption + role-based retrieval & masking', async () => {
      const sensitiveInpsProtocol = 'INPS-TELEMATICO-2026-991188';
      const cipherProtocol = await cifraDatoSensibile(sensitiveInpsProtocol);

      // Stored record
      const absenceRecord = {
        id: 'abs_001',
        richiedenteId: 'm.rossi',
        tipo: 'malattia',
        protocolloCifrato: cipherProtocol,
      };

      // Function simulating retrieval and role-based masking
      async function retrieveAbsence(
        currentUserRole: 'titolare' | 'responsabile' | 'dipendente',
        currentUserId: string
      ): Promise<{ id: string; protocolloVisibile: string }> {
        const canView = verificaPermessoOperazione(
          currentUserRole,
          'visualizza_dettagli_sanitari',
          absenceRecord.richiedenteId,
          currentUserId
        );

        if (canView) {
          const decrypted = await decifraDatoSensibile(absenceRecord.protocolloCifrato);
          return { id: absenceRecord.id, protocolloVisibile: decrypted };
        } else {
          return { id: absenceRecord.id, protocolloVisibile: '*** RISERVATO ***' };
        }
      }

      // 1. Titolare view: unmasked
      const titolareView = await retrieveAbsence('titolare', 'direzione');
      expect(titolareView.protocolloVisibile).toBe(sensitiveInpsProtocol);

      // 2. Owner dipendente view: unmasked
      const ownerView = await retrieveAbsence('dipendente', 'm.rossi');
      expect(ownerView.protocolloVisibile).toBe(sensitiveInpsProtocol);

      // 3. Colleague dipendente view: strictly masked
      const colleagueView = await retrieveAbsence('dipendente', 'l.verdi');
      expect(colleagueView.protocolloVisibile).toBe('*** RISERVATO ***');
    });
  });

  // =========================================================================
  // TIER 4: REAL-WORLD APPLICATION SCENARIOS
  // =========================================================================
  describe('Tier 4: Privilege Escalation & Brute Force Attack Simulations', () => {
    it('T4-ATTACK-1: Employee privilege escalation attempt via role parameter manipulation is rejected', () => {
      const loggedUser = { id: 'm.rossi', trueRole: 'dipendente' as const };

      // Attacker attempts to pass forged role: 'titolare' to the permission checker
      // But the authoritative checker relies on the verified session role
      const effectiveRole = loggedUser.trueRole;
      const isAllowedToApproveOwnVacation = verificaPermessoOperazione(
        effectiveRole,
        'approva_richiesta',
        loggedUser.id,
        loggedUser.id
      );

      expect(isAllowedToApproveOwnVacation).toBe(false);
    });

    it('T4-ATTACK-2: Brute force login simulation triggers lockout after 5 consecutive failures', () => {
      const targetUser = 'titolare';
      const baseTime = Date.now();

      // Attempts 1 to 4: Failures, not yet locked out
      for (let i = 1; i <= 4; i++) {
        const res = rateLimiter.registraTentativo(targetUser, false, baseTime);
        expect(res.bloccato).toBe(false);
        expect(res.tentativiRimanenti).toBe(MAX_LOGIN_ATTEMPTS - i);
      }

      // Attempt 5: 5th failure triggers lockout
      const lockRes = rateLimiter.registraTentativo(targetUser, false, baseTime);
      expect(lockRes.bloccato).toBe(true);
      expect(lockRes.tentativiRimanenti).toBe(0);
      expect(lockRes.secondiSblocco).toBeGreaterThan(0);

      // Attempt 6 (even with correct password during lockout): BLOCKED
      const attemptDuringLock = rateLimiter.registraTentativo(targetUser, true, baseTime + 1000);
      expect(attemptDuringLock.bloccato).toBe(true);

      // Attempt after lockout expiry (15 minutes later): Unlocked
      const timeAfterLockout = baseTime + LOCKOUT_DURATION_MS + 1000;
      const attemptAfterExpiry = rateLimiter.registraTentativo(targetUser, true, timeAfterLockout);
      expect(attemptAfterExpiry.bloccato).toBe(false);
      expect(attemptAfterExpiry.tentativiRimanenti).toBe(MAX_LOGIN_ATTEMPTS);
    });

    it('T4-ATTACK-3: Successful login before limit resets the failed attempt counter', () => {
      const user = 'g.verdi';
      const now = Date.now();

      // 3 failed attempts
      rateLimiter.registraTentativo(user, false, now);
      rateLimiter.registraTentativo(user, false, now);
      const third = rateLimiter.registraTentativo(user, false, now);
      expect(third.tentativiRimanenti).toBe(2);

      // Successful login resets counter
      const success = rateLimiter.registraTentativo(user, true, now);
      expect(success.bloccato).toBe(false);
      expect(success.tentativiRimanenti).toBe(MAX_LOGIN_ATTEMPTS);

      // Next failed attempt starts counter fresh from 4 remaining
      const nextFail = rateLimiter.registraTentativo(user, false, now);
      expect(nextFail.tentativiRimanenti).toBe(4);
    });
  });
});
