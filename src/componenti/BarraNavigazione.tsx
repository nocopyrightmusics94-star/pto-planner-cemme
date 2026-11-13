/**
 * Barra di Navigazione Istituzionale
 * C. Emme Impianti S.r.l.
 * 
 * 100% in lingua italiana - Con logo aziendale ad alta risoluzione
 */

import React from 'react';
import { usaAutenticazione } from '@/contesti/ContestoAutenticazione';
import { usaPianificatore } from '@/contesti/ContestoPianificatore';
import {
  Users,
  Calendar,
  LogOut,
  ShieldCheck,
  Building2,
  Database,
  ChevronLeft,
  ChevronRight,
  User,
  CalendarPlus,
  Bell,
  History,
} from 'lucide-react';

interface ProprietaBarraNavigazione {
  suApriGestioneUtenze: () => void;
  suApriCopiaSicurezza: () => void;
  suApriNuovaRichiesta: () => void;
  suApriChiusuraAziendale?: () => void;
  vistaAziendaleAttiva: boolean;
  suCambiaVistaAziendale: (attiva: boolean) => void;
  schedaAttiva: 'calendario' | 'storico';
  suCambiaSchedaAttiva: (scheda: 'calendario' | 'storico') => void;
}

export const BarraNavigazione: React.FC<ProprietaBarraNavigazione> = ({
  suApriGestioneUtenze,
  suApriCopiaSicurezza,
  suApriNuovaRichiesta,
  suApriChiusuraAziendale,
  vistaAziendaleAttiva,
  suCambiaVistaAziendale,
  schedaAttiva,
  suCambiaSchedaAttiva,
}) => {
  const { utenzaAttiva, eTitolare, eResponsabile, puoApprovare, disconnetti } = usaAutenticazione();
  const { annoSelezionato, impostaAnnoSelezionato, richiesteInAttesaApprovabili, notificheNonLette } = usaPianificatore();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-aziendale-grigioBordo shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo e Denominazione Aziendale */}
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-white p-1 rounded-lg">
              <img
                src="/logo-cemme.png"
                alt="Logo Ufficiale C. Emme Impianti S.r.l."
                className="h-12 w-auto object-contain"
              />
            </div>
            <div className="hidden md:block border-l border-slate-200 pl-4">
              <h1 className="text-base font-bold text-slate-900 leading-tight">
                Pianificatore Ferie e Permessi
              </h1>
              <p className="text-[11px] font-medium text-slate-500">
                C. Emme Impianti S.r.l. — Impianti Tecnologici & Ferroviari
              </p>
            </div>
          </div>

          {/* Selettore Anno Fiscale */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
            <button
              onClick={() => impostaAnnoSelezionato(annoSelezionato - 1)}
              title="Anno precedente"
              className="p-1.5 text-slate-600 hover:text-aziendale-blu hover:bg-white rounded-lg transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center px-3 font-bold text-slate-800 text-xs tracking-wide">
              <Calendar className="w-4 h-4 mr-1.5 text-aziendale-blu" />
              Anno {annoSelezionato}
            </div>
            <button
              onClick={() => impostaAnnoSelezionato(annoSelezionato + 1)}
              title="Anno successivo"
              className="p-1.5 text-slate-600 hover:text-aziendale-blu hover:bg-white rounded-lg transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Area Azioni & Profilo Utente */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* Pulsante Nuova Richiesta */}
            <button
              onClick={suApriNuovaRichiesta}
              title="Invia una richiesta di ferie, permesso o malattia"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-aziendale-blu hover:bg-aziendale-bluScuro text-white shadow-xs transition-all hover:scale-[1.02]"
            >
              <CalendarPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Nuova Richiesta</span>
            </button>

            {/* Selettore Scheda: Calendario o Storico */}
            <button
              onClick={() => {
                suCambiaVistaAziendale(false);
                suCambiaSchedaAttiva(schedaAttiva === 'calendario' ? 'storico' : 'calendario');
              }}
              title="Passa allo storico delle assenze"
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
                schedaAttiva === 'storico' && !vistaAziendaleAttiva
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {schedaAttiva === 'storico' && !vistaAziendaleAttiva ? (
                <>
                  <Calendar className="w-4 h-4" />
                  <span className="hidden sm:inline">Calendario</span>
                </>
              ) : (
                <>
                  <History className="w-4 h-4 text-aziendale-blu" />
                  <span className="hidden sm:inline">Storico Assenze</span>
                </>
              )}
            </button>

            {/* Notifica Richieste da Approvare (per Titolare e Responsabile) */}
            {puoApprovare && richiesteInAttesaApprovabili.length > 0 && (
              <span className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-extrabold border animate-pulse ${
                eTitolare
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : 'bg-purple-100 text-purple-800 border-purple-300'
              }`}>
                <Bell className={`w-3.5 h-3.5 ${eTitolare ? 'text-amber-600' : 'text-purple-600'}`} />
                <span>{richiesteInAttesaApprovabili.length} da valutare</span>
              </span>
            )}

            {/* Notifiche Direzione per i Dipendenti */}
            {notificheNonLette.length > 0 && (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-100 text-rose-800 text-xs font-extrabold border border-rose-300 animate-pulse"
                title={`${notificheNonLette.length} comunicazioni non lette dalla Direzione`}
              >
                <Bell className="w-3.5 h-3.5 text-rose-600" />
                <span>{notificheNonLette.length} avvisi</span>
              </span>
            )}

            {/* Pulsanti Riservati al Titolare */}
            {eTitolare && (
              <>
                {suApriChiusuraAziendale && (
                  <button
                    onClick={suApriChiusuraAziendale}
                    title="Programma chiusura aziendale collettiva per tutti i dipendenti"
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-indigo-50 text-indigo-900 border border-indigo-200 hover:bg-indigo-100 transition-all"
                  >
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    <span className="hidden xl:inline">Chiusura Aziendale</span>
                  </button>
                )}

                <button
                  onClick={() => suCambiaVistaAziendale(!vistaAziendaleAttiva)}
                  title="Visualizza la pianificazione di tutto il personale aziendale"
                  className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
                    vistaAziendaleAttiva
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span className="hidden md:inline">
                    {vistaAziendaleAttiva ? 'Vista Singola' : 'Quadro Aziendale'}
                  </span>
                </button>

                <button
                  onClick={suApriGestioneUtenze}
                  title="Gestione utenze, dipendenti e password"
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-aziendale-blu transition-all"
                >
                  <Users className="w-4 h-4 text-aziendale-blu" />
                  <span className="hidden lg:inline">Gestione Utenze</span>
                </button>
              </>
            )}

            {/* Backup Copia di Sicurezza */}
            <button
              onClick={suApriCopiaSicurezza}
              title="Salva o ripristina la copia di sicurezza dei dati"
              className="p-2 text-slate-600 hover:text-aziendale-blu hover:bg-slate-100 rounded-xl transition-all"
            >
              <Database className="w-4 h-4" />
            </button>

            {/* Distintivo Utente Connesso */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="flex flex-col text-right">
                <span className="text-xs font-bold text-slate-900 leading-none flex items-center justify-end gap-1">
                  {eTitolare ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                  ) : eResponsabile ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-slate-500" />
                  )}
                  {utenzaAttiva?.nomeCompleto || utenzaAttiva?.identificativo}
                </span>
                <span className="text-[10px] font-medium text-slate-500 capitalize">
                  {eTitolare ? 'Titolare' : eResponsabile ? 'Responsabile' : 'Dipendente'}
                </span>
              </div>

              {/* Pulsante Disconnetti */}
              <button
                onClick={disconnetti}
                title="Disconnetti sessione"
                className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
