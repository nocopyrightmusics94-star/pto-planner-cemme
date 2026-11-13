/**
 * Modulo di Rilevamento Manomissioni e Storage Tampering (HMAC-SHA256)
 * C. Emme Impianti S.r.l. - Cybersecurity & Integrity Protection
 * 
 * Genera e verifica sigilli di integrità crittografici su localStorage e file di backup,
 * impedendo privilege escalation e forgiatura di stati approvati non autorizzati.
 */

import { bytesAHex, timingSafeEqual } from './hashing';

export const DEFAULT_INTEGRITY_SECRET = 'cemme-hmac-sha256-storage-integrity-key-2026';

/**
 * Ottiene o deriva una CryptoKey HMAC-SHA256 per la sigillatura dei dati
 */
async function ottieniChiaveHMAC(segreto: string = DEFAULT_INTEGRITY_SECRET): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return globalThis.crypto.subtle.importKey(
    'raw',
    enc.encode(segreto),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * Serializzazione canonica deterministica JSON (chiavi ordinate alfabeticamente a ogni livello)
 */
export function serializzaCanonico(obj: unknown): string {
  if (obj === null || typeof obj !== 'object') {
    return JSON.stringify(obj);
  }
  if (Array.isArray(obj)) {
    return '[' + obj.map(serializzaCanonico).join(',') + ']';
  }

  const chiavi = Object.keys(obj as Record<string, unknown>).sort();
  return (
    '{' +
    chiavi
      .map(
        (k) =>
          JSON.stringify(k) +
          ':' +
          serializzaCanonico((obj as Record<string, unknown>)[k])
      )
      .join(',') +
    '}'
  );
}

export const canonicalizeJson = serializzaCanonico;

/**
 * Calcola un sigillo crittografico HMAC-SHA256 a 64 caratteri esadecimali sui dati forniti.
 * 
 * @param dati Dati arbitrari (oggetto, array o primitivo) da sigillare
 * @param segreto Chiave HMAC segreta opzionale (usa DEFAULT_INTEGRITY_SECRET se omessa)
 * @returns Sigillo esadecimale a 64 caratteri (256 bit)
 */
export async function calcolaSigilloIntegrita(
  dati: unknown,
  segreto: string = DEFAULT_INTEGRITY_SECRET
): Promise<string> {
  const jsonCanonico = serializzaCanonico(dati);
  const enc = new TextEncoder();
  const chiave = await ottieniChiaveHMAC(segreto);

  const sigBuffer = await globalThis.crypto.subtle.sign(
    'HMAC',
    chiave,
    enc.encode(jsonCanonico)
  );

  return bytesAHex(new Uint8Array(sigBuffer));
}

/**
 * Verifica se il sigillo di integrità corrisponde esattamente al contenuto dei dati.
 * Il confronto avviene tassativamente a tempo costante (anti-timing attack).
 * 
 * @param dati Dati da verificare
 * @param sigillo Sigillo esadecimale atteso (deve essere lungo 64 caratteri)
 * @param segreto Chiave HMAC segreta opzionale
 * @returns true se i dati sono autentici e inalterati, false in caso di discrepanza o manomissione
 */
export async function verificaSigilloIntegrita(
  dati: unknown,
  sigillo: string,
  segreto: string = DEFAULT_INTEGRITY_SECRET
): Promise<boolean> {
  if (!sigillo || typeof sigillo !== 'string' || sigillo.length !== 64) {
    return false;
  }

  try {
    const calcolato = await calcolaSigilloIntegrita(dati, segreto);
    return timingSafeEqual(calcolato.toLowerCase(), sigillo.toLowerCase());
  } catch {
    return false;
  }
}
