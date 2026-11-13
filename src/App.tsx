/**
 * Applicazione Principale - Pianificatore Ferie e Permessi
 * C. Emme Impianti S.r.l.
 * 
 * 100% in lingua italiana - Con flusso richieste/approvazione, storico e calendario a singolo mese
 */

import React, { useState } from 'react';
import { FornitoreAutenticazione, usaAutenticazione } from '@/contesti/ContestoAutenticazione';
import { FornitorePianificatore, usaPianificatore } from '@/contesti/ContestoPianificatore';
import { ModuloAccesso } from '@/componenti/ModuloAccesso';
import { BarraNavigazione } from '@/componenti/BarraNavigazione';
import { RiepilogoSaldi } from '@/componenti/RiepilogoSaldi';
import { CalendarioMensile } from '@/componenti/CalendarioMensile';
import { ModuloNuovaRichiesta } from '@/componenti/ModuloNuovaRichiesta';
import { PannelloApprovazioni } from '@/componenti/PannelloApprovazioni';
import { StoricoAssenze } from '@/componenti/StoricoAssenze';
import { GestioneUtenzeModal } from '@/componenti/GestioneUtenzeModal';
import { VistaAziendale } from '@/componenti/VistaAziendale';
import { GuidaHostingModal } from '@/componenti/GuidaHostingModal';
import { CopiaSicurezzaModal } from '@/componenti/CopiaSicurezzaModal';
import { BannerNotifiche } from '@/componenti/BannerNotifiche';
import { ModaleChiusuraAziendale } from '@/componenti/ModaleChiusuraAziendale';
import { ShieldCheck, Phone, MapPin, Mail, Calendar, History } from 'lucide-react';

const ContenutoPannello: React.FC = () => {
  const { utenzaAttiva, eTitolare, puoApprovare } = usaAutenticazione();
  const { annoSelezionato, utenzaVisualizzataOggetto } = usaPianificatore();

  const [schedaAttiva, setSchedaAttiva] = useState<'calendario' | 'storico'>('calendario');
  const [vistaAziendaleAttiva, setVistaAziendaleAttiva] = useState(false);
  const [gestioneUtenzeAperta, setGestioneUtenzeAperta] = useState(false);
  const [chiusuraAziendaleAperta, setChiusuraAziendaleAperta] = useState(false);
  const [guidaHostingAperta, setGuidaHostingAperta] = useState(false);
  const [copiaSicurezzaAperta, setCopiaSicurezzaAperta] = useState(false);
  const [nuovaRichiestaAperta, setNuovaRichiestaAperta] = useState(false);

  if (!utenzaAttiva) {
    return <ModuloAccesso />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-aziendale-grigioSfondo">
      {/* Barra di Navigazione */}
      <BarraNavigazione
        suApriGestioneUtenze={() => setGestioneUtenzeAperta(true)}
        suApriChiusuraAziendale={() => setChiusuraAziendaleAperta(true)}
        suApriCopiaSicurezza={() => setCopiaSicurezzaAperta(true)}
        suApriNuovaRichiesta={() => setNuovaRichiestaAperta(true)}
        vistaAziendaleAttiva={vistaAziendaleAttiva}
        suCambiaVistaAziendale={setVistaAziendaleAttiva}
        schedaAttiva={schedaAttiva}
        suCambiaSchedaAttiva={setSchedaAttiva}
      />

      {/* Contenitore Principale */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Banner Notifiche Direzione (Revoche, Chiusure, Avvisi) */}
        <BannerNotifiche />
        
        {/* Banner Informativo sul Dipendente Visualizzato */}
        {!vistaAziendaleAttiva && eTitolare && utenzaVisualizzataOggetto?.identificativo !== 'titolare' && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between text-xs text-blue-900 font-medium shadow-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-aziendale-blu shrink-0" />
              <span>
                Stai visualizzando il piano e lo storico per:{' '}
                <strong className="text-slate-900">{utenzaVisualizzataOggetto?.nomeCompleto}</strong>{' '}
                ({utenzaVisualizzataOggetto?.reparto || 'Personale'}).
              </span>
            </div>
          </div>
        )}

        {/* Tab di commutazione rapida tra Calendario e Storico */}
        {!vistaAziendaleAttiva && (
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
            <button
              onClick={() => setSchedaAttiva('calendario')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                schedaAttiva === 'calendario'
                  ? 'bg-aziendale-blu text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Calendario Mensile</span>
            </button>

            <button
              onClick={() => setSchedaAttiva('storico')}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                schedaAttiva === 'storico'
                  ? 'bg-aziendale-blu text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <History className="w-4 h-4" />
              <span>{eTitolare ? 'Storico Generale & Persona per Persona' : 'Il Tuo Storico Personale'}</span>
            </button>
          </div>
        )}

        {/* Alternanza tra Vista Aziendale, Calendario e Storico */}
        {vistaAziendaleAttiva && eTitolare ? (
          <VistaAziendale />
        ) : (
          <>
            {/* Riepilogo Assenze Fruite & Pulsante Nuova Richiesta */}
            <RiepilogoSaldi suApriNuovaRichiesta={() => setNuovaRichiestaAperta(true)} />

            {/* Pannello Approvazioni per il Titolare e per i Responsabili */}
            {puoApprovare && <PannelloApprovazioni />}

            {/* Contenuto della scheda attiva: Calendario Mensile o Storico */}
            {schedaAttiva === 'calendario' ? (
              <CalendarioMensile />
            ) : (
              <StoricoAssenze />
            )}
          </>
        )}
      </main>

      {/* Modali di Sistema */}
      <ModuloNuovaRichiesta
        aperto={nuovaRichiestaAperta}
        suChiudi={() => setNuovaRichiestaAperta(false)}
      />

      {eTitolare && (
        <>
          <GestioneUtenzeModal
            aperto={gestioneUtenzeAperta}
            suChiudi={() => setGestioneUtenzeAperta(false)}
          />

          <ModaleChiusuraAziendale
            aperto={chiusuraAziendaleAperta}
            suChiudi={() => setChiusuraAziendaleAperta(false)}
          />
        </>
      )}

      <GuidaHostingModal
        aperto={guidaHostingAperta}
        suChiudi={() => setGuidaHostingAperta(false)}
      />

      <CopiaSicurezzaModal
        aperto={copiaSicurezzaAperta}
        suChiudi={() => setCopiaSicurezzaAperta(false)}
      />

      {/* Piè di Pagina */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-8 no-stampa">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-xs text-slate-500 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/logo-cemme.png"
              alt="C. Emme Impianti S.r.l."
              className="h-9 w-auto object-contain opacity-80"
            />
            <div>
              <div className="font-bold text-slate-800">C. Emme Impianti S.r.l.</div>
              <div>Impianti Tecnologici e Ferroviari — Segnalamento e Sicurezza</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              Via G. Pelella 17, 80026 Casoria (NA)
            </span>
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              +39 081 3446736
            </span>
            <span className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              c.emmeimpiantisrl@legalmail.it
            </span>
          </div>

          <div className="text-[11px] text-slate-400 font-medium">
            Pianificatore Ferie e Permessi &copy; {annoSelezionato} — Tutti i diritti riservati
          </div>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <FornitoreAutenticazione>
      <FornitorePianificatore>
        <ContenutoPannello />
      </FornitorePianificatore>
    </FornitoreAutenticazione>
  );
}
