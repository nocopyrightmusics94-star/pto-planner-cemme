/**
 * Storico Assenze (Personale per il Dipendente e Generale/Persona per Persona per il Titolare)
 * C. Emme Impianti S.r.l.
 * 
 * 100% in lingua italiana - Con gestione del numero di protocollo medico anche postumo
 */

import React, { useState, useMemo } from 'react';
import { usaPianificatore } from '@/contesti/ContestoPianificatore';
import { usaAutenticazione } from '@/contesti/ContestoAutenticazione';
import { RichiestaFerie } from '@/tipi';
import {
  History,
  Palmtree,
  Clock,
  Stethoscope,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileText,
  Edit3,
  UserCheck,
  Building2,
  Calendar,
  Filter,
  Check,
  X,
  Undo2,
} from 'lucide-react';

export const StoricoAssenze: React.FC = () => {
  const {
    tutteLeRichieste,
    richiesteUtenzaVisualizzata,
    idUtenzaVisualizzata,
    impostaIdUtenzaVisualizzata,
    utenzaVisualizzataOggetto,
    impostaProtocolloMalattia,
    revocaRichiesta,
  } = usaPianificatore();
  const { tutteLeUtenze, eTitolare, utenzaAttiva } = usaAutenticazione();

  // Tab per il Titolare: 'generale' (tutti i dipendenti) oppure 'persona' (persona per persona)
  const [modalitaTitolare, setModalitaTitolare] = useState<'generale' | 'persona'>('generale');
  const [filtroTipo, setFiltroTipo] = useState<string>('tutti');

  // Stato per l'inserimento/modifica del numero di protocollo medico (anche postumo)
  const [richiestaInModificaProtocollo, setRichiestaInModificaProtocollo] = useState<RichiestaFerie | null>(null);
  const [nuovoProtocollo, setNuovoProtocollo] = useState('');

  // Richieste da visualizzare a seconda del ruolo e della modalità
  const elencoRichieste = useMemo(() => {
    let elenco: RichiestaFerie[] = [];
    if (!eTitolare) {
      elenco = richiesteUtenzaVisualizzata;
    } else {
      if (modalitaTitolare === 'generale') {
        elenco = tutteLeRichieste;
      } else {
        elenco = tutteLeRichieste.filter((r) => r.utenzaId === idUtenzaVisualizzata);
      }
    }

    if (filtroTipo !== 'tutti') {
      elenco = elenco.filter((r) => r.tipo === filtroTipo);
    }

    return elenco;
  }, [eTitolare, modalitaTitolare, tutteLeRichieste, idUtenzaVisualizzata, richiesteUtenzaVisualizzata, filtroTipo]);

  // Conteggio totali reali approvati per l'elenco attualmente visualizzato
  const totalizzatori = useMemo(() => {
    let ggFerie = 0;
    let orePermesso = 0;
    let ggMalattia = 0;

    elencoRichieste.forEach((r) => {
      if (r.stato === 'approvata') {
        if (r.tipo === 'ferie_intera') ggFerie += r.giorniTotaliLavorativi;
        else if (r.tipo === 'permesso_rol') orePermesso += (r.orePermessoPerGiorno || 4) * r.giorniTotaliLavorativi;
        else if (r.tipo === 'malattia') ggMalattia += r.giorniTotaliLavorativi;
      }
    });

    return { ggFerie, orePermesso, ggMalattia };
  }, [elencoRichieste]);

  const gestisciSalvaProtocollo = () => {
    if (!richiestaInModificaProtocollo) return;
    impostaProtocolloMalattia(richiestaInModificaProtocollo.id, nuovoProtocollo);
    setRichiestaInModificaProtocollo(null);
    setNuovoProtocollo('');
  };

  return (
    <div className="bg-white rounded-3xl border border-aziendale-grigioBordo shadow-sm p-6 space-y-6">
      
      {/* Testata dello Storico */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-aziendale-blu text-white">
            <History className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              {eTitolare
                ? modalitaTitolare === 'generale'
                  ? 'Storico Generale Assenze Aziendali'
                  : `Storico Assenze: ${utenzaVisualizzataOggetto?.nomeCompleto}`
                : 'Il Tuo Storico Personale Assenze'}
            </h3>
            <p className="text-xs text-slate-500">
              {eTitolare
                ? 'Riepilogo analitico di ferie, permessi e malattie fruite dal personale'
                : 'Tutte le tue richieste di ferie, permessi e certificati di malattia registrati'}
            </p>
          </div>
        </div>

        {/* Controlli per il Titolare: Switch Generale vs Persona per Persona */}
        <div className="flex flex-wrap items-center gap-2">
          {eTitolare && (
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl text-xs font-semibold">
              <button
                onClick={() => setModalitaTitolare('generale')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  modalitaTitolare === 'generale'
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Storico Generale</span>
              </button>

              <button
                onClick={() => setModalitaTitolare('persona')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  modalitaTitolare === 'persona'
                    ? 'bg-white text-slate-900 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>Persona per Persona</span>
              </button>
            </div>
          )}

          {/* Selettore persona specifica (quando in modalità Persona per Persona per il titolare) */}
          {eTitolare && modalitaTitolare === 'persona' && (
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-700">
              <UserCheck className="w-3.5 h-3.5 text-aziendale-blu ml-1" />
              <select
                value={idUtenzaVisualizzata}
                onChange={(e) => impostaIdUtenzaVisualizzata(e.target.value)}
                className="bg-transparent font-bold text-slate-900 focus:outline-none pr-1 pl-1 text-xs"
              >
                {tutteLeUtenze.map((u) => (
                  <option key={u.identificativo} value={u.identificativo}>
                    {u.nomeCompleto} ({u.ruolo === 'titolare' ? 'Titolare' : u.ruolo === 'responsabile' ? 'Responsabile' : 'Dipendente'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filtro per Tipologia di Assenza */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-500 ml-1" />
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
              className="bg-transparent font-bold text-slate-800 focus:outline-none pr-1 pl-1 text-xs"
            >
              <option value="tutti">Tutte le Tipologie</option>
              <option value="ferie_intera">Ferie</option>
              <option value="permesso_rol">Permesso Orario</option>
              <option value="malattia">Malattia</option>
            </select>
          </div>
        </div>
      </div>

      {/* Riquadri di Totale Reale (Senza Saldi o Tetti Fissi) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-blue-50/60 border border-blue-200/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
              Ferie Fruite
            </span>
            <span className="text-2xl font-extrabold text-blue-950">
              {totalizzatori.ggFerie} <span className="text-xs font-semibold text-blue-600">giorni</span>
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-100 text-aziendale-blu">
            <Palmtree className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-purple-50/60 border border-purple-200/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider block">
              Permessi Usufruiti
            </span>
            <span className="text-2xl font-extrabold text-purple-950">
              {totalizzatori.orePermesso} <span className="text-xs font-semibold text-purple-600">ore</span>
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-100 text-purple-700">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
              Giornate di Malattia
            </span>
            <span className="text-2xl font-extrabold text-emerald-950">
              {totalizzatori.ggMalattia} <span className="text-xs font-semibold text-emerald-700">giorni</span>
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700">
            <Stethoscope className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabella Dettagliata dello Storico */}
      <div className="overflow-x-auto border border-slate-200 rounded-2xl">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
            <tr>
              {eTitolare && modalitaTitolare === 'generale' && (
                <th className="p-3">Dipendente</th>
              )}
              <th className="p-3">Tipologia</th>
              <th className="p-3">Periodo Assenza</th>
              <th className="p-3">Quantità</th>
              <th className="p-3">Protocollo Certificato (Malattia)</th>
              <th className="p-3">Stato Decisione</th>
              <th className="p-3">Note / Motivazione</th>
              <th className="p-3 text-right">Data Richiesta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
            {elencoRichieste.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-6 text-center text-slate-400">
                  Nessuna assenza registrata per i filtri selezionati.
                </td>
              </tr>
            ) : (
              elencoRichieste.map((r) => {
                const eMalattia = r.tipo === 'malattia';
                const puoModificareProtocollo = eMalattia && (eTitolare || utenzaAttiva?.identificativo === r.utenzaId);

                return (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    {eTitolare && modalitaTitolare === 'generale' && (
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{r.nomeRichiedente}</div>
                        <div className="text-[10px] text-slate-400">{r.reparto || 'Personale'}</div>
                      </td>
                    )}

                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold ${
                          r.tipo === 'ferie_intera'
                            ? 'bg-blue-50 text-aziendale-blu border border-blue-200'
                            : r.tipo === 'permesso_rol'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {r.tipo === 'ferie_intera' && <Palmtree className="w-3.5 h-3.5 text-aziendale-blu" />}
                        {r.tipo === 'permesso_rol' && <Clock className="w-3.5 h-3.5 text-purple-600" />}
                        {r.tipo === 'malattia' && <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />}
                        <span>
                          {r.tipo === 'ferie_intera'
                            ? 'Ferie Intera'
                            : r.tipo === 'permesso_rol'
                            ? 'Permesso Orario'
                            : 'Malattia'}
                        </span>
                      </span>
                    </td>

                    <td className="p-3 font-semibold text-slate-800">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>
                          {r.dataInizio === r.dataFine ? r.dataInizio : `${r.dataInizio} → ${r.dataFine}`}
                        </span>
                      </div>
                    </td>

                    <td className="p-3 font-bold text-slate-900">
                      {r.tipo === 'permesso_rol'
                        ? `${(r.orePermessoPerGiorno || 4) * r.giorniTotaliLavorativi} ore (${r.orePermessoPerGiorno}h/gg)`
                        : `${r.giorniTotaliLavorativi} ${r.giorniTotaliLavorativi === 1 ? 'giorno' : 'giorni'}`}
                    </td>

                    {/* Colonna Numero di Protocollo (anche postumo) */}
                    <td className="p-3">
                      {eMalattia ? (
                        <div className="flex items-center gap-2">
                          {r.numeroProtocollo ? (
                            <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 text-[11px] flex items-center gap-1">
                              <FileText className="w-3 h-3 text-emerald-600" />
                              {r.numeroProtocollo}
                            </span>
                          ) : (
                            <span className="text-[11px] text-amber-700 italic">
                              Non ancora inserito
                            </span>
                          )}

                          {puoModificareProtocollo && (
                            <button
                              type="button"
                              onClick={() => {
                                setRichiestaInModificaProtocollo(r);
                                setNuovoProtocollo(r.numeroProtocollo || '');
                              }}
                              title="Inserisci o modifica numero di protocollo medico"
                              className="p-1 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>

                    <td className="p-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                            r.stato === 'approvata'
                              ? 'bg-emerald-100 text-emerald-800'
                              : r.stato === 'in_attesa'
                              ? 'bg-amber-100 text-amber-800'
                              : r.stato === 'revocata'
                              ? 'bg-purple-100 text-purple-900 border border-purple-200'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {r.stato === 'approvata' && (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Approvata
                            </>
                          )}
                          {r.stato === 'in_attesa' && (
                            <>
                              <AlertCircle className="w-3 h-3 text-amber-600" />
                              In Attesa
                            </>
                          )}
                          {r.stato === 'revocata' && (
                            <>
                              <Undo2 className="w-3 h-3 text-purple-600" />
                              Revocata
                            </>
                          )}
                          {r.stato === 'rifiutata' && (
                            <>
                              <XCircle className="w-3 h-3 text-rose-600" />
                              Rifiutata
                            </>
                          )}
                        </span>

                        {eTitolare && r.stato === 'approvata' && (
                          <button
                            type="button"
                            onClick={() => {
                              const motivo = window.prompt(
                                `Inserisci la motivazione aziendale per la revoca delle ferie di ${r.nomeRichiedente}:`,
                                'Esigenze di cantiere'
                              );
                              if (motivo && motivo.trim()) {
                                revocaRichiesta(r.id, motivo.trim());
                              }
                            }}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg text-[10px] font-bold border border-rose-200 flex items-center gap-0.5 transition-colors"
                            title="Revoca questa richiesta e notifica il dipendente"
                          >
                            <Undo2 className="w-3 h-3" />
                            <span>Revoca</span>
                          </button>
                        )}
                      </div>
                    </td>

                    <td className="p-3 text-slate-500 max-w-[200px] truncate" title={r.motivazione}>
                      {r.motivazione ? `"${r.motivazione}"` : '—'}
                    </td>

                    <td className="p-3 text-right text-slate-400 text-[11px]">
                      {r.dataInvio ? r.dataInvio.split('T')[0] : '—'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modale Inserimento/Modifica Protocollo Medico (Postumo) */}
      {richiestaInModificaProtocollo && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 border border-slate-200 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Aggiorna Protocollo Medico
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    {richiestaInModificaProtocollo.nomeRichiedente} — Periodo: {richiestaInModificaProtocollo.dataInizio}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRichiestaInModificaProtocollo(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Numero di Protocollo Telematico Certificato (INPS)
              </label>
              <input
                type="text"
                autoFocus
                placeholder="es. 987654321"
                value={nuovoProtocollo}
                onChange={(e) => setNuovoProtocollo(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono font-medium text-slate-800"
              />
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Il numero di protocollo aggiornato sarà visibile sia nel calendario che nei prospetti aziendali.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRichiestaInModificaProtocollo(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Annulla
              </button>
              <button
                type="button"
                onClick={gestisciSalvaProtocollo}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Salva Protocollo</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
