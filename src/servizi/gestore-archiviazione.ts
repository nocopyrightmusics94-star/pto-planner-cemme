/**
 * Gestore dell'Archiviazione Dati, Utenze, Richieste e Certificati di Malattia
 * C. Emme Impianti S.r.l.
 * 
 * 100% in lingua italiana - Persistenza locale permanente
 */

import { Utenza, VoceAssenza, RichiestaFerie, NotificaDipendente, ChiusuraAziendale } from '@/tipi';

const CHIAVE_UTENZE = 'cemme_utenze_v2';
const CHIAVE_ASSENZE = 'cemme_assenze_v2';
const CHIAVE_RICHIESTE = 'cemme_richieste_v2';
const CHIAVE_UTENZA_CORRENTE = 'cemme_sessione_attiva_v2';
const CHIAVE_NOTIFICHE = 'cemme_notifiche_v1';
const CHIAVE_CHIUSURE = 'cemme_chiusure_v1';

/**
 * Utenza predefinita iniziale di fabbrica: TITOLARE
 */
export const UTENZA_TITOLARE_INIZIALE: Utenza = {
  identificativo: 'titolare',
  nomeCompleto: 'Direzione Generale — C. Emme Impianti S.r.l.',
  chiaveAccesso: 'cemme2026',
  ruolo: 'titolare',
  dataCreazione: new Date().toISOString(),
  reparto: 'Direzione & Coordinamento Lavori',
  telefono: '+39 081 3446736',
};

/**
 * Inizializza l'archivio garantendo la presenza dell'utenza titolare
 */
export function inizializzaArchivio(): void {
  try {
    const rawUtenze = localStorage.getItem(CHIAVE_UTENZE);
    if (!rawUtenze) {
      // Migrazione o prima inizializzazione
      const v1Utenze = localStorage.getItem('cemme_utenze_v1');
      if (v1Utenze) {
        try {
          const parsed = JSON.parse(v1Utenze);
          localStorage.setItem(CHIAVE_UTENZE, JSON.stringify(parsed));
        } catch {
          localStorage.setItem(CHIAVE_UTENZE, JSON.stringify([UTENZA_TITOLARE_INIZIALE]));
        }
      } else {
        localStorage.setItem(CHIAVE_UTENZE, JSON.stringify([UTENZA_TITOLARE_INIZIALE]));
      }
    } else {
      const elenco: Utenza[] = JSON.parse(rawUtenze);
      const titolareIdx = elenco.findIndex((u) => u.identificativo === 'titolare');
      if (titolareIdx === -1) {
        elenco.unshift(UTENZA_TITOLARE_INIZIALE);
      } else {
        // Assicura la password aggiornata 'cemme2026' per il titolare
        if (elenco[titolareIdx].chiaveAccesso === 'cemme2025') {
          elenco[titolareIdx].chiaveAccesso = 'cemme2026';
        }
      }
      localStorage.setItem(CHIAVE_UTENZE, JSON.stringify(elenco));
    }

    if (!localStorage.getItem(CHIAVE_ASSENZE)) {
      const v1Assenze = localStorage.getItem('cemme_assenze_v1');
      if (v1Assenze) localStorage.setItem(CHIAVE_ASSENZE, v1Assenze);
      else localStorage.setItem(CHIAVE_ASSENZE, JSON.stringify([]));
    }

    if (!localStorage.getItem(CHIAVE_RICHIESTE)) {
      const v1Richieste = localStorage.getItem('cemme_richieste_v1');
      if (v1Richieste) localStorage.setItem(CHIAVE_RICHIESTE, v1Richieste);
      else localStorage.setItem(CHIAVE_RICHIESTE, JSON.stringify([]));
    }
  } catch (errore) {
    console.error('Errore durante l’inizializzazione dell’archivio:', errore);
  }
}

/**
 * Recupera tutte le utenze registrate
 */
export function ottieniTutteUtenze(): Utenza[] {
  try {
    const raw = localStorage.getItem(CHIAVE_UTENZE);
    if (!raw) return [UTENZA_TITOLARE_INIZIALE];
    return JSON.parse(raw);
  } catch {
    return [UTENZA_TITOLARE_INIZIALE];
  }
}

/**
 * Aggiunge una nuova utenza senza alcun vincolo di giorni o ROL
 */
