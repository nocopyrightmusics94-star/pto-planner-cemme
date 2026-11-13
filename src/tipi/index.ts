/**
 * Tipi di dati ufficiali - Pianificatore Ferie, Permessi e Malattia
 * C. Emme Impianti S.r.l. - Interamente in lingua italiana
 */

export type RuoloUtente = 'titolare' | 'responsabile' | 'dipendente';

export interface Utenza {
  /** Identificativo univoco di accesso (es. "titolare", "m.rossi") */
  identificativo: string;
  /** Nome e cognome completo della persona */
  nomeCompleto: string;
  /** Chiave segreta di accesso / parola d'ordine */
  chiaveAccesso?: string;
  /** Ruolo gerarchico ricoperto in azienda */
  ruolo: RuoloUtente;
  /** Data di registrazione dell'utenza */
  dataCreazione: string;
  /** Mansione o reparto aziendale (es. Tecnico Segnalamento, Amministrazione, Cantiere) */
  reparto?: string;
  /** Numero di telefono di reperibilità per le squadre */
  telefono?: string;
  /** Salt crittografico per PBKDF2 */
  salt?: string;
  /** Hash della password memorizzata (se migrata) */
  chiaveAccessoHash?: string;
}

export type TipoAssenza = 
  | 'ferie_intera'      // Giornata intera di ferie (1 o più giorni)
  | 'permesso_rol'      // Permesso orario (ore libere a scelta)
  | 'malattia'          // Assenza per malattia con protocollo medico
  | 'festivo_nazionale' // Ricorrenza festiva ufficiale da calendario
  | 'chiusura_aziendale'; // Chiusura aziendale collettiva disposta dalla Direzione

export type StatoRichiesta = 'in_attesa' | 'approvata' | 'rifiutata' | 'revocata';

export interface VoceAssenza {
  id: string;
  /** Riferimento alla richiesta originaria */
  richiestaId?: string;
  /** Identificativo dell'utenza a cui appartiene l'assenza */
  utenzaId: string;
  /** Nome e cognome del collaboratore (per visibilità immediata a calendario) */
  nomeUtente?: string;
  /** Data nel formato ISO AAAA-MM-GG */
  data: string;
  /** Tipologia di assenza */
  tipo: TipoAssenza;
  /** Valore numerico (giorni per ferie/malattia, ore per permessi) */
  quantita: number;
  /** Stato approvativo dell'assenza */
  stato: StatoRichiesta;
  /** Numero di protocollo telematico del certificato medico (per malattia) */
  numeroProtocollo?: string;
  /** Note o motivazione opzionale */
  note?: string;
  /** Timestamp di creazione/modifica */
  dataAggiornamento: string;
}

export interface RichiestaFerie {
  id: string;
  /** ID del richiedente */
  utenzaId: string;
  /** Nome e cognome del dipendente */
  nomeRichiedente: string;
  /** Reparto o squadra operativa */
  reparto?: string;
  /** Ruolo ricoperto dal richiedente (dipendente, responsabile o titolare) */
  ruoloRichiedente?: RuoloUtente;
  /** Tipologia dell'assenza richiesta */
  tipo: TipoAssenza;
  /** Data di inizio (AAAA-MM-GG) */
  dataInizio: string;
  /** Data di fine (AAAA-MM-GG) */
  dataFine: string;
  /** Elenco puntuale delle date lavorative incluse nella richiesta */
  dateCoinvolte: string[];
  /** Ore per ciascuna giornata nel caso di permessi (libere a scelta) */
  orePermessoPerGiorno?: number;
  /** Giorni lavorativi complessivi richiesti */
  giorniTotaliLavorativi: number;
  /** Stato corrente della richiesta */
  stato: StatoRichiesta;
  /** Numero di protocollo medico INPS (inseribile anche a posteriori) */
  numeroProtocollo?: string;
  /** Motivazione inserita dal richiedente */
  motivazione?: string;
  /** Data e ora di invio della richiesta */
  dataInvio: string;
  /** Data e ora della decisione */
  dataDecisione?: string;
  /** Eventuale nota all'approvazione o al rifiuto */
  notaTitolare?: string;
  /** Data e ora di eventuale revoca */
  dataRevoca?: string;
  /** Motivazione della revoca da parte del Titolare */
  motivoRevoca?: string;
}

/** Alias unificato per le richieste di assenza / ferie */
export type RichiestaAssenza = RichiestaFerie;

export interface SessioneAttiva {
  identificativo: string;
  ruolo: RuoloUtente;
  tokenSessione: string;
  timestampCreazione: number;
  ultimoAccesso: number;
}

export interface BackupAziendale {
  azienda: 'C. Emme Impianti S.r.l.';
  versione: string;
  dataEsportazione: string;
  sigillo?: string;
  checksum?: string;
  utenze: Utenza[];
  assenze: VoceAssenza[];
  richieste: RichiestaAssenza[];
}

export interface Festivita {
  data: string; // Formato AAAA-MM-GG
  nome: string;
  descrizione?: string;
  nazionale: boolean; // true = festa nazionale italiana, false = patronale Casoria
}

export interface StatisticheAssenze {
  totaleGiorniFerieGodute: number;
  totaleOrePermessiGodute: number;
  totaleGiorniMalattia: number;
  richiesteInAttesa: number;
  richiesteTotaliRegistrate: number;
}

export interface NotificaDipendente {
  id: string;
  destinatarioId: string;
  titolo: string;
  messaggio: string;
  tipo: 'revoca' | 'chiusura_aziendale' | 'informativa';
  dataInvio: string;
  letta: boolean;
  dettagli?: {
    richiestaId?: string;
    periodo?: string;
    motivazioneRevoca?: string;
  };
}

export interface ChiusuraAziendale {
  id: string;
  titolo: string;
  dataInizio: string;
  dataFine: string;
  dateCoinvolte: string[];
  giorniLavorativi: number;
  descrizione?: string;
  dataCreazione: string;
  creataDa?: string;
}
