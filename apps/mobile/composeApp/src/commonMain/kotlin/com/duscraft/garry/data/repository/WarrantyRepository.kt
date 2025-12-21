package com.duscraft.garry.data.repository

import com.duscraft.garry.data.api.ApiClient
import com.duscraft.garry.data.api.ApiException
import com.duscraft.garry.data.model.*

class WarrantyRepository(
    private val apiClient: ApiClient
) {
    suspend fun getWarranties(): Result<List<Warranty>> {
        return try {
            Result.success(apiClient.getWarranties())
        } catch (e: ApiException) {
            Result.failure(Exception(e.message))
        } catch (e: Exception) {
            Result.failure(Exception("Impossible de charger les garanties."))
        }
    }

    suspend fun getWarranty(id: String): Result<Warranty> {
        return try {
            Result.success(apiClient.getWarranty(id))
        } catch (e: ApiException) {
            Result.failure(Exception(e.message))
        } catch (e: Exception) {
            Result.failure(Exception("Impossible de charger la garantie."))
        }
    }

    suspend fun createWarranty(
        productName: String,
        brand: String,
        category: String,
        purchaseDate: String,
        warrantyMonths: Int,
        store: String,
        receiptUrl: String? = null,
        notes: String? = null
    ): Result<Warranty> {
        return try {
            val request = CreateWarrantyRequest(
                productName = productName,
                brand = brand,
                category = category,
                purchaseDate = purchaseDate,
                warrantyMonths = warrantyMonths,
                store = store,
                receiptUrl = receiptUrl,
                notes = notes
            )
            Result.success(apiClient.createWarranty(request))
        } catch (e: ApiException) {
            Result.failure(Exception(e.message))
        } catch (e: Exception) {
            Result.failure(Exception("Impossible de créer la garantie."))
        }
    }

    suspend fun updateWarranty(
        id: String,
        productName: String? = null,
        brand: String? = null,
        category: String? = null,
        purchaseDate: String? = null,
        warrantyMonths: Int? = null,
        store: String? = null,
        receiptUrl: String? = null,
        notes: String? = null
    ): Result<Warranty> {
        return try {
            val request = UpdateWarrantyRequest(
                productName = productName,
                brand = brand,
                category = category,
                purchaseDate = purchaseDate,
                warrantyMonths = warrantyMonths,
                store = store,
                receiptUrl = receiptUrl,
                notes = notes
            )
            Result.success(apiClient.updateWarranty(id, request))
        } catch (e: ApiException) {
            Result.failure(Exception(e.message))
        } catch (e: Exception) {
            Result.failure(Exception("Impossible de modifier la garantie."))
        }
    }

    suspend fun deleteWarranty(id: String): Result<Unit> {
        return try {
            apiClient.deleteWarranty(id)
            Result.success(Unit)
        } catch (e: ApiException) {
            Result.failure(Exception(e.message))
        } catch (e: Exception) {
            Result.failure(Exception("Impossible de supprimer la garantie."))
        }
    }

    suspend fun getExpiringWarranties(days: Int = 30): Result<List<Warranty>> {
        return try {
            Result.success(apiClient.getExpiringWarranties(days))
        } catch (e: ApiException) {
            Result.failure(Exception(e.message))
        } catch (e: Exception) {
            Result.failure(Exception("Impossible de charger les garanties expirantes."))
        }
    }

    suspend fun getStats(): Result<Stats> {
        return try {
            Result.success(apiClient.getStats())
        } catch (e: ApiException) {
            Result.failure(Exception(e.message))
        } catch (e: Exception) {
            Result.failure(Exception("Impossible de charger les statistiques."))
        }
    }

    suspend fun getCategories(): Result<List<String>> {
        return try {
            Result.success(apiClient.getCategories())
        } catch (e: ApiException) {
            Result.failure(Exception(e.message))
        } catch (e: Exception) {
            Result.failure(Exception("Impossible de charger les catégories."))
        }
    }
}
