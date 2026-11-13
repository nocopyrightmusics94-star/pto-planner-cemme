/**
 * Pannello di Gestione Utenze Aziendali (Riservato al Titolare)
 * C. Emme Impianti S.r.l.
 * 
 * 100% in lingua italiana - Senza vincoli di giorni o quote
 */

import React, { useState } from 'react';
import { usaAutenticazione } from '@/contesti/ContestoAutenticazione';
import { Utenza, RuoloUtente } from '@/tipi';
import {
  Users,
  UserPlus,
  Shield,
  KeyRound,
  Trash2,
  X,
  CheckCircle,
  AlertCircle,
  Briefcase,
  Phone,
  UserCheck,
} from 'lucide-react';

interface ProprietaGestioneUtenze {
  aperto: boolean;
  suChiudi: () => void;
}

export const GestioneUtenzeModal: React.FC<ProprietaGestioneUtenze> = ({ aperto, suChiudi }) => {
  const { tutteLeUtenze, registraNuovaUtenza, rimuoviUtenzaEsistente, modificaUtenzaEsistente } = usaAutenticazione();

  // Campi del modulo di registrazione nuova utenza
  const [identificativo, setIdentificativo] = useState('');
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [chiaveAccesso, setChiaveAccesso] = useState('');
  const [ruolo, setRuolo] = useState<RuoloUtente>('dipendente');
  const [reparto, setReparto] = useState('Impianti Tecnologici & Ferroviari');
  const [telefono, setTelefono] = useState('');

  const [messaggioEsito, setMessaggioEsito] = useState<{ tipo: 'successo' | 'errore'; testo: string } | null>(null);

  // Modale cambio password utenza
  const [utenzaInModifica, setUtenzaInModifica] = useState<Utenza | null>(null);
  const [nuovaChiave, setNuovaChiave] = useState('');

  if (!aperto) return null;

  const gestisciCreazioneUtenza = (e: React.FormEvent) => {
    e.preventDefault();
    setMessaggioEsito(null);

    if (!identificativo.trim() || !nomeCompleto.trim() || !chiaveAccesso.trim()) {
      setMessaggioEsito({ tipo: 'errore', testo: 'Compila tutti i campi obbligatori contrassegnati.' });
      return;
    }

    const risultato = registraNuovaUtenza({
      identificativo: identificativo.trim().toLowerCase(),
      nomeCompleto: nomeCompleto.trim(),
      chiaveAccesso: chiaveAccesso.trim(),
      ruolo,
      reparto: reparto.trim(),
      telefono: telefono.trim(),
    });

    if (risultato.successo) {
      setMessaggioEsito({ tipo: 'successo', testo: risultato.messaggio });
      setIdentificativo('');
      setNomeCompleto('');
      setChiaveAccesso('');
      setRuolo('dipendente');
      setTelefono('');
    } else {
      setMessaggioEsito({ tipo: 'errore', testo: risultato.messaggio });
    }
  };

  const gestisciEliminaUtenza = (id: string, nome: string) => {
    if (window.confirm(`Sei sicuro di voler eliminare l'utenza di "${nome}" (${id})? I dati associati verranno rimossi.`)) {
      const res = rimuoviUtenzaEsistente(id);
      if (res.successo) {
        setMessaggioEsito({ tipo: 'successo', testo: res.messaggio });
      } else {
        setMessaggioEsito({ tipo: 'errore', testo: res.messaggio });
      }
    }
  };

  const salvaNuovaChiaveAccesso = () => {
    if (!utenzaInModifica) return;
    if (nuovaChiave.length < 4) {
      alert("La nuova chiave d'accesso deve avere almeno 4 caratteri.");
      return;
    }

    const aggiornata: Utenza = {
      ...utenzaInModifica,
      chiaveAccesso: nuovaChiave,
    };

    const ok = modificaUtenzaEsistente(aggiornata);
    if (ok) {
      setMessaggioEsito({ tipo: 'successo', testo: `Chiave d'accesso per "${utenzaInModifica.nomeCompleto}" aggiornata con successo!` });
      setUtenzaInModifica(null);
      setNuovaChiave('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Testata Modale */}
        <div className="bg-slate-900 text-white p-5 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-aziendale-blu text-white">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Gestione Utenze Aziendali</h2>
              <p className="text-xs text-slate-300">
                Pannello Direzione — Creazione dipendenti con ID e Password per C. Emme Impianti S.r.l.
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

        {/* Corpo Modale Scorrevole */}
        <div className="p-6 overflow-y-auto space-y-6">
          
          {messaggioEsito && (
            <div
              className={`p-4 rounded-2xl flex items-center gap-3 text-sm font-semibold ${
                messaggioEsito.tipo === 'successo'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {messaggioEsito.tipo === 'successo' ? (
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span>{messaggioEsito.testo}</span>
            </div>
          )}

          {/* Sezione 1: Modulo Aggiunta Nuova Utenza */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2 mb-4 text-slate-800 font-bold text-sm">
              <UserPlus className="w-4 h-4 text-aziendale-blu" />
              <span>Registra Nuova Utenza (Dipendente / Tecnico)</span>
            </div>

            <form onSubmit={gestisciCreazioneUtenza} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Identificativo Utenza (ID) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="es. m.rossi"
                    value={identificativo}
                    onChange={(e) => setIdentificativo(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-aziendale-blu focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome e Cognome *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="es. Mario Rossi"
                    value={nomeCompleto}
                    onChange={(e) => setNomeCompleto(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-aziendale-blu focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Chiave d'Accesso (Password) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Minimo 4 caratteri"
                    value={chiaveAccesso}
                    onChange={(e) => setChiaveAccesso(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-aziendale-blu focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Reparto / Squadra Operativa
                  </label>
                  <input
                    type="text"
                    placeholder="es. Impianti Ferroviari"
                    value={reparto}
                    onChange={(e) => setReparto(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-aziendale-blu focus:outline-none font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Recapito Telefonico di Reperibilità
                  </label>
                  <input
                    type="text"
                    placeholder="es. +39 333 1234567"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-aziendale-blu focus:outline-none font-medium"
                  />
                </div>
              </div>

              {/* Selettore Ruolo Utenza */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Tipologia Ruolo e Permessi per questa Utenza *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRuolo('dipendente')}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
                      ruolo === 'dipendente'
                        ? 'border-aziendale-blu bg-blue-50/60 ring-2 ring-aziendale-blu/30 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg mt-0.5 ${
                        ruolo === 'dipendente'
                          ? 'bg-aziendale-blu text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span>Dipendente / Tecnico</span>
                        {ruolo === 'dipendente' && (
                          <span className="text-[10px] font-extrabold text-aziendale-blu bg-blue-100 px-1.5 py-0.2 rounded-full">
                            Selezionato
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                        Invia richieste di ferie/permessi/malattia e consulta il proprio storico personale.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRuolo('responsabile')}
                    className={`p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
                      ruolo === 'responsabile'
                        ? 'border-purple-600 bg-purple-50/60 ring-2 ring-purple-500/30 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <div
                      className={`p-2 rounded-lg mt-0.5 ${
                        ruolo === 'responsabile'
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <span>Responsabile di Reparto</span>
                        {ruolo === 'responsabile' && (
                          <span className="text-[10px] font-extrabold text-purple-700 bg-purple-100 px-1.5 py-0.2 rounded-full">
                            Selezionato
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                        Può approvare/rifiutare le richieste dei dipendenti. Le sue richieste personali richiedono l'approvazione del Titolare.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="py-2.5 px-6 bg-aziendale-blu hover:bg-aziendale-bluScuro text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Aggiungi Utenza Aziendale</span>
                </button>
              </div>
            </form>
          </div>

          {/* Sezione 2: Elenco Utenze Registrate */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600" />
                <span>Utenze Registrate ({tutteLeUtenze.length})</span>
              </h3>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Nominativo & Reparto</th>
                    <th className="p-3.5">Identificativo (ID)</th>
                    <th className="p-3.5">Ruolo</th>
                    <th className="p-3.5">Recapito</th>
                    <th className="p-3.5 text-right">Azioni</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {tutteLeUtenze.map((u) => {
                    const eTitolare = u.ruolo === 'titolare';

                    return (
                      <tr key={u.identificativo} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900">{u.nomeCompleto}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Briefcase className="w-3 h-3 text-slate-400" />
                            {u.reparto || 'Personale'}
                          </div>
                        </td>
                        <td className="p-3.5 font-mono text-slate-900 font-semibold">
                          {u.identificativo}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                              u.ruolo === 'titolare'
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : u.ruolo === 'responsabile'
                                ? 'bg-purple-100 text-purple-800 border-purple-300'
                                : 'bg-slate-100 text-slate-700 border-slate-300'
                            }`}
                          >
                            {u.ruolo === 'titolare'
                              ? 'Titolare'
                              : u.ruolo === 'responsabile'
                              ? 'Responsabile'
                              : 'Dipendente'}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-500">
                          {u.telefono ? (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {u.telefono}
                            </span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td className="p-3.5 text-right space-x-1">
                          <button
                            onClick={() => {
                              setUtenzaInModifica(u);
                              setNuovaChiave('');
                            }}
                            title="Cambia chiave d'accesso"
                            className="p-1.5 text-slate-500 hover:text-aziendale-blu hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          {!eTitolare && (
                            <button
                              onClick={() => gestisciEliminaUtenza(u.identificativo, u.nomeCompleto)}
                              title="Rimuovi utenza"
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modale cambio password */}
          {utenzaInModifica && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h4 className="font-bold text-amber-900 text-sm">
                  Modifica Chiave d'Accesso per: {utenzaInModifica.nomeCompleto}
                </h4>
                <p className="text-xs text-amber-700">
                  Inserisci la nuova chiave d'accesso (minimo 4 caratteri)
                </p>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Nuova chiave..."
                  value={nuovaChiave}
                  onChange={(e) => setNuovaChiave(e.target.value)}
                  className="px-3 py-1.5 text-sm bg-white border border-amber-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none font-mono"
                />
                <button
                  onClick={salvaNuovaChiaveAccesso}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                >
                  Salva
                </button>
                <button
                  onClick={() => setUtenzaInModifica(null)}
                  className="px-2 py-1.5 text-slate-500 hover:bg-amber-100 rounded-xl text-xs font-semibold"
                >
                  Annulla
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Chiusura */}
        <div className="bg-slate-50 p-4 px-6 border-t border-slate-200 flex justify-end">
          <button
            onClick={suChiudi}
            className="px-5 py-2 text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl transition-colors"
          >
            Chiudi Pannello
          </button>
        </div>

      </div>
    </div>
  );
};
