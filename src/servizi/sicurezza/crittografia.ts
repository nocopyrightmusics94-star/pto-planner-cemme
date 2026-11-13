/**
 * Modulo di Crittografia Dati Sensibili (GDPR Art. 9)
 * C. Emme Impianti S.r.l. - Cybersecurity & Privacy Protection
 * 
 * Implementazione Web Crypto API standard AES-GCM a 256 bit con derivazione
 * chiave tramite PBKDF2-SHA256 (100.000 iterazioni) e IV casuale univoco a 96 bit (12 byte).
 */

export const DEFAULT_ENCRYPTION_SECRET = 'cemme-impianti-super-secret-master-key-2026';

export interface PayloadCifrato {
  c: string; // Base64 ciphertext
  iv: string; // Base64 IV (12 byte)
  s: string; // Base64 Salt (16 byte)
  v: '1.0';
}

function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64');
  }
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  if (typeof Buffer !== 'undefined') {
    return new Uint8Array(Buffer.from(base64, 'base64'));
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function derivaChiaveAES(segreto: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const baseKey = await globalThis.crypto.subtle.importKey(
    'raw',
    enc.encode(segreto),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return globalThis.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Cifra una stringa di dati sensibili tramite AES-GCM 256.
 * Genera un IV a 96 bit e un salt PBKDF2 a 128 bit univoci per ogni cifratura.
 * 
 * @param testoInChiaro Dato sensibile da proteggere
 * @param chiaveSegreta Chiave segreta aziendale opzionale (usa DEFAULT_ENCRYPTION_SECRET se omessa)
 * @returns Envelope JSON serializzato contenente ciphertext (c), IV (iv), salt (s) e versione (v)
 */
export async function cifraDatoSensibile(
  testoInChiaro: string,
  chiaveSegreta: string = DEFAULT_ENCRYPTION_SECRET
): Promise<string> {
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16));
  const chiave = await derivaChiaveAES(chiaveSegreta, salt);

  const enc = new TextEncoder();
  const cipherBuffer = await globalThis.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as unknown as BufferSource },
    chiave,
    enc.encode(testoInChiaro)
  );

  const payload: PayloadCifrato = {
    c: bytesToBase64(new Uint8Array(cipherBuffer)),
    iv: bytesToBase64(iv),
    s: bytesToBase64(salt),
    v: '1.0',
  };

  return JSON.stringify(payload);
}

/**
 * Decifra un dato sensibile cifrato con AES-GCM 256.
 * Gestisce e segnala tempestivamente tentativi di manomissione o discrepanze di chiave.
 * 
 * @param testoCifrato Envelope JSON serializzato
 * @param chiaveSegreta Chiave segreta utilizzata per la derivazione
 * @returns Testo in chiaro decifrato
 */
export async function decifraDatoSensibile(
  testoCifrato: string,
  chiaveSegreta: string = DEFAULT_ENCRYPTION_SECRET
): Promise<string> {
  let parsed: PayloadCifrato;
  try {
    parsed = JSON.parse(testoCifrato);
  } catch {
    throw new Error('Formato cifrato non valido: JSON malformato');
  }

  if (!parsed || !parsed.c || !parsed.iv || !parsed.s) {
    throw new Error('Struttura envelope AES-GCM incompleta');
  }

  const iv = base64ToBytes(parsed.iv);
  const salt = base64ToBytes(parsed.s);
  const cipherBytes = base64ToBytes(parsed.c);

  const chiave = await derivaChiaveAES(chiaveSegreta, salt);

  try {
    const plainBuffer = await globalThis.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as unknown as BufferSource },
      chiave,
      cipherBytes as unknown as BufferSource
    );

    const dec = new TextDecoder();
    return dec.decode(plainBuffer);
  } catch {
    throw new Error('Decifratura fallita: chiave errata o payload manomesso');
  }
}
