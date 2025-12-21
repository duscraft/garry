package com.duscraft.garry.data.repository

import com.duscraft.garry.data.api.ApiClient
import com.duscraft.garry.data.api.ApiException
import com.duscraft.garry.data.api.TokenStorage
import com.duscraft.garry.data.model.AuthResponse
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

sealed class AuthState {
    data object Loading : AuthState()
    data object Unauthenticated : AuthState()
    data object Authenticated : AuthState()
}

class AuthRepository(
    private val apiClient: ApiClient,
    private val tokenStorage: TokenStorage
) {
    private val _authState = MutableStateFlow<AuthState>(AuthState.Loading)
    val authState: StateFlow<AuthState> = _authState.asStateFlow()

    suspend fun checkAuthStatus() {
        val tokens = tokenStorage.getTokens()
        _authState.value = if (tokens != null) {
            AuthState.Authenticated
        } else {
            AuthState.Unauthenticated
        }
    }

    suspend fun login(email: String, password: String): Result<AuthResponse> {
        return try {
            val response = apiClient.login(email, password)
            tokenStorage.saveTokens(response.accessToken, response.refreshToken)
            _authState.value = AuthState.Authenticated
            Result.success(response)
        } catch (e: ApiException) {
            Result.failure(Exception(e.message))
        } catch (e: Exception) {
            Result.failure(Exception("Erreur de connexion. Vérifiez votre connexion internet."))
        }
    }

    suspend fun register(email: String, password: String, name: String): Result<AuthResponse> {
        return try {
            val response = apiClient.register(email, password, name)
            tokenStorage.saveTokens(response.accessToken, response.refreshToken)
            _authState.value = AuthState.Authenticated
            Result.success(response)
        } catch (e: ApiException) {
            Result.failure(Exception(e.message))
        } catch (e: Exception) {
            Result.failure(Exception("Erreur lors de l'inscription. Vérifiez votre connexion internet."))
        }
    }

    suspend fun logout() {
        apiClient.logout()
        _authState.value = AuthState.Unauthenticated
    }

    suspend fun isLoggedIn(): Boolean {
        return tokenStorage.getTokens() != null
    }
}
