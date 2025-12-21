package com.duscraft.garry.data.model

import kotlinx.serialization.json.Json
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertNull
import kotlin.test.assertNotNull

class ModelsTest {
    private val json = Json { ignoreUnknownKeys = true }

    @Test
    fun userDeserializesCorrectly() {
        val jsonString = """{"id":"123","email":"test@example.com","name":"Test User"}"""
        val user = json.decodeFromString<User>(jsonString)
        
        assertEquals("123", user.id)
        assertEquals("test@example.com", user.email)
        assertEquals("Test User", user.name)
    }

    @Test
    fun authResponseDeserializesCorrectly() {
        val jsonString = """{"access_token":"abc123","refresh_token":"xyz789","expires_in":3600}"""
        val response = json.decodeFromString<AuthResponse>(jsonString)
        
        assertEquals("abc123", response.accessToken)
        assertEquals("xyz789", response.refreshToken)
        assertEquals(3600L, response.expiresIn)
    }

    @Test
    fun loginRequestSerializesCorrectly() {
        val request = LoginRequest(email = "test@example.com", password = "password123")
        val jsonString = json.encodeToString(LoginRequest.serializer(), request)
        
        assert(jsonString.contains("\"email\":\"test@example.com\""))
        assert(jsonString.contains("\"password\":\"password123\""))
    }

    @Test
    fun registerRequestSerializesCorrectly() {
        val request = RegisterRequest(
            email = "test@example.com",
            password = "password123",
            name = "Test User"
        )
        val jsonString = json.encodeToString(RegisterRequest.serializer(), request)
        
        assert(jsonString.contains("\"email\":\"test@example.com\""))
        assert(jsonString.contains("\"password\":\"password123\""))
        assert(jsonString.contains("\"name\":\"Test User\""))
    }

    @Test
    fun warrantyDeserializesWithAllFields() {
        val jsonString = """{
            "id": "warranty-123",
            "user_id": "user-456",
            "product_name": "MacBook Pro",
            "brand": "Apple",
            "category": "electronics",
            "purchase_date": "2024-01-15",
            "warranty_end_date": "2026-01-15",
            "warranty_months": 24,
            "store": "Apple Store",
            "receipt_url": "https://example.com/receipt.pdf",
            "notes": "AppleCare included",
            "created_at": "2024-01-15T10:00:00Z",
            "updated_at": "2024-01-15T10:00:00Z"
        }"""
        
        val warranty = json.decodeFromString<Warranty>(jsonString)
        
        assertEquals("warranty-123", warranty.id)
        assertEquals("user-456", warranty.userId)
        assertEquals("MacBook Pro", warranty.productName)
        assertEquals("Apple", warranty.brand)
        assertEquals("electronics", warranty.category)
        assertEquals("2024-01-15", warranty.purchaseDate)
        assertEquals("2026-01-15", warranty.warrantyEndDate)
        assertEquals(24, warranty.warrantyMonths)
        assertEquals("Apple Store", warranty.store)
        assertEquals("https://example.com/receipt.pdf", warranty.receiptUrl)
        assertEquals("AppleCare included", warranty.notes)
    }

    @Test
    fun warrantyDeserializesWithOptionalFieldsNull() {
        val jsonString = """{
            "id": "warranty-123",
            "user_id": "user-456",
            "product_name": "Generic Item",
            "brand": "Brand",
            "category": "other",
            "purchase_date": "2024-01-15",
            "warranty_end_date": "2025-01-15",
            "warranty_months": 12,
            "store": "Store",
            "created_at": "2024-01-15T10:00:00Z",
            "updated_at": "2024-01-15T10:00:00Z"
        }"""
        
        val warranty = json.decodeFromString<Warranty>(jsonString)
        
        assertNull(warranty.receiptUrl)
        assertNull(warranty.notes)
    }

    @Test
    fun createWarrantyRequestSerializesCorrectly() {
        val request = CreateWarrantyRequest(
            productName = "iPhone 15",
            brand = "Apple",
            category = "electronics",
            purchaseDate = "2024-06-15",
            warrantyMonths = 24,
            store = "Apple Store",
            receiptUrl = null,
            notes = "Test note"
        )
        
        val jsonString = json.encodeToString(CreateWarrantyRequest.serializer(), request)
        
        assert(jsonString.contains("\"product_name\":\"iPhone 15\""))
        assert(jsonString.contains("\"brand\":\"Apple\""))
        assert(jsonString.contains("\"warranty_months\":24"))
        assert(jsonString.contains("\"notes\":\"Test note\""))
    }

