import { CRYPTO_CONSTANTS } from './constants';
import { deriveKey } from './kdf';
import { decryptData } from './serialization';

export const CANARY_PAYLOAD = CRYPTO_CONSTANTS.CANARY_PAYLOAD;

/**
 * Verifies a passphrase against a stored salt and canary ciphertext envelope.
 * Derives the key and attempts to decrypt canaryEnvelope.
 * If decrypted text === CANARY_PAYLOAD, returns { valid: true, key }.
 * If decryption throws or text mismatches, returns { valid: false }.
 */
export async function verifyPassphrase(
  passphrase: string,
  salt: string,
  canaryEnvelope: string
): Promise<{ valid: boolean; key?: CryptoKey }> {
  try {
    const key = await deriveKey(passphrase, salt);
    const decrypted = await decryptData(canaryEnvelope, key);
    if (decrypted === CANARY_PAYLOAD) {
      return { valid: true, key };
    }
    return { valid: false };
  } catch {
    return { valid: false };
  }
}
