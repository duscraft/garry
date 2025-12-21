package com.duscraft.garry.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ExitToApp
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.duscraft.garry.data.model.Warranty
import com.duscraft.garry.data.repository.AuthRepository
import com.duscraft.garry.data.repository.WarrantyRepository
import com.duscraft.garry.ui.components.ErrorMessage
import com.duscraft.garry.ui.components.LoadingIndicator
import com.duscraft.garry.ui.components.StatsCard
import com.duscraft.garry.ui.components.WarrantyCard
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    authRepository: AuthRepository,
    warrantyRepository: WarrantyRepository,
    onAddWarrantyClick: () -> Unit,
    onWarrantyClick: (String) -> Unit,
    onLogout: () -> Unit
) {
    var warranties by remember { mutableStateOf<List<Warranty>>(emptyList()) }
    var stats by remember { mutableStateOf<com.duscraft.garry.data.model.Stats?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    
    val scope = rememberCoroutineScope()

    fun loadData() {
        scope.launch {
            isLoading = true
            error = null
            
            val statsResult = warrantyRepository.getStats()
            val warrantiesResult = warrantyRepository.getWarranties()
            
            statsResult.fold(
                onSuccess = { stats = it },
                onFailure = { error = it.message }
            )
            
            warrantiesResult.fold(
                onSuccess = { warranties = it },
                onFailure = { if (error == null) error = it.message }
            )
            
            isLoading = false
        }
    }

    LaunchedEffect(Unit) {
        loadData()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Tableau de bord") },
                actions = {
                    IconButton(onClick = {
                        scope.launch {
                            authRepository.logout()
                            onLogout()
                        }
                    }) {
                        Icon(Icons.Default.ExitToApp, contentDescription = "Déconnexion")
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = onAddWarrantyClick) {
                Icon(Icons.Default.Add, contentDescription = "Ajouter une garantie")
            }
        }
    ) { paddingValues ->
        if (isLoading) {
            LoadingIndicator(modifier = Modifier.padding(paddingValues))
        } else if (error != null) {
            ErrorMessage(
                message = error!!, 
                onRetry = { loadData() },
                modifier = Modifier.padding(paddingValues)
            )
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                item {
                    stats?.let { StatsCard(stats = it) }
                }
                
                item {
                    Text(
                        text = "Vos garanties",
                        style = MaterialTheme.typography.titleLarge,
                        modifier = Modifier.padding(vertical = 8.dp)
                    )
                }
                
                if (warranties.isEmpty()) {
                    item {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(
                                containerColor = MaterialTheme.colorScheme.surfaceVariant
                            )
                        ) {
                            Column(
                                modifier = Modifier.padding(24.dp),
                                horizontalAlignment = androidx.compose.ui.Alignment.CenterHorizontally
                            ) {
                                Text(
                                    text = "Aucune garantie enregistrée",
                                    style = MaterialTheme.typography.bodyLarge
                                )
                                Spacer(modifier = Modifier.height(8.dp))
                                Text(
                                    text = "Appuyez sur + pour ajouter votre première garantie",
                                    style = MaterialTheme.typography.bodyMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                        }
                    }
                } else {
                    items(warranties) { warranty ->
                        WarrantyCard(
                            warranty = warranty,
                            onClick = { onWarrantyClick(warranty.id) }
                        )
                    }
                }
            }
        }
    }
}
