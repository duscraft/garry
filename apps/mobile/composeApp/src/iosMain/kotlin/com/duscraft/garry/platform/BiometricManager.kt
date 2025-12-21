package com.duscraft.garry.platform

import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import platform.LocalAuthentication.LAContext
import platform.LocalAuthentication.LAPolicyDeviceOwnerAuthenticationWithBiometrics
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume
import platform.Foundation.NSError

actual class BiometricManager {
    actual fun canAuthenticate(): Boolean {
        val context = LAContext()
        return context.canEvaluatePolicy(LAPolicyDeviceOwnerAuthenticationWithBiometrics, null)
    }

    actual suspend fun authenticate(): Boolean = suspendCancellableCoroutine { continuation ->
        val context = LAContext()
        if (canAuthenticate()) {
            context.evaluatePolicy(
                LAPolicyDeviceOwnerAuthenticationWithBiometrics,
                localizedReason = "Authentifiez-vous pour accéder à Garry"
            ) { success, error ->
                continuation.resume(success)
            }
        } else {
            continuation.resume(false)
        }
    }
}

@Composable
actual fun rememberBiometricManager(): BiometricManager {
    return remember { BiometricManager() }
}
