import { CRYPTO_CONSTANTS } from './constants';
import { getCrypto, stringToBytes, bytesToString } from './utils';

/**
 * Encrypts plaintext bytes using AES-GCM-256 with a 96-bit random IV
 */
export async function encryptBuffer(
  plaintext: Uint8Array,
  key: CryptoKey,
  iv: Uint8Array
): Promise<Uint8Array> {
  const cryptoInstance = getCrypto();
  const encryptedBuffer = await cryptoInstance.subtle.encrypt(
    {
      name: CRYPTO_CONSTANTS.CIPHER_ALGORITHM,
      iv: iv as unknown as BufferSource,
      tagLength: CRYPTO_CONSTANTS.TAG_LENGTH,
    },
    key,
    plaintext as unknown as BufferSource
  );

  return new Uint8Array(encryptedBuffer);
}

/**
 * Decrypts ciphertext buffer (ciphertext + tag) using AES-GCM-256
 */
export async function decryptBuffer(
  ciphertextWithTag: Uint8Array,
  key: CryptoKey,
  iv: Uint8Array
): Promise<Uint8Array> {
  const cryptoInstance = getCrypto();
  const decryptedBuffer = await cryptoInstance.subtle.decrypt(
    {
      name: CRYPTO_CONSTANTS.CIPHER_ALGORITHM,
      iv: iv as unknown as BufferSource,
      tagLength: CRYPTO_CONSTANTS.TAG_LENGTH,
    },
    key,
    ciphertextWithTag as unknown as BufferSource
  );

  return new Uint8Array(decryptedBuffer);
}
