package com.duscraft.garry.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import com.duscraft.garry.data.model.WarrantyCategory
import com.duscraft.garry.data.repository.WarrantyRepository
import com.duscraft.garry.ui.components.CategoryDropdown
import com.duscraft.garry.ui.components.ErrorMessage
import com.duscraft.garry.ui.components.LoadingIndicator
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EditWarrantyScreen(
    warrantyId: String,
    warrantyRepository: WarrantyRepository,
    onBackClick: () -> Unit,
    onSaveSuccess: () -> Unit
) {
    var productName by remember { mutableStateOf("") }
    var brand by remember { mutableStateOf("") }
    var category by remember { mutableStateOf<WarrantyCategory?>(null) }
    var purchaseDate by remember { mutableStateOf("") }
    var warrantyMonths by remember { mutableStateOf("") }
    var store by remember { mutableStateOf("") }
    var notes by remember { mutableStateOf("") }
    
    var isLoading by remember { mutableStateOf(true) }
    var isSaving by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    
    val scope = rememberCoroutineScope()

    // Load existing data
    LaunchedEffect(warrantyId) {
        isLoading = true
        error = null
        warrantyRepository.getWarranty(warrantyId).fold(
            onSuccess = { warranty ->
                productName = warranty.productName
                brand = warranty.brand
                category = WarrantyCategory.fromValue(warranty.category)
                purchaseDate = warranty.purchaseDate
                warrantyMonths = warranty.warrantyMonths.toString()
                store = warranty.store
                notes = warranty.notes ?: ""
            },
            onFailure = { error = "Impossible de charger les données" }
        )
        isLoading = false
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Modifier la garantie") },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Retour")
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
                onRetry = { /* Retry logic could be added here */ },
                modifier = Modifier.padding(paddingValues)
            )
        } else {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .verticalScroll(rememberScrollState())
                    .padding(16.dp)
            ) {
                OutlinedTextField(
                    value = productName,
                    onValueChange = { productName = it },
                    label = { Text("Nom du produit") },
                    modifier = Modifier.fillMaxWidth()
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                OutlinedTextField(
                    value = brand,
                    onValueChange = { brand = it },
                    label = { Text("Marque") },
                    modifier = Modifier.fillMaxWidth()
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                CategoryDropdown(
                    selectedCategory = category,
                    onCategorySelected = { category = it },
                    modifier = Modifier.fillMaxWidth()
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                OutlinedTextField(
                    value = purchaseDate,
                    onValueChange = { purchaseDate = it },
                    label = { Text("Date d'achat (YYYY-MM-DD)") },
                    modifier = Modifier.fillMaxWidth()
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                OutlinedTextField(
                    value = warrantyMonths,
                    onValueChange = { if (it.all { char -> char.isDigit() }) warrantyMonths = it },
                    label = { Text("Durée de garantie (mois)") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.fillMaxWidth()
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                OutlinedTextField(
                    value = store,
                    onValueChange = { store = it },
                    label = { Text("Magasin") },
                    modifier = Modifier.fillMaxWidth()
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                OutlinedTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    label = { Text("Notes (optionnel)") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 3
                )
                
                Spacer(modifier = Modifier.height(24.dp))
                
                Button(
                    onClick = {
                        if (productName.isBlank() || brand.isBlank() || category == null || 
                            purchaseDate.isBlank() || warrantyMonths.isBlank() || store.isBlank()) {
                            // Ideally show snackbar
                            return@Button
                        }
                        
                        isSaving = true
                        
                        scope.launch {
                            warrantyRepository.updateWarranty(
                                id = warrantyId,
                                productName = productName,
                                brand = brand,
                                category = category!!.value,
                                purchaseDate = purchaseDate,
                                warrantyMonths = warrantyMonths.toIntOrNull() ?: 24,
                                store = store,
                                notes = if (notes.isBlank()) null else notes
                            ).fold(
                                onSuccess = { onSaveSuccess() },
                                onFailure = { }
                            )
                            isSaving = false
                        }
                    },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = !isSaving
                ) {
                    if (isSaving) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(24.dp),
                            color = MaterialTheme.colorScheme.onPrimary
                        )
                    } else {
                        Text("Mettre à jour")
                    }
                }
            }
        }
    }
}
