/**
 * Banner e Centro Notifiche per il Personale
 * C. Emme Impianti S.r.l.
 * 
 * Notifiche formali in tempo reale (revoca ferie, chiusure aziendali, comunicazioni direzione)
 */

import React from 'react';
import { usaPianificatore } from '@/contesti/ContestoPianificatore';
import {
  AlertTriangle,
  Building2,
  Bell,
  CheckCircle2,
} from 'lucide-react';

export const BannerNotifiche: React.FC = () => {
  const { notificheNonLette, segnaNotificaLetta } = usaPianificatore();

  if (notificheNonLette.length === 0) return null;

  return (
    <div className="space-y-3 mb-6 no-stampa">
      {notificheNonLette.map((notifica) => {
        const eRevoca = notifica.tipo === 'revoca';
        const eChiusura = notifica.tipo === 'chiusura_aziendale';

        return (
          <div
            key={notifica.id}
            className={`p-4 rounded-2xl border shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all animate-in fade-in slide-in-from-top-2 ${
              eRevoca
                ? 'bg-rose-50 border-rose-300 text-rose-900 ring-2 ring-rose-400/20'
                : eChiusura
                ? 'bg-indigo-50 border-indigo-300 text-indigo-950 ring-2 ring-indigo-400/20'
                : 'bg-amber-50 border-amber-300 text-amber-950 ring-2 ring-amber-400/20'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                  eRevoca
                    ? 'bg-rose-600 text-white'
                    : eChiusura
                    ? 'bg-indigo-600 text-white'
                    : 'bg-amber-600 text-white'
                }`}
              >
                {eRevoca ? (
                  <AlertTriangle className="w-5 h-5" />
                ) : eChiusura ? (
                  <Building2 className="w-5 h-5" />
                ) : (
                  <Bell className="w-5 h-5" />
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-sm leading-tight">
                    {notifica.titolo}
                  </h4>
                  <span
                    className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      eRevoca
                        ? 'bg-rose-200 text-rose-800'
                        : 'bg-indigo-200 text-indigo-900'
                    }`}
                  >
                    Comunicazione Direzione
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {new Date(notifica.dataInvio).toLocaleDateString('it-IT', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <p className="text-xs font-medium leading-relaxed">
                  {notifica.messaggio}
                </p>

                {notifica.dettagli?.motivazioneRevoca && (
                  <div className="mt-1 bg-white/70 p-2 rounded-lg border border-rose-200 text-xs font-semibold text-rose-800 italic">
                    Motivo revoca specificato dalla Direzione: "{notifica.dettagli.motivazioneRevoca}"
                  </div>
                )}
              </div>
            </div>

            <div className="shrink-0 self-end sm:self-center">
              <button
                onClick={() => segnaNotificaLetta(notifica.id)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 ${
                  eRevoca
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Ho preso visione</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
