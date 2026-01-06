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
import com.duscraft.garry.i18n.LocaleManager
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
    val strings = LocaleManager.strings
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
            onFailure = { error = strings.loadError }
        )
        isLoading = false
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(strings.edit) },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.Default.ArrowBack, contentDescription = strings.back)
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
                onRetry = { },
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
                    label = { Text(strings.productName) },
                    modifier = Modifier.fillMaxWidth()
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                OutlinedTextField(
                    value = brand,
                    onValueChange = { brand = it },
                    label = { Text(strings.brand) },
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
                    label = { Text(strings.purchaseDateFormat) },
                    modifier = Modifier.fillMaxWidth()
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                OutlinedTextField(
                    value = warrantyMonths,
                    onValueChange = { if (it.all { char -> char.isDigit() }) warrantyMonths = it },
                    label = { Text(strings.warrantyDuration) },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.fillMaxWidth()
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                OutlinedTextField(
                    value = store,
                    onValueChange = { store = it },
                    label = { Text(strings.store) },
                    modifier = Modifier.fillMaxWidth()
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                OutlinedTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    label = { Text(strings.notesOptional) },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 3
                )
                
                Spacer(modifier = Modifier.height(24.dp))
                
                Button(
                    onClick = {
                        if (productName.isBlank() || brand.isBlank() || category == null || 
                            purchaseDate.isBlank() || warrantyMonths.isBlank() || store.isBlank()) {
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
                        Text(strings.save)
                    }
                }
            }
        }
    }
}
