/**
 * Authoritative Security Reference Oracle & Testing Harness
 * Conforms to PROJECT.md interface contracts, Web Crypto API, and NIST SP 800-63B standards.
 */
import { z } from 'zod';

// ==========================================
// 1. CONSTANTS & DEFAULTS
// ==========================================
export const DEFAULT_ENCRYPTION_SECRET = 'cemme-impianti-super-secret-master-key-2026';
export const DEFAULT_INTEGRITY_SECRET = 'cemme-hmac-sha256-storage-integrity-key-2026';
export const PBKDF2_ITERATIONS = 100000;
export const SESSION_INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// Web Crypto helper for Node / Browser compatibility
const crypto = globalThis.crypto;

// ==========================================
// 2. TIMING SAFE COMPARISON
// ==========================================
export function timingSafeEqual(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

// ==========================================
// 3. PBKDF2-SHA256 PASSWORD HASHING
// ==========================================
export interface HashPasswordResult {
  hash: string;
  salt: string;
  iterazioni: number;
}

export async function generaHashPassword(
  passwordInChiaro: string,
  saltEsistente?: string
): Promise<HashPasswordResult> {
  const enc = new TextEncoder();
  let saltBytes: Uint8Array;

  if (saltEsistente) {
    saltBytes = hexToBytes(saltEsistente);
  } else {
    saltBytes = crypto.getRandomValues(new Uint8Array(16));
  }

  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(passwordInChiaro),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes as unknown as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    256
  );

  const hashHex = bytesToHex(new Uint8Array(derivedBits));
  const saltHex = bytesToHex(saltBytes);

  return {
    hash: hashHex,
    salt: saltHex,
    iterazioni: PBKDF2_ITERATIONS,
  };
}

export async function verificaPassword(
  passwordInChiaro: string,
  hashMemorizzato: string,
  salt: string
): Promise<boolean> {
  if (!passwordInChiaro || !hashMemorizzato || !salt) return false;
  try {
    const ricalcolato = await generaHashPassword(passwordInChiaro, salt);
    return timingSafeEqual(ricalcolato.hash, hashMemorizzato);
  } catch {
    return false;
  }
}

// ==========================================
// 4. AES-GCM 256 ENCRYPTION & DECRYPTION
// ==========================================
export interface PayloadCifrato {
  datiCifrati: string;
  iv: string;
  versione: '1.0';
}

async function derivaChiaveAES(segreto: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(segreto),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function cifraDatoSensibile(
  testoInChiaro: string,
  chiaveSegreta: string = DEFAULT_ENCRYPTION_SECRET
): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const chiave = await derivaChiaveAES(chiaveSegreta, salt);

  const enc = new TextEncoder();
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    chiave,
    enc.encode(testoInChiaro)
  );

  const payload = {
    c: bytesToBase64(new Uint8Array(cipherBuffer)),
    iv: bytesToBase64(iv),
    s: bytesToBase64(salt),
    v: '1.0',
  };

  return JSON.stringify(payload);
}

export async function decifraDatoSensibile(
  testoCifrato: string,
  chiaveSegreta: string = DEFAULT_ENCRYPTION_SECRET
): Promise<string> {
  let parsed: { c: string; iv: string; s: string; v: string };
  try {
    parsed = JSON.parse(testoCifrato);
  } catch {
    throw new Error('Formato cifrato non valido: JSON malformato');
  }

  if (!parsed.c || !parsed.iv || !parsed.s) {
    throw new Error('Struttura envelope AES-GCM incompleta');
  }

  const iv = base64ToBytes(parsed.iv);
  const salt = base64ToBytes(parsed.s);
  const cipherBytes = base64ToBytes(parsed.c);

  const chiave = await derivaChiaveAES(chiaveSegreta, salt);

  try {
    const plainBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as unknown as BufferSource },
      chiave,
      cipherBytes as unknown as BufferSource
    );

    const dec = new TextDecoder();
    return dec.decode(plainBuffer);
  } catch {
    throw new Error('Decifratura fallita: chiave errata o payload manomesso');
  }
}

