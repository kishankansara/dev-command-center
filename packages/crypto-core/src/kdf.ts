import { CRYPTO_CONSTANTS } from './constants';
import { getCrypto, stringToBytes, hexToBytes } from './utils';

/**
 * Derives an AES-GCM-256 CryptoKey from a user passphrase and salt (hex string or Uint8Array)
 */
export async function deriveKey(
  passphrase: string,
  salt: string | Uint8Array
): Promise<CryptoKey> {
  const saltBytes = typeof salt === 'string' ? hexToBytes(salt) : salt;
  return deriveKeyFromPassphrase(passphrase, saltBytes);
}

/**
 * Derives an AES-GCM-256 CryptoKey from a user passphrase and salt via PBKDF2-HMAC-SHA256
 */
export async function deriveKeyFromPassphrase(
  passphrase: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const cryptoInstance = getCrypto();
  const passphraseBytes = stringToBytes(passphrase);

  // Import raw passphrase as a key derivation base
  const baseKey = await cryptoInstance.subtle.importKey(
    'raw',
    passphraseBytes as unknown as BufferSource,
    { name: 'PBKDF2' },
    false,
    ['deriveKey', 'deriveBits']
  );

  // Derive AES-GCM 256-bit encryption key
  return cryptoInstance.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: CRYPTO_CONSTANTS.PBKDF2_ITERATIONS,
      hash: CRYPTO_CONSTANTS.PBKDF2_HASH,
    },
    baseKey,
    {
      name: CRYPTO_CONSTANTS.CIPHER_ALGORITHM,
      length: CRYPTO_CONSTANTS.AES_KEY_LENGTH,
    },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Derives raw 32-byte key material for cross-platform validation
 */
export async function deriveRawKeyBits(
  passphrase: string,
  salt: Uint8Array
): Promise<Uint8Array> {
  const cryptoInstance = getCrypto();
  const passphraseBytes = stringToBytes(passphrase);

  const baseKey = await cryptoInstance.subtle.importKey(
    'raw',
    passphraseBytes as unknown as BufferSource,
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const bits = await cryptoInstance.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: CRYPTO_CONSTANTS.PBKDF2_ITERATIONS,
      hash: CRYPTO_CONSTANTS.PBKDF2_HASH,
    },
    baseKey,
    CRYPTO_CONSTANTS.AES_KEY_LENGTH
  );

  return new Uint8Array(bits);
}
