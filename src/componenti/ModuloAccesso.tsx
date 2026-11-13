/**
 * Modulo di Accesso Istituzionale
 * C. Emme Impianti S.r.l.
 * 
 * 100% in italiano - Zero termini in inglese
 */

import React, { useState } from 'react';
import { usaAutenticazione } from '@/contesti/ContestoAutenticazione';
import { KeyRound, User, AlertCircle, ArrowRight } from 'lucide-react';

export const ModuloAccesso: React.FC = () => {
  const { accedi } = usaAutenticazione();
  const [identificativo, setIdentificativo] = useState('');
  const [chiave, setChiave] = useState('');
  const [errore, setErrore] = useState<string | null>(null);
  const [caricamento, setCaricamento] = useState(false);

  const inviaAccesso = (e: React.FormEvent) => {
    e.preventDefault();
    setErrore(null);

    if (!identificativo.trim() || !chiave.trim()) {
      setErrore("Inserisci sia l'identificativo che la chiave d'accesso.");
      return;
    }

    setCaricamento(true);
    const esito = accedi(identificativo, chiave);
    setCaricamento(false);

    if (!esito.successo) {
      setErrore(esito.messaggio || "Credenziali non corrette.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-aziendale-grigioSfondo">
      <div className="w-full max-w-md">
        
        {/* Scheda Centrale di Accesso */}
        <div className="bg-white rounded-3xl p-8 border border-aziendale-grigioBordo shadow-scheda space-y-6">
          
          {/* Logo e Intestazione Aziendale */}
          <div className="text-center space-y-3">
            <div className="inline-block bg-white p-2 rounded-2xl">
              <img
                src="/logo-cemme.png"
                alt="C. Emme Impianti S.r.l."
                className="h-16 w-auto mx-auto object-contain"
              />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Pianificatore Ferie e Permessi
              </h2>
              <p className="text-xs font-semibold text-slate-500 mt-1">
                Portale Riservato — C. Emme Impianti S.r.l.
              </p>
            </div>
          </div>

          {/* Avviso di errore */}
          {errore && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-2xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errore}</span>
            </div>
          )}

          {/* Modulo di Inserimento Credenziali */}
          <form onSubmit={inviaAccesso} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Identificativo Utenza
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="Identificativo utenza"
                  value={identificativo}
                  onChange={(e) => setIdentificativo(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-aziendale-blu focus:outline-none font-medium text-slate-900 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Chiave d'Accesso (Password)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="Inserisci la chiave d'accesso"
                  value={chiave}
                  onChange={(e) => setChiave(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-aziendale-blu focus:outline-none font-medium text-slate-900 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={caricamento}
              className="w-full py-3 px-4 bg-aziendale-blu hover:bg-aziendale-bluScuro text-white text-sm font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
            >
              <span>Accedi al Sistema</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-400 mt-6 font-medium">
          C. Emme Impianti S.r.l. — Via G. Pelella 17, 80026 Casoria (NA)
        </p>

      </div>
    </div>
  );
};