// ==========================================
// 5. HMAC-SHA256 INTEGRITY SEAL
// ==========================================
function canonicalizeJson(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalizeJson).join(',') + ']';
  }
  const keys = Object.keys(obj as Record<string, unknown>).sort();
  return (
    '{' +
    keys
      .map(
        (k) =>
          JSON.stringify(k) +
          ':' +
          canonicalizeJson((obj as Record<string, unknown>)[k])
      )
      .join(',') +
    '}'
  );
}

async function getHmacKey(segreto: string = DEFAULT_INTEGRITY_SECRET): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    enc.encode(segreto),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function calcolaSigilloIntegrita(
  dati: unknown,
  segreto: string = DEFAULT_INTEGRITY_SECRET
): Promise<string> {
  const jsonCanonical = canonicalizeJson(dati);
  const enc = new TextEncoder();
  const key = await getHmacKey(segreto);

  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(jsonCanonical));
  return bytesToHex(new Uint8Array(sig));
}

export async function verificaSigilloIntegrita(
  dati: unknown,
  sigillo: string,
  segreto: string = DEFAULT_INTEGRITY_SECRET
): Promise<boolean> {
  if (!sigillo || typeof sigillo !== 'string' || sigillo.length !== 64) {
    return false;
  }
  try {
    const calcolato = await calcolaSigilloIntegrita(dati, segreto);
    return timingSafeEqual(calcolato.toLowerCase(), sigillo.toLowerCase());
  } catch {
    return false;
  }
}

// ==========================================
// 6. ZOD RUNTIME SCHEMAS
// ==========================================
const FormatoDataISO = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato data non valido, atteso YYYY-MM-DD');

const RuoloSchema = z.enum(['titolare', 'responsabile', 'dipendente'], {
  errorMap: () => ({ message: 'Ruolo utente non autorizzato' }),
});

const TipoAssenzaSchema = z.enum([
  'ferie_intera',
  'permesso_rol',
  'malattia',
  'festivo_nazionale',
]);

const StatoRichiestaSchema = z.enum(['in_attesa', 'approvata', 'rifiutata']);

export const UtenzaSchema = z
  .object({
    identificativo: z
      .string()
      .min(2, 'ID utente minimo 2 caratteri')
      .max(50, 'ID utente massimo 50 caratteri')
      .regex(/^[a-z0-9._-]+$/, 'ID utente deve contenere solo lettere minuscole, numeri, punti o trattini'),
    nomeCompleto: z.string().min(2, 'Nome minimo 2 caratteri').max(100, 'Nome massimo 100 caratteri'),
    chiaveAccessoHash: z.string().length(64, 'Digest password deve essere di 64 caratteri esadecimali'),
    salt: z.string().length(32, 'Salt deve essere di 32 caratteri esadecimali (16 bytes)'),
    ruolo: RuoloSchema,
    dataCreazione: z.string().datetime({ message: 'Timestamp di creazione ISO 8601 richiesto' }),
    reparto: z.string().max(100).optional(),
    telefono: z.string().max(30).optional(),
  })
  .strict();

export type UtenzaValidata = z.infer<typeof UtenzaSchema>;

export const VoceAssenzaSchema = z
  .object({
    id: z.string().min(3).max(100),
    richiestaId: z.string().optional(),
    utenzaId: z.string().min(2).max(50),
    data: FormatoDataISO,
    tipo: TipoAssenzaSchema,
    quantita: z.number().positive().max(24, 'Quantità ore/giorni eccedente limite massimo'),
    stato: StatoRichiestaSchema,
    numeroProtocollo: z.string().max(500).optional(),
    note: z.string().max(500).optional(),
    dataAggiornamento: z.string().datetime(),
  })
  .strict();

export type VoceAssenzaValidata = z.infer<typeof VoceAssenzaSchema>;

export const RichiestaAssenzaSchema = z
  .object({
    id: z.string().min(3).max(100),
    utenzaId: z.string().min(2).max(50),
    nomeRichiedente: z.string().min(2).max(100),
    reparto: z.string().max(100).optional(),
    ruoloRichiedente: RuoloSchema.optional(),
    tipo: TipoAssenzaSchema,
    dataInizio: FormatoDataISO,
    dataFine: FormatoDataISO,
    dateCoinvolte: z.array(FormatoDataISO).min(1).max(366),
    orePermessoPerGiorno: z.number().positive().max(24).optional(),
    giorniTotaliLavorativi: z.number().int().nonnegative().max(366),
    stato: StatoRichiestaSchema,
    numeroProtocollo: z.string().max(500).optional(),
    motivazione: z.string().max(1000).optional(),
    dataInvio: z.string().datetime(),
    dataDecisione: z.string().datetime().optional(),
    notaTitolare: z.string().max(500).optional(),
  })
  .strict();

