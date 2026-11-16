/**
 * Secure API Utility
 * Provides End-to-End Client-Side Payload Encryption (AES-256-GCM)
 * Conceals and hides sensitive request payloads from the browser DevTools Network tab.
 */

const PAYLOAD_SECRET = import.meta.env.VITE_PAYLOAD_SECRET || 'harry_global_payload_secure_2026';

let cachedKey: CryptoKey | null = null;

async function getCryptoKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;
  const enc = new TextEncoder();
  const keyHash = await window.crypto.subtle.digest('SHA-256', enc.encode(PAYLOAD_SECRET));
  cachedKey = await window.crypto.subtle.importKey(
    'raw',
    keyHash,
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  return cachedKey;
}

/**
 * Encrypts arbitrary data using AES-256-GCM with a randomized IV per request.
 * Output is packed as [IV (12 bytes)][AuthTag (16 bytes)][Ciphertext] and Base64 encoded.
 */
export async function encryptPayload(data: any): Promise<string> {
  try {
    const cryptoKey = await getCryptoKey();
    const enc = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const plaintext = typeof data === 'string' ? data : JSON.stringify(data);

    const cipherBuffer = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      enc.encode(plaintext)
    );

    const cipherBytes = new Uint8Array(cipherBuffer);
    const tag = cipherBytes.slice(cipherBytes.length - 16);
    const cipherOnly = cipherBytes.slice(0, cipherBytes.length - 16);

    const combined = new Uint8Array(12 + 16 + cipherOnly.length);
    combined.set(iv, 0);
    combined.set(tag, 12);
    combined.set(cipherOnly, 28);

    let binary = '';
    for (let i = 0; i < combined.length; i++) {
      binary += String.fromCharCode(combined[i]);
    }
    return btoa(binary);
  } catch (err) {
    console.warn('[SecureAPI] Encryption error, fallback to unencrypted payload:', err);
    return '';
  }
}

/**
 * Drop-in wrapper around fetch() that transparently encrypts request payloads
 * for POST, PATCH, and PUT methods. In the Network tab, inspectors only see
 * the encrypted `__enc` string instead of plain text usernames, passwords, or personal data.
 */
export async function secureFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  let modifiedInit = init ? { ...init } : undefined;

  if (modifiedInit && modifiedInit.body && (modifiedInit.method === 'POST' || modifiedInit.method === 'PATCH' || modifiedInit.method === 'PUT')) {
    let rawData: any = modifiedInit.body;
    let isJson = false;

    if (typeof rawData === 'string') {
      try {
        rawData = JSON.parse(rawData);
        isJson = true;
      } catch {
        // Not a JSON string (could be form-data, etc.)
      }
    } else if (typeof rawData === 'object' && rawData !== null && !(rawData instanceof FormData) && !(rawData instanceof Blob)) {
      isJson = true;
    }

    if (isJson && typeof rawData === 'object' && rawData !== null && !rawData.__enc) {
      const encrypted = await encryptPayload(rawData);
      if (encrypted) {
        modifiedInit = {
          ...modifiedInit,
          headers: {
            ...modifiedInit.headers,
            'Content-Type': 'application/json',
            'x-payload-encrypted': 'true'
          },
          body: JSON.stringify({ __enc: encrypted })
        };
      }
    }
  }

  return fetch(input, modifiedInit);
}
