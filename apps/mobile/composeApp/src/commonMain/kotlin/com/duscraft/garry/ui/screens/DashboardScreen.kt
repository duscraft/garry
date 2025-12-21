package com.duscraft.garry.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ExitToApp
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.material.ExperimentalMaterialApi
import androidx.compose.material.pullrefresh.PullRefreshIndicator
import androidx.compose.material.pullrefresh.pullRefresh
import androidx.compose.material.pullrefresh.rememberPullRefreshState
import androidx.compose.ui.Alignment

@OptIn(ExperimentalMaterial3Api::class, ExperimentalMaterialApi::class)
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
    var isRefreshing by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    
    val scope = rememberCoroutineScope()

    fun loadData(showLoading: Boolean = true) {
        scope.launch {
            if (showLoading) isLoading = true
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
            isRefreshing = false
        }
    }
    
    val pullRefreshState = rememberPullRefreshState(
        refreshing = isRefreshing,
        onRefresh = {
            isRefreshing = true
            loadData(showLoading = false)
        }
    )

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
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .pullRefresh(pullRefreshState)
        ) {
            if (isLoading) {
                LoadingIndicator(modifier = Modifier.align(Alignment.Center))
            } else if (error != null) {
                ErrorMessage(
                    message = error!!, 
                    onRetry = { loadData() },
                    modifier = Modifier.align(Alignment.Center)
                )
            } else {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
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
                                    horizontalAlignment = Alignment.CenterHorizontally
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
            
            PullRefreshIndicator(
                refreshing = isRefreshing,
                state = pullRefreshState,
                modifier = Modifier.align(Alignment.TopCenter),
                backgroundColor = MaterialTheme.colorScheme.surface,
                contentColor = MaterialTheme.colorScheme.primary
            )
        }
    }
}
