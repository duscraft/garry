use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::{get, post},
    Json, Router,
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::{collections::HashMap, net::SocketAddr, sync::Arc};
use tokio::sync::RwLock;
use tower_http::cors::{Any, CorsLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use uuid::Uuid;

type AppState = Arc<RwLock<HashMap<Uuid, Warranty>>>;

#[derive(Debug, Clone, Serialize, Deserialize)]
struct Warranty {
    id: Uuid,
    user_id: String,
    product_name: String,
    brand: Option<String>,
    category: WarrantyCategory,
    purchase_date: DateTime<Utc>,
    warranty_end_date: DateTime<Utc>,
    store: Option<String>,
    receipt_url: Option<String>,
    notes: Option<String>,
    created_at: DateTime<Utc>,
    updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
enum WarrantyCategory {
    Electronics,
    Appliances,
    Furniture,
    Clothing,
    Automotive,
    Sports,
    Other,
}

impl WarrantyCategory {
    fn default_warranty_months(&self) -> i64 {
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
}

#[derive(Debug, Deserialize)]
struct CreateWarrantyRequest {
    product_name: String,
    brand: Option<String>,
    category: WarrantyCategory,
    purchase_date: DateTime<Utc>,
    warranty_months: Option<i64>,
    store: Option<String>,
    receipt_url: Option<String>,
    notes: Option<String>,
}

#[derive(Debug, Serialize)]
struct HealthResponse {
    status: String,
    service: String,
    version: String,
}

#[derive(Debug, Serialize)]
struct WarrantyListResponse {
    warranties: Vec<Warranty>,
    total: usize,
}

#[derive(Debug, Serialize)]
struct ApiError {
    error: String,
    message: String,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::registry()
        .with(tracing_subscriber::fmt::layer())
        .with(tracing_subscriber::EnvFilter::from_default_env())
        .init();

    let state: AppState = Arc::new(RwLock::new(HashMap::new()));

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/health", get(health_check))
        .route("/api/v1/warranties", get(list_warranties).post(create_warranty))
        .route("/api/v1/warranties/{id}", get(get_warranty).delete(delete_warranty))
        .route("/api/v1/warranties/expiring", get(list_expiring_warranties))
        .layer(cors)
        .with_state(state);

    let port: u16 = std::env::var("PORT")
        .unwrap_or_else(|_| "8080".to_string())
        .parse()
        .unwrap_or(8080);

    let addr = SocketAddr::from(([0, 0, 0, 0], port));
    tracing::info!("Garry API starting on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn health_check() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "healthy".to_string(),
        service: "garry-api".to_string(),
        version: "0.1.0".to_string(),
    })
}

async fn list_warranties(State(state): State<AppState>) -> Json<WarrantyListResponse> {
    let warranties = state.read().await;
    let list: Vec<Warranty> = warranties.values().cloned().collect();
    let total = list.len();
    Json(WarrantyListResponse {
        warranties: list,
        total,
    })
}

async fn create_warranty(
    State(state): State<AppState>,
    Json(payload): Json<CreateWarrantyRequest>,
) -> (StatusCode, Json<Warranty>) {
    let now = Utc::now();
    let warranty_months = payload
        .warranty_months
        .unwrap_or_else(|| payload.category.default_warranty_months());

    let warranty_end_date = payload.purchase_date + chrono::Duration::days(warranty_months * 30);

    let warranty = Warranty {
        id: Uuid::new_v4(),
        user_id: "demo-user".to_string(),
        product_name: payload.product_name,
        brand: payload.brand,
        category: payload.category,
        purchase_date: payload.purchase_date,
        warranty_end_date,
        store: payload.store,
        receipt_url: payload.receipt_url,
        notes: payload.notes,
        created_at: now,
        updated_at: now,
    };

    state.write().await.insert(warranty.id, warranty.clone());
    (StatusCode::CREATED, Json(warranty))
}

async fn get_warranty(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<Json<Warranty>, (StatusCode, Json<ApiError>)> {
    let warranties = state.read().await;
    warranties.get(&id).cloned().map(Json).ok_or_else(|| {
        (
            StatusCode::NOT_FOUND,
            Json(ApiError {
                error: "not_found".to_string(),
                message: "Warranty not found".to_string(),
            }),
        )
    })
}

async fn delete_warranty(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, (StatusCode, Json<ApiError>)> {
    let mut warranties = state.write().await;
    warranties.remove(&id).map(|_| StatusCode::NO_CONTENT).ok_or_else(|| {
        (
            StatusCode::NOT_FOUND,
            Json(ApiError {
                error: "not_found".to_string(),
                message: "Warranty not found".to_string(),
            }),
        )
    })
}

async fn list_expiring_warranties(State(state): State<AppState>) -> Json<WarrantyListResponse> {
    let warranties = state.read().await;
    let now = Utc::now();
    let thirty_days_later = now + chrono::Duration::days(30);

    let expiring: Vec<Warranty> = warranties
        .values()
        .filter(|w| w.warranty_end_date > now && w.warranty_end_date <= thirty_days_later)
        .cloned()
        .collect();

    let total = expiring.len();
    Json(WarrantyListResponse {
        warranties: expiring,
        total,
    })
}