export type RichiestaAssenzaValidata = z.infer<typeof RichiestaAssenzaSchema>;

export const BackupAziendaleSchema = z
  .object({
    azienda: z.literal('C. Emme Impianti S.r.l.'),
    versione: z.string().min(1).max(20),
    dataEsportazione: z.string().datetime(),
    sigillo: z.string().length(64),
    utenze: z.array(UtenzaSchema),
    assenze: z.array(VoceAssenzaSchema),
    richieste: z.array(RichiestaAssenzaSchema),
  })
  .strict();

export type BackupAziendaleValidato = z.infer<typeof BackupAziendaleSchema>;

export const SessioneAttivaSchema = z
  .object({
    identificativo: z.string().min(2),
    ruolo: RuoloSchema,
    tokenSessione: z.string().min(32),
    timestampCreazione: z.number().positive(),
    ultimoAccesso: z.number().positive(),
  })
  .strict();

export type SessioneAttiva = z.infer<typeof SessioneAttivaSchema>;

// ==========================================
// 7. SESSION SECURITY & RBAC ENFORCEMENT
// ==========================================
export function generaTokenSessione(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return bytesToHex(bytes);
}

export function validaSessione(
  sessione: SessioneAttiva | null | undefined,
  nowTimestamp: number = Date.now(),
  timeoutMs: number = SESSION_INACTIVITY_TIMEOUT_MS
): { valida: boolean; motivo?: string } {
  if (!sessione) {
    return { valida: false, motivo: 'Nessuna sessione attiva' };
  }
  const result = SessioneAttivaSchema.safeParse(sessione);
  if (!result.success) {
    return { valida: false, motivo: 'Struttura sessione non valida' };
  }

  if (nowTimestamp < sessione.timestampCreazione) {
    return { valida: false, motivo: 'Timestamp sessione nel futuro (orologio di sistema anomalo)' };
  }

  const tempoInattivita = nowTimestamp - sessione.ultimoAccesso;
  if (tempoInattivita > timeoutMs) {
    return { valida: false, motivo: 'Sessione scaduta per inattività' };
  }

  return { valida: true };
}

export type OperazioneAziendale =
  | 'approva_richiesta'
  | 'rifiuta_richiesta'
  | 'esporta_backup'
  | 'ripristina_backup'
  | 'crea_utente'
  | 'elimina_utente'
  | 'visualizza_dettagli_sanitari'
  | 'invia_propria_richiesta'
  | 'annulla_propria_richiesta';

export function verificaPermessoOperazione(
  ruolo: 'titolare' | 'responsabile' | 'dipendente',
  operazione: OperazioneAziendale,
  proprietarioRisorsaId?: string,
  utenteRichiedenteId?: string
): boolean {
  switch (operazione) {
    case 'approva_richiesta':
    case 'rifiuta_richiesta':
    case 'esporta_backup':
    case 'ripristina_backup':
    case 'crea_utente':
    case 'elimina_utente':
      return ruolo === 'titolare';

    case 'visualizza_dettagli_sanitari':
      if (ruolo === 'titolare' || ruolo === 'responsabile') return true;
      return (
        Boolean(proprietarioRisorsaId) &&
        Boolean(utenteRichiedenteId) &&
        proprietarioRisorsaId === utenteRichiedenteId
      );

    case 'invia_propria_richiesta':
      return (
        Boolean(proprietarioRisorsaId) &&
        Boolean(utenteRichiedenteId) &&
        proprietarioRisorsaId === utenteRichiedenteId
      );

    case 'annulla_propria_richiesta':
      if (ruolo === 'titolare') return true;
      return (
        Boolean(proprietarioRisorsaId) &&
        Boolean(utenteRichiedenteId) &&
        proprietarioRisorsaId === utenteRichiedenteId
      );

    default:
      return false;
  }
}

