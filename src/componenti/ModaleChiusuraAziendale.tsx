/**
 * Finestra Modale per la Chiusura Aziendale Collettiva (Riservato al Titolare)
 * C. Emme Impianti S.r.l.
 * 
 * 100% in lingua italiana - Applicazione automatica a tutto il personale
 */

import React, { useState } from 'react';
import { usaPianificatore } from '@/contesti/ContestoPianificatore';
import { formattaDataISO, verificaGiornoFestivo } from '@/dati/festivita-italiane';
import {
  Building2,
  Calendar,
  X,
  AlertCircle,
  CheckCircle2,
  Trash2,
  Users,
  ShieldCheck,
  Plus,
} from 'lucide-react';

interface ProprietaModaleChiusuraAziendale {
  aperto: boolean;
  suChiudi: () => void;
}

export const ModaleChiusuraAziendale: React.FC<ProprietaModaleChiusuraAziendale> = ({
  aperto,
  suChiudi,
}) => {
  const { chiusureAziendali, impostaChiusuraAziendale, eliminaChiusuraAziendale } = usaPianificatore();

  const [titolo, setTitolo] = useState('');
  const [dataInizio, setDataInizio] = useState('');
  const [dataFine, setDataFine] = useState('');
  const [descrizione, setDescrizione] = useState('');
  const [errore, setErrore] = useState<string | null>(null);
  const [messaggioConferma, setMessaggioConferma] = useState<string | null>(null);

  if (!aperto) return null;

  // Calcolo delle date lavorative incluse
  const calcolaDateLavorative = (inizio: string, fine: string): string[] => {
    if (!inizio || !fine || inizio > fine) return [];
    const dInizio = new Date(inizio + 'T00:00:00');
    const dFine = new Date(fine + 'T00:00:00');
    const date: string[] = [];

    const curr = new Date(dInizio);
    while (curr <= dFine) {
      const iso = formattaDataISO(curr);
      const day = curr.getDay();
      const eWeekend = day === 0 || day === 6;
      const festivo = verificaGiornoFestivo(iso);

      if (!eWeekend && !festivo) {
        date.push(iso);
      }
      curr.setDate(curr.getDate() + 1);
    }
    return date;
  };

  const dateLavorative = calcolaDateLavorative(dataInizio, dataFine);

  const gestisciSalvataggio = (e: React.FormEvent) => {
    e.preventDefault();
    setErrore(null);
    setMessaggioConferma(null);

    if (!titolo.trim()) {
      setErrore('Inserisci una denominazione per la chiusura aziendale.');
      return;
    }

    if (!dataInizio || !dataFine) {
      setErrore('Seleziona sia la data di inizio sia la data di fine.');
      return;
    }

    if (dataInizio > dataFine) {
      setErrore('La data di inizio non può essere successiva alla data di fine.');
      return;
    }

    if (dateLavorative.length === 0) {
      setErrore('Il periodo selezionato non comprende alcuna giornata lavorativa.');
      return;
    }

    impostaChiusuraAziendale({
      titolo: titolo.trim(),
      dataInizio,
      dataFine,
      dateCoinvolte: dateLavorative,
      giorniLavorativi: dateLavorative.length,
      descrizione: descrizione.trim() || undefined,
    });

    setMessaggioConferma(
      `Chiusura aziendale "${titolo.trim()}" applicata con successo a tutto il personale (${dateLavorative.length} gg lavorativi)!`
    );

    setTitolo('');
    setDataInizio('');
    setDataFine('');
    setDescrizione('');
  };

  const gestisciEliminazione = (id: string, titoloChiusura: string) => {
    if (
      window.confirm(
        `Sei sicuro di voler revocare ed eliminare la chiusura aziendale "${titoloChiusura}"? I calendari di tutto il personale verranno aggiornati.`
      )
    ) {
      eliminaChiusuraAziendale(id);
      setMessaggioConferma(`Chiusura aziendale "${titoloChiusura}" revocata correttamente.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Testata Modale */}
        <div className="bg-slate-900 text-white p-5 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-600 text-white">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Chiusura Aziendale Collettiva</h2>
              <p className="text-xs text-slate-300">
                Pannello Direzione — Pianificazione sospensione attività e ferie collettive per tutto il personale
              </p>
            </div>
          </div>
          <button
            onClick={suChiudi}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo Modale Scorrevole */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {/* Banner di Successo o Errore */}
          {messaggioConferma && (
            <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-900 border border-emerald-200 flex items-center gap-3 text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{messaggioConferma}</span>
            </div>
          )}

          {errore && (
            <div className="p-4 rounded-2xl bg-rose-50 text-rose-900 border border-rose-200 flex items-center gap-3 text-xs font-bold animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errore}</span>
            </div>
          )}

          {/* Form Inserimento Nuova Chiusura */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Plus className="w-4 h-4 text-indigo-600" />
              <span>Programma Nuovo Periodo di Chiusura Aziendale</span>
            </div>

            <form onSubmit={gestisciSalvataggio} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Denominazione Chiusura / Ferie Collettive *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="es. Chiusura Estiva Cantieri 2026 oppure Ferie Collettive Natalizie"
                    value={titolo}
                    onChange={(e) => setTitolo(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Data Inizio Chiusura *
                  </label>
                  <input
                    type="date"
                    required
                    value={dataInizio}
                    onChange={(e) => setDataInizio(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Data Fine Chiusura *
                  </label>
                  <input
                    type="date"
                    required
                    value={dataFine}
                    onChange={(e) => setDataFine(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Giornate Lavorative Coinvolte
                  </label>
                  <div className="w-full px-3 py-2 text-xs bg-slate-200/80 border border-slate-300 rounded-xl font-extrabold text-indigo-950 flex items-center justify-between">
                    <span>{dateLavorative.length} gg</span>
                    <span className="text-[10px] font-semibold text-slate-500">
                      (esclusi festivi e weekend)
                    </span>
                  </div>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Comunicazione / Note Aggiuntive per il Personale
                  </label>
                  <textarea
                    rows={2}
                    placeholder="es. Sospensione programmata di tutte le squadre operative di cantiere. Riapertura lunedì 24 Agosto."
                    value={descrizione}
                    onChange={(e) => setDescrizione(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              {/* Box Informativo di Impatto Collettivo */}
              <div className="bg-indigo-50 border border-indigo-200 p-3.5 rounded-xl flex items-center gap-3 text-xs text-indigo-950 font-medium">
                <Users className="w-5 h-5 text-indigo-600 shrink-0" />
                <span>
                  <strong>Nota Operativa:</strong> L'impostazione della chiusura aziendale registrerà automaticamente il blocco su tutti i calendari del personale e invierà una notifica formale a ciascun dipendente.
                </span>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={!titolo.trim() || !dataInizio || !dataFine || dateLavorative.length === 0}
                  className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
                >
                  <Building2 className="w-4 h-4" />
                  <span>Conferma e Applica a Tutto il Personale ({dateLavorative.length} gg)</span>
                </button>
              </div>
            </form>
          </div>

          {/* Elenco Chiusure Aziendali Attive */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Chiusure Aziendali Programmate ({chiusureAziendali.length})</span>
              </h3>
            </div>

            {chiusureAziendali.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-200 rounded-2xl space-y-1">
                <Building2 className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">Nessuna chiusura aziendale programmata</p>
                <p className="text-[11px] text-slate-400">
                  Usa il modulo soprastante per impostare periodi di chiusura estiva o natalizia per tutti i dipendenti.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {chiusureAziendali.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 bg-white border border-slate-200 hover:border-indigo-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs transition-all"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-slate-900 text-sm">{c.titolo}</h4>
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-200">
                          {c.giorniLavorativi} gg lavorativi
                        </span>
                      </div>
                      <div className="text-xs text-slate-600 font-semibold flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                        <span>
                          Dal {c.dataInizio} al {c.dataFine}
                        </span>
                      </div>
                      {c.descrizione && (
                        <p className="text-[11px] text-slate-500 italic mt-0.5">
                          "{c.descrizione}"
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => gestisciEliminazione(c.id, c.titolo)}
                      title="Revoca ed elimina chiusura aziendale"
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-rose-200 font-bold text-xs flex items-center gap-1 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Revoca Chiusura</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Chiusura Modale */}
        <div className="bg-slate-50 p-4 px-6 border-t border-slate-200 flex justify-end">
          <button
            onClick={suChiudi}
            className="px-5 py-2 text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl transition-colors"
          >
            Chiudi Finestra
          </button>
        </div>

      </div>
    </div>
  );
};
