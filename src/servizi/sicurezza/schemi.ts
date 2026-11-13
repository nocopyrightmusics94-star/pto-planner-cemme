/**
 * Schemi di Validazione Runtime Rigorosa con Zod
 * C. Emme Impianti S.r.l. - Cybersecurity & Runtime Integrity
 * 
 * Protezione contro deserializzazione insicura (CWE-502), injection di payload,
 * prototype pollution, alterazione dei ruoli e overflow dei campi nello storage.
 */

import { z } from 'zod';
import {
  Utenza,
  VoceAssenza,
  RichiestaAssenza,
  BackupAziendale,
  SessioneAttiva,
  RuoloUtente,
  TipoAssenza,
  StatoRichiesta,
} from '@/tipi';
import { bytesToHex } from './hashing';

export const FormatoDataISO = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato data non valido, atteso YYYY-MM-DD');

export const RuoloUtenteSchema: z.ZodType<RuoloUtente> = z.enum(
  ['titolare', 'responsabile', 'dipendente'],
  { message: 'Ruolo utente non autorizzato' }
);

export const RuoloSchema = RuoloUtenteSchema;

export const TipoAssenzaSchema: z.ZodType<TipoAssenza> = z.enum([
  'ferie_intera',
  'permesso_rol',
  'malattia',
  'festivo_nazionale',
  'chiusura_aziendale',
]);

export const StatoRichiestaSchema: z.ZodType<StatoRichiesta> = z.enum([
  'in_attesa',
  'approvata',
  'rifiutata',
  'revocata',
]);

/**
 * Schema runtime rigoroso per la validazione di un account Utenza.
 * Protegge con .strict() contro injection e prototype pollution.
 */
export const UtenzaSchema: z.ZodType<Utenza> = z
  .object({
    identificativo: z
      .string()
      .min(1, 'ID utente minimo 1 carattere')
      .max(50, 'ID utente massimo 50 caratteri')
      .regex(/^[a-zA-Z0-9._-]+$/, 'ID utente deve contenere solo caratteri validi (lettere minuscole o maiuscole, numeri, punti o trattini)'),
    nomeCompleto: z.string().min(1, 'Nome minimo 1 carattere').max(100, 'Nome massimo 100 caratteri'),
    chiaveAccesso: z.string().min(1).optional(),
    chiaveAccessoHash: z.string().length(64, 'Digest password deve essere di 64 caratteri esadecimali').optional(),
    salt: z.string().length(32, 'Salt deve essere di 32 caratteri esadecimali').optional(),
    ruolo: RuoloUtenteSchema,
    dataCreazione: z.string().min(1, 'Timestamp di creazione richiesto'),
    reparto: z.string().max(100).optional(),
    telefono: z.string().max(30).optional(),
  })
  .strict();

export type UtenzaValidata = z.infer<typeof UtenzaSchema>;

/**
 * Schema runtime rigoroso per la validazione di una Voce di Assenza nel calendario.
 */
export const VoceAssenzaSchema: z.ZodType<VoceAssenza> = z
  .object({
    id: z.string().min(1).max(100),
    richiestaId: z.string().max(100).optional(),
    utenzaId: z.string().min(1).max(50),
    nomeUtente: z.string().optional(),
    data: FormatoDataISO,
    tipo: TipoAssenzaSchema,
    quantita: z.number().positive().max(24, 'Quantità ore/giorni eccedente limite massimo'),
    stato: StatoRichiestaSchema,
    numeroProtocollo: z.string().max(500).optional(),
    note: z.string().max(1000).optional(),
    dataAggiornamento: z.string().min(1),
  })
  .strict();

export type VoceAssenzaValidata = z.infer<typeof VoceAssenzaSchema>;

/**
 * Schema runtime rigoroso per la validazione di una Richiesta di Assenza / Ferie.
 */
export const RichiestaAssenzaSchema: z.ZodType<RichiestaAssenza> = z
  .object({
    id: z.string().min(1).max(100),
    utenzaId: z.string().min(1).max(50),
    nomeRichiedente: z.string().min(1).max(100),
    reparto: z.string().max(100).optional(),
    ruoloRichiedente: RuoloUtenteSchema.optional(),
    tipo: TipoAssenzaSchema,
    dataInizio: FormatoDataISO,
    dataFine: FormatoDataISO,
    dateCoinvolte: z.array(FormatoDataISO).min(1).max(366),
    orePermessoPerGiorno: z.number().positive().max(24).optional(),
    giorniTotaliLavorativi: z.number().int().nonnegative().max(366),
    stato: StatoRichiestaSchema,
    numeroProtocollo: z.string().max(500).optional(),
    motivazione: z.string().max(2000).optional(),
    dataInvio: z.string().min(1),
    dataDecisione: z.string().optional(),
    notaTitolare: z.string().max(1000).optional(),
    dataRevoca: z.string().optional(),
    motivoRevoca: z.string().optional(),
  })
  .strict();

export type RichiestaAssenzaValidata = z.infer<typeof RichiestaAssenzaSchema>;

/**
 * Schema runtime rigoroso per la validazione del file di Backup Aziendale.
 */
export const BackupAziendaleSchema: z.ZodType<BackupAziendale> = z
  .object({
    azienda: z.literal('C. Emme Impianti S.r.l.'),
    versione: z.string().min(1).max(20),
    dataEsportazione: z.string().min(1),
    sigillo: z.string().length(64).optional(),
    checksum: z.string().max(128).optional(),
    utenze: z.array(UtenzaSchema),
    assenze: z.array(VoceAssenzaSchema),
    richieste: z.array(RichiestaAssenzaSchema),
  })
  .strict();

export type BackupAziendaleValidato = z.infer<typeof BackupAziendaleSchema>;

/**
 * Schema runtime per la validazione della Sessione Attiva hardened.
 */
export const SessioneAttivaSchema: z.ZodType<SessioneAttiva> = z
  .object({
    identificativo: z.string().min(1),
    ruolo: RuoloUtenteSchema,
    tokenSessione: z.string().min(16),
    timestampCreazione: z.number().positive(),
    ultimoAccesso: z.number().positive(),
  })
  .strict();

export const SESSION_INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minuti
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minuti

/**
 * Genera un token crittografico di sessione a 256 bit casuale
 */
export function generaTokenSessione(): string {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(32));
  return bytesToHex(bytes);
}

/**
 * Valida la conformità temporale e strutturale di una sessione attiva
 */
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

  if (sessione.ultimoAccesso > nowTimestamp || sessione.ultimoAccesso < sessione.timestampCreazione) {
    return { valida: false, motivo: 'Timestamp sessione nel futuro o anomalo' };
  }

  const tempoInattivita = nowTimestamp - sessione.ultimoAccesso;
  if (tempoInattivita > timeoutMs) {
    return { valida: false, motivo: 'Sessione scaduta per inattività' };
  }

  return { valida: true };
}

/**
 * Funzione di utilità per validare e sanificare i dati di backup JSON
 */
export function validaBackupAziendaleSicuro(jsonString: string): {
  successo: boolean;
  dati?: BackupAziendale;
  errore?: string;
} {
  try {
    const raw = JSON.parse(jsonString);
    const validato = BackupAziendaleSchema.parse(raw);
    return { successo: true, dati: validato };
  } catch (err) {
    if (err instanceof z.ZodError) {
      const dettaglio = err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
      return { successo: false, errore: `Violazione schema di sicurezza backup: ${dettaglio}` };
    }
    return { successo: false, errore: 'File JSON di backup non valido o non analizzabile.' };
  }
}
