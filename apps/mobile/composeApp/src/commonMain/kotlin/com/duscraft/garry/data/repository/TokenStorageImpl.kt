package com.duscraft.garry.data.repository

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import com.duscraft.garry.data.api.TokenStorage
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map

class TokenStorageImpl(
    private val dataStore: DataStore<Preferences>
) : TokenStorage {
    
    companion object {
        private val ACCESS_TOKEN_KEY = stringPreferencesKey("access_token")
        private val REFRESH_TOKEN_KEY = stringPreferencesKey("refresh_token")
    }
    
    override suspend fun saveTokens(accessToken: String, refreshToken: String) {
        dataStore.edit { preferences ->
            preferences[ACCESS_TOKEN_KEY] = accessToken
            preferences[REFRESH_TOKEN_KEY] = refreshToken
        }
    }
    
    override suspend fun getTokens(): Pair<String, String>? {
        val preferences = dataStore.data.first()
        val accessToken = preferences[ACCESS_TOKEN_KEY]
        val refreshToken = preferences[REFRESH_TOKEN_KEY]
        
        return if (accessToken != null && refreshToken != null) {
            Pair(accessToken, refreshToken)
        } else {
            null
        }
    }
    
    override suspend fun clearTokens() {
        dataStore.edit { preferences ->
            preferences.remove(ACCESS_TOKEN_KEY)
            preferences.remove(REFRESH_TOKEN_KEY)
        }
    }
}
