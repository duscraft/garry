package com.duscraft.garry.platform

import android.content.Context
import androidx.biometric.BiometricManager as AndroidBiometricManager
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.fragment.app.FragmentActivity
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.platform.LocalContext
import kotlin.coroutines.resume
import kotlin.coroutines.suspendCoroutine

actual class BiometricManager(private val context: Context) {
    actual fun canAuthenticate(): Boolean {
        val biometricManager = AndroidBiometricManager.from(context)
        return biometricManager.canAuthenticate(AndroidBiometricManager.Authenticators.BIOMETRIC_STRONG) == AndroidBiometricManager.BIOMETRIC_SUCCESS
    }

    actual suspend fun authenticate(): Boolean = suspendCoroutine { continuation ->
        val activity = context as? FragmentActivity
        if (activity == null) {
            continuation.resume(false)
            return@suspendCoroutine
        }

        val executor = ContextCompat.getMainExecutor(context)
        val callback = object : BiometricPrompt.AuthenticationCallback() {
            override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                super.onAuthenticationSucceeded(result)
                continuation.resume(true)
            }

            override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                super.onAuthenticationError(errorCode, errString)
                continuation.resume(false)
            }

            override fun onAuthenticationFailed() {
                super.onAuthenticationFailed()
            }
        }

        val biometricPrompt = BiometricPrompt(activity, executor, callback)
        val promptInfo = BiometricPrompt.PromptInfo.Builder()
            .setTitle("Authentification requise")
            .setSubtitle("Connectez-vous à Garry")
            .setNegativeButtonText("Annuler")
            .build()

        biometricPrompt.authenticate(promptInfo)
    }
}

@Composable
actual fun rememberBiometricManager(): BiometricManager {
    val context = LocalContext.current
    return remember(context) { BiometricManager(context) }
}