export function aggiungiNuovaUtenza(nuovaUtenza: Omit<Utenza, 'dataCreazione'>): { successo: boolean; messaggio: string } {
  const elenco = ottieniTutteUtenze();
  const idNormalizzato = nuovaUtenza.identificativo.trim().toLowerCase();

  if (!idNormalizzato) {
    return { successo: false, messaggio: "L'identificativo utente non può essere vuoto." };
  }

  if (elenco.some((u) => u.identificativo.toLowerCase() === idNormalizzato)) {
    return { successo: false, messaggio: `L'utenza con identificativo "${idNormalizzato}" è già registrata.` };
  }

  if (!nuovaUtenza.chiaveAccesso || nuovaUtenza.chiaveAccesso.length < 4) {
    return { successo: false, messaggio: "La chiave d'accesso deve contenere almeno 4 caratteri." };
  }

  const utenzaCompleta: Utenza = {
    identificativo: idNormalizzato,
    nomeCompleto: nuovaUtenza.nomeCompleto.trim(),
    chiaveAccesso: nuovaUtenza.chiaveAccesso.trim(),
    ruolo: nuovaUtenza.ruolo || 'dipendente',
    dataCreazione: new Date().toISOString(),
    reparto: nuovaUtenza.reparto?.trim(),
    telefono: nuovaUtenza.telefono?.trim(),
  };

  elenco.push(utenzaCompleta);
  localStorage.setItem(CHIAVE_UTENZE, JSON.stringify(elenco));
  return { successo: true, messaggio: `Utenza "${utenzaCompleta.nomeCompleto}" registrata con successo!` };
}

/**
 * Aggiorna i dati o la password di un'utenza
 */
export function aggiornaUtenza(utenzaAggiornata: Utenza): boolean {
  try {
    const elenco = ottieniTutteUtenze();
    const indice = elenco.findIndex((u) => u.identificativo === utenzaAggiornata.identificativo);
    if (indice === -1) return false;

    elenco[indice] = utenzaAggiornata;
    localStorage.setItem(CHIAVE_UTENZE, JSON.stringify(elenco));
    return true;
  } catch {
    return false;
  }
}

/**
 * Elimina un'utenza e le sue relative assenze
 */
export function eliminaUtenza(identificativo: string): { successo: boolean; messaggio: string } {
  if (identificativo === 'titolare') {
    return { successo: false, messaggio: "L'utenza principale del titolare non può essere eliminata." };
  }

  try {
    const elenco = ottieniTutteUtenze().filter((u) => u.identificativo !== identificativo);
    localStorage.setItem(CHIAVE_UTENZE, JSON.stringify(elenco));

    const assenze = ottieniTutteAssenze().filter((a) => a.utenzaId !== identificativo);
    localStorage.setItem(CHIAVE_ASSENZE, JSON.stringify(assenze));

    const richieste = ottieniTutteRichieste().filter((r) => r.utenzaId !== identificativo);
    localStorage.setItem(CHIAVE_RICHIESTE, JSON.stringify(richieste));

    return { successo: true, messaggio: "Utenza e storico associato rimossi con successo." };
  } catch {
    return { successo: false, messaggio: "Errore durante la rimozione dell'utenza." };
  }
}

/**
 * Verifica credenziali di accesso
 */
export function verificaCredenziali(identificativo: string, chiave: string): Utenza | null {
  const elenco = ottieniTutteUtenze();
  const idNormalizzato = identificativo.trim().toLowerCase();
  const utente = elenco.find((u) => u.identificativo.toLowerCase() === idNormalizzato);

  if (!utente) return null;
  if (utente.chiaveAccesso === chiave) {
    return utente;
  }
  return null;
}

/**
 * Sessione utente attiva
 */
export function ottieniSessioneAttiva(): Utenza | null {
  try {
    const raw = localStorage.getItem(CHIAVE_UTENZA_CORRENTE);
    if (!raw) return null;
    const utenteSalvo: Utenza = JSON.parse(raw);
    const tutti = ottieniTutteUtenze();
    return tutti.find((u) => u.identificativo === utenteSalvo.identificativo) || null;
  } catch {
    return null;
  }
}

export function impostaSessioneAttiva(utenza: Utenza | null): void {
  if (!utenza) {
    localStorage.removeItem(CHIAVE_UTENZA_CORRENTE);
  } else {
    localStorage.setItem(CHIAVE_UTENZA_CORRENTE, JSON.stringify(utenza));
  }
}

/**
 * GESTIONE ASSENZE CALENDARIO
 */
