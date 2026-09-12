package com.devcommandcenter.security

import android.os.Handler
import android.os.Looper
import java.util.Arrays
import java.util.concurrent.CopyOnWriteArrayList

/**
 * In-Memory Auto-Wipe Manager (FR-SEC-03)
 * Clears decrypted secrets from heap memory on app pause (onPause)
 * or after 5 minutes of idle time.
 */
class MemoryAutoWipeManager(
    private val idleTimeoutMillis: Long = 5 * 60 * 1000L // 5 minutes
) {
    interface Wipeable {
        fun wipeSensitiveData()
    }

    private val registeredHolders = CopyOnWriteArrayList<Wipeable>()
    private val handler = Handler(Looper.getMainLooper())
    private var isScheduled = false

    private val idleWipeRunnable = Runnable {
        wipeAllHeapSecrets()
    }

    /**
     * Registers a component holding decrypted secrets in memory
     */
    fun register(wipeable: Wipeable) {
        registeredHolders.add(wipeable)
    }

    fun unregister(wipeable: Wipeable) {
        registeredHolders.remove(wipeable)
    }

    /**
     * Notifies user activity to reset the 5-minute idle countdown
     */
    fun onUserInteraction() {
        handler.removeCallbacks(idleWipeRunnable)
        handler.postDelayed(idleWipeRunnable, idleTimeoutMillis)
        isScheduled = true
    }

    /**
     * Triggered on Android lifecycle onPause()
     */
    fun onAppPaused() {
        wipeAllHeapSecrets()
    }

    /**
     * Wipes all registered in-memory secret caches and zeroizes byte buffers
     */
    fun wipeAllHeapSecrets() {
        handler.removeCallbacks(idleWipeRunnable)
        isScheduled = false
        for (holder in registeredHolders) {
            try {
                holder.wipeSensitiveData()
            } catch (e: Exception) {
                // Defensive logging / error suppression
            }
        }
    }

    companion object {
        /**
         * Securely overwrites a byte array with zeros in heap memory
         */
        fun zeroize(buffer: ByteArray) {
            Arrays.fill(buffer, 0.toByte())
        }

        /**
         * Securely overwrites a char array with null characters in heap memory
         */
        fun zeroize(buffer: CharArray) {
            Arrays.fill(buffer, '\u0000')
        }
    }
}
