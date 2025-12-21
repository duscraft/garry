package com.duscraft.garry

import androidx.compose.runtime.*
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.PreferenceDataStoreFactory
import androidx.datastore.preferences.core.Preferences
import androidx.navigation.compose.rememberNavController
import com.duscraft.garry.data.api.ApiClient
import com.duscraft.garry.data.repository.AuthRepository
import com.duscraft.garry.data.repository.TokenStorageImpl
import com.duscraft.garry.data.repository.WarrantyRepository
import com.duscraft.garry.navigation.NavGraph
import com.duscraft.garry.navigation.Screen
import com.duscraft.garry.ui.components.LoadingIndicator
import com.duscraft.garry.ui.theme.GarryTheme
import kotlinx.coroutines.launch
import okio.Path.Companion.toPath

// Platform-specific DataStore path provider
expect fun dataStorePath(): String

private lateinit var dataStore: DataStore<Preferences>

fun getDataStore(): DataStore<Preferences> {
    if (!::dataStore.isInitialized) {
        dataStore = PreferenceDataStoreFactory.createWithPath(
            produceFile = { dataStorePath().toPath() }
        )
    }
    return dataStore
}

@Composable
fun App() {
    val navController = rememberNavController()
    val scope = rememberCoroutineScope()
    
    // Dependency Injection Setup
    val dataStore = remember { getDataStore() }
    val tokenStorage = remember { TokenStorageImpl(dataStore) }
    val apiClient = remember { ApiClient(tokenStorage) }
    val authRepository = remember { AuthRepository(apiClient, tokenStorage) }
    val warrantyRepository = remember { WarrantyRepository(apiClient) }
    
    // Auth State
    var startDestination by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(Unit) {
        val isLoggedIn = authRepository.isLoggedIn()
        startDestination = if (isLoggedIn) Screen.Dashboard.route else Screen.Login.route
    }

    GarryTheme {
        if (startDestination == null) {
            LoadingIndicator()
        } else {
            NavGraph(
                navController = navController,
                startDestination = startDestination!!,
                authRepository = authRepository,
                warrantyRepository = warrantyRepository
            )
        }
    }
}
