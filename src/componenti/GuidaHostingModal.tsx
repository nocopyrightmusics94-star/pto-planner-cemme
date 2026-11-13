/**
 * Guida Istituzionale di Pubblicazione e Hosting Gratuito H24 Permanente
 * C. Emme Impianti S.r.l.
 * 
 * 100% in italiano - Istruzioni complete per mantenere online il software senza costi
 */

import React from 'react';
import { Cloud, CheckCircle2, ShieldCheck, Globe, Database, X, ArrowUpRight } from 'lucide-react';

interface ProprietaGuidaHosting {
  aperto: boolean;
  suChiudi: () => void;
}

export const GuidaHostingModal: React.FC<ProprietaGuidaHosting> = ({ aperto, suChiudi }) => {
  if (!aperto) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Testata */}
        <div className="bg-slate-900 text-white p-5 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500 text-white">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Guida Hosting Gratuito H24 Permanente</h2>
              <p className="text-xs text-slate-300">
                Come pubblicare il Pianificatore Ferie di C. Emme Impianti online a costo zero per sempre
              </p>
            </div>
          </div>
          <button
            onClick={suChiudi}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenuto */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700 text-sm">
          
          {/* Box Garanzie */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2">
            <div className="flex items-center gap-2 font-bold text-emerald-900 text-sm">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Garanzie del Servizio Selezionato</span>
            </div>
            <ul className="text-xs text-emerald-800 space-y-1 font-medium">
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <strong>Costo: 0 € per sempre</strong> (nessuna carta di credito richiesta, nessun abbonamento a scadenza).
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <strong>Disponibilità H24 reale (Zero Sleep):</strong> A differenza dei vecchi server gratuiti (Heroku/Render) che vanno in "sospensione/ibernazione" dopo 15 minuti, l'infrastruttura Edge/Static è sempre attiva e risponde istantaneamente (0 millisecondi di attesa).
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <strong>Dominio personalizzato aziendale gratuito:</strong> Possibilità di collegare ad esempio <code>ferie.cemmeimpianti.it</code> con certificato di sicurezza SSL/HTTPS automatico.
              </li>
            </ul>
          </div>

          {/* Metodo Consigliato: Vercel */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Globe className="w-5 h-5 text-aziendale-blu" />
              <span>Metodo 1: Pubblicazione con Vercel (Consigliato — 2 Minuti)</span>
            </h3>
            <div className="space-y-2 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <p>
                <strong>Passo 1:</strong> Crea un account gratuito su{' '}
                <a
                  href="https://vercel.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-aziendale-blu underline font-bold inline-flex items-center"
                >
                  vercel.com <ArrowUpRight className="w-3 h-3 ml-0.5" />
                </a>{' '}
                (oppure accedi con il tuo account GitHub).
              </p>
              <p>
                <strong>Passo 2:</strong> Carica questa cartella di progetto su un repository GitHub privato (es. <code>cemme-pianificatore-ferie</code>).
              </p>
              <p>
                <strong>Passo 3:</strong> Su Vercel clicca <em>"Add New Project"</em>, seleziona il tuo repository GitHub e premi <strong>"Deploy"</strong>.
              </p>
              <p>
                <strong>Passo 4:</strong> In meno di 30 secondi riceverai un link web sicuro (es. <code>https://cemme-ferie.vercel.app</code>) attivo per sempre 24 ore su 24, accessibile da qualsiasi computer, smartphone o tablet da parte di tutti i collaboratori!
              </p>
            </div>
          </div>

          {/* Metodo Alternativo: Cloudflare Pages */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Cloud className="w-5 h-5 text-amber-500" />
              <span>Metodo 2: Cloudflare Pages (Alternativa Illimitata a Vita)</span>
            </h3>
            <div className="space-y-2 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <p>
                1. Registrati gratis su <strong>Cloudflare.com</strong>.
              </p>
              <p>
                2. Vai su <em>"Workers & Pages"</em> &gt; <em>"Create Application"</em> &gt; <em>"Pages"</em>.
              </p>
              <p>
                3. Collega la cartella del progetto. Cloudflare compila l'applicazione e garantisce banda e richieste illimitate con protezione DDoS inclusa.
              </p>
            </div>
          </div>

          {/* Persistenza Dati e Database */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Database className="w-5 h-5 text-purple-600" />
              <span>Persistenza Dati e Sicurezza Aziendale</span>
            </h3>
            <div className="text-xs space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <p>
                • <strong>Salvataggio Locale Istantaneo:</strong> L'applicazione salva ogni variazione di ferie, password e utenze in tempo reale nella memoria protetta del browser.
              </p>
              <p>
                • <strong>Copia di Sicurezza JSON (Backup):</strong> Il titolare può in qualunque momento cliccare sull'icona della banca dati nella barra in alto e scaricare un file di backup con tutti i dati dell'azienda, pronto per essere ripristinato ovunque.
              </p>
              <p>
                • <strong>Database Cloud Gratuito Permanente (Opzionale):</strong> Se desideri sincronizzare le ferie tra dispositivi diversi in tempo reale via cloud, puoi attivare un database <strong>Turso (libSQL/SQLite)</strong> o <strong>Neon Postgres</strong>, entrambi provvisti di piano 100% gratuito che NON si disattiva mai.
              </p>
            </div>
          </div>

        </div>

        {/* Chiusura */}
        <div className="bg-slate-50 p-4 px-6 border-t border-slate-200 flex justify-end">
          <button
            onClick={suChiudi}
            className="px-5 py-2 text-xs font-bold bg-aziendale-blu text-white rounded-xl hover:bg-aziendale-bluScuro transition-colors"
          >
            Ho Compreso
          </button>
        </div>

      </div>
    </div>
  );
};
