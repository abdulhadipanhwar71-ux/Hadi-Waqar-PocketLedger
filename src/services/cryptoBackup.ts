import { BackupData, EncryptedBackupPayload } from '../types';

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function encryptBackupData(
  data: BackupData,
  passphrase: string
): Promise<EncryptedBackupPayload> {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  const plaintextJson = JSON.stringify(data);
  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plaintextJson)
  );

  return {
    version: data.version,
    isEncrypted: true,
    appName: 'PocketLedger',
    salt: bufferToBase64(salt.buffer),
    iv: bufferToBase64(iv.buffer),
    ciphertext: bufferToBase64(ciphertextBuffer),
  };
}

export async function decryptBackupData(
  payload: EncryptedBackupPayload,
  passphrase: string
): Promise<BackupData> {
  const enc = new TextEncoder();
  const dec = new TextDecoder();

  const salt = new Uint8Array(base64ToBuffer(payload.salt));
  const iv = new Uint8Array(base64ToBuffer(payload.iv));
  const ciphertext = base64ToBuffer(payload.ciphertext);

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  try {
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );
    const jsonStr = dec.decode(decryptedBuffer);
    const data = JSON.parse(jsonStr) as BackupData;
    validateBackupStructure(data);
    return data;
  } catch (err) {
    throw new Error('Failed to decrypt: Incorrect passphrase or corrupted backup file.');
  }
}

export function validateBackupStructure(data: any): asserts data is BackupData {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid backup: File must contain a JSON object.');
  }
  if (data.appName !== 'PocketLedger') {
    throw new Error('Invalid backup: Not a valid PocketLedger backup file.');
  }
  if (!Array.isArray(data.accounts)) {
    throw new Error('Invalid backup: Accounts list is missing or invalid.');
  }
  if (!Array.isArray(data.transactions)) {
    throw new Error('Invalid backup: Transactions list is missing or invalid.');
  }
  if (!Array.isArray(data.categories)) {
    throw new Error('Invalid backup: Categories list is missing or invalid.');
  }
}
