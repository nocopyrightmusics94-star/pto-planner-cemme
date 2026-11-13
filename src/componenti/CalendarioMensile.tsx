/**
 * Calendario a Singolo Mese con Nomi dei Dipendenti, Revoca Ferie e Chiusura Aziendale
 * C. Emme Impianti S.r.l.
 * 
 * 100% in italiano - Vista supervisione Direzione e piano personale collaboratore
 */

import React, { useState } from 'react';
import { usaPianificatore } from '@/contesti/ContestoPianificatore';
import { usaAutenticazione } from '@/contesti/ContestoAutenticazione';
import {
  NOMI_MESI_ITALIANI,
  GIORNI_SETTIMANA_ESTESI,
  formattaDataISO,
  verificaGiornoFestivo,
} from '@/dati/festivita-italiane';
import { VoceAssenza } from '@/tipi';
import { ModaleChiusuraAziendale } from './ModaleChiusuraAziendale';
import {
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  AlertCircle,
  X,
  Printer,
  FileText,
  Edit3,
  Building2,
  Undo2,
  Send,
  Briefcase,
  Calendar,
} from 'lucide-react';

export const CalendarioMensile: React.FC = () => {
  const {
    annoSelezionato,
    meseSelezionato,
    vaiAlMesePrecedente,
    vaiAlMeseSuccessivo,
    tornaAlMeseCorrente,
    assenzeUtenza,
    mappaAssenzeAziendaliPerData,
    chiusureAziendali,
    cancellaGiorno,
    impostaProtocolloMalattia,
    revocaRichiesta,
  } = usaPianificatore();
  const { eTitolare, tutteLeUtenze } = usaAutenticazione();

  // Stato modale dettaglio giorno
  const [dataGiornoSelezionato, setDataGiornoSelezionato] = useState<string | null>(null);

  // Stato per la revoca di una richiesta specifica
  const [assenzaInRevoca, setAssenzaInRevoca] = useState<VoceAssenza | null>(null);
  const [motivazioneRevoca, setMotivazioneRevoca] = useState('');
  const [confermaRevocaMessaggio, setConfermaRevocaMessaggio] = useState<string | null>(null);

  // Stato per la modifica del protocollo medico
  const [inModificaProtocollo, setInModificaProtocollo] = useState(false);
  const [assenzaModificaProtocollo, setAssenzaModificaProtocollo] = useState<VoceAssenza | null>(null);
  const [nuovoProtocollo, setNuovoProtocollo] = useState('');

  // Modale Chiusura Aziendale
  const [chiusuraModalAperta, setChiusuraModalAperta] = useState(false);

  const primoDelMese = new Date(annoSelezionato, meseSelezionato, 1);
  const ultimoDelMese = new Date(annoSelezionato, meseSelezionato + 1, 0);
  const numeroGiorniNelMese = ultimoDelMese.getDate();

  let giornoSettimanaIniziale = primoDelMese.getDay() - 1;
  if (giornoSettimanaIniziale === -1) giornoSettimanaIniziale = 6;

  const oggi = new Date();
  const oggiISO = formattaDataISO(oggi);

  // Mappa assenze personali (per dipendenti)
  const mappaAssenzePersonali = new Map<string, VoceAssenza>();
  assenzeUtenza.forEach((a) => mappaAssenzePersonali.set(a.data, a));

  const gestisciStampa = () => {
    window.print();
  };

  const gestisciEseguiRevoca = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assenzaInRevoca) return;

    if (!motivazioneRevoca.trim()) {
      alert('Inserisci la motivazione aziendale per la revoca delle ferie.');
      return;
    }

    const idDaRevocare = assenzaInRevoca.richiestaId || assenzaInRevoca.id;
    revocaRichiesta(idDaRevocare, motivazioneRevoca.trim());

    setConfermaRevocaMessaggio(
      `Ferie per ${assenzaInRevoca.nomeUtente || assenzaInRevoca.utenzaId} revocate con successo! Il dipendente ha ricevuto una notifica formale.`
    );
    setAssenzaInRevoca(null);
    setMotivazioneRevoca('');

    setTimeout(() => {
      setConfermaRevocaMessaggio(null);
    }, 3000);
  };

  const salvaProtocolloDalDettaglio = () => {
    if (!assenzaModificaProtocollo || !assenzaModificaProtocollo.richiestaId) return;
    impostaProtocolloMalattia(assenzaModificaProtocollo.richiestaId, nuovoProtocollo);
    setInModificaProtocollo(false);
    setAssenzaModificaProtocollo(null);
  };

  return (
    <div className="bg-white rounded-3xl border border-aziendale-grigioBordo shadow-sm p-6 space-y-6">
      
      {/* Testata di Controllo del Calendario con Frecce & Azioni Direzione */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        
        {/* Titolo Mese e Navigatore a Frecce */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
            <button
              onClick={vaiAlMesePrecedente}
              title="Mese precedente"
              className="p-2 text-slate-700 hover:text-aziendale-blu hover:bg-white rounded-xl transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="px-4 text-center min-w-[180px]">
              <span className="text-lg font-extrabold text-slate-900 block leading-tight">
                {NOMI_MESI_ITALIANI[meseSelezionato]}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Anno {annoSelezionato}
              </span>
            </div>

            <button
              onClick={vaiAlMeseSuccessivo}
              title="Mese successivo"
              className="p-2 text-slate-700 hover:text-aziendale-blu hover:bg-white rounded-xl transition-all"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Pulsante Torna ad Oggi */}
          <button
            onClick={tornaAlMeseCorrente}
            title="Torna al mese corrente di oggi"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span>Mese Corrente</span>
          </button>
        </div>

        {/* Azioni Titolare e Stampa */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {eTitolare && (
            <button
              onClick={() => setChiusuraModalAperta(true)}
              title="Programma una chiusura aziendale collettiva per tutti i collaboratori"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all"
            >
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>Chiusura Aziendale</span>
            </button>
          )}

          <button
            onClick={gestisciStampa}
            title="Stampa prospetto del mese"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
          >
            <Printer className="w-4 h-4 text-slate-600" />
            <span>Stampa Mese</span>
          </button>
        </div>

      </div>

      {/* Griglia della Settimana (Lun - Dom) */}
      <div className="grid grid-cols-7 gap-2 text-center">
        {GIORNI_SETTIMANA_ESTESI.map((nome, idx) => (
          <div
            key={nome}
            className={`py-2 text-xs font-bold uppercase tracking-wider rounded-xl ${
              idx >= 5 ? 'bg-slate-100/60 text-slate-400' : 'bg-slate-50 text-slate-600'
            }`}
          >
            <span className="hidden md:inline">{nome}</span>
            <span className="md:hidden">{nome.slice(0, 3)}</span>
          </div>
        ))}
      </div>

      {/* Griglia dei Giorni del Mese */}
      <div className="grid grid-cols-7 gap-2 min-h-[440px]">
        {Array.from({ length: giornoSettimanaIniziale }).map((_, idx) => (
          <div
            key={`spazio-${idx}`}
            className="rounded-2xl border border-transparent bg-slate-50/30"
          />
        ))}

        {Array.from({ length: numeroGiorniNelMese }).map((_, idx) => {
          const g = idx + 1;
          const dataCorr = new Date(annoSelezionato, meseSelezionato, g);
          const dataISO = formattaDataISO(dataCorr);
          const day = dataCorr.getDay();
          const eWeekend = day === 0 || day === 6;
          const festivo = verificaGiornoFestivo(dataISO);
          const eFestivo = Boolean(festivo);
          const eOggi = dataISO === oggiISO;

          // Chiusura aziendale collettiva presente in questa data
          const chiusuraDelGiorno = chiusureAziendali.find((c) =>
            c.dateCoinvolte.includes(dataISO)
          );

          // Assenze del giorno
          let assenzeGiorno: VoceAssenza[] = [];
          if (eTitolare) {
            // Nella schermata del titolare: mostra TUTTE le assenze di ciascun collaboratore
            const tutte = mappaAssenzeAziendaliPerData.get(dataISO) || [];
            // Rimuovi eventuali duplicati di chiusura aziendale per non ingombrare la cella
            assenzeGiorno = tutte.filter((a) => a.tipo !== 'chiusura_aziendale');
          } else {
            // Per il dipendente: mostra la propria assenza
            const propria = mappaAssenzePersonali.get(dataISO);
            if (propria && propria.tipo !== 'chiusura_aziendale') {
              assenzeGiorno = [propria];
            }
          }

          let bordo = 'border-slate-200/90';
          let sfondo = 'bg-white hover:border-slate-400';

          if (eFestivo) {
            sfondo = 'bg-rose-50/70 border-rose-200';
          } else if (chiusuraDelGiorno) {
            sfondo = 'bg-indigo-50/80 border-indigo-300 ring-1 ring-indigo-400/30';
          } else if (assenzeGiorno.length > 0) {
            const haInAttesa = assenzeGiorno.some((a) => a.stato === 'in_attesa');
            if (haInAttesa) {
              sfondo = 'bg-amber-50/60 border-amber-300';
            } else {
              sfondo = 'bg-blue-50/60 border-blue-200';
            }
          } else if (eWeekend) {
            sfondo = 'bg-slate-50/80 border-slate-200/50 text-slate-400';
          }

          const haElementiInterattivi =
            eFestivo || Boolean(chiusuraDelGiorno) || assenzeGiorno.length > 0;

          return (
            <div
              key={dataISO}
              onClick={() => {
                setDataGiornoSelezionato(dataISO);
              }}
              className={`min-h-[85px] md:min-h-[95px] p-2 rounded-2xl border transition-all flex flex-col justify-between ${sfondo} ${bordo} ${
                eOggi ? 'ring-2 ring-amber-500 shadow-sm' : ''
              } ${haElementiInterattivi ? 'cursor-pointer hover:shadow-md' : 'hover:bg-slate-50/50 cursor-pointer'}`}
            >
              {/* Intestazione Giorno e Badge Oggi */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-sm font-extrabold ${
                    eFestivo
                      ? 'text-rose-600'
                      : eWeekend
                      ? 'text-slate-400'
                      : 'text-slate-800'
                  }`}
                >
                  {g}
                </span>

                {eOggi && (
                  <span className="text-[9px] font-extrabold bg-amber-500 text-white px-1.5 py-0.2 rounded-full uppercase">
                    Oggi
                  </span>
                )}
              </div>

              {/* Corpo della Cella: Festività, Chiusura Aziendale, e NOMI PERSONE IN FERIE */}
              <div className="space-y-1 mt-1">
                {eFestivo && (
                  <div className="text-[10px] font-bold text-rose-700 leading-tight line-clamp-1">
                    ★ {festivo?.nome}
                  </div>
                )}

                {chiusuraDelGiorno && (
                  <div
                    className="flex items-center gap-1 text-[10px] font-extrabold text-indigo-900 bg-indigo-100 border border-indigo-200 px-1.5 py-0.5 rounded-md truncate"
                    title={`Chiusura Aziendale: ${chiusuraDelGiorno.titolo}`}
                  >
                    <Building2 className="w-3 h-3 text-indigo-700 shrink-0" />
                    <span className="truncate">{chiusuraDelGiorno.titolo}</span>
                  </div>
                )}

                {/* Elenco Nomi Collaboratori in Ferie / Assenza */}
                {assenzeGiorno.slice(0, 3).map((a, i) => {
                  const nome = a.nomeUtente || a.utenzaId;
                  const eFerie = a.tipo === 'ferie_intera';
                  const eMalattia = a.tipo === 'malattia';
                  const eInAttesa = a.stato === 'in_attesa';

                  return (
                    <div
                      key={`${a.utenzaId}_${i}`}
                      className={`flex items-center justify-between gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md truncate transition-all ${
                        eInAttesa
                          ? 'bg-amber-100/90 text-amber-900 border border-amber-300'
                          : eFerie
                          ? 'bg-blue-100/90 text-aziendale-blu border border-blue-200'
                          : eMalattia
                          ? 'bg-emerald-100/90 text-emerald-900 border border-emerald-200'
                          : 'bg-purple-100/90 text-purple-900 border border-purple-200'
                      }`}
                      title={`${nome}: ${
                        eFerie
                          ? 'Ferie'
                          : eMalattia
                          ? 'Malattia'
                          : `Permesso (${a.quantita}h)`
                      } (${eInAttesa ? 'In attesa' : 'Approvata'})`}
                    >
                      <span className="truncate">
                        {eTitolare ? `👤 ${nome}` : eFerie ? 'Ferie' : eMalattia ? 'Malattia' : `Permesso ${a.quantita}h`}
                      </span>
                      <span className="text-[9px] font-extrabold shrink-0 uppercase opacity-85">
                        {eInAttesa
                          ? 'Attesa'
                          : eFerie
                          ? 'Ferie'
                          : eMalattia
                          ? 'Mal.'
                          : `${a.quantita}h`}
                      </span>
                    </div>
                  );
                })}

                {assenzeGiorno.length > 3 && (
                  <div className="text-[9px] text-slate-500 font-bold text-center">
                    +{assenzeGiorno.length - 3} altri collaboratori
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legenda del Calendario */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-slate-600 pt-3 border-t border-slate-100">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-blue-100 border border-aziendale-blu inline-block" />
            <span>Ferie Approvata</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-indigo-100 border border-indigo-400 inline-block" />
            <span>Chiusura Aziendale</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-emerald-100 border border-emerald-500 inline-block" />
            <span>Malattia</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-purple-100 border border-purple-400 inline-block" />
            <span>Permesso Orario</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-amber-100 border border-amber-400 inline-block" />
            <span>In Attesa di Valutazione</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-md bg-rose-100 border border-rose-300 inline-block" />
            <span>Festività Ufficiale</span>
          </div>
        </div>
      </div>

      {/* Modale Dettaglio Giorno: Elenco Persone in Ferie e Funzione di Revoca */}
      {dataGiornoSelezionato && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full space-y-5 border border-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            
            {/* Intestazione del Giorno */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-aziendale-blu" />
                  <span>Piano Giornata: {dataGiornoSelezionato}</span>
                </h4>
                <p className="text-xs text-slate-500">
                  {eTitolare
                    ? 'Supervisione assenze organico, dettagli e revoca ferie'
                    : 'Dettaglio della pianificazione per questa data'}
                </p>
              </div>
              <button
                onClick={() => {
                  setDataGiornoSelezionato(null);
                  setAssenzaInRevoca(null);
                  setMotivazioneRevoca('');
                }}
                className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Eventuale Notifica / Messaggio di Conferma Revoca */}
            {confermaRevocaMessaggio && (
              <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{confermaRevocaMessaggio}</span>
              </div>
            )}

            {/* Eventuale Chiusura Aziendale Programmata */}
            {(() => {
              const chiusura = chiusureAziendali.find((c) =>
                c.dateCoinvolte.includes(dataGiornoSelezionato)
              );
              if (!chiusura) return null;
              return (
                <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-2xl text-xs space-y-1">
                  <div className="flex items-center gap-2 text-indigo-950 font-bold">
                    <Building2 className="w-4 h-4 text-indigo-700" />
                    <span>Chiusura Aziendale Collettiva: {chiusura.titolo}</span>
                  </div>
                  <p className="text-indigo-800">
                    Periodo dal {chiusura.dataInizio} al {chiusura.dataFine} ({chiusura.giorniLavorativi} gg).
                  </p>
                  {chiusura.descrizione && (
                    <p className="text-[11px] text-indigo-700 italic">"{chiusura.descrizione}"</p>
                  )}
                </div>
              );
            })()}

            {/* Elenco Collaboratori Assenti in questa Data */}
            {(() => {
              const assenzeDelGiorno = eTitolare
                ? (mappaAssenzeAziendaliPerData.get(dataGiornoSelezionato) || []).filter(
                    (a) => a.tipo !== 'chiusura_aziendale'
                  )
                : assenzeUtenza.filter(
                    (a) => a.data === dataGiornoSelezionato && a.tipo !== 'chiusura_aziendale'
                  );

              if (assenzeDelGiorno.length === 0) {
                return (
                  <div className="py-6 text-center text-slate-500 text-xs space-y-1">
                    <p className="font-bold text-slate-700">Nessuna assenza programmata per questa giornata</p>
                    <p className="text-[11px] text-slate-400">
                      Tutto il personale è regolarmente in servizio o operativo nei cantieri.
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  <h5 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                    {eTitolare ? `Collaboratori Assenti (${assenzeDelGiorno.length})` : 'La Tua Richiesta'}
                  </h5>

                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                    {assenzeDelGiorno.map((a) => {
                      const utenteInfo = tutteLeUtenze.find(
                        (u) => u.identificativo === a.utenzaId
                      );
                      const eInRevocaQuesto = assenzaInRevoca?.id === a.id;

                      return (
                        <div key={a.id} className="p-4 bg-white space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                                <span>{a.nomeUtente || utenteInfo?.nomeCompleto || a.utenzaId}</span>
                                <span
                                  className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-md uppercase border ${
                                    utenteInfo?.ruolo === 'responsabile'
                                      ? 'bg-purple-100 text-purple-800 border-purple-300'
                                      : 'bg-slate-100 text-slate-700 border-slate-300'
                                  }`}
                                >
                                  {utenteInfo?.ruolo === 'responsabile' ? 'Responsabile' : 'Dipendente'}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                <Briefcase className="w-3 h-3 text-slate-400" />
                                <span>{utenteInfo?.reparto || 'Personale Operativo'}</span>
                              </div>
                            </div>

                            <span
                              className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                                a.tipo === 'ferie_intera'
                                  ? 'bg-blue-100 text-aziendale-blu border border-blue-200'
                                  : a.tipo === 'malattia'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : 'bg-purple-100 text-purple-700 border border-purple-200'
                              }`}
                            >
                              {a.tipo === 'ferie_intera'
                                ? 'Ferie'
                                : a.tipo === 'malattia'
                                ? 'Malattia'
                                : `Permesso (${a.quantita}h)`}
                            </span>
                          </div>

                          {/* Stato e Note */}
                          <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                            <span className="text-slate-600 font-medium">Stato approvazione:</span>
                            <span
                              className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                                a.stato === 'approvata'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {a.stato === 'approvata' ? 'Confermata' : 'In attesa'}
                            </span>
                          </div>

                          {/* Protocollo medico se malattia */}
                          {a.tipo === 'malattia' && (
                            <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200 text-xs space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-emerald-900 flex items-center gap-1">
                                  <FileText className="w-3.5 h-3.5 text-emerald-700" />
                                  Protocollo Medico INPS:
                                </span>
                                {!inModificaProtocollo && a.richiestaId && (
                                  <button
                                    onClick={() => {
                                      setAssenzaModificaProtocollo(a);
                                      setNuovoProtocollo(a.numeroProtocollo || '');
                                      setInModificaProtocollo(true);
                                    }}
                                    className="text-[10px] font-bold text-emerald-700 hover:underline flex items-center gap-0.5"
                                  >
                                    <Edit3 className="w-3 h-3" /> Modifica
                                  </button>
                                )}
                              </div>
                              {inModificaProtocollo && assenzaModificaProtocollo?.id === a.id ? (
                                <div className="flex items-center gap-1.5 pt-1">
                                  <input
                                    type="text"
                                    value={nuovoProtocollo}
                                    onChange={(e) => setNuovoProtocollo(e.target.value)}
                                    placeholder="Nuovo protocollo..."
                                    className="flex-1 px-2 py-1 text-xs bg-white border border-emerald-300 rounded-lg font-mono font-bold"
                                  />
                                  <button
                                    onClick={salvaProtocolloDalDettaglio}
                                    className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold"
                                  >
                                    Salva
                                  </button>
                                  <button
                                    onClick={() => setInModificaProtocollo(false)}
                                    className="px-2 py-1 text-slate-500 text-xs"
                                  >
                                    Annulla
                                  </button>
                                </div>
                              ) : (
                                <span className="font-mono font-bold text-emerald-800">
                                  {a.numeroProtocollo || 'Non ancora comunicato'}
                                </span>
                              )}
                            </div>
                          )}

                          {a.note && (
                            <div className="text-[11px] text-slate-500 italic">
                              "{a.note}"
                            </div>
                          )}

                          {/* Sezione REVOCA FERIE per il Titolare */}
                          {eTitolare && a.stato === 'approvata' && (
                            <div className="pt-2 border-t border-slate-100">
                              {!eInRevocaQuesto ? (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAssenzaInRevoca(a);
                                    setMotivazioneRevoca('');
                                  }}
                                  className="w-full py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                                >
                                  <Undo2 className="w-3.5 h-3.5 text-rose-600" />
                                  <span>Revoca Ferie & Notifica Dipendente</span>
                                </button>
                              ) : (
                                <form onSubmit={gestisciEseguiRevoca} className="bg-rose-50/80 p-3 rounded-xl border border-rose-200 space-y-2">
                                  <label className="block text-xs font-bold text-rose-950">
                                    Motivazione Aziendale della Revoca (verrà notificata a {a.nomeUtente || a.utenzaId}) *
                                  </label>
                                  <input
                                    type="text"
                                    required
                                    placeholder="es. Esigenze urgenti di cantiere / presidio operativo..."
                                    value={motivazioneRevoca}
                                    onChange={(e) => setMotivazioneRevoca(e.target.value)}
                                    className="w-full px-3 py-1.5 text-xs bg-white border border-rose-300 rounded-lg font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                                  />
                                  <div className="flex items-center gap-2 justify-end pt-1">
                                    <button
                                      type="button"
                                      onClick={() => setAssenzaInRevoca(null)}
                                      className="px-3 py-1 text-xs text-slate-600 hover:bg-rose-100 rounded-lg font-semibold"
                                    >
                                      Annulla
                                    </button>
                                    <button
                                      type="submit"
                                      className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1"
                                    >
                                      <Send className="w-3.5 h-3.5" />
                                      <span>Conferma Revoca</span>
                                    </button>
                                  </div>
                                </form>
                              )}
                            </div>
                          )}

                          {/* Se l'utente non è titolare e desidera rimuovere una propria voce */}
                          {!eTitolare && (
                            <button
                              onClick={() => {
                                if (window.confirm('Vuoi cancellare questa assenza dal piano?')) {
                                  cancellaGiorno(a.data);
                                  setDataGiornoSelezionato(null);
                                }
                              }}
                              className="w-full py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition-colors"
                            >
                              Cancella dal Calendario
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

          </div>
        </div>
      )}

      {/* Finestra Modale Chiusura Aziendale (Titolare) */}
      <ModaleChiusuraAziendale
        aperto={chiusuraModalAperta}
        suChiudi={() => setChiusuraModalAperta(false)}
      />

    </div>
  );
};
