package com.devcommandcenter.security

import android.content.Context
import androidx.biometric.BiometricManager
import androidx.biometric.BiometricManager.Authenticators.BIOMETRIC_STRONG
import androidx.biometric.BiometricManager.Authenticators.DEVICE_CREDENTIAL
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity

/**
 * Biometric Authentication Manager (FR-SEC-01, TC-MOB-01)
 * Gates cryptographic operations behind hardware-backed BiometricPrompt
 * with BIOMETRIC_STRONG or DEVICE_CREDENTIAL (PIN/pattern/password) fallback.
 */
class BiometricAuthManager(private val activity: FragmentActivity) {

    sealed class AuthResult {
        data object Success : AuthResult()
        data class Error(val errorCode: Int, val errString: CharSequence) : AuthResult()
        data object Failed : AuthResult()
    }

    /**
     * Checks whether the device hardware supports strong biometrics or device credentials
     */
    fun canAuthenticate(): Boolean {
        val biometricManager = BiometricManager.from(activity)
        return biometricManager.canAuthenticate(BIOMETRIC_STRONG or DEVICE_CREDENTIAL) ==
                BiometricManager.BIOMETRIC_SUCCESS
    }

    /**
     * Presents the OS hardware biometric dialog
     */
    fun authenticate(
        title: String = "DevCommandCenter Vault Verification",
        subtitle: String = "Authenticate to decrypt sensitive credentials",
        onResult: (AuthResult) -> Unit
    ) {
        val executor = ContextCompat.getMainExecutor(activity)

        val callback = object : BiometricPrompt.AuthenticationCallback() {
            override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                super.onAuthenticationError(errorCode, errString)
                onResult(AuthResult.Error(errorCode, errString))
            }

            override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                super.onAuthenticationSucceeded(result)
                onResult(AuthResult.Success)
            }

            override fun onAuthenticationFailed() {
                super.onAuthenticationFailed()
                onResult(AuthResult.Failed)
            }
        }

        val promptInfo = BiometricPrompt.PromptInfo.Builder()
            .setTitle(title)
            .setSubtitle(subtitle)
            .setAllowedAuthenticators(BIOMETRIC_STRONG or DEVICE_CREDENTIAL)
            .build()

        val biometricPrompt = BiometricPrompt(activity, executor, callback)
        biometricPrompt.authenticate(promptInfo)
    }
}
