function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function hashPin(pin: string, saltHex?: string): Promise<{ hash: string; salt: string }> {
  const enc = new TextEncoder();
  const salt = saltHex
    ? new Uint8Array((saltHex.match(/.{1,2}/g) || []).map(byte => parseInt(byte, 16)))
    : crypto.getRandomValues(new Uint8Array(16));

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(pin),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  return {
    hash: bufferToHex(derivedBits),
    salt: bufferToHex(salt.buffer),
  };
}

export async function verifyPin(pin: string, expectedHash: string, saltHex: string): Promise<boolean> {
  try {
    const { hash } = await hashPin(pin, saltHex);
    return hash === expectedHash;
  } catch {
    return false;
  }
}
