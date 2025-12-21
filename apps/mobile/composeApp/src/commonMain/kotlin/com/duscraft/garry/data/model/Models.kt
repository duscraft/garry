package com.duscraft.garry.data.model

import kotlinx.datetime.LocalDate
import kotlinx.datetime.Instant
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class User(
    val id: String,
    val email: String,
    val name: String
)

@Serializable
data class AuthResponse(
    @SerialName("access_token")
    val accessToken: String,
    @SerialName("refresh_token")
    val refreshToken: String,
    @SerialName("expires_in")
    val expiresIn: Long
)

@Serializable
data class LoginRequest(
    val email: String,
    val password: String
)

@Serializable
data class RegisterRequest(
    val email: String,
    val password: String,
    val name: String
)

@Serializable
data class RefreshRequest(
    @SerialName("refresh_token")
    val refreshToken: String
)

@Serializable
data class Warranty(
    val id: String,
    @SerialName("user_id")
    val userId: String,
    @SerialName("product_name")
    val productName: String,
    val brand: String,
    val category: String,
    @SerialName("purchase_date")
    val purchaseDate: String,
    @SerialName("warranty_end_date")
    val warrantyEndDate: String,
    @SerialName("warranty_months")
    val warrantyMonths: Int,
    val store: String,
    @SerialName("receipt_url")
    val receiptUrl: String? = null,
    val notes: String? = null,
    @SerialName("created_at")
    val createdAt: String,
    @SerialName("updated_at")
    val updatedAt: String
)

@Serializable
data class CreateWarrantyRequest(
    @SerialName("product_name")
    val productName: String,
    val brand: String,
    val category: String,
    @SerialName("purchase_date")
    val purchaseDate: String,
    @SerialName("warranty_months")
    val warrantyMonths: Int,
    val store: String,
    @SerialName("receipt_url")
    val receiptUrl: String? = null,
    val notes: String? = null
)

@Serializable
data class UpdateWarrantyRequest(
    @SerialName("product_name")
    val productName: String? = null,
    val brand: String? = null,
    val category: String? = null,
    @SerialName("purchase_date")
    val purchaseDate: String? = null,
    @SerialName("warranty_months")
    val warrantyMonths: Int? = null,
    val store: String? = null,
    @SerialName("receipt_url")
    val receiptUrl: String? = null,
    val notes: String? = null
)

@Serializable
data class Stats(
    @SerialName("total_warranties")
    val totalWarranties: Int,
    @SerialName("active_warranties")
    val activeWarranties: Int,
    @SerialName("expired_warranties")
    val expiredWarranties: Int,
    @SerialName("expiring_soon_warranties")
    val expiringSoonWarranties: Int
)

@Serializable
data class ErrorResponse(
    val message: String
)

enum class WarrantyCategory(val value: String, val displayName: String) {
    ELECTRONICS("electronics", "Électronique"),
    APPLIANCES("appliances", "Électroménager"),
    FURNITURE("furniture", "Mobilier"),
    CLOTHING("clothing", "Vêtements"),
    AUTOMOTIVE("automotive", "Automobile"),
    SPORTS("sports", "Sport"),
    OTHER("other", "Autre");

    companion object {
        fun fromValue(value: String): WarrantyCategory =
            entries.find { it.value == value } ?: OTHER
    }
}

enum class WarrantyStatus {
    VALID,      // More than 30 days remaining
    EXPIRING,   // 30 days or less remaining
    EXPIRED     // Past warranty end date
}
