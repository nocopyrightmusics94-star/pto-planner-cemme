/**
 * Pannello Approvazione Richieste Ferie e Permessi (Riservato al Titolare)
 * C. Emme Impianti S.r.l.
 * 
 * 100% in italiano - Decisione immediata con pulsanti Accetta / Rifiuta
 */

import React, { useState } from 'react';
import { usaPianificatore } from '@/contesti/ContestoPianificatore';
import { usaAutenticazione } from '@/contesti/ContestoAutenticazione';
import {
  CheckCircle2,
  XCircle,
  Briefcase,
  Calendar,
  Inbox,
  Check,
  X,
  ShieldCheck,
  UserCheck,
  Info,
} from 'lucide-react';

export const PannelloApprovazioni: React.FC = () => {
  const { richiesteInAttesaApprovabili, tutteLeRichieste, accettaRichiesta, rifiutaRichiesta } = usaPianificatore();
  const { eTitolare, eResponsabile } = usaAutenticazione();
  const [schedaAttiva, setSchedaAttiva] = useState<'in_attesa' | 'storico'>('in_attesa');
  const [notaDecisione, setNotaDecisione] = useState<string>('');

  // Storico filtrato in base ai permessi
  const richiesteStorico = tutteLeRichieste.filter((r) => {
    if (r.stato === 'in_attesa') return false;
    if (eTitolare) return true;
    if (eResponsabile) {
      return r.ruoloRichiedente !== 'responsabile' && r.ruoloRichiedente !== 'titolare';
    }
    return false;
  });

  const gestisciAccetta = (id: string) => {
    accettaRichiesta(id, notaDecisione || undefined);
    setNotaDecisione('');
  };

  const gestisciRifiuta = (id: string) => {
    rifiutaRichiesta(id, notaDecisione || undefined);
    setNotaDecisione('');
  };

  return (
    <div className="bg-white rounded-3xl border border-aziendale-grigioBordo shadow-sm p-6 space-y-4">
      {/* Intestazione */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-2xl text-white ${eTitolare ? 'bg-amber-500' : 'bg-purple-600'}`}>
            {eTitolare ? <ShieldCheck className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              {eTitolare
                ? 'Approvazione Richieste Ferie & Permessi (Direzione)'
                : 'Approvazione Richieste Ferie & Permessi (Responsabile)'}
            </h3>
            <p className="text-xs text-slate-500">
              {eTitolare
                ? 'Valutazione e approvazione per tutto il personale aziendale (Dipendenti e Responsabili)'
                : 'Valutazione autorizzazioni per il personale dipendente di C. Emme Impianti S.r.l.'}
            </p>
          </div>
        </div>

        {/* Tab selettore */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setSchedaAttiva('in_attesa')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              schedaAttiva === 'in_attesa'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>In Attesa</span>
            {richiesteInAttesaApprovabili.length > 0 && (
              <span className={`text-white text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${eTitolare ? 'bg-amber-500' : 'bg-purple-600'}`}>
                {richiesteInAttesaApprovabili.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setSchedaAttiva('storico')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              schedaAttiva === 'storico'
                ? 'bg-white text-slate-900 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Storico Decisioni ({richiesteStorico.length})
          </button>
        </div>
      </div>

      {/* Nota informativa per il Responsabile */}
      {eResponsabile && !eTitolare && (
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-3 flex items-center gap-2 text-xs text-purple-900 font-medium">
          <Info className="w-4 h-4 text-purple-600 shrink-0" />
          <span>
            In qualità di Responsabile puoi approvare le richieste dei Dipendenti. Le tue richieste personali di ferie o permessi possono essere accettate solo dal <strong>Titolare</strong>.
          </span>
        </div>
      )}

      {/* Contenuto Scheda: IN ATTESA */}
      {schedaAttiva === 'in_attesa' && (
        <>
          {richiesteInAttesaApprovabili.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <Inbox className="w-10 h-10 text-slate-300 mx-auto" />
              <h4 className="font-bold text-slate-700 text-sm">
                Nessuna richiesta in attesa di approvazione
              </h4>
              <p className="text-xs text-slate-400">
                Tutte le richieste di ferie e permessi di tua competenza sono state valutate.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {richiesteInAttesaApprovabili.map((richiesta) => (
                <div
                  key={richiesta.id}
                  className="bg-amber-50/50 border border-amber-200 rounded-2xl p-4 flex flex-col justify-between space-y-3 shadow-xs hover:border-amber-300 transition-all"
                >
                  <div className="space-y-2">
                    {/* Richiedente e Badge Tipo */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm">
                            {richiesta.nomeRichiedente}
                          </h4>
                          <span
                            className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-md uppercase border ${
                              richiesta.ruoloRichiedente === 'responsabile'
                                ? 'bg-purple-100 text-purple-800 border-purple-300'
                                : 'bg-slate-100 text-slate-700 border-slate-300'
                            }`}
                          >
                            {richiesta.ruoloRichiedente === 'responsabile' ? 'Responsabile' : 'Dipendente'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                          <Briefcase className="w-3 h-3 text-slate-400" />
                          <span>{richiesta.reparto || 'Personale'}</span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                          richiesta.tipo === 'ferie_intera'
                            ? 'bg-blue-100 text-aziendale-blu border border-blue-200'
                            : richiesta.tipo === 'malattia'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-purple-100 text-purple-700 border border-purple-200'
                        }`}
                      >
                        {richiesta.tipo === 'ferie_intera'
                          ? 'Ferie'
                          : richiesta.tipo === 'malattia'
                          ? 'Malattia'
                          : `Permesso (${richiesta.orePermessoPerGiorno}h/gg)`}
                      </span>
                    </div>

                    {/* Date e durata */}
                    <div className="bg-white p-2.5 rounded-xl border border-amber-200/80 text-xs text-slate-700 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-semibold">
                        <Calendar className="w-4 h-4 text-amber-600" />
                        <span>
                          Dal {richiesta.dataInizio} al {richiesta.dataFine}
                        </span>
                      </div>
                      <span className="font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200 text-[11px]">
                        {richiesta.giorniTotaliLavorativi}{' '}
                        {richiesta.giorniTotaliLavorativi === 1 ? 'giorno lavorativo' : 'giorni lavorativi'}
                      </span>
                    </div>

                    {/* Note del richiedente */}
                    {richiesta.motivazione && (
                      <div className="text-xs text-slate-600 italic bg-amber-100/40 p-2 rounded-lg">
                        "{richiesta.motivazione}"
                      </div>
                    )}
                  </div>

                  {/* Azioni: Pulsante Accetta e Rifiuta */}
                  <div className="pt-2 border-t border-amber-200/60 flex items-center gap-2">
                    <button
                      onClick={() => gestisciAccetta(richiesta.id)}
                      className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      <span>Accetta Richiesta</span>
                    </button>

                    <button
                      onClick={() => gestisciRifiuta(richiesta.id)}
                      className="flex-1 py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                    >
                      <X className="w-4 h-4" />
                      <span>Rifiuta</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Contenuto Scheda: STORICO */}
      {schedaAttiva === 'storico' && (
        <div className="overflow-x-auto border border-slate-200 rounded-2xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="p-3">Dipendente</th>
                <th className="p-3">Tipologia</th>
                <th className="p-3">Periodo Richiesto</th>
                <th className="p-3">Giorni</th>
                <th className="p-3">Esito Decisione</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {richiesteStorico.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-slate-400">
                    Nessuna decisione registrata nello storico.
                  </td>
                </tr>
              ) : (
                richiesteStorico.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-bold text-slate-900">{r.nomeRichiedente}</td>
                    <td className="p-3 capitalize">{r.tipo.replace('_', ' ')}</td>
                    <td className="p-3">
                      Dal {r.dataInizio} al {r.dataFine}
                    </td>
                    <td className="p-3 font-semibold">{r.giorniTotaliLavorativi} gg</td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          r.stato === 'approvata'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {r.stato === 'approvata' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Accettata
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-rose-600" />
                            Rifiutata
                          </>
                        )}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
