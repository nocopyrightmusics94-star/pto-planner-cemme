/**
 * Quadro Generale e Vista Presenze Aziendali (Riservato al Titolare)
 * C. Emme Impianti S.r.l.
 * 
 * 100% in italiano - Monitoraggio organico squadre per prevenire scoperture nei cantieri
 */

import React, { useState, useMemo } from 'react';
import { usaPianificatore } from '@/contesti/ContestoPianificatore';
import { usaAutenticazione } from '@/contesti/ContestoAutenticazione';
import { NOMI_MESI_ITALIANI, GIORNI_SETTIMANA_ITALIANI, formattaDataISO, verificaGiornoFestivo } from '@/dati/festivita-italiane';
import { Building2, AlertTriangle, Calendar, Filter } from 'lucide-react';

export const VistaAziendale: React.FC = () => {
  const { annoSelezionato, tutteLeAssenzeAziendali } = usaPianificatore();
  const { tutteLeUtenze } = usaAutenticazione();

  // Mese selezionato per il dettaglio matriciale (0 = Gennaio ... 11 = Dicembre)
  const [meseAttivo, setMeseAttivo] = useState<number>(new Date().getMonth());
  const [filtroReparto, setFiltroReparto] = useState<string>('tutti');

  // Elenco reparti univoci
  const reparti = useMemo(() => {
    const set = new Set<string>();
    tutteLeUtenze.forEach((u) => {
      if (u.reparto) set.add(u.reparto);
    });
    return Array.from(set);
  }, [tutteLeUtenze]);

  // Utenti filtrati
  const utentiFiltrati = useMemo(() => {
    if (filtroReparto === 'tutti') return tutteLeUtenze;
    return tutteLeUtenze.filter((u) => u.reparto === filtroReparto);
  }, [tutteLeUtenze, filtroReparto]);

  // Giorni del mese attivo
  const ultimoDelMese = new Date(annoSelezionato, meseAttivo + 1, 0);
  const numeroGiorni = ultimoDelMese.getDate();

  // Mappa presenze: chiave = `${utenzaId}_${dataISO}` -> tipo assenza
  const mappaPresenze = useMemo(() => {
    const mappa = new Map<string, string>();
    tutteLeAssenzeAziendali.forEach((a) => {
      mappa.set(`${a.utenzaId}_${a.data}`, a.tipo);
    });
    return mappa;
  }, [tutteLeAssenzeAziendali]);

  // Calcolo delle sovrapposizioni (più di 1 dipendente assente lo stesso giorno)
  const sovrapposizioniGiornaliere = useMemo(() => {
    const conteggi = new Map<string, number>();
    for (let g = 1; g <= numeroGiorni; g++) {
      const d = new Date(annoSelezionato, meseAttivo, g);
      const iso = formattaDataISO(d);
      let assenti = 0;
      utentiFiltrati.forEach((u) => {
        if (mappaPresenze.has(`${u.identificativo}_${iso}`)) {
          assenti++;
        }
      });
      if (assenti > 1) {
        conteggi.set(iso, assenti);
      }
    }
    return conteggi;
  }, [annoSelezionato, meseAttivo, numeroGiorni, utentiFiltrati, mappaPresenze]);

  return (
    <div className="bg-white rounded-3xl border border-aziendale-grigioBordo shadow-sm p-6 space-y-6">
      
      {/* Intestazione */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-aziendale-blu text-white">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Quadro Presenze Aziendali — {NOMI_MESI_ITALIANI[meseAttivo]} {annoSelezionato}
            </h2>
            <p className="text-xs text-slate-500">
              Vista matriciale complessiva per il monitoraggio della forza lavoro e delle squadre operative
            </p>
          </div>
        </div>

        {/* Filtri: Selettore Mese e Reparto */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-slate-500 ml-1" />
            <select
              value={meseAttivo}
              onChange={(e) => setMeseAttivo(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none pr-1"
            >
              {NOMI_MESI_ITALIANI.map((nome, i) => (
                <option key={nome} value={i}>
                  {nome}
                </option>
              ))}
            </select>
          </div>

          {reparti.length > 0 && (
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-700">
              <Filter className="w-3.5 h-3.5 text-slate-500 ml-1" />
              <select
                value={filtroReparto}
                onChange={(e) => setFiltroReparto(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none pr-1"
              >
                <option value="tutti">Tutti i Reparti</option>
                {reparti.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Avviso Sovrapposizioni Squadre */}
      {sovrapposizioniGiornaliere.size > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 text-xs text-amber-800 font-semibold">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <span className="font-bold">Attenzione scoperture cantieri:</span> Sono presenti{' '}
            {sovrapposizioniGiornaliere.size} giornate con 2 o più collaboratori contemporaneamente assenti nel mese di{' '}
            {NOMI_MESI_ITALIANI[meseAttivo]}.
          </div>
        </div>
      )}

      {/* Matrice Presenze */}
      <div className="overflow-x-auto border border-slate-200 rounded-2xl">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <th className="p-3 sticky left-0 bg-slate-100 z-10 min-w-[200px] border-r border-slate-200">
                Personale & Squadra ({utentiFiltrati.length})
              </th>
              {Array.from({ length: numeroGiorni }).map((_, i) => {
                const g = i + 1;
                const d = new Date(annoSelezionato, meseAttivo, g);
                const iso = formattaDataISO(d);
                const dayOfWeek = d.getDay();
                const eWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                const festivo = verificaGiornoFestivo(iso);
                const giornoSettimanaNome = GIORNI_SETTIMANA_ITALIANI[dayOfWeek === 0 ? 6 : dayOfWeek - 1];
                const sovrapposizione = sovrapposizioniGiornaliere.get(iso);

                return (
                  <th
                    key={iso}
                    className={`p-1.5 text-center min-w-[32px] border-r border-slate-200 ${
                      festivo
                        ? 'bg-rose-100 text-rose-800 font-extrabold'
                        : eWeekend
                        ? 'bg-slate-200/70 text-slate-500'
                        : sovrapposizione
                        ? 'bg-amber-100 text-amber-900 font-extrabold'
                        : 'bg-slate-50 text-slate-700'
                    }`}
                    title={festivo ? festivo.nome : `${g} ${NOMI_MESI_ITALIANI[meseAttivo]}`}
                  >
                    <div className="text-[9px] uppercase">{giornoSettimanaNome}</div>
                    <div className="text-xs font-extrabold">{g}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {utentiFiltrati.map((utente) => (
              <tr key={utente.identificativo} className="hover:bg-slate-50/80 transition-colors">
                <td className="p-3 sticky left-0 bg-white z-10 border-r border-slate-200 font-bold text-slate-800 whitespace-nowrap shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                  <div className="flex items-center gap-1.5">
                    <span>{utente.nomeCompleto}</span>
                    <span
                      className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase border ${
                        utente.ruolo === 'titolare'
                          ? 'bg-amber-100 text-amber-800 border-amber-300'
                          : utente.ruolo === 'responsabile'
                          ? 'bg-purple-100 text-purple-800 border-purple-300'
                          : 'bg-slate-100 text-slate-700 border-slate-300'
                      }`}
                    >
                      {utente.ruolo === 'titolare' ? 'Titolare' : utente.ruolo === 'responsabile' ? 'Responsabile' : 'Dipendente'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">
                    {utente.reparto || 'Personale'} ({utente.identificativo})
                  </div>
                </td>

                {Array.from({ length: numeroGiorni }).map((_, i) => {
                  const g = i + 1;
                  const d = new Date(annoSelezionato, meseAttivo, g);
                  const iso = formattaDataISO(d);
                  const dayOfWeek = d.getDay();
                  const eWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                  const festivo = verificaGiornoFestivo(iso);
                  const tipoAssenza = mappaPresenze.get(`${utente.identificativo}_${iso}`);

                  let sfondo = '';
                  let contenuto = '';

                  if (festivo) {
                    sfondo = 'bg-rose-50 text-rose-700';
                    contenuto = '★';
                  } else if (tipoAssenza === 'ferie_intera') {
                    sfondo = 'bg-aziendale-blu text-white font-bold';
                    contenuto = 'F';
                  } else if (tipoAssenza === 'malattia') {
                    sfondo = 'bg-emerald-600 text-white font-bold';
                    contenuto = 'M';
                  } else if (tipoAssenza === 'permesso_rol') {
                    sfondo = 'bg-purple-600 text-white font-bold';
                    contenuto = 'P';
                  } else if (eWeekend) {
                    sfondo = 'bg-slate-100/60 text-slate-300';
                  }

                  return (
                    <td
                      key={iso}
                      className={`p-1 text-center border-r border-slate-100 text-xs ${sfondo}`}
                      title={
                        tipoAssenza
                          ? `${utente.nomeCompleto}: ${
                              tipoAssenza === 'ferie_intera'
                                ? 'Ferie intera'
                                : tipoAssenza === 'malattia'
                                ? 'Malattia'
                                : tipoAssenza === 'permesso_rol'
                                ? 'Permesso ROL'
                                : 'Festivo'
                            } il ${g} ${NOMI_MESI_ITALIANI[meseAttivo]}`
                          : ''
                      }
                    >
                      {contenuto}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legenda rapida della tabella */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600 pt-2 border-t border-slate-100">
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-md bg-aziendale-blu text-white font-bold flex items-center justify-center text-[10px]">
            F
          </span>
          <span>Ferie</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-md bg-emerald-600 text-white font-bold flex items-center justify-center text-[10px]">
            M
          </span>
          <span>Malattia</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-md bg-purple-600 text-white font-bold flex items-center justify-center text-[10px]">
            P
          </span>
          <span>Permesso Orario</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded-md bg-rose-100 text-rose-700 font-bold flex items-center justify-center text-[10px]">
            ★
          </span>
          <span>Festività Ufficiale</span>
        </div>
      </div>

    </div>
  );
};
