/**
 * Contesto del Pianificatore Ferie, Permessi e Malattie
 * C. Emme Impianti S.r.l.
 * 
 * 100% in lingua italiana - Totali storici reali senza tetti artificiali
 */

import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { VoceAssenza, StatisticheAssenze, Utenza, RichiestaFerie, ChiusuraAziendale, NotificaDipendente } from '@/tipi';
import { usaAutenticazione } from './ContestoAutenticazione';
import {
  ottieniTutteAssenze,
  ottieniTutteRichieste,
  salvaNuovaRichiesta,
  aggiornaProtocolloMalattia,
  accettaRichiesta as archiviaAccettaRichiesta,
  rifiutaRichiesta as archiviaRifiutaRichiesta,
  cancellaRichiesta as archiviaCancellaRichiesta,
  rimuoviAssenza,
  revocaRichiesta as archiviaRevocaRichiesta,
  ottieniTutteChiusureAziendali,
  salvaNuovaChiusuraAziendale,
  eliminaChiusuraAziendale as archiviaEliminaChiusura,
  ottieniNotificheUtenza,
  segnaNotificaLetta as archiviaSegnaNotificaLetta,
  eliminaNotifica as archiviaEliminaNotifica,
} from '@/servizi/gestore-archiviazione';

interface ProprietaContestoPianificatore {
  annoSelezionato: number;
  impostaAnnoSelezionato: (anno: number) => void;
  meseSelezionato: number; // 0 = Gennaio ... 11 = Dicembre
  impostaMeseSelezionato: (mese: number) => void;
  vaiAlMesePrecedente: () => void;
  vaiAlMeseSuccessivo: () => void;
  tornaAlMeseCorrente: () => void;
  idUtenzaVisualizzata: string;
  impostaIdUtenzaVisualizzata: (id: string) => void;
  utenzaVisualizzataOggetto: Utenza | null;
  assenzeUtenza: VoceAssenza[];
  tutteLeAssenzeAziendali: VoceAssenza[];
  mappaAssenzeAziendaliPerData: Map<string, VoceAssenza[]>;
  tutteLeRichieste: RichiestaFerie[];
  richiesteUtenzaVisualizzata: RichiestaFerie[];
  richiesteInAttesaAziendali: RichiestaFerie[];
  richiesteInAttesaApprovabili: RichiestaFerie[];
  chiusureAziendali: ChiusuraAziendale[];
  notificheUtente: NotificaDipendente[];
  notificheNonLette: NotificaDipendente[];
  statistiche: StatisticheAssenze;
  inviaRichiesta: (richiesta: Omit<RichiestaFerie, 'id' | 'dataInvio' | 'stato'> & { stato?: RichiestaFerie['stato'] }) => void;
  impostaProtocolloMalattia: (idRichiesta: string, protocollo: string) => void;
  accettaRichiesta: (idRichiesta: string, nota?: string) => void;
  rifiutaRichiesta: (idRichiesta: string, nota?: string) => void;
  revocaRichiesta: (idRichiesta: string, motivazione: string) => void;
  rimuoviRichiesta: (idRichiesta: string) => void;
  cancellaGiorno: (dataISO: string) => void;
  impostaChiusuraAziendale: (chiusura: Omit<ChiusuraAziendale, 'id' | 'dataCreazione'>) => void;
  eliminaChiusuraAziendale: (id: string) => void;
  segnaNotificaLetta: (id: string) => void;
  eliminaNotifica: (id: string) => void;
  ricaricaAssenzeERichieste: () => void;
}

const ContestoPianificatore = createContext<ProprietaContestoPianificatore | undefined>(undefined);