// ==========================================
// 8. BRUTE FORCE PROTECTION ENGINE
// ==========================================
export class GestoreRateLimiting {
  private tentativiFalliti = new Map<string, { tentativi: number; bloccatoFinoA: number }>();

  public registraTentativo(chiaveIdentificativa: string, successo: boolean, now: number = Date.now()): {
    bloccato: boolean;
    tentativiRimanenti: number;
    secondiSblocco?: number;
  } {
    const stato = this.tentativiFalliti.get(chiaveIdentificativa) || {
      tentativi: 0,
      bloccatoFinoA: 0,
    };

    if (stato.bloccatoFinoA > now) {
      const secondi = Math.ceil((stato.bloccatoFinoA - now) / 1000);
      return { bloccato: true, tentativiRimanenti: 0, secondiSblocco: secondi };
    }

    if (successo) {
      this.tentativiFalliti.delete(chiaveIdentificativa);
      return { bloccato: false, tentativiRimanenti: MAX_LOGIN_ATTEMPTS };
    }

    stato.tentativi += 1;
    if (stato.tentativi >= MAX_LOGIN_ATTEMPTS) {
      stato.bloccatoFinoA = now + LOCKOUT_DURATION_MS;
      this.tentativiFalliti.set(chiaveIdentificativa, stato);
      return {
        bloccato: true,
        tentativiRimanenti: 0,
        secondiSblocco: Math.ceil(LOCKOUT_DURATION_MS / 1000),
      };
    }

    this.tentativiFalliti.set(chiaveIdentificativa, stato);
    return {
      bloccato: false,
      tentativiRimanenti: MAX_LOGIN_ATTEMPTS - stato.tentativi,
    };
  }

  public resetta(chiaveIdentificativa: string): void {
    this.tentativiFalliti.delete(chiaveIdentificativa);
  }
}

// ==========================================
// 9. LOCALSTORAGE INTEGRITY WRAPPER SIMULATOR
// ==========================================
export class StorageIntegritaSimulator {
  private memoria = new Map<string, string>();
  private secret: string;

  constructor(secret: string = DEFAULT_INTEGRITY_SECRET) {
    this.secret = secret;
  }

  public async setItemSigillato(chiave: string, valore: unknown): Promise<void> {
    const json = JSON.stringify(valore);
    const sigillo = await calcolaSigilloIntegrita(valore, this.secret);
    const busta = JSON.stringify({ d: json, s: sigillo });
    this.memoria.set(chiave, busta);
  }

  public async getItemVerificato<T = unknown>(chiave: string): Promise<{
    valore: T | null;
    manomesso: boolean;
  }> {
    const bustaRaw = this.memoria.get(chiave);
    if (!bustaRaw) return { valore: null, manomesso: false };

    let busta: { d: string; s: string };
    try {
      busta = JSON.parse(bustaRaw);
    } catch {
      return { valore: null, manomesso: true };
    }

    if (!busta.d || !busta.s) {
      return { valore: null, manomesso: true };
    }

    let dati: unknown;
    try {
      dati = JSON.parse(busta.d);
    } catch {
      return { valore: null, manomesso: true };
    }

    const valido = await verificaSigilloIntegrita(dati, busta.s, this.secret);
    if (!valido) {
      return { valore: null, manomesso: true };
    }

    return { valore: dati as T, manomesso: false };
  }

  // Simulation method for direct tampering by attacker
  public manomettiGrezzo(chiave: string, stringaManomessa: string): void {
    this.memoria.set(chiave, stringaManomessa);
  }

  public getRaw(chiave: string): string | undefined {
    return this.memoria.get(chiave);
  }
}

// ==========================================
// 10. UTILITY BYTE/HEX/BASE64 CONVERTERS
// ==========================================
export function bytesToHex(bytes: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

export function hexToBytes(hex: string): Uint8Array {
  const cleanHex = hex.trim();
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substring(i, i + 2), 16);
  }
  return bytes;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return Buffer.from(binary, 'binary').toString('base64');
}

export function base64ToBytes(base64: string): Uint8Array {
  const binary = Buffer.from(base64, 'base64').toString('binary');
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
