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
import kotlinx.coroutines.launch
import kotlinx.datetime.Clock
import kotlinx.datetime.TimeZone
import kotlinx.datetime.toLocalDateTime

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddWarrantyScreen(
    warrantyRepository: WarrantyRepository,
    onBackClick: () -> Unit,
    onSaveSuccess: () -> Unit
) {
    var productName by remember { mutableStateOf("") }
    var brand by remember { mutableStateOf("") }
    var category by remember { mutableStateOf<WarrantyCategory?>(null) }
    var purchaseDate by remember { mutableStateOf("") }
    var warrantyMonths by remember { mutableStateOf("24") }
    var store by remember { mutableStateOf("") }
    var notes by remember { mutableStateOf("") }
    
    // Default to today's date if empty
    LaunchedEffect(Unit) {
        val today = Clock.System.now().toLocalDateTime(TimeZone.currentSystemDefault()).date
        purchaseDate = today.toString()
    }
    
    var isLoading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }
    
    val scope = rememberCoroutineScope()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Ajouter une garantie") },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Retour")
                    }
                }
            )
        }
    ) { paddingValues ->
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
            
            if (error != null) {
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = error!!,
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodySmall
                )
            }
            
            Spacer(modifier = Modifier.height(24.dp))
            
            Button(
                onClick = {
                    if (productName.isBlank() || brand.isBlank() || category == null || 
                        purchaseDate.isBlank() || warrantyMonths.isBlank() || store.isBlank()) {
                        error = "Veuillez remplir tous les champs obligatoires"
                        return@Button
                    }
                    
                    isLoading = true
                    error = null
                    
                    scope.launch {
                        warrantyRepository.createWarranty(
                            productName = productName,
                            brand = brand,
                            category = category!!.value,
                            purchaseDate = purchaseDate,
                            warrantyMonths = warrantyMonths.toIntOrNull() ?: 24,
                            store = store,
                            notes = if (notes.isBlank()) null else notes
                        ).fold(
                            onSuccess = { onSaveSuccess() },
                            onFailure = { error = "Erreur lors de l'enregistrement: ${it.message}" }
                        )
                        isLoading = false
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                enabled = !isLoading
            ) {
                if (isLoading) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(24.dp),
                        color = MaterialTheme.colorScheme.onPrimary
                    )
                } else {
                    Text("Enregistrer")
                }
            }
        }
    }
}
