/**
 * Riepilogo Assenze Godute e Richieste in Corso
 * C. Emme Impianti S.r.l.
 * 
 * 100% in lingua italiana - Rimozione tetti fissi e visualizzazione dati reali
 */

import React from 'react';
import { usaPianificatore } from '@/contesti/ContestoPianificatore';
import { usaAutenticazione } from '@/contesti/ContestoAutenticazione';
import {
  Clock,
  Palmtree,
  UserCheck,
  CalendarPlus,
  AlertCircle,
  Stethoscope,
} from 'lucide-react';

interface ProprietaRiepilogoSaldi {
  suApriNuovaRichiesta: () => void;
}

export const RiepilogoSaldi: React.FC<ProprietaRiepilogoSaldi> = ({ suApriNuovaRichiesta }) => {
  const {
    statistiche,
    idUtenzaVisualizzata,
    impostaIdUtenzaVisualizzata,
  } = usaPianificatore();
  const { tutteLeUtenze, eTitolare } = usaAutenticazione();

  return (
    <div className="space-y-4">
      
      {/* Barra Superiore: Selettore Dipendente (se Titolare) e Pulsante Nuova Richiesta */}
      <div className="bg-white p-4 rounded-3xl border border-aziendale-grigioBordo shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Selettore dipendente per il titolare */}
        {eTitolare && tutteLeUtenze.length > 1 ? (
          <div className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-aziendale-blu shrink-0" />
            <span className="text-xs font-bold text-slate-700">Visualizzazione per:</span>
            <select
              value={idUtenzaVisualizzata}
              onChange={(e) => impostaIdUtenzaVisualizzata(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-aziendale-blu"
            >
              {tutteLeUtenze.map((u) => (
                <option key={u.identificativo} value={u.identificativo}>
                  {u.nomeCompleto} ({u.ruolo === 'titolare' ? 'Titolare' : u.ruolo === 'responsabile' ? 'Responsabile' : 'Dipendente'})
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-slate-600 text-xs font-semibold">
            <Palmtree className="w-4 h-4 text-aziendale-blu" />
            <span>Pianificazione ferie, permessi e malattia senza vincoli</span>
          </div>
        )}

        {/* Pulsante Principale: NUOVA RICHIESTA */}
        <button
          onClick={suApriNuovaRichiesta}
          className="py-2.5 px-5 bg-aziendale-blu hover:bg-aziendale-bluScuro text-white text-xs font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 hover:scale-[1.02]"
        >
          <CalendarPlus className="w-4 h-4" />
          <span>Nuova Richiesta (Ferie, Permesso o Malattia)</span>
        </button>

      </div>

      {/* Griglia delle 4 Schede di Riepilogo Assenze Fruite */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Scheda 1: Ferie Godute */}
        <div className="bg-white rounded-3xl p-5 border border-aziendale-grigioBordo shadow-scheda relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Ferie Godute
            </span>
            <div className="p-2 rounded-xl bg-blue-50 text-aziendale-blu">
              <Palmtree className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-extrabold text-slate-900">
              {statistiche.totaleGiorniFerieGodute}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              giorni fruiti
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            Giornate di ferie confermate ed approvate.
          </p>
        </div>

        {/* Scheda 2: Permessi Orari Goduti */}
        <div className="bg-white rounded-3xl p-5 border border-aziendale-grigioBordo shadow-scheda relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Permessi Orari
            </span>
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-extrabold text-slate-900">
              {statistiche.totaleOrePermessiGodute}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              ore usufruite
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            Ore di permesso orario autorizzate.
          </p>
        </div>

        {/* Scheda 3: Giornate di Malattia */}
        <div className="bg-white rounded-3xl p-5 border border-aziendale-grigioBordo shadow-scheda relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Malattia
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
              <Stethoscope className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-extrabold text-slate-900">
              {statistiche.totaleGiorniMalattia}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              giorni registrati
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            Con protocollo certificato INPS.
          </p>
        </div>

        {/* Scheda 4: Richieste in Attesa */}
        <div className="bg-white rounded-3xl p-5 border border-aziendale-grigioBordo shadow-scheda relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {eTitolare ? 'Richieste da Valutare' : 'In Attesa di Conferma'}
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl font-extrabold text-slate-900">
              {statistiche.richiesteInAttesa}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              richieste pendenti
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            {eTitolare
              ? 'In attesa di approvazione o rifiuto.'
              : 'In attesa della decisione del Titolare.'}
          </p>
        </div>

      </div>
    </div>
  );
};
