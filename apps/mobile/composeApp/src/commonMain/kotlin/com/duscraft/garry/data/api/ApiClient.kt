package com.duscraft.garry.data.api

import com.duscraft.garry.data.model.*
import io.ktor.client.*
import io.ktor.client.call.*
import io.ktor.client.plugins.*
import io.ktor.client.plugins.auth.*
import io.ktor.client.plugins.auth.providers.*
import io.ktor.client.plugins.contentnegotiation.*
import io.ktor.client.plugins.logging.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.serialization.kotlinx.json.*
import kotlinx.serialization.json.Json

class ApiClient(
    private val tokenStorage: TokenStorage,
    private val authBaseUrl: String = "http://10.0.2.2:8081/api/v1",
    private val apiBaseUrl: String = "http://10.0.2.2:8080/api/v1"
) {
    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
        encodeDefaults = true
    }

    private val httpClient = HttpClient {
        install(ContentNegotiation) {
            json(json)
        }
        
        install(Logging) {
            logger = Logger.DEFAULT
            level = LogLevel.BODY
        }
        
        install(Auth) {
            bearer {
                loadTokens {
                    tokenStorage.getTokens()?.let { (access, refresh) ->
                        BearerTokens(access, refresh)
                    }
                }
                
                refreshTokens {
                    val refreshToken = tokenStorage.getTokens()?.second ?: return@refreshTokens null
                    
                    try {
                        val response = client.post("$authBaseUrl/auth/refresh") {
                            contentType(ContentType.Application.Json)
                            setBody(RefreshRequest(refreshToken))
                            markAsRefreshTokenRequest()
                        }
                        
                        if (response.status.isSuccess()) {
                            val authResponse = response.body<AuthResponse>()
                            tokenStorage.saveTokens(authResponse.accessToken, authResponse.refreshToken)
                            BearerTokens(authResponse.accessToken, authResponse.refreshToken)
                        } else {
                            tokenStorage.clearTokens()
                            null
                        }
                    } catch (e: Exception) {
                        tokenStorage.clearTokens()
                        null
                    }
                }
            }
        }
        
        defaultRequest {
            contentType(ContentType.Application.Json)
        }
        
        HttpResponseValidator {
            validateResponse { response ->
                if (!response.status.isSuccess() && response.status != HttpStatusCode.Unauthorized) {
                    val errorBody = try {
                        response.body<ErrorResponse>()
                    } catch (e: Exception) {
                        ErrorResponse("Erreur ${response.status.value}: ${response.status.description}")
                    }
                    throw ApiException(errorBody.message, response.status.value)
                }
            }
        }
    }

    // Auth endpoints (no bearer auth needed for these)
    suspend fun login(email: String, password: String): AuthResponse {
        val response = httpClient.post("$authBaseUrl/auth/login") {
            setBody(LoginRequest(email, password))
        }
        return response.body()
    }

    suspend fun register(email: String, password: String, name: String): AuthResponse {
        val response = httpClient.post("$authBaseUrl/auth/register") {
            setBody(RegisterRequest(email, password, name))
        }
        return response.body()
    }

    suspend fun logout() {
        try {
            httpClient.post("$authBaseUrl/auth/logout")
        } catch (e: Exception) {
            // Ignore errors on logout
        }
        tokenStorage.clearTokens()
    }

    // Warranty endpoints
    suspend fun getWarranties(): List<Warranty> {
        val response = httpClient.get("$apiBaseUrl/warranties")
        return response.body()
    }

    suspend fun getWarranty(id: String): Warranty {
        val response = httpClient.get("$apiBaseUrl/warranties/$id")
        return response.body()
    }

    suspend fun createWarranty(request: CreateWarrantyRequest): Warranty {
        val response = httpClient.post("$apiBaseUrl/warranties") {
            setBody(request)
        }
        return response.body()
    }

    suspend fun updateWarranty(id: String, request: UpdateWarrantyRequest): Warranty {
        val response = httpClient.put("$apiBaseUrl/warranties/$id") {
            setBody(request)
        }
        return response.body()
    }

    suspend fun deleteWarranty(id: String) {
        httpClient.delete("$apiBaseUrl/warranties/$id")
    }

    suspend fun getExpiringWarranties(days: Int = 30): List<Warranty> {
        val response = httpClient.get("$apiBaseUrl/warranties/expiring") {
            parameter("days", days)
        }
        return response.body()
    }

    suspend fun getStats(): Stats {
        val response = httpClient.get("$apiBaseUrl/warranties/stats")
        return response.body()
    }

    suspend fun getCategories(): List<String> {
        val response = httpClient.get("$apiBaseUrl/warranties/categories")
        return response.body()
    }
}

class ApiException(
    override val message: String,
    val statusCode: Int
) : Exception(message)

interface TokenStorage {
    suspend fun saveTokens(accessToken: String, refreshToken: String)
    suspend fun getTokens(): Pair<String, String>?
    suspend fun clearTokens()
}
