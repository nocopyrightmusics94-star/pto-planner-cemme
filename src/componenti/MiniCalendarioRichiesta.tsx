/**
 * Mini Calendario Interattivo Avanzato per la Selezione Multipla di Giorni
 * C. Emme Impianti S.r.l.
 * 
 * 100% in lingua italiana - Supporto sia per intervalli continui che per selezione giorni singoli
 */

import React, { useState, useEffect } from 'react';
import {
  NOMI_MESI_ITALIANI,
  GIORNI_SETTIMANA_ITALIANI,
  formattaDataISO,
  verificaGiornoFestivo,
} from '@/dati/festivita-italiane';
import { ChevronLeft, ChevronRight, CalendarRange, MousePointerClick, RotateCcw } from 'lucide-react';

interface ProprietaMiniCalendario {
  dataInizio: string | null;
  dataFine: string | null;
  dateSelezionate: string[];
  suModificaSelezione: (inizio: string | null, fine: string | null, dateLavorative: string[]) => void;
}

export const MiniCalendarioRichiesta: React.FC<ProprietaMiniCalendario> = ({
  dataInizio,
  dataFine,
  dateSelezionate,
  suModificaSelezione,
}) => {
  const oggi = new Date();
  const [anno, setAnno] = useState<number>(
    dataInizio ? parseInt(dataInizio.split('-')[0], 10) : oggi.getFullYear()
  );
  const [mese, setMese] = useState<number>(
    dataInizio ? parseInt(dataInizio.split('-')[1], 10) - 1 : oggi.getMonth()
  );

  // Modalità di selezione: 'intervallo' (periodo da data a data) oppure 'singoli' (giorni sparsi)
  const [modalita, setModalita] = useState<'intervallo' | 'singoli'>('intervallo');

  // Stato interno per la selezione a due clic dell'intervallo
  const [dataPartenza, setDataPartenza] = useState<string | null>(dataInizio);
  const [dataArrivo, setDataArrivo] = useState<string | null>(dataFine);
  const [dataHover, setDataHover] = useState<string | null>(null);

  // Sincronizza lo stato locale se i props cambiano
  useEffect(() => {
    setDataPartenza(dataInizio);
    setDataArrivo(dataFine);
  }, [dataInizio, dataFine]);

  const primoDelMese = new Date(anno, mese, 1);
  const ultimoDelMese = new Date(anno, mese + 1, 0);
  const numeroGiorni = ultimoDelMese.getDate();

  let giornoSettimanaIniziale = primoDelMese.getDay() - 1;
  if (giornoSettimanaIniziale === -1) giornoSettimanaIniziale = 6;

  const mesePrecedente = () => {
    if (mese === 0) {
      setMese(11);
      setAnno((prev) => prev - 1);
    } else {
      setMese((prev) => prev - 1);
    }
  };

  const meseSuccessivo = () => {
    if (mese === 11) {
      setMese(0);
      setAnno((prev) => prev + 1);
    } else {
      setMese((prev) => prev + 1);
    }
  };

  // Calcola tutti i giorni lavorativi effettivi compresi tra due date
  const calcolaDateLavorative = (inizioStr: string, fineStr: string): string[] => {
    const dInizio = new Date(inizioStr + 'T00:00:00');
    const dFine = new Date(fineStr + 'T00:00:00');
    const lavorativi: string[] = [];

    const curr = new Date(dInizio);
    while (curr <= dFine) {
      const iso = formattaDataISO(curr);
      const day = curr.getDay();
      const eWeekend = day === 0 || day === 6;
      const festivo = verificaGiornoFestivo(iso);

      if (!eWeekend && !festivo) {
        lavorativi.push(iso);
      }
      curr.setDate(curr.getDate() + 1);
    }
    return lavorativi;
  };

  // Gestione clic sul giorno
  const gestisciClickGiorno = (dataISO: string, eWeekend: boolean, eFestivo: boolean) => {
    if (eWeekend || eFestivo) return;

    if (modalita === 'intervallo') {
      if (!dataPartenza || (dataPartenza && dataArrivo)) {
        // PRIMO CLIC: imposta data di partenza e azzera la fine
        setDataPartenza(dataISO);
        setDataArrivo(null);
        const lavorativi = [dataISO];
        suModificaSelezione(dataISO, dataISO, lavorativi);
      } else if (dataPartenza && !dataArrivo) {
        // SECONDO CLIC: imposta data di arrivo ed estende il periodo a tutti i giorni compresi
        let inizioEffettivo = dataPartenza;
        let fineEffettiva = dataISO;

        if (dataISO < dataPartenza) {
          inizioEffettivo = dataISO;
          fineEffettiva = dataPartenza;
        }

        setDataPartenza(inizioEffettivo);
        setDataArrivo(fineEffettiva);

        const lavorativi = calcolaDateLavorative(inizioEffettivo, fineEffettiva);
        suModificaSelezione(inizioEffettivo, fineEffettiva, lavorativi);
      }
    } else {
      // MODALITÀ GIORNI SINGOLI: aggiungi o rimuovi il giorno
      const nuovoSet = new Set(dateSelezionate);
      if (nuovoSet.has(dataISO)) {
        nuovoSet.delete(dataISO);
      } else {
        nuovoSet.add(dataISO);
      }

      const elencoOrdinato = Array.from(nuovoSet).sort();
      const prima = elencoOrdinato.length > 0 ? elencoOrdinato[0] : null;
      const ultima = elencoOrdinato.length > 0 ? elencoOrdinato[elencoOrdinato.length - 1] : null;
      suModificaSelezione(prima, ultima, elencoOrdinato);
    }
  };

  // Preimpostazioni rapide: 1 settimana lavorativa (5 gg) o 2 settimane (10 gg)
  const applicaSettimana = (numeroSettimane: number) => {
    const dInizio = dataPartenza ? new Date(dataPartenza + 'T00:00:00') : new Date(anno, mese, 1);
    // Sposta al primo giorno lavorativo se è weekend
    while (dInizio.getDay() === 0 || dInizio.getDay() === 6 || verificaGiornoFestivo(formattaDataISO(dInizio))) {
      dInizio.setDate(dInizio.getDate() + 1);
    }

    const isoInizio = formattaDataISO(dInizio);
    const dateLavorative: string[] = [];
    const cursore = new Date(dInizio);
    const giorniTarget = numeroSettimane * 5;

    while (dateLavorative.length < giorniTarget) {
      const iso = formattaDataISO(cursore);
      const day = cursore.getDay();
      if (day !== 0 && day !== 6 && !verificaGiornoFestivo(iso)) {
        dateLavorative.push(iso);
      }
      cursore.setDate(cursore.getDate() + 1);
    }

    const isoFine = dateLavorative[dateLavorative.length - 1];
    setDataPartenza(isoInizio);
    setDataArrivo(isoFine);
    suModificaSelezione(isoInizio, isoFine, dateLavorative);
  };

  const azzeraSelezione = () => {
    setDataPartenza(null);
    setDataArrivo(null);
    setDataHover(null);
    suModificaSelezione(null, null, []);
  };

  return (
    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
      
      {/* Switch Modalità: Periodo Continuo vs Giorni Singoli */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
        <div className="flex items-center bg-slate-200/80 p-0.5 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setModalita('intervallo');
              azzeraSelezione();
            }}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
              modalita === 'intervallo'
                ? 'bg-white text-aziendale-blu font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarRange className="w-3.5 h-3.5" />
            <span>Periodo Continuo (Da... A...)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setModalita('singoli');
              azzeraSelezione();
            }}
            className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1.5 ${
              modalita === 'singoli'
                ? 'bg-white text-aziendale-blu font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MousePointerClick className="w-3.5 h-3.5" />
            <span>Giorni Singoli a Scelta</span>
          </button>
        </div>

        {/* Pulsanti Rapidi */}
        <div className="flex items-center gap-1.5 text-[11px]">
          <button
            type="button"
            onClick={() => applicaSettimana(1)}
            className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 font-bold text-slate-700 hover:bg-slate-100"
          >
            +1 Settimana
          </button>
          <button
            type="button"
            onClick={() => applicaSettimana(2)}
            className="px-2 py-0.5 rounded-lg bg-white border border-slate-200 font-bold text-slate-700 hover:bg-slate-100"
          >
            +2 Settimane
          </button>
          {(dataPartenza || dateSelezionate.length > 0) && (
            <button
              type="button"
              onClick={azzeraSelezione}
              title="Azzera selezione"
              className="p-1 rounded-lg text-rose-600 hover:bg-rose-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Intestazione Mese con Frecce */}
      <div className="flex items-center justify-between">
        <h4 className="font-bold text-slate-800 text-sm">
          {NOMI_MESI_ITALIANI[mese]} {anno}
        </h4>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={mesePrecedente}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={meseSuccessivo}
            className="p-1 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Giorni della Settimana (Lun - Dom) */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {GIORNI_SETTIMANA_ITALIANI.map((g) => (
          <span key={g} className="text-[10px] font-bold text-slate-400 uppercase">
            {g}
          </span>
        ))}
      </div>

      {/* Griglia Giorni */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: giornoSettimanaIniziale }).map((_, idx) => (
          <div key={`spazio-${idx}`} className="h-8" />
        ))}

        {Array.from({ length: numeroGiorni }).map((_, idx) => {
          const g = idx + 1;
          const dataCorr = new Date(anno, mese, g);
          const iso = formattaDataISO(dataCorr);
          const day = dataCorr.getDay();
          const eWeekend = day === 0 || day === 6;
          const festivo = verificaGiornoFestivo(iso);
          const eFestivo = Boolean(festivo);

          // Calcolo dello stato di selezione
          let eSelezionato = false;
          let eEstremo = false;

          if (modalita === 'intervallo') {
            const dataFineEffettiva = dataArrivo || (dataPartenza && dataHover ? dataHover : null);
            
            if (dataPartenza && dataFineEffettiva) {
              const minData = dataPartenza <= dataFineEffettiva ? dataPartenza : dataFineEffettiva;
              const maxData = dataPartenza <= dataFineEffettiva ? dataFineEffettiva : dataPartenza;
              eSelezionato = iso >= minData && iso <= maxData;
              eEstremo = iso === minData || iso === maxData;
            } else if (dataPartenza && iso === dataPartenza) {
              eSelezionato = true;
              eEstremo = true;
            }
          } else {
            eSelezionato = dateSelezionate.includes(iso);
            eEstremo = eSelezionato;
          }

          let stile = 'text-slate-700 hover:bg-slate-200';
          if (eFestivo) {
            stile = 'bg-rose-50 text-rose-400 font-bold cursor-not-allowed';
          } else if (eWeekend) {
            stile = 'text-slate-300 cursor-not-allowed';
          } else if (eEstremo) {
            stile = 'bg-aziendale-blu text-white font-extrabold shadow-sm scale-105';
          } else if (eSelezionato) {
            stile = 'bg-blue-100 text-aziendale-blu font-bold';
          }

          return (
            <button
              key={iso}
              type="button"
              disabled={eWeekend || eFestivo}
              onMouseEnter={() => {
                if (dataPartenza && !dataArrivo) {
                  setDataHover(iso);
                }
              }}
              onClick={() => gestisciClickGiorno(iso, eWeekend, eFestivo)}
              title={festivo ? festivo.nome : `${g} ${NOMI_MESI_ITALIANI[mese]}`}
              className={`h-8 rounded-xl text-xs flex items-center justify-center transition-all ${stile}`}
            >
              {g}
            </button>
          );
        })}
      </div>

      {/* Barra di Stato e Istruzioni Dinamiche */}
      <div className="bg-white p-2.5 rounded-xl border border-slate-200 text-[11px] text-center font-medium">
        {modalita === 'intervallo' ? (
          !dataPartenza ? (
            <span className="text-slate-500">
              👉 Fai clic sul <strong>primo giorno</strong> del periodo di ferie
            </span>
          ) : !dataArrivo ? (
            <span className="text-amber-700 font-bold animate-pulse">
              📅 Inizio selezionato ({dataPartenza}). Ora fai clic sull'<strong>ultimo giorno</strong> del periodo
            </span>
          ) : (
            <span className="text-aziendale-blu font-extrabold">
              ✓ Periodo selezionato: dal {dataPartenza} al {dataArrivo} ({dateSelezionate.length} {dateSelezionate.length === 1 ? 'giorno lavorativo' : 'giorni lavorativi'})
            </span>
          )
        ) : (
          <span className="text-slate-600 font-bold">
            {dateSelezionate.length === 0
              ? 'Fai clic sui singoli giorni lavorativi che desideri richiedere'
              : `✓ ${dateSelezionate.length} giornate singole selezionate`}
          </span>
        )}
      </div>

    </div>
  );
};
