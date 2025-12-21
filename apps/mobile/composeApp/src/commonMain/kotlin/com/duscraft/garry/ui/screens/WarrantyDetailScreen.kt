package com.duscraft.garry.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.duscraft.garry.data.model.Warranty
import com.duscraft.garry.data.model.WarrantyStatus
import com.duscraft.garry.data.repository.WarrantyRepository
import com.duscraft.garry.ui.components.ErrorMessage
import com.duscraft.garry.ui.components.LoadingIndicator
import com.duscraft.garry.ui.components.StatusBadge
import kotlinx.coroutines.launch
import kotlinx.datetime.Clock
import kotlinx.datetime.LocalDate
import kotlinx.datetime.TimeZone
import kotlinx.datetime.daysUntil
import kotlinx.datetime.toLocalDateTime

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WarrantyDetailScreen(
    warrantyId: String,
    warrantyRepository: WarrantyRepository,
    onBackClick: () -> Unit,
    onEditClick: (String) -> Unit,
    onDeleteSuccess: () -> Unit
) {
    var warranty by remember { mutableStateOf<Warranty?>(null) }
    var isLoading by remember { mutableStateOf(true) }
    var error by remember { mutableStateOf<String?>(null) }
    var showDeleteDialog by remember { mutableStateOf(false) }
    
    val scope = rememberCoroutineScope()

    fun loadWarranty() {
        scope.launch {
            isLoading = true
            error = null
            warrantyRepository.getWarranty(warrantyId).fold(
                onSuccess = { warranty = it },
                onFailure = { error = it.message ?: "Impossible de charger les détails de la garantie" }
            )
            isLoading = false
        }
    }

    LaunchedEffect(warrantyId) {
        loadWarranty()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Détails") },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Retour")
                    }
                },
                actions = {
                    IconButton(onClick = { onEditClick(warrantyId) }) {
                        Icon(Icons.Default.Edit, contentDescription = "Modifier")
                    }
                    IconButton(onClick = { showDeleteDialog = true }) {
                        Icon(Icons.Default.Delete, contentDescription = "Supprimer")
                    }
                }
            )
        }
    ) { paddingValues ->
        if (isLoading) {
            LoadingIndicator(modifier = Modifier.padding(paddingValues))
        } else if (error != null) {
            ErrorMessage(
                message = error!!,
                onRetry = { loadWarranty() },
                modifier = Modifier.padding(paddingValues)
            )
        } else {
            warranty?.let { w ->
                // Determine status
                val today = Clock.System.now().toLocalDateTime(TimeZone.currentSystemDefault()).date
                val endDate = LocalDate.parse(w.warrantyEndDate)
                val daysRemaining = today.daysUntil(endDate)
                
                val status = when {
                    daysRemaining < 0 -> WarrantyStatus.EXPIRED
                    daysRemaining <= 30 -> WarrantyStatus.EXPIRING
                    else -> WarrantyStatus.VALID
                }

                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues)
                        .verticalScroll(rememberScrollState())
                        .padding(16.dp)
                ) {
                    // Header Card
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.surface
                        ),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                    ) {
                        Column(
                            modifier = Modifier.padding(24.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
                            ) {
                                StatusBadge(status = status)
                                Text(
                                    text = w.category,
                                    style = MaterialTheme.typography.labelMedium,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            }
                            
                            Spacer(modifier = Modifier.height(16.dp))
                            
                            Text(
                                text = w.productName,
                                style = MaterialTheme.typography.headlineSmall,
                                fontWeight = FontWeight.Bold
                            )
                            
                            Text(
                                text = w.brand,
                                style = MaterialTheme.typography.titleMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                    
                    Spacer(modifier = Modifier.height(24.dp))
                    
                    // Details
                    DetailRow("Magasin", w.store)
                    Divider()
                    DetailRow("Date d'achat", w.purchaseDate)
                    Divider()
                    DetailRow("Fin de garantie", w.warrantyEndDate)
                    Divider()
                    DetailRow("Durée", "${w.warrantyMonths} mois")
                    
                    if (!w.notes.isNullOrEmpty()) {
                        Spacer(modifier = Modifier.height(24.dp))
                        Text(
                            text = "Notes",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = w.notes,
                            style = MaterialTheme.typography.bodyMedium
                        )
                    }
                }
            }
        }
        
        if (showDeleteDialog) {
            AlertDialog(
                onDismissRequest = { showDeleteDialog = false },
                title = { Text("Supprimer la garantie ?") },
                text = { Text("Cette action est irréversible. Voulez-vous vraiment supprimer cette garantie ?") },
                confirmButton = {
                    TextButton(
                        onClick = {
                            scope.launch {
                                warrantyRepository.deleteWarranty(warrantyId).fold(
                                    onSuccess = { onDeleteSuccess() },
                                    onFailure = { }
                                )
                                showDeleteDialog = false
                            }
                        },
                        colors = ButtonDefaults.textButtonColors(
                            contentColor = MaterialTheme.colorScheme.error
                        )
                    ) {
                        Text("Supprimer")
                    }
                },
                dismissButton = {
                    TextButton(onClick = { showDeleteDialog = false }) {
                        Text("Annuler")
                    }
                }
            )
        }
    }
}

@Composable
private fun DetailRow(label: String, value: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 16.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.SemiBold
        )
    }
}
