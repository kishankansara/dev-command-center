/**
 * Cryptographic constants per DevCommandCenter IEEE 830-1998 SRS
 */
export const CRYPTO_CONSTANTS = {
  KDF_NAME: 'PBKDF2-SHA256' as const,
  PBKDF2_HASH: 'SHA-256' as const,
  PBKDF2_ITERATIONS: 100000,
  SALT_BYTES: 16,     // 128 bits
  CIPHER_ALGORITHM: 'AES-GCM' as const,
  AES_KEY_LENGTH: 256, // 256 bits
  IV_BYTES: 12,        // 96 bits standard for AES-GCM
  TAG_LENGTH: 128,     // 128 bits authentication tag
  PAYLOAD_VERSION: 1,
  CANARY_PAYLOAD: 'VAULT_CANARY_VALID',
} as const;
