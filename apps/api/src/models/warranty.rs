use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize, sqlx::Type, PartialEq)]
#[sqlx(type_name = "warranty_category", rename_all = "snake_case")]
#[serde(rename_all = "snake_case")]
pub enum WarrantyCategory {
    Electronics,
    Appliances,
    Furniture,
    Clothing,
    Automotive,
    Sports,
    Other,
}

impl WarrantyCategory {
    pub fn default_warranty_months(&self) -> i32 {
        match self {
            WarrantyCategory::Electronics => 24,
            WarrantyCategory::Appliances => 24,
            WarrantyCategory::Furniture => 24,
            WarrantyCategory::Clothing => 6,
            WarrantyCategory::Automotive => 24,
            WarrantyCategory::Sports => 12,
            WarrantyCategory::Other => 24,
        }
    }

    pub fn display_name_fr(&self) -> &'static str {
        match self {
            WarrantyCategory::Electronics => "Électronique",
            WarrantyCategory::Appliances => "Électroménager",
            WarrantyCategory::Furniture => "Mobilier",
            WarrantyCategory::Clothing => "Vêtements",
            WarrantyCategory::Automotive => "Automobile",
            WarrantyCategory::Sports => "Sport",
            WarrantyCategory::Other => "Autre",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Warranty {
    pub id: Uuid,
    pub user_id: String,
    pub product_name: String,
    pub brand: Option<String>,
    pub category: WarrantyCategory,
    pub purchase_date: DateTime<Utc>,
    pub warranty_end_date: DateTime<Utc>,
    pub warranty_months: i32,
    pub store: Option<String>,
    pub receipt_url: Option<String>,
    pub notes: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Deserialize)]
pub struct CreateWarrantyRequest {
    pub product_name: String,
    pub brand: Option<String>,
    pub category: WarrantyCategory,
    pub purchase_date: DateTime<Utc>,
    pub warranty_months: Option<i32>,
    pub store: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct UpdateWarrantyRequest {
    pub product_name: Option<String>,
    pub brand: Option<String>,
    pub category: Option<WarrantyCategory>,
    pub purchase_date: Option<DateTime<Utc>>,
    pub warranty_months: Option<i32>,
    pub store: Option<String>,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct WarrantyListResponse {
    pub warranties: Vec<Warranty>,
    pub total: usize,
}

#[derive(Debug, Deserialize, Default)]
pub struct WarrantyFilters {
    pub category: Option<WarrantyCategory>,
    pub status: Option<String>,
    pub limit: Option<i64>,
    pub offset: Option<i64>,
}
