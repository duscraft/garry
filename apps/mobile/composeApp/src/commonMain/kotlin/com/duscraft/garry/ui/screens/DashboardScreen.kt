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
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.duscraft.garry.data.model.Warranty
import com.duscraft.garry.data.repository.AuthRepository
import com.duscraft.garry.data.repository.WarrantyRepository
import com.duscraft.garry.i18n.LocaleManager
import com.duscraft.garry.ui.components.ErrorMessage
import com.duscraft.garry.ui.components.LoadingIndicator
import com.duscraft.garry.ui.components.StatsCard
import com.duscraft.garry.ui.components.WarrantyCard
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class, ExperimentalMaterialApi::class)
@Composable
fun DashboardScreen(
    authRepository: AuthRepository,
    warrantyRepository: WarrantyRepository,
    onAddWarrantyClick: () -> Unit,
    onWarrantyClick: (String) -> Unit,
    onLogout: () -> Unit
) {
    val strings = LocaleManager.strings
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
                title = { Text(strings.dashboard) },
                actions = {
                    IconButton(onClick = {
                        scope.launch {
                            authRepository.logout()
                            onLogout()
                        }
                    }) {
                        Icon(Icons.Default.ExitToApp, contentDescription = strings.logout)
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = onAddWarrantyClick) {
                Icon(Icons.Default.Add, contentDescription = strings.addWarranty)
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
                            text = strings.yourWarranties,
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
                                        text = strings.noWarranties,
                                        style = MaterialTheme.typography.bodyLarge
                                    )
                                    Spacer(modifier = Modifier.height(8.dp))
                                    Text(
                                        text = strings.noWarrantiesHint,
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
