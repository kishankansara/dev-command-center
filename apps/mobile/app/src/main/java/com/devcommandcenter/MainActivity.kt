package com.devcommandcenter

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.view.WindowManager
import androidx.appcompat.app.AppCompatActivity
import com.devcommandcenter.auth.SecureSessionManager
import com.devcommandcenter.data.SupabaseProjectRepository
import com.devcommandcenter.security.BiometricAuthManager
import com.devcommandcenter.security.KeystoreKeyManager
import com.devcommandcenter.security.MemoryAutoWipeManager

/**
 * Main Android Activity for DevCommandCenter
 * Strictly enforces:
 * 1. WindowManager.LayoutParams.FLAG_SECURE to block screen leaks (FR-SEC-02)
 * 2. Hardware-backed BiometricPrompt gating (FR-SEC-01, TC-MOB-01)
 * 3. In-memory auto-wipe on onPause() and 5-min idle timer (FR-SEC-03)
 * 4. OAuth deep-link callback and token persistence via Android Keystore / EncryptedSharedPreferences
 * 5. Realtime sync repository listener (FR-SYN-01)
 */
class MainActivity : AppCompatActivity() {

    private lateinit var biometricAuthManager: BiometricAuthManager
    private lateinit var keystoreKeyManager: KeystoreKeyManager
    private lateinit var memoryAutoWipeManager: MemoryAutoWipeManager
    private lateinit var sessionManager: SecureSessionManager
    private lateinit var projectRepository: SupabaseProjectRepository

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // FR-SEC-02: Screen Leak Prevention
        // Block OS screenshots, screen recordings, and task-switcher previews
        window.setFlags(
            WindowManager.LayoutParams.FLAG_SECURE,
            WindowManager.LayoutParams.FLAG_SECURE
        )

        // Initialize security & auth subsystems
        biometricAuthManager = BiometricAuthManager(this)
        keystoreKeyManager = KeystoreKeyManager()
        memoryAutoWipeManager = MemoryAutoWipeManager()
        sessionManager = SecureSessionManager(this)
        projectRepository = SupabaseProjectRepository(sessionManager)

        // Ensure Android Keystore hardware key is ready
        keystoreKeyManager.getOrCreateHardwareKey()

        val btnAuth = findViewById<android.widget.Button>(R.id.btnBiometricAuth)
        val tvStatus = findViewById<android.widget.TextView>(R.id.tvAuthStatus)

        btnAuth?.setOnClickListener {
            requireBiometricAuthentication(
                onSuccess = {
                    tvStatus?.text = "Authenticated: Hardware Keystore Unlocked"
                    tvStatus?.setTextColor(android.graphics.Color.parseColor("#10B981"))
                },
                onError = { err ->
                    tvStatus?.text = "Auth Failed: $err"
                    tvStatus?.setTextColor(android.graphics.Color.parseColor("#F43F5E"))
                }
            )
        }

        // Trigger biometric prompt on startup
        requireBiometricAuthentication(
            onSuccess = {
                tvStatus?.text = "Authenticated: Hardware Keystore Unlocked"
                tvStatus?.setTextColor(android.graphics.Color.parseColor("#10B981"))
            },
            onError = { err ->
                tvStatus?.text = "Auth Failed: $err"
                tvStatus?.setTextColor(android.graphics.Color.parseColor("#F43F5E"))
            }
        )

        // Handle OAuth deep link if opened via devcommandcenter://login-callback
        handleOAuthDeepLink(intent)

        // Attach Realtime sync listener if authenticated
        if (sessionManager.isAuthenticated()) {
            projectRepository.attachRealtimeListener()
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleOAuthDeepLink(intent)
    }

    private fun handleOAuthDeepLink(intent: Intent?) {
        val uri: Uri? = intent?.data
        if (uri != null && uri.scheme == "devcommandcenter" && uri.host == "login-callback") {
            val accessToken = uri.getQueryParameter("access_token")
            val refreshToken = uri.getQueryParameter("refresh_token")
            val userId = uri.getQueryParameter("user_id") ?: "user-mobile"
            val email = uri.getQueryParameter("email") ?: "dev.mobile@gmail.com"

            if (!accessToken.isNullOrBlank() && !refreshToken.isNullOrBlank()) {
                sessionManager.saveSession(
                    userId = userId,
                    email = email,
                    accessToken = accessToken,
                    refreshToken = refreshToken
                )
                projectRepository.attachRealtimeListener()
            }
        }
    }

    override fun onUserInteraction() {
        super.onUserInteraction()
        // Reset 5-minute idle auto-wipe countdown (FR-SEC-03)
        memoryAutoWipeManager.onUserInteraction()
    }

    private var isUnlocked = false

    override fun onPause() {
        super.onPause()
        // FR-SEC-03: Immediately clear decrypted secrets from heap memory on app pause
        memoryAutoWipeManager.onAppPaused()

        // Relock on backgrounding
        isUnlocked = false
        val tvStatus = findViewById<android.widget.TextView>(R.id.tvAuthStatus)
        tvStatus?.text = "Vault Locked: Biometrics Required"
        tvStatus?.setTextColor(android.graphics.Color.parseColor("#F59E0B"))
    }

    override fun onResume() {
        super.onResume()
        // Require biometric re-authentication if returning while locked
        if (!isUnlocked) {
            val tvStatus = findViewById<android.widget.TextView>(R.id.tvAuthStatus)
            requireBiometricAuthentication(
                onSuccess = {
                    isUnlocked = true
                    tvStatus?.text = "Authenticated: Hardware Keystore Unlocked"
                    tvStatus?.setTextColor(android.graphics.Color.parseColor("#10B981"))
                },
                onError = { err ->
                    isUnlocked = false
                    tvStatus?.text = "Auth Failed: $err"
                    tvStatus?.setTextColor(android.graphics.Color.parseColor("#F43F5E"))
                }
            )
        }
    }

    /**
     * Public API invoked before decrypting sensitive credential fields
     * Gates access strictly behind biometric challenge (TC-MOB-01)
     */
    fun requireBiometricAuthentication(onSuccess: () -> Unit, onError: (String) -> Unit) {
        biometricAuthManager.authenticate { result ->
            when (result) {
                is BiometricAuthManager.AuthResult.Success -> {
                    memoryAutoWipeManager.onUserInteraction()
                    onSuccess()
                }
                is BiometricAuthManager.AuthResult.Error -> {
                    onError(result.errString.toString())
                }
                is BiometricAuthManager.AuthResult.Failed -> {
                    onError("Biometric authentication rejected by user")
                }
            }
        }
    }
}
