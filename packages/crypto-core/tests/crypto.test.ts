import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  encryptText,
  decryptText,
  deriveKeyFromPassphrase,
  generateRandomBytes,
  CRYPTO_CONSTANTS,
  deserializePayload,
} from '../src/index';

describe('Zero-Knowledge AES-256-GCM Cryptographic Engine', () => {
  const masterPassphrase = 'CorrectHorseBatteryStaple!2026';
  const secretData = 'mock_secret_production_token_XYZ123456789';

  it('successfully encrypts and decrypts secret data roundtrip', async () => {
    const ciphertext = await encryptText(secretData, masterPassphrase);
    assert.strictEqual(typeof ciphertext, 'string');
    assert.ok(ciphertext.length > 30, 'Ciphertext should be non-trivial base64');

    // Decrypt using identical passphrase
    const decrypted = await decryptText(ciphertext, masterPassphrase);
    assert.strictEqual(decrypted, secretData);
  });

  it('enforces zero-knowledge: ciphertext contains no plaintext leakage (TC-SEC-01)', async () => {
    const passwordSecret = 'my-super-secret-smtp-password-999';
    const ciphertext = await encryptText(passwordSecret, masterPassphrase);

    assert.strictEqual(ciphertext.includes(passwordSecret), false, 'Plaintext must not appear in serialized string');
    assert.strictEqual(ciphertext.includes('smtp'), false, 'Substrings must not appear');

    // Inspect decoded payload
    const payload = deserializePayload(ciphertext);
    assert.strictEqual(payload.v, 1);
    assert.strictEqual(payload.kdf, 'PBKDF2-SHA256');
    assert.strictEqual(payload.iter, 100000);
  });

  it('fails decryption when an incorrect passphrase is supplied', async () => {
    const ciphertext = await encryptText(secretData, masterPassphrase);
    const wrongPassphrase = 'WrongPassphraseAttempt!';

    await assert.rejects(
      async () => {
        await decryptText(ciphertext, wrongPassphrase);
      },
      /operation failed|tag|authentication|decrypt/i
    );
  });

  it('fails decryption if ciphertext payload has been tampered with (integrity check)', async () => {
    const ciphertext = await encryptText(secretData, masterPassphrase);
    const payload = deserializePayload(ciphertext);

    // Tamper with ciphertext by altering last byte
    const ctChars = payload.ct.split('');
    ctChars[ctChars.length - 2] = ctChars[ctChars.length - 2] === 'A' ? 'B' : 'A';
    payload.ct = ctChars.join('');

    const tamperedCiphertext = Buffer.from(JSON.stringify(payload)).toString('base64');

    await assert.rejects(
      async () => {
        await decryptText(tamperedCiphertext, masterPassphrase);
      },
      /operation failed|tag|authentication|decrypt/i
    );
  });

  it('encrypts and decrypts complex structured JSON test credentials (FR-PRJ-03)', async () => {
    const testCredentials = [
      { id: '1', label: 'Stripe Mock Key', value: 'sk_test_51Mz...abc' },
      { id: '2', label: 'Firebase Dev Admin', value: 'firebase-adminsdk@dev.iam.gserviceaccount.com' }
    ];
    const jsonString = JSON.stringify(testCredentials);

    const ciphertext = await encryptText(jsonString, masterPassphrase);
    const decryptedJson = await decryptText(ciphertext, masterPassphrase);
    const parsed = JSON.parse(decryptedJson);

    assert.deepStrictEqual(parsed, testCredentials);
  });

  it('efficiently uses pre-derived CryptoKey for batch operations', async () => {
    const salt = generateRandomBytes(CRYPTO_CONSTANTS.SALT_BYTES);
    const key = await deriveKeyFromPassphrase(masterPassphrase, salt);

    const secrets = ['secret_alpha', 'secret_beta', 'secret_gamma'];
    const ciphertexts: string[] = [];

    const startTime = Date.now();
    for (const s of secrets) {
      ciphertexts.push(await encryptText(s, { key, salt }));
    }

    for (let i = 0; i < secrets.length; i++) {
      const decrypted = await decryptText(ciphertexts[i], key);
      assert.strictEqual(decrypted, secrets[i]);
    }
    const elapsed = Date.now() - startTime;
    assert.ok(elapsed < 500, `Batch operations took ${elapsed}ms, should be very fast with pre-derived key`);
  });

  it('generates salt, derives key, creates canary and verifies successfully', async () => {
    const { generateSalt, deriveKey, encryptData, verifyPassphrase, CANARY_PAYLOAD } = await import('../src/index');

    const salt = generateSalt();
    assert.strictEqual(typeof salt, 'string');
    assert.strictEqual(salt.length, 32, '16 bytes in hex should be 32 hex chars');

    const key = await deriveKey(masterPassphrase, salt);
    assert.ok(key);

    const canaryEnvelope = await encryptData(CANARY_PAYLOAD, key);
    assert.strictEqual(typeof canaryEnvelope, 'string');

    // 1. Valid passphrase verification
    const validResult = await verifyPassphrase(masterPassphrase, salt, canaryEnvelope);
    assert.strictEqual(validResult.valid, true);
    assert.ok(validResult.key, 'Valid verification must yield derived CryptoKey');

    // 2. Invalid passphrase verification
    const invalidResult = await verifyPassphrase('IncorrectPassphrase!999', salt, canaryEnvelope);
    assert.strictEqual(invalidResult.valid, false);
    assert.strictEqual(invalidResult.key, undefined);

    // 3. Tampered canary envelope verification
    const tamperedCanary = canaryEnvelope.substring(0, canaryEnvelope.length - 4) + 'AAAA';
    const tamperedResult = await verifyPassphrase(masterPassphrase, salt, tamperedCanary);
    assert.strictEqual(tamperedResult.valid, false);
  });
});
