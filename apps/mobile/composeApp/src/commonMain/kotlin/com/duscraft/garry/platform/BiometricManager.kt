package com.duscraft.garry.platform

import androidx.compose.runtime.Composable

expect class BiometricManager {
    suspend fun authenticate(): Boolean
    fun canAuthenticate(): Boolean
}

@Composable
expect fun rememberBiometricManager(): BiometricManager
