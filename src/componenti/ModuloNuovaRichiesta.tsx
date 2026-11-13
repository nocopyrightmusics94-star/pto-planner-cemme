/**
 * Modulo Modale per Nuova Richiesta Ferie, Permessi e Malattia
 * C. Emme Impianti S.r.l.
 * 
 * 100% in lingua italiana - Rimossa la mezza giornata e abilitata richiesta ferie multiple
 */

import React, { useState } from 'react';
import { usaAutenticazione } from '@/contesti/ContestoAutenticazione';
import { usaPianificatore } from '@/contesti/ContestoPianificatore';
import { TipoAssenza } from '@/tipi';
import { MiniCalendarioRichiesta } from './MiniCalendarioRichiesta';
import { formattaDataISO, verificaGiornoFestivo } from '@/dati/festivita-italiane';
import {
  CalendarPlus,
  Palmtree,
  Clock,
  Send,
  X,
  AlertCircle,
  CheckCircle2,
  Stethoscope,
  FileText,
  UserCheck,
  ShieldCheck,
} from 'lucide-react';

interface ProprietaModuloNuovaRichiesta {
  aperto: boolean;
  suChiudi: () => void;
}

export const ModuloNuovaRichiesta: React.FC<ProprietaModuloNuovaRichiesta> = ({
  aperto,
  suChiudi,
}) => {
  const { utenzaAttiva, tutteLeUtenze, eTitolare, eResponsabile } = usaAutenticazione();
  const { inviaRichiesta } = usaPianificatore();

  // Selettore utente per il Titolare
  const [idDestinatario, setIdDestinatario] = useState<string>(utenzaAttiva?.identificativo || 'titolare');

  // Tipologie disponibili: Ferie (più giorni), Permesso Orario (a ore), Malattia
  const [tipo, setTipo] = useState<TipoAssenza>('ferie_intera');
  const [dataInizio, setDataInizio] = useState<string | null>(null);
  const [dataFine, setDataFine] = useState<string | null>(null);
  const [dateLavorative, setDateLavorative] = useState<string[]>([]);
  const [orePermesso, setOrePermesso] = useState<number>(4);
  const [numeroProtocollo, setNumeroProtocollo] = useState('');
  const [motivazione, setMotivazione] = useState('');
  const [errore, setErrore] = useState<string | null>(null);
  const [inviatoConSuccesso, setInviatoConSuccesso] = useState(false);

  if (!aperto) return null;

  const calcolaDateLavorativeTra = (inizioStr: string, fineStr: string): string[] => {
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

  const gestisciModificaSelezione = (
    inizio: string | null,
    fine: string | null,
    lavorative: string[]
  ) => {
    setDataInizio(inizio);
    setDataFine(fine);
    setDateLavorative(lavorative);
    setErrore(null);
  };

  // Modifica manuale dei campi data Da / A
  const gestisciCambioDataInizioManuale = (valore: string) => {
    setDataInizio(valore);
    const fineEffettiva = dataFine && dataFine >= valore ? dataFine : valore;
    setDataFine(fineEffettiva);
    setDateLavorative(calcolaDateLavorativeTra(valore, fineEffettiva));
  };

  const gestisciCambioDataFineManuale = (valore: string) => {
    setDataFine(valore);
    const inizioEffettivo = dataInizio && dataInizio <= valore ? dataInizio : valore;
    setDataInizio(inizioEffettivo);
    setDateLavorative(calcolaDateLavorativeTra(inizioEffettivo, valore));
  };

  const inviaModulo = (e: React.FormEvent) => {
    e.preventDefault();
    setErrore(null);

    if (!dataInizio || !dataFine || dateLavorative.length === 0) {
      setErrore('Seleziona almeno una giornata lavorativa per la richiesta.');
      return;
    }

    if (tipo === 'permesso_rol' && (orePermesso <= 0 || isNaN(orePermesso))) {
      setErrore('Specifica un numero di ore valido per il permesso.');
      return;
    }

    const targetId = eTitolare ? idDestinatario : (utenzaAttiva?.identificativo || 'titolare');
    const utenteDestinatario = tutteLeUtenze.find((u) => u.identificativo === targetId) || utenzaAttiva;

    // Se è richiesta inserita dal titolare, viene approvata direttamente
    const statoIniziale = eTitolare ? 'approvata' : 'in_attesa';
    const notaDirezione = eTitolare
      ? (targetId === utenzaAttiva?.identificativo
          ? 'Inserita e approvata direttamente dalla Direzione'
          : `Inserita direttamente dal Titolare per ${utenteDestinatario?.nomeCompleto}`)
      : undefined;

    inviaRichiesta({
      utenzaId: targetId,
      nomeRichiedente: utenteDestinatario?.nomeCompleto || 'Richiedente',
      reparto: utenteDestinatario?.reparto || 'Personale',
      ruoloRichiedente: utenteDestinatario?.ruolo || 'dipendente',
      tipo,
      dataInizio,
      dataFine,
      dateCoinvolte: dateLavorative,
      orePermessoPerGiorno: tipo === 'permesso_rol' ? orePermesso : undefined,
      numeroProtocollo: tipo === 'malattia' && numeroProtocollo.trim() ? numeroProtocollo.trim() : undefined,
      giorniTotaliLavorativi: dateLavorative.length,
      motivazione: motivazione.trim() || undefined,
      stato: statoIniziale,
      notaTitolare: notaDirezione,
    });

    setInviatoConSuccesso(true);
    setTimeout(() => {
      setInviatoConSuccesso(false);
      suChiudi();
      setDataInizio(null);
      setDataFine(null);
      setDateLavorative([]);
      setNumeroProtocollo('');
      setMotivazione('');
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* Testata */}
        <div className="bg-slate-900 text-white p-5 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-aziendale-blu text-white">
              <CalendarPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Nuova Richiesta di Assenza</h2>
              <p className="text-xs text-slate-300">
                Pianificazione e inoltro al Titolare — C. Emme Impianti S.r.l.
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

        {/* Corpo Modale */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          
          {inviatoConSuccesso && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl flex items-center gap-2.5 font-bold animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>
                {eTitolare
                  ? 'Assenza registrata e approvata con successo direttamente a calendario!'
                  : 'Richiesta inoltrata con successo! In attesa di approvazione.'}
              </span>
            </div>
          )}

          {errore && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-2xl flex items-center gap-2.5 font-bold animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errore}</span>
            </div>
          )}

          <form onSubmit={inviaModulo} className="space-y-4">
            
            {/* Selettore Destinatario per il Titolare */}
            {eTitolare && (
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    Destinatario dell'Assenza (Inserimento Direzione)
                  </label>
                  <span className="text-[10px] bg-amber-200/80 text-amber-900 font-extrabold px-2 py-0.5 rounded-full">
                    Approvata Automaticamente
                  </span>
                </div>
                <select
                  value={idDestinatario}
                  onChange={(e) => setIdDestinatario(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-amber-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="titolare">Per me stesso (Titolare - Direzione Aziendale)</option>
                  {tutteLeUtenze
                    .filter((u) => u.identificativo !== 'titolare')
                    .map((u) => (
                      <option key={u.identificativo} value={u.identificativo}>
                        {u.nomeCompleto} ({u.ruolo === 'responsabile' ? 'Responsabile' : 'Dipendente'} — {u.reparto || 'Personale'})
                      </option>
                    ))}
                </select>
                <p className="text-[11px] text-amber-800 leading-tight">
                  Le ferie e i permessi inseriti dal Titolare vengono convalidati direttamente e registrati a calendario senza necessità di approvazione ulteriore.
                </p>
              </div>
            )}

            {/* Informazione per Responsabile */}
            {!eTitolare && eResponsabile && (
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-3 text-purple-900 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-purple-600 shrink-0" />
                <span className="text-[11px] font-medium">
                  In qualità di <strong>Responsabile</strong>, la tua richiesta verrà inviata direttamente al <strong>Titolare</strong> per l'approvazione.
                </span>
              </div>
            )}
            
            {/* Scelta Tipologia a 3 Opzioni (Senza Mezza Giornata) */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Tipologia di Assenza
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setTipo('ferie_intera')}
                  className={`p-3.5 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
                    tipo === 'ferie_intera'
                      ? 'bg-blue-50 border-aziendale-blu text-aziendale-blu font-bold shadow-xs ring-2 ring-blue-500/20'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Palmtree className="w-5 h-5 text-aziendale-blu" />
                  <span className="text-xs font-bold">Ferie</span>
                  <span className="text-[10px] text-slate-400">Singola o più giorni</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTipo('permesso_rol')}
                  className={`p-3.5 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
                    tipo === 'permesso_rol'
                      ? 'bg-purple-50 border-purple-600 text-purple-700 font-bold shadow-xs ring-2 ring-purple-600/20'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Clock className="w-5 h-5 text-purple-600" />
                  <span className="text-xs font-bold">Permesso Orario</span>
                  <span className="text-[10px] text-slate-400">Ore a scelta libera</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTipo('malattia')}
                  className={`p-3.5 rounded-2xl border flex flex-col items-center gap-1.5 transition-all ${
                    tipo === 'malattia'
                      ? 'bg-emerald-50 border-emerald-600 text-emerald-800 font-bold shadow-xs ring-2 ring-emerald-600/20'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Stethoscope className="w-5 h-5 text-emerald-600" />
                  <span className="text-xs font-bold">Malattia</span>
                  <span className="text-[10px] text-slate-400">Con protocollo</span>
                </button>
              </div>
            </div>

            {/* Configurazione Ore per Permesso */}
            {tipo === 'permesso_rol' && (
              <div className="bg-purple-50/70 p-3.5 rounded-2xl border border-purple-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-900 text-xs flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-purple-700" />
                    Ore di permesso richieste per ciascuna giornata:
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0.5}
                      max={12}
                      step={0.5}
                      value={orePermesso}
                      onChange={(e) => setOrePermesso(parseFloat(e.target.value) || 1)}
                      className="w-20 px-2.5 py-1 text-center font-extrabold text-sm bg-white border border-purple-300 rounded-xl text-purple-900 focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                    <span className="font-bold text-purple-800 text-xs">Ore</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-1 text-[11px]">
                  <span className="text-purple-700 font-medium">Scelta rapida:</span>
                  {[1, 2, 3, 4, 6, 8].map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setOrePermesso(h)}
                      className={`px-2 py-0.5 rounded-lg border font-bold transition-colors ${
                        orePermesso === h
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-white text-purple-700 border-purple-200 hover:bg-purple-100'
                      }`}
                    >
                      {h}h
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Campo Protocollo per Malattia (anche postumo) */}
            {tipo === 'malattia' && (
              <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200 space-y-1.5">
                <label className="block text-xs font-bold text-emerald-900">
                  Numero di Protocollo Certificato Medico (INPS / Telematico)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-600">
                    <FileText className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    placeholder="es. 123456789 (Facoltativo: inseribile anche successivamente)"
                    value={numeroProtocollo}
                    onChange={(e) => setNumeroProtocollo(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-emerald-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-600 font-mono font-medium text-slate-800"
                  />
                </div>
                <p className="text-[11px] text-emerald-700 leading-tight">
                  Se non hai ancora il certificato sottomano, puoi inviare la richiesta subito e inserire o modificare il numero di protocollo in un secondo momento direttamente dal tuo Storico.
                </p>
              </div>
            )}

            {/* Campi Data Inizio e Data Fine Sincronizzati */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center gap-3">
              <div className="flex-1 w-full">
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Data Inizio Periodo
                </label>
                <input
                  type="date"
                  value={dataInizio || ''}
                  onChange={(e) => gestisciCambioDataInizioManuale(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-aziendale-blu"
                />
              </div>

              <div className="flex-1 w-full">
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Data Fine Periodo
                </label>
                <input
                  type="date"
                  value={dataFine || ''}
                  onChange={(e) => gestisciCambioDataFineManuale(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-aziendale-blu"
                />
              </div>
            </div>

            {/* Mini Calendario per Selezione Periodo o Giorni Multipli */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Oppure Seleziona Direttamente sul Mini Calendario
              </label>
              <MiniCalendarioRichiesta
                dataInizio={dataInizio}
                dataFine={dataFine}
                dateSelezionate={dateLavorative}
                suModificaSelezione={gestisciModificaSelezione}
              />
            </div>

            {/* Box Riepilogo Giornate Libere */}
            {dateLavorative.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">
                      Durata Complessiva
                    </span>
                    <span className="font-extrabold text-slate-900 text-sm">
                      {dateLavorative.length} {dateLavorative.length === 1 ? 'giornata lavorativa' : 'giornate lavorative'}
                    </span>
                    <span className="text-slate-500 ml-1">
                      ({tipo === 'permesso_rol'
                        ? `${dateLavorative.length * orePermesso} ore di permesso`
                        : tipo === 'malattia'
                        ? `${dateLavorative.length} giorni di malattia`
                        : `${dateLavorative.length} giorni di ferie`})
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">
                      Periodo Selezionato
                    </span>
                    <span className="font-bold text-aziendale-blu">
                      {dataInizio === dataFine ? dataInizio : `${dataInizio} → ${dataFine}`}
                    </span>
                  </div>
                </div>

                {/* Elenco date incluse */}
                {dateLavorative.length > 1 && (
                  <div className="text-[11px] text-slate-600 border-t border-blue-200/60 pt-2 flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-slate-700">Date lavorative richieste:</span>
                    {dateLavorative.map((d) => (
                      <span key={d} className="bg-white px-2 py-0.5 rounded-lg border border-blue-200 font-mono text-[10px] font-bold text-aziendale-blu">
                        {d}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Note / Motivazione */}
            <div>
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                Note o Motivazione Facoltativa
              </label>
              <textarea
                rows={2}
                placeholder="es. Ferie estive, impegni personali, visita medica..."
                value={motivazione}
                onChange={(e) => setMotivazione(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-aziendale-blu focus:outline-none font-medium text-slate-800"
              />
            </div>

            {/* Pulsanti Azione */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={suChiudi}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Annulla
              </button>

              <button
                type="submit"
                disabled={!dataInizio || !dataFine || dateLavorative.length === 0}
                className="px-5 py-2.5 bg-aziendale-blu hover:bg-aziendale-bluScuro disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>
                  {eTitolare
                    ? `Registra e Approva Assenza (${dateLavorative.length} gg)`
                    : eResponsabile
                    ? `Invia Richiesta al Titolare (${dateLavorative.length} gg)`
                    : `Invia Richiesta di Assenza (${dateLavorative.length} gg)`}
                </span>
              </button>
            </div>

          </form>

        </div>

      </div>
    </div>
  );
};
