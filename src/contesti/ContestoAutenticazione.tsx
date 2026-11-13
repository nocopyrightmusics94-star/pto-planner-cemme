/**
 * Contesto di Autenticazione e Sicurezza Utenze
 * C. Emme Impianti S.r.l.
 * 
 * Gestisce l'accesso del personale e le funzioni riservate al Titolare.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Utenza } from '@/tipi';
import {
  inizializzaArchivio,
  ottieniSessioneAttiva,
  impostaSessioneAttiva,
  verificaCredenziali,
  ottieniTutteUtenze,
  aggiungiNuovaUtenza,
  aggiornaUtenza,
  eliminaUtenza,
} from '@/servizi/gestore-archiviazione';

interface ProprietaContestoAutenticazione {
  utenzaAttiva: Utenza | null;
  eTitolare: boolean;
  eResponsabile: boolean;
  puoApprovare: boolean;
  tutteLeUtenze: Utenza[];
  accedi: (identificativo: string, chiave: string) => { successo: boolean; messaggio?: string };
  disconnetti: () => void;
  registraNuovaUtenza: (dati: Omit<Utenza, 'dataCreazione'>) => { successo: boolean; messaggio: string };
  modificaUtenzaEsistente: (utenza: Utenza) => boolean;
  rimuoviUtenzaEsistente: (identificativo: string) => { successo: boolean; messaggio: string };
  ricaricaDati: () => void;
}

const ContestoAutenticazione = createContext<ProprietaContestoAutenticazione | undefined>(undefined);

export const FornitoreAutenticazione: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [utenzaAttiva, setUtenzaAttiva] = useState<Utenza | null>(null);
  const [tutteLeUtenze, setTutteLeUtenze] = useState<Utenza[]>([]);
  const [caricamentoCompletato, setCaricamentoCompletato] = useState(false);

  const ricaricaDati = () => {
    inizializzaArchivio();
    const utenze = ottieniTutteUtenze();
    setTutteLeUtenze(utenze);
    const sessione = ottieniSessioneAttiva();
    setUtenzaAttiva(sessione);
  };

  useEffect(() => {
    ricaricaDati();
    setCaricamentoCompletato(true);
  }, []);

  const accedi = (identificativo: string, chiave: string) => {
    const utente = verificaCredenziali(identificativo, chiave);
    if (!utente) {
      return { successo: false, messaggio: "Identificativo o chiave d'accesso non corretti. Riprova." };
    }
    impostaSessioneAttiva(utente);
    setUtenzaAttiva(utente);
    return { successo: true };
  };

  const disconnetti = () => {
    impostaSessioneAttiva(null);
    setUtenzaAttiva(null);
  };

  const registraNuovaUtenza = (dati: Omit<Utenza, 'dataCreazione'>) => {
    const esito = aggiungiNuovaUtenza(dati);
    if (esito.successo) {
      setTutteLeUtenze(ottieniTutteUtenze());
    }
    return esito;
  };

  const modificaUtenzaEsistente = (utenza: Utenza) => {
    const ok = aggiornaUtenza(utenza);
    if (ok) {
      setTutteLeUtenze(ottieniTutteUtenze());
      if (utenzaAttiva?.identificativo === utenza.identificativo) {
        setUtenzaAttiva(utenza);
        impostaSessioneAttiva(utenza);
      }
    }
    return ok;
  };

  const rimuoviUtenzaEsistente = (identificativo: string) => {
    const esito = eliminaUtenza(identificativo);
    if (esito.successo) {
      setTutteLeUtenze(ottieniTutteUtenze());
    }
    return esito;
  };

  const eTitolare = utenzaAttiva?.ruolo === 'titolare';
  const eResponsabile = utenzaAttiva?.ruolo === 'responsabile';
  const puoApprovare = eTitolare || eResponsabile;

  if (!caricamentoCompletato) {
    return null;
  }

  return (
    <ContestoAutenticazione.Provider
      value={{
        utenzaAttiva,
        eTitolare,
        eResponsabile,
        puoApprovare,
        tutteLeUtenze,
        accedi,
        disconnetti,
        registraNuovaUtenza,
        modificaUtenzaEsistente,
        rimuoviUtenzaEsistente,
        ricaricaDati,
      }}
    >
      {children}
    </ContestoAutenticazione.Provider>
  );
};

export const usaAutenticazione = (): ProprietaContestoAutenticazione => {
  const context = useContext(ContestoAutenticazione);
  if (!context) {
    throw new Error('usaAutenticazione deve essere utilizzato all’interno di un FornitoreAutenticazione');
  }
  return context;
};
