package com.devcommandcenter.security

import android.util.Base64
import org.json.JSONObject
import java.nio.charset.StandardCharsets
import java.security.SecureRandom
import javax.crypto.Cipher
import javax.crypto.SecretKey
import javax.crypto.SecretKeyFactory
import javax.crypto.spec.GCMParameterSpec
import javax.crypto.spec.PBEKeySpec
import javax.crypto.spec.SecretKeySpec

/**
 * Cross-Platform AES-256-GCM Cryptographic Engine
 * Exact byte-for-byte compatibility with Web Crypto API (SubtleCrypto)
 * PBKDF2-HMAC-SHA256 (100,000 iterations) + AES/GCM/NoPadding (256-bit, 12-byte IV, 128-bit tag)
 */
class AesGcmCipherEngine {

    companion object {
        const val PBKDF2_ITERATIONS = 100000
        const val KEY_LENGTH_BITS = 256
        const val SALT_LENGTH_BYTES = 16
        const val IV_LENGTH_BYTES = 12
        const val GCM_TAG_LENGTH_BITS = 128
    }

    /**
     * Derives an AES-256 SecretKey from a user passphrase and salt
     */
    fun deriveKey(passphrase: CharArray, salt: ByteArray): SecretKey {
        val spec = PBEKeySpec(passphrase, salt, PBKDF2_ITERATIONS, KEY_LENGTH_BITS)
        val factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256")
        val keyBytes = factory.generateSecret(spec).encoded
        return SecretKeySpec(keyBytes, "AES")
    }

    /**
     * Decrypts a base64 or JSON serialized ciphertext envelope from Web Client
     */
    fun decryptPayload(serialized: String, passphrase: CharArray): String {
        val jsonString = if (serialized.trim().startsWith("{")) {
            serialized.trim()
        } else {
            String(Base64.decode(serialized.trim(), Base64.DEFAULT), StandardCharsets.UTF_8)
        }

        val json = JSONObject(jsonString)
        val salt = Base64.decode(json.getString("salt"), Base64.DEFAULT)
        val iv = Base64.decode(json.getString("iv"), Base64.DEFAULT)
        val ct = Base64.decode(json.getString("ct"), Base64.DEFAULT)

        val secretKey = deriveKey(passphrase, salt)
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        val gcmSpec = GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv)
        cipher.init(Cipher.DECRYPT_MODE, secretKey, gcmSpec)

        val decryptedBytes = cipher.doFinal(ct)
        return String(decryptedBytes, StandardCharsets.UTF_8)
    }

    /**
     * Encrypts plaintext string into an interoperable base64 serialized envelope
     */
    fun encryptPayload(plaintext: String, passphrase: CharArray): String {
        val random = SecureRandom()
        val salt = ByteArray(SALT_LENGTH_BYTES).also { random.nextBytes(it) }
        val iv = ByteArray(IV_LENGTH_BYTES).also { random.nextBytes(it) }

        val secretKey = deriveKey(passphrase, salt)
        val cipher = Cipher.getInstance("AES/GCM/NoPadding")
        val gcmSpec = GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv)
        cipher.init(Cipher.ENCRYPT_MODE, secretKey, gcmSpec)

        val ciphertext = cipher.doFinal(plaintext.toByteArray(StandardCharsets.UTF_8))

        val json = JSONObject().apply {
            put("v", 1)
            put("kdf", "PBKDF2-SHA256")
            put("iter", PBKDF2_ITERATIONS)
            put("salt", Base64.encodeToString(salt, Base64.NO_WRAP))
            put("iv", Base64.encodeToString(iv, Base64.NO_WRAP))
            put("ct", Base64.encodeToString(ciphertext, Base64.NO_WRAP))
        }

        return Base64.encodeToString(
            json.toString().toByteArray(StandardCharsets.UTF_8),
            Base64.NO_WRAP
        )
    }
}
