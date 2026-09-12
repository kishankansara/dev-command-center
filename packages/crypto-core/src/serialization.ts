import { EncryptedPayload } from '@dev-command-center/shared-types';
import { CRYPTO_CONSTANTS } from './constants';
import {
  base64ToBytes,
  bytesToBase64,
  generateRandomBytes,
  stringToBytes,
  bytesToString,
} from './utils';
import { deriveKeyFromPassphrase } from './kdf';
import { encryptBuffer, decryptBuffer } from './cipher';

/**
 * Serializes an EncryptedPayload to a portable Base64-encoded string representation
 */
export function serializePayload(payload: EncryptedPayload): string {
  const json = JSON.stringify(payload);
  return bytesToBase64(stringToBytes(json));
}

/**
 * Deserializes an encrypted string back to an EncryptedPayload structure
 */
export function deserializePayload(serialized: string): EncryptedPayload {
  const trimmed = serialized.trim();
  let jsonString: string;

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    jsonString = trimmed;
  } else {
    try {
      jsonString = bytesToString(base64ToBytes(trimmed));
    } catch {
      throw new Error('Invalid ciphertext format: failed to decode base64 envelope.');
    }
  }

  const parsed = JSON.parse(jsonString);
  if (
    typeof parsed.v !== 'number' ||
    typeof parsed.salt !== 'string' ||
    typeof parsed.iv !== 'string' ||
    typeof parsed.ct !== 'string'
  ) {
    throw new Error('Invalid ciphertext structure: missing required envelope fields.');
  }

  return parsed as EncryptedPayload;
}

/**
 * High-level zero-knowledge encryption function
 * Takes plaintext and either a master passphrase or pre-derived CryptoKey
 */
export async function encryptText(
  plaintext: string,
  passphraseOrKey: string | { key: CryptoKey; salt: Uint8Array }
): Promise<string> {
  let key: CryptoKey;
  let salt: Uint8Array;

  if (typeof passphraseOrKey === 'string') {
    salt = generateRandomBytes(CRYPTO_CONSTANTS.SALT_BYTES);
    key = await deriveKeyFromPassphrase(passphraseOrKey, salt);
  } else {
    key = passphraseOrKey.key;
    salt = passphraseOrKey.salt;
  }

  const iv = generateRandomBytes(CRYPTO_CONSTANTS.IV_BYTES);
  const plaintextBytes = stringToBytes(plaintext);
  const ciphertextBytes = await encryptBuffer(plaintextBytes, key, iv);

  const payload: EncryptedPayload = {
    v: CRYPTO_CONSTANTS.PAYLOAD_VERSION,
    kdf: CRYPTO_CONSTANTS.KDF_NAME,
    iter: CRYPTO_CONSTANTS.PBKDF2_ITERATIONS,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ct: bytesToBase64(ciphertextBytes),
  };

  return serializePayload(payload);
}

/**
 * High-level zero-knowledge decryption function
 */
export async function decryptText(
  serializedCiphertext: string,
  passphraseOrKey: string | CryptoKey
): Promise<string> {
  const payload = deserializePayload(serializedCiphertext);
  const salt = base64ToBytes(payload.salt);
  const iv = base64ToBytes(payload.iv);
  const ciphertextWithTag = base64ToBytes(payload.ct);

  let key: CryptoKey;
  if (typeof passphraseOrKey === 'string') {
    key = await deriveKeyFromPassphrase(passphraseOrKey, salt);
  } else {
    key = passphraseOrKey;
  }

  const decryptedBytes = await decryptBuffer(ciphertextWithTag, key, iv);
  return bytesToString(decryptedBytes);
}