    @Test
    fun updateWarrantyRequestSerializesWithPartialFields() {
        val request = UpdateWarrantyRequest(
            productName = "Updated Name",
            warrantyMonths = 36
        )
        
        val jsonString = json.encodeToString(UpdateWarrantyRequest.serializer(), request)
        
        assert(jsonString.contains("\"product_name\":\"Updated Name\""))
        assert(jsonString.contains("\"warranty_months\":36"))
    }

    @Test
    fun statsDeserializesCorrectly() {
        val jsonString = """{
            "total_warranties": 10,
            "active_warranties": 7,
            "expired_warranties": 2,
            "expiring_soon_warranties": 1
        }"""
        
        val stats = json.decodeFromString<Stats>(jsonString)
        
        assertEquals(10, stats.totalWarranties)
        assertEquals(7, stats.activeWarranties)
        assertEquals(2, stats.expiredWarranties)
        assertEquals(1, stats.expiringSoonWarranties)
    }

    @Test
    fun errorResponseDeserializesCorrectly() {
        val jsonString = """{"message":"Something went wrong"}"""
        val error = json.decodeFromString<ErrorResponse>(jsonString)
        
        assertEquals("Something went wrong", error.message)
    }
}

class WarrantyCategoryTest {
    
    @Test
    fun fromValueReturnsCorrectCategory() {
        assertEquals(WarrantyCategory.ELECTRONICS, WarrantyCategory.fromValue("electronics"))
        assertEquals(WarrantyCategory.APPLIANCES, WarrantyCategory.fromValue("appliances"))
        assertEquals(WarrantyCategory.FURNITURE, WarrantyCategory.fromValue("furniture"))
        assertEquals(WarrantyCategory.CLOTHING, WarrantyCategory.fromValue("clothing"))
        assertEquals(WarrantyCategory.AUTOMOTIVE, WarrantyCategory.fromValue("automotive"))
        assertEquals(WarrantyCategory.SPORTS, WarrantyCategory.fromValue("sports"))
        assertEquals(WarrantyCategory.OTHER, WarrantyCategory.fromValue("other"))
    }

    @Test
    fun fromValueReturnsOtherForUnknownCategory() {
        assertEquals(WarrantyCategory.OTHER, WarrantyCategory.fromValue("unknown"))
        assertEquals(WarrantyCategory.OTHER, WarrantyCategory.fromValue(""))
        assertEquals(WarrantyCategory.OTHER, WarrantyCategory.fromValue("random"))
    }

    @Test
    fun categoryHasCorrectDisplayNames() {
        assertEquals("Électronique", WarrantyCategory.ELECTRONICS.displayName)
        assertEquals("Électroménager", WarrantyCategory.APPLIANCES.displayName)
        assertEquals("Mobilier", WarrantyCategory.FURNITURE.displayName)
        assertEquals("Vêtements", WarrantyCategory.CLOTHING.displayName)
        assertEquals("Automobile", WarrantyCategory.AUTOMOTIVE.displayName)
        assertEquals("Sport", WarrantyCategory.SPORTS.displayName)
        assertEquals("Autre", WarrantyCategory.OTHER.displayName)
    }

    @Test
    fun categoryHasCorrectValues() {
        assertEquals("electronics", WarrantyCategory.ELECTRONICS.value)
        assertEquals("appliances", WarrantyCategory.APPLIANCES.value)
        assertEquals("furniture", WarrantyCategory.FURNITURE.value)
        assertEquals("clothing", WarrantyCategory.CLOTHING.value)
        assertEquals("automotive", WarrantyCategory.AUTOMOTIVE.value)
        assertEquals("sports", WarrantyCategory.SPORTS.value)
        assertEquals("other", WarrantyCategory.OTHER.value)
    }
}

class WarrantyStatusTest {
    
    @Test
    fun statusEnumHasAllValues() {
        val statuses = WarrantyStatus.entries
        
        assertEquals(3, statuses.size)
        assert(statuses.contains(WarrantyStatus.VALID))
        assert(statuses.contains(WarrantyStatus.EXPIRING))
        assert(statuses.contains(WarrantyStatus.EXPIRED))
    }
}
