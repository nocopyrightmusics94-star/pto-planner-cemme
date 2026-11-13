/**
 * Modale di Gestione Copia di Sicurezza e Ripristino Dati
 * C. Emme Impianti S.r.l.
 * 
 * 100% in italiano - Backup e importazione dati aziendali
 */

import React, { useState } from 'react';
import {
  esportaCopiaDiSicurezza,
  ripristinaCopiaDiSicurezza,
} from '@/servizi/gestore-archiviazione';
import { usaAutenticazione } from '@/contesti/ContestoAutenticazione';
import { usaPianificatore } from '@/contesti/ContestoPianificatore';
import { Database, Download, Upload, CheckCircle, AlertCircle, X, ShieldAlert } from 'lucide-react';

interface ProprietaCopiaSicurezza {
  aperto: boolean;
  suChiudi: () => void;
}

export const CopiaSicurezzaModal: React.FC<ProprietaCopiaSicurezza> = ({ aperto, suChiudi }) => {
  const { ricaricaDati } = usaAutenticazione();
  const { ricaricaAssenzeERichieste } = usaPianificatore();
  const [esito, setEsito] = useState<{ tipo: 'successo' | 'errore'; messaggio: string } | null>(null);

  if (!aperto) return null;

  const gestisciEsportazione = () => {
    try {
      const jsonDati = esportaCopiaDiSicurezza();
      const blob = new Blob([jsonDati], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const dataOggi = new Date().toISOString().split('T')[0];
      const link = document.createElement('a');
      link.href = url;
      link.download = `cemme_impianti_backup_ferie_${dataOggi}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setEsito({
        tipo: 'successo',
        messaggio: 'Copia di sicurezza scaricata con successo sul tuo dispositivo!',
      });
    } catch {
      setEsito({
        tipo: 'errore',
        messaggio: 'Si è verificato un errore durante la creazione della copia di sicurezza.',
      });
    }
  };

  const gestisciImportazioneFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evento) => {
      const contenuto = evento.target?.result as string;
      const risultato = ripristinaCopiaDiSicurezza(contenuto);
      if (risultato.successo) {
        setEsito({ tipo: 'successo', messaggio: risultato.messaggio });
        ricaricaDati();
        ricaricaAssenzeERichieste();
      } else {
        setEsito({ tipo: 'errore', messaggio: risultato.messaggio });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        
        {/* Testata */}
        <div className="bg-slate-900 text-white p-5 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-600 text-white">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Copia di Sicurezza & Ripristino</h2>
              <p className="text-xs text-slate-300">
                Archiviazione e salvataggio dati di C. Emme Impianti S.r.l.
              </p>
            </div>
          </div>
          <button
            onClick={suChiudi}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corpo */}
        <div className="p-6 space-y-5 text-xs text-slate-700">
          
          {esito && (
            <div
              className={`p-3.5 rounded-2xl flex items-center gap-2.5 font-bold ${
                esito.tipo === 'successo'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {esito.tipo === 'successo' ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{esito.messaggio}</span>
            </div>
          )}

          {/* Sezione 1: Scarica Copia */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <Download className="w-4 h-4 text-aziendale-blu" />
              <span>Esporta Copia Dati Aziendali</span>
            </div>
            <p className="text-slate-500 leading-relaxed">
              Genera e scarica un file JSON contenente tutte le utenze create, le password cifrate e le ferie pianificate per tutti gli anni.
            </p>
            <button
              onClick={gestisciEsportazione}
              className="w-full py-2.5 px-4 bg-aziendale-blu hover:bg-aziendale-bluScuro text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Scarica File di Sicurezza (JSON)</span>
            </button>
          </div>

          {/* Sezione 2: Ripristina da File */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
              <Upload className="w-4 h-4 text-purple-600" />
              <span>Ripristina da un File Precedente</span>
            </div>
            <p className="text-slate-500 leading-relaxed">
              Seleziona un file di backup precedentemente esportato per ricaricare le informazioni aziendali su questo o su un altro computer.
            </p>
            <label className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer">
              <Upload className="w-4 h-4" />
              <span>Seleziona File di Backup</span>
              <input
                type="file"
                accept=".json"
                onChange={gestisciImportazioneFile}
                className="hidden"
              />
            </label>
          </div>

          <div className="flex items-start gap-2 text-slate-400 text-[11px] bg-slate-100 p-3 rounded-xl">
            <ShieldAlert className="w-4 h-4 shrink-0 text-slate-500" />
            <span>
              Nota: Il ripristino sovrascriverà i dati correnti con quelli contenuti nel file selezionato.
            </span>
          </div>

        </div>

        {/* Chiusura */}
        <div className="bg-slate-50 p-3.5 px-6 border-t border-slate-200 flex justify-end">
          <button
            onClick={suChiudi}
            className="px-4 py-1.5 text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl transition-colors"
          >
            Chiudi
          </button>
        </div>

      </div>
    </div>
  );
};