export function ottieniTutteAssenze(): VoceAssenza[] {
  try {
    const raw = localStorage.getItem(CHIAVE_ASSENZE);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function salvaAssenza(assenza: VoceAssenza): void {
  const tutte = ottieniTutteAssenze();
  const indice = tutte.findIndex((a) => a.utenzaId === assenza.utenzaId && a.data === assenza.data);

  if (indice >= 0) {
    tutte[indice] = assenza;
  } else {
    tutte.push(assenza);
  }

  localStorage.setItem(CHIAVE_ASSENZE, JSON.stringify(tutte));
}

export function rimuoviAssenza(utenzaId: string, data: string): void {
  const tutte = ottieniTutteAssenze();
  const filtrate = tutte.filter((a) => !(a.utenzaId === utenzaId && a.data === data));
  localStorage.setItem(CHIAVE_ASSENZE, JSON.stringify(filtrate));
}

/**
 * GESTIONE RICHIESTE FERIE, PERMESSI E MALATTIA
 */
export function ottieniTutteRichieste(): RichiestaFerie[] {
  try {
    const raw = localStorage.getItem(CHIAVE_RICHIESTE);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Invia una nuova richiesta di ferie/permessi/malattia
 */
export function salvaNuovaRichiesta(richiesta: RichiestaFerie): void {
  const richieste = ottieniTutteRichieste();
  richieste.unshift(richiesta);
  localStorage.setItem(CHIAVE_RICHIESTE, JSON.stringify(richieste));

  // Crea le corrispondenti voci nel calendario
  const assenzeEsistenti = ottieniTutteAssenze();
  let quantitaGiorno = 1;
  if (richiesta.tipo === 'permesso_rol') quantitaGiorno = richiesta.orePermessoPerGiorno ?? 4;
  if (richiesta.tipo === 'malattia') quantitaGiorno = 1;

  const nuoveVoci: VoceAssenza[] = richiesta.dateCoinvolte.map((data) => ({
    id: `${richiesta.utenzaId}_${data}`,
    richiestaId: richiesta.id,
    utenzaId: richiesta.utenzaId,
    nomeUtente: richiesta.nomeRichiedente,
    data,
    tipo: richiesta.tipo,
    quantita: quantitaGiorno,
    stato: richiesta.stato || 'in_attesa',
    numeroProtocollo: richiesta.numeroProtocollo,
    note: richiesta.motivazione,
    dataAggiornamento: new Date().toISOString(),
  }));

  const dateSet = new Set(richiesta.dateCoinvolte);
  const filtrate = assenzeEsistenti.filter(
    (a) => !(a.utenzaId === richiesta.utenzaId && dateSet.has(a.data))
  );

  filtrate.push(...nuoveVoci);
  localStorage.setItem(CHIAVE_ASSENZE, JSON.stringify(filtrate));
}

/**
 * Aggiorna il numero di protocollo medico per una richiesta di malattia (anche postuma)
 */
export function aggiornaProtocolloMalattia(idRichiesta: string, protocollo: string): boolean {
  try {
    const richieste = ottieniTutteRichieste();
    const indice = richieste.findIndex((r) => r.id === idRichiesta);
    if (indice === -1) return false;

    richieste[indice].numeroProtocollo = protocollo.trim();
    localStorage.setItem(CHIAVE_RICHIESTE, JSON.stringify(richieste));

    // Aggiorna anche tutte le voci di assenza collegate nel calendario
    const assenze = ottieniTutteAssenze();
    assenze.forEach((a) => {
      if (a.richiestaId === idRichiesta) {
        a.numeroProtocollo = protocollo.trim();
        a.dataAggiornamento = new Date().toISOString();
      }
    });
    localStorage.setItem(CHIAVE_ASSENZE, JSON.stringify(assenze));

    return true;
  } catch {
    return false;
  }
}

/**
 * Il Titolare accetta (approva) la richiesta
 */
export function accettaRichiesta(idRichiesta: string, notaTitolare?: string): boolean {
  try {
    const richieste = ottieniTutteRichieste();
    const indice = richieste.findIndex((r) => r.id === idRichiesta);
    if (indice === -1) return false;

    richieste[indice].stato = 'approvata';
    richieste[indice].dataDecisione = new Date().toISOString();
    if (notaTitolare) richieste[indice].notaTitolare = notaTitolare;
    localStorage.setItem(CHIAVE_RICHIESTE, JSON.stringify(richieste));

    // Aggiorna lo stato delle assenze collegate
    const assenze = ottieniTutteAssenze();
    assenze.forEach((a) => {
      if (a.richiestaId === idRichiesta) {
        a.stato = 'approvata';
        a.dataAggiornamento = new Date().toISOString();
      }
    });
    localStorage.setItem(CHIAVE_ASSENZE, JSON.stringify(assenze));

    return true;
  } catch {
    return false;
  }
}

/**
 * Il Titolare rifiuta la richiesta
 */
export function rifiutaRichiesta(idRichiesta: string, notaTitolare?: string): boolean {
  try {
    const richieste = ottieniTutteRichieste();
    const indice = richieste.findIndex((r) => r.id === idRichiesta);
    if (indice === -1) return false;

    richieste[indice].stato = 'rifiutata';
    richieste[indice].dataDecisione = new Date().toISOString();
    if (notaTitolare) richieste[indice].notaTitolare = notaTitolare;
    localStorage.setItem(CHIAVE_RICHIESTE, JSON.stringify(richieste));

    // Rimuovi dal calendario le assenze collegate per liberare i giorni
    const assenze = ottieniTutteAssenze().filter((a) => a.richiestaId !== idRichiesta);
    localStorage.setItem(CHIAVE_ASSENZE, JSON.stringify(assenze));

    return true;
  } catch {
    return false;
  }
}

/**
 * Cancella una richiesta
 */
export function cancellaRichiesta(idRichiesta: string): boolean {
  try {
    const richieste = ottieniTutteRichieste().filter((r) => r.id !== idRichiesta);
    localStorage.setItem(CHIAVE_RICHIESTE, JSON.stringify(richieste));

    const assenze = ottieniTutteAssenze().filter((a) => a.richiestaId !== idRichiesta);
    localStorage.setItem(CHIAVE_ASSENZE, JSON.stringify(assenze));

    return true;
  } catch {
    return false;
  }
}

/**
 * GESTIONE NOTIFICHE IN-APP DIPENDENTI
 */
export function ottieniTutteNotifiche(): NotificaDipendente[] {
  try {
    const raw = localStorage.getItem(CHIAVE_NOTIFICHE);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function ottieniNotificheUtenza(idUtenza: string): NotificaDipendente[] {
  const tutte = ottieniTutteNotifiche();
  return tutte.filter((n) => n.destinatarioId === idUtenza);
}

export function inviaNotifica(notifica: NotificaDipendente): void {
  const tutte = ottieniTutteNotifiche();
  tutte.unshift(notifica);
  localStorage.setItem(CHIAVE_NOTIFICHE, JSON.stringify(tutte));
}

export function segnaNotificaLetta(idNotifica: string): void {
  const tutte = ottieniTutteNotifiche();
  const n = tutte.find((item) => item.id === idNotifica);
  if (n) {
    n.letta = true;
    localStorage.setItem(CHIAVE_NOTIFICHE, JSON.stringify(tutte));
  }
}

export function eliminaNotifica(idNotifica: string): void {
  const tutte = ottieniTutteNotifiche().filter((n) => n.id !== idNotifica);
  localStorage.setItem(CHIAVE_NOTIFICHE, JSON.stringify(tutte));
}

/**
 * Il Titolare revoca una richiesta di ferie approvata e notifica il dipendente
 */
export function revocaRichiesta(idRichiesta: string, motivazioneRevoca: string): boolean {
  try {
    const richieste = ottieniTutteRichieste();
    const indice = richieste.findIndex((r) => r.id === idRichiesta);
    if (indice === -1) return false;

    const richiesta = richieste[indice];
    richiesta.stato = 'revocata';
    richiesta.dataRevoca = new Date().toISOString();
    richiesta.motivoRevoca = motivazioneRevoca.trim();
    localStorage.setItem(CHIAVE_RICHIESTE, JSON.stringify(richieste));

    // Rimuovi le relative voci dal calendario per liberare le giornate
    const assenze = ottieniTutteAssenze().filter((a) => a.richiestaId !== idRichiesta);
    localStorage.setItem(CHIAVE_ASSENZE, JSON.stringify(assenze));

    // Invia notifica formale al dipendente interessato
    inviaNotifica({
      id: `notifica_revoca_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      destinatarioId: richiesta.utenzaId,
      titolo: 'Ferie Revocate dalla Direzione',
      messaggio: `La Direzione Aziendale ha revocato le ferie precedentemente approvate per il periodo dal ${richiesta.dataInizio} al ${richiesta.dataFine}. Motivazione: "${motivazioneRevoca.trim()}".`,
      tipo: 'revoca',
      dataInvio: new Date().toISOString(),
      letta: false,
      dettagli: {
        richiestaId: richiesta.id,
        periodo: `${richiesta.dataInizio} → ${richiesta.dataFine}`,
        motivazioneRevoca: motivazioneRevoca.trim(),
      },
    });

    return true;
  } catch {
    return false;
  }
}

/**
 * GESTIONE CHIUSURE AZIENDALI COLLETTIVE
 */
export function ottieniTutteChiusureAziendali(): ChiusuraAziendale[] {
  try {
    const raw = localStorage.getItem(CHIAVE_CHIUSURE);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function salvaNuovaChiusuraAziendale(chiusura: ChiusuraAziendale): void {
  const chiusure = ottieniTutteChiusureAziendali();
  chiusure.unshift(chiusura);
  localStorage.setItem(CHIAVE_CHIUSURE, JSON.stringify(chiusure));

  // Crea le corrispondenti voci nel calendario per TUTTO il personale
  const tutteLeUtenze = ottieniTutteUtenze();
  const assenzeEsistenti = ottieniTutteAssenze();

  const nuoveVoci: VoceAssenza[] = [];
  tutteLeUtenze.forEach((utente) => {
    chiusura.dateCoinvolte.forEach((data) => {
      nuoveVoci.push({
        id: `chiusura_${chiusura.id}_${utente.identificativo}_${data}`,
        richiestaId: chiusura.id,
        utenzaId: utente.identificativo,
        nomeUtente: utente.nomeCompleto,
        data,
        tipo: 'chiusura_aziendale',
        quantita: 1,
        stato: 'approvata',
        note: `Chiusura Aziendale: ${chiusura.titolo}`,
        dataAggiornamento: new Date().toISOString(),
      });
    });

    // Invia notifica di chiusura aziendale a ciascun collaboratore (se diverso dal titolare)
    if (utente.ruolo !== 'titolare') {
      inviaNotifica({
        id: `notifica_chiusura_${Date.now()}_${utente.identificativo}`,
        destinatarioId: utente.identificativo,
        titolo: `Chiusura Aziendale: ${chiusura.titolo}`,
        messaggio: `La Direzione ha programmato una Chiusura Aziendale collettiva dal ${chiusura.dataInizio} al ${chiusura.dataFine} (${chiusura.giorniLavorativi} gg lavorativi). ${chiusura.descrizione || ''}`,
        tipo: 'chiusura_aziendale',
        dataInvio: new Date().toISOString(),
        letta: false,
        dettagli: {
          periodo: `${chiusura.dataInizio} → ${chiusura.dataFine}`,
        },
      });
    }
  });

  const dateSet = new Set(chiusura.dateCoinvolte);
  const filtrate = assenzeEsistenti.filter((a) => !dateSet.has(a.data));
  filtrate.push(...nuoveVoci);
  localStorage.setItem(CHIAVE_ASSENZE, JSON.stringify(filtrate));
}

export function eliminaChiusuraAziendale(idChiusura: string): boolean {
  try {
    const chiusure = ottieniTutteChiusureAziendali().filter((c) => c.id !== idChiusura);
    localStorage.setItem(CHIAVE_CHIUSURE, JSON.stringify(chiusure));

    // Rimuovi le relative voci dal calendario
    const assenze = ottieniTutteAssenze().filter((a) => a.richiestaId !== idChiusura);
    localStorage.setItem(CHIAVE_ASSENZE, JSON.stringify(assenze));
    return true;
  } catch {
    return false;
  }
}

/**
 * Esportazione completa Copia di Sicurezza
 */
export function esportaCopiaDiSicurezza(): string {
  const dati = {
    azienda: 'C. Emme Impianti S.r.l.',
    versione: '3.0',
    dataEsportazione: new Date().toISOString(),
    utenze: ottieniTutteUtenze(),
    assenze: ottieniTutteAssenze(),
    richieste: ottieniTutteRichieste(),
  };
  return JSON.stringify(dati, null, 2);
}

/**
 * Ripristino da file JSON
 */
export function ripristinaCopiaDiSicurezza(datiJson: string): { successo: boolean; messaggio: string } {
  try {
    const parsed = JSON.parse(datiJson);
    if (!Array.isArray(parsed.utenze) || !Array.isArray(parsed.assenze)) {
      return { successo: false, messaggio: 'Formato del file di ripristino non valido.' };
    }

    localStorage.setItem(CHIAVE_UTENZE, JSON.stringify(parsed.utenze));
    localStorage.setItem(CHIAVE_ASSENZE, JSON.stringify(parsed.assenze));
    if (Array.isArray(parsed.richieste)) {
      localStorage.setItem(CHIAVE_RICHIESTE, JSON.stringify(parsed.richieste));
    }
    return { successo: true, messaggio: 'Dati aziendali ripristinati correttamente con successo!' };
  } catch {
    return { successo: false, messaggio: 'Impossibile leggere il file selezionato.' };
  }
}