export const FornitorePianificatore: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { utenzaAttiva, tutteLeUtenze, eTitolare, eResponsabile } = usaAutenticazione();
  
  const oggi = new Date();
  const [annoSelezionato, setAnnoSelezionato] = useState<number>(oggi.getFullYear());
  const [meseSelezionato, setMeseSelezionato] = useState<number>(oggi.getMonth());

  const [idUtenzaVisualizzata, setIdUtenzaVisualizzata] = useState<string>(
    utenzaAttiva?.identificativo || 'titolare'
  );

  const [tutteLeAssenzeAziendali, setTutteLeAssenzeAziendali] = useState<VoceAssenza[]>([]);
  const [tutteLeRichieste, setTutteLeRichieste] = useState<RichiestaFerie[]>([]);
  const [chiusureAziendali, setChiusureAziendali] = useState<ChiusuraAziendale[]>([]);
  const [notificheUtente, setNotificheUtente] = useState<NotificaDipendente[]>([]);

  const ricaricaAssenzeERichieste = () => {
    setTutteLeAssenzeAziendali(ottieniTutteAssenze());
    setTutteLeRichieste(ottieniTutteRichieste());
    setChiusureAziendali(ottieniTutteChiusureAziendali());
    if (utenzaAttiva?.identificativo) {
      setNotificheUtente(ottieniNotificheUtenza(utenzaAttiva.identificativo));
    }
  };

  useEffect(() => {
    ricaricaAssenzeERichieste();
  }, [utenzaAttiva?.identificativo]);

  useEffect(() => {
    if (utenzaAttiva && !eTitolare) {
      setIdUtenzaVisualizzata(utenzaAttiva.identificativo);
    }
  }, [utenzaAttiva, eTitolare]);

  const vaiAlMesePrecedente = () => {
    if (meseSelezionato === 0) {
      setMeseSelezionato(11);
      setAnnoSelezionato((prev) => prev - 1);
    } else {
      setMeseSelezionato((prev) => prev - 1);
    }
  };

  const vaiAlMeseSuccessivo = () => {
    if (meseSelezionato === 11) {
      setMeseSelezionato(0);
      setAnnoSelezionato((prev) => prev + 1);
    } else {
      setMeseSelezionato((prev) => prev + 1);
    }
  };

  const tornaAlMeseCorrente = () => {
    const ora = new Date();
    setAnnoSelezionato(ora.getFullYear());
    setMeseSelezionato(ora.getMonth());
  };

  const utenzaVisualizzataOggetto = useMemo(() => {
    return tutteLeUtenze.find((u) => u.identificativo === idUtenzaVisualizzata) || utenzaAttiva;
  }, [tutteLeUtenze, idUtenzaVisualizzata, utenzaAttiva]);

  // Assenze filtrate per l'utenza selezionata
  const assenzeUtenza = useMemo(() => {
    return tutteLeAssenzeAziendali.filter((a) => a.utenzaId === idUtenzaVisualizzata);
  }, [tutteLeAssenzeAziendali, idUtenzaVisualizzata]);

  // Richieste per l'utenza selezionata
  const richiesteUtenzaVisualizzata = useMemo(() => {
    return tutteLeRichieste.filter((r) => r.utenzaId === idUtenzaVisualizzata);
  }, [tutteLeRichieste, idUtenzaVisualizzata]);

  // Richieste in attesa aziendali (per il Titolare)
  const richiesteInAttesaAziendali = useMemo(() => {
    return tutteLeRichieste.filter((r) => r.stato === 'in_attesa');
  }, [tutteLeRichieste]);

  // Richieste che l'utente correntemente connesso ha il permesso di approvare/rifiutare:
  // - Il Titolare può approvare tutte le richieste (dipendenti e responsabili)
  // - Il Responsabile può approvare SOLO le richieste dei dipendenti (non le sue, né quelle di altri responsabili)
  // - I dipendenti ordinari non possono approvare alcuna richiesta
  const richiesteInAttesaApprovabili = useMemo(() => {
    if (eTitolare) {
      return tutteLeRichieste.filter((r) => r.stato === 'in_attesa');
    }
    if (eResponsabile) {
      return tutteLeRichieste.filter(
        (r) =>
          r.stato === 'in_attesa' &&
          r.utenzaId !== utenzaAttiva?.identificativo &&
          r.ruoloRichiedente !== 'responsabile' &&
          r.ruoloRichiedente !== 'titolare'
      );
    }
    return [];
  }, [eTitolare, eResponsabile, tutteLeRichieste, utenzaAttiva]);

  // Notifiche non lette per l'utente loggato
  const notificheNonLette = useMemo(() => {
    return notificheUtente.filter((n) => !n.letta);
  }, [notificheUtente]);

  // Mappa di tutte le assenze per data (utilizzata dal Titolare per mostrare i nomi di chi è assente)
  const mappaAssenzeAziendaliPerData = useMemo(() => {
    const mappa = new Map<string, VoceAssenza[]>();
    tutteLeAssenzeAziendali.forEach((a) => {
      // Assicura che nomeUtente sia valorizzato
      if (!a.nomeUtente) {
        const u = tutteLeUtenze.find((user) => user.identificativo === a.utenzaId);
        if (u) a.nomeUtente = u.nomeCompleto;
      }
      const arr = mappa.get(a.data) || [];
      arr.push(a);
      mappa.set(a.data, arr);
    });
    return mappa;
  }, [tutteLeAssenzeAziendali, tutteLeUtenze]);

  // Calcolo statistiche storiche reali (senza tetti)
  const statistiche: StatisticheAssenze = useMemo(() => {
    let totaleFerie = 0;
    let totaleRol = 0;
    let totaleMalattia = 0;

    assenzeUtenza.forEach((a) => {
      if (a.stato === 'approvata') {
        if (a.tipo === 'ferie_intera') totaleFerie += 1;
        else if (a.tipo === 'permesso_rol') totaleRol += a.quantita;
        else if (a.tipo === 'malattia') totaleMalattia += 1;
      }
    });

    const inAttesaCount = eTitolare || eResponsabile
      ? richiesteInAttesaApprovabili.length
      : richiesteUtenzaVisualizzata.filter((r) => r.stato === 'in_attesa').length;

    return {
      totaleGiorniFerieGodute: totaleFerie,
      totaleOrePermessiGodute: totaleRol,
      totaleGiorniMalattia: totaleMalattia,
      richiesteInAttesa: inAttesaCount,
      richiesteTotaliRegistrate: richiesteUtenzaVisualizzata.length,
    };
  }, [assenzeUtenza, eTitolare, eResponsabile, richiesteInAttesaApprovabili, richiesteUtenzaVisualizzata]);

  // Invio richiesta
  const inviaRichiesta = (
    dati: Omit<RichiestaFerie, 'id' | 'dataInvio' | 'stato'> & { stato?: RichiestaFerie['stato'] }
  ) => {
    const statoEffettivo = dati.stato || 'in_attesa';
    const nuova: RichiestaFerie = {
      ...dati,
      id: `richiesta_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      dataInvio: new Date().toISOString(),
      stato: statoEffettivo,
      dataDecisione: statoEffettivo === 'approvata' ? new Date().toISOString() : undefined,
      notaTitolare:
        statoEffettivo === 'approvata'
          ? (dati.notaTitolare || 'Approvata direttamente dalla Direzione')
          : undefined,
    };

    salvaNuovaRichiesta(nuova);
    ricaricaAssenzeERichieste();
  };

  // Aggiornamento protocollo malattia (anche postumo)
  const impostaProtocolloMalattia = (idRichiesta: string, protocollo: string) => {
    aggiornaProtocolloMalattia(idRichiesta, protocollo);
    ricaricaAssenzeERichieste();
  };

  const accettaRichiesta = (idRichiesta: string, nota?: string) => {
    archiviaAccettaRichiesta(idRichiesta, nota);
    ricaricaAssenzeERichieste();
  };

  const rifiutaRichiesta = (idRichiesta: string, nota?: string) => {
    archiviaRifiutaRichiesta(idRichiesta, nota);
    ricaricaAssenzeERichieste();
  };

  const revocaRichiesta = (idRichiesta: string, motivazione: string) => {
    archiviaRevocaRichiesta(idRichiesta, motivazione);
    ricaricaAssenzeERichieste();
  };

  const impostaChiusuraAziendale = (chiusura: Omit<ChiusuraAziendale, 'id' | 'dataCreazione'>) => {
    const nuova: ChiusuraAziendale = {
      ...chiusura,
      id: `chiusura_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      dataCreazione: new Date().toISOString(),
      creataDa: utenzaAttiva?.identificativo || 'titolare',
    };
    salvaNuovaChiusuraAziendale(nuova);
    ricaricaAssenzeERichieste();
  };

  const eliminaChiusuraAziendale = (id: string) => {
    archiviaEliminaChiusura(id);
    ricaricaAssenzeERichieste();
  };

  const segnaNotificaLetta = (id: string) => {
    archiviaSegnaNotificaLetta(id);
    if (utenzaAttiva?.identificativo) {
      setNotificheUtente(ottieniNotificheUtenza(utenzaAttiva.identificativo));
    }
  };

  const eliminaNotifica = (id: string) => {
    archiviaEliminaNotifica(id);
    if (utenzaAttiva?.identificativo) {
      setNotificheUtente(ottieniNotificheUtenza(utenzaAttiva.identificativo));
    }
  };

  const rimuoviRichiesta = (idRichiesta: string) => {
    archiviaCancellaRichiesta(idRichiesta);
    ricaricaAssenzeERichieste();
  };

  const cancellaGiorno = (dataISO: string) => {
    rimuoviAssenza(idUtenzaVisualizzata, dataISO);
    ricaricaAssenzeERichieste();
  };

  return (
    <ContestoPianificatore.Provider
      value={{
        annoSelezionato,
        impostaAnnoSelezionato: setAnnoSelezionato,
        meseSelezionato,
        impostaMeseSelezionato: setMeseSelezionato,
        vaiAlMesePrecedente,
        vaiAlMeseSuccessivo,
        tornaAlMeseCorrente,
        idUtenzaVisualizzata,
        impostaIdUtenzaVisualizzata: setIdUtenzaVisualizzata,
        utenzaVisualizzataOggetto,
        assenzeUtenza,
        tutteLeAssenzeAziendali,
        mappaAssenzeAziendaliPerData,
        tutteLeRichieste,
        richiesteUtenzaVisualizzata,
        richiesteInAttesaAziendali,
        richiesteInAttesaApprovabili,
        chiusureAziendali,
        notificheUtente,
        notificheNonLette,
        statistiche,
        inviaRichiesta,
        impostaProtocolloMalattia,
        accettaRichiesta,
        rifiutaRichiesta,
        revocaRichiesta,
        rimuoviRichiesta,
        cancellaGiorno,
        impostaChiusuraAziendale,
        eliminaChiusuraAziendale,
        segnaNotificaLetta,
        eliminaNotifica,
        ricaricaAssenzeERichieste,
      }}
    >
      {children}
    </ContestoPianificatore.Provider>
  );
};

export const usaPianificatore = (): ProprietaContestoPianificatore => {
  const context = useContext(ContestoPianificatore);
  if (!context) {
    throw new Error('usaPianificatore deve essere utilizzato all’interno di un FornitorePianificatore');
  }
  return context;
};
