/**
 * Festività Nazionali Italiane e Festa Patronale di Casoria (Napoli)
 * C. Emme Impianti S.r.l.
 * 
 * Calcolo dinamico preciso con algoritmo canonico per Pasqua e Lunedì dell'Angelo
 */

import { Festivita } from '@/tipi';

/**
 * Calcolo astronomico e civile della Pasqua Cristiana secondo il metodo di Meeus/Jones/Butcher
 */
export function calcolaDomenicaPasqua(anno: number): Date {
  const a = anno % 19;
  const b = Math.floor(anno / 100);
  const c = anno % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mese = Math.floor((h + l - 7 * m + 114) / 31) - 1; // 0-indicizzato (2 = Marzo, 3 = Aprile)
  const giorno = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(anno, mese, giorno);
}

/**
 * Formatta una data in stringa 'AAAA-MM-GG'
 */
export function formattaDataISO(data: Date): string {
  const anno = data.getFullYear();
  const mese = String(data.getMonth() + 1).padStart(2, '0');
  const giorno = String(data.getDate()).padStart(2, '0');
  return `${anno}-${mese}-${giorno}`;
}

/**
 * Restituisce l'elenco completo delle festività per un dato anno
 */
export function ottieniFestivitaAnno(anno: number): Festivita[] {
  const pasqua = calcolaDomenicaPasqua(anno);
  const pasquetta = new Date(pasqua);
  pasquetta.setDate(pasqua.getDate() + 1);

  const formattaGiorno = (m: number, g: number) => {
    const mm = String(m).padStart(2, '0');
    const gg = String(g).padStart(2, '0');
    return `${anno}-${mm}-${gg}`;
  };

  const festivita: Festivita[] = [
    {
      data: formattaGiorno(1, 1),
      nome: 'Capodanno',
      descrizione: 'Inizio del nuovo anno civile',
      nazionale: true,
    },
    {
      data: formattaGiorno(1, 6),
      nome: 'Epifania',
      descrizione: 'Epifania del Signore',
      nazionale: true,
    },
    {
      data: formattaGiorno(1, 15),
      nome: 'San Mauro Abate (Patrono Casoria)',
      descrizione: 'Festa patronale del Comune di Casoria (sede C. Emme Impianti)',
      nazionale: false,
    },
    {
      data: formattaDataISO(pasqua),
      nome: 'Domenica di Pasqua',
      descrizione: 'Resurrezione del Signore',
      nazionale: true,
    },
    {
      data: formattaDataISO(pasquetta),
      nome: "Lunedì dell'Angelo (Pasquetta)",
      descrizione: 'Lunedì di Pasqua',
      nazionale: true,
    },
    {
      data: formattaGiorno(4, 25),
      nome: 'Festa della Liberazione',
      descrizione: 'Anniversario della liberazione d’Italia',
      nazionale: true,
    },
    {
      data: formattaGiorno(5, 1),
      nome: 'Festa dei Lavoratori',
      descrizione: 'Festa internazionale del lavoro',
      nazionale: true,
    },
    {
      data: formattaGiorno(6, 2),
      nome: 'Festa della Repubblica',
      descrizione: 'Nascita della Repubblica Italiana',
      nazionale: true,
    },
    {
      data: formattaGiorno(8, 15),
      nome: 'Assunzione di Maria (Ferragosto)',
      descrizione: 'Festa dell’Assunta e Ferragosto',
      nazionale: true,
    },
    {
      data: formattaGiorno(11, 1),
      nome: 'Tutti i Santi (Ognissanti)',
      descrizione: 'Solennità di Tutti i Santi',
      nazionale: true,
    },
    {
      data: formattaGiorno(12, 8),
      nome: 'Immacolata Concezione',
      descrizione: 'Solennità dell’Immacolata Concezione',
      nazionale: true,
    },
    {
      data: formattaGiorno(12, 25),
      nome: 'Natale di Nostro Signore',
      descrizione: 'Nascita di Gesù',
      nazionale: true,
    },
    {
      data: formattaGiorno(12, 26),
      nome: 'Santo Stefano',
      descrizione: 'Primo Martire',
      nazionale: true,
    },
  ];

  // Ordina cronologicamente
  return festivita.sort((a, b) => a.data.localeCompare(b.data));
}

/**
 * Verifica se una specifica data è festiva
 */
export function verificaGiornoFestivo(dataStr: string): Festivita | undefined {
  const anno = parseInt(dataStr.split('-')[0], 10);
  const elenco = ottieniFestivitaAnno(anno);
  return elenco.find((f) => f.data === dataStr);
}

/**
 * Nomi ufficiali dei mesi in italiano
 */
export const NOMI_MESI_ITALIANI = [
  'Gennaio',
  'Febbraio',
  'Marzo',
  'Aprile',
  'Maggio',
  'Giugno',
  'Luglio',
  'Agosto',
  'Settembre',
  'Ottobre',
  'Novembre',
  'Dicembre',
];

/**
 * Giorni della settimana in italiano (partendo da Lunedì = 0)
 */
export const GIORNI_SETTIMANA_ITALIANI = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];
export const GIORNI_SETTIMANA_ESTESI = [
  'Lunedì',
  'Martedì',
  'Mercoledì',
  'Giovedì',
  'Venerdì',
  'Sabato',
  'Domenica',
];
