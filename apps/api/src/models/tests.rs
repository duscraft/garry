#[cfg(test)]
mod tests {
    use crate::models::{
        CreateWarrantyRequest, UpdateWarrantyRequest, WarrantyCategory, WarrantyFilters,
    };
    use chrono::{Duration, Utc};

    #[test]
    fn test_warranty_category_default_months() {
        assert_eq!(WarrantyCategory::Electronics.default_warranty_months(), 24);
        assert_eq!(WarrantyCategory::Appliances.default_warranty_months(), 24);
        assert_eq!(WarrantyCategory::Furniture.default_warranty_months(), 24);
        assert_eq!(WarrantyCategory::Clothing.default_warranty_months(), 6);
        assert_eq!(WarrantyCategory::Automotive.default_warranty_months(), 24);
        assert_eq!(WarrantyCategory::Sports.default_warranty_months(), 12);
        assert_eq!(WarrantyCategory::Other.default_warranty_months(), 24);
    }

    #[test]
    fn test_warranty_category_display_name_fr() {
        assert_eq!(
            WarrantyCategory::Electronics.display_name_fr(),
            "Électronique"
        );
        assert_eq!(
            WarrantyCategory::Appliances.display_name_fr(),
            "Électroménager"
        );
        assert_eq!(WarrantyCategory::Furniture.display_name_fr(), "Mobilier");
        assert_eq!(WarrantyCategory::Clothing.display_name_fr(), "Vêtements");
        assert_eq!(WarrantyCategory::Automotive.display_name_fr(), "Automobile");
        assert_eq!(WarrantyCategory::Sports.display_name_fr(), "Sport");
        assert_eq!(WarrantyCategory::Other.display_name_fr(), "Autre");
    }

    #[test]
    fn test_warranty_category_serialization() {
        let category = WarrantyCategory::Electronics;
        let json = serde_json::to_string(&category).unwrap();
        assert_eq!(json, "\"electronics\"");

        let deserialized: WarrantyCategory = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized, WarrantyCategory::Electronics);
    }

    #[test]
    fn test_create_warranty_request_serialization() {
        let request = CreateWarrantyRequest {
            product_name: "iPhone 15".to_string(),
            brand: Some("Apple".to_string()),
            category: WarrantyCategory::Electronics,
            purchase_date: Utc::now(),
            warranty_months: Some(24),
            store: Some("Apple Store".to_string()),
            notes: None,
        };

        let json = serde_json::to_string(&request).unwrap();
        assert!(json.contains("iPhone 15"));
        assert!(json.contains("Apple"));
        assert!(json.contains("electronics"));
    }

    #[test]
    fn test_create_warranty_request_deserialization() {
        let json = r#"{
            "product_name": "MacBook Pro",
            "brand": "Apple",
            "category": "electronics",
            "purchase_date": "2024-01-15T10:00:00Z",
            "warranty_months": 36,
            "store": "Apple Store"
        }"#;

        let request: CreateWarrantyRequest = serde_json::from_str(json).unwrap();
        assert_eq!(request.product_name, "MacBook Pro");
        assert_eq!(request.brand, Some("Apple".to_string()));
        assert_eq!(request.category, WarrantyCategory::Electronics);
        assert_eq!(request.warranty_months, Some(36));
    }

    #[test]
    fn test_create_warranty_request_minimal() {
        let json = r#"{
            "product_name": "Test Product",
            "category": "other",
            "purchase_date": "2024-01-15T10:00:00Z"
        }"#;

        let request: CreateWarrantyRequest = serde_json::from_str(json).unwrap();
        assert_eq!(request.product_name, "Test Product");
        assert_eq!(request.brand, None);
        assert_eq!(request.warranty_months, None);
        assert_eq!(request.store, None);
        assert_eq!(request.notes, None);
    }

    #[test]
    fn test_update_warranty_request_partial() {
        let json = r#"{"product_name": "Updated Name"}"#;

        let request: UpdateWarrantyRequest = serde_json::from_str(json).unwrap();
        assert_eq!(request.product_name, Some("Updated Name".to_string()));
        assert_eq!(request.brand, None);
        assert_eq!(request.category, None);
    }

    #[test]
    fn test_warranty_filters_default() {
        let filters = WarrantyFilters::default();
        assert_eq!(filters.category, None);
        assert_eq!(filters.status, None);
        assert_eq!(filters.page, None);
        assert_eq!(filters.per_page, None);
    }

    #[test]
    fn test_warranty_end_date_calculation() {
        let purchase_date = Utc::now();
        let warranty_months = 24;
        let expected_end = purchase_date + Duration::days(warranty_months as i64 * 30);

        let days_diff = (expected_end - purchase_date).num_days();
        assert_eq!(days_diff, 720);
    }

    #[test]
    fn test_all_categories_exist() {
        let categories = vec![
            WarrantyCategory::Electronics,
            WarrantyCategory::Appliances,
            WarrantyCategory::Furniture,
            WarrantyCategory::Clothing,
            WarrantyCategory::Automotive,
            WarrantyCategory::Sports,
            WarrantyCategory::Other,
        ];

        assert_eq!(categories.len(), 7);
    }
}
