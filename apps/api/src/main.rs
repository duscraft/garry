mod config;
mod db;
mod error;
mod models;

use std::net::SocketAddr;
use std::sync::Arc;

use axum::{
    extract::{Path, Query, State},
    http::{header, StatusCode, Request},
    middleware::{self, Next},
    response::Response,
    routing::{delete, get, post, put},
    Json, Router,
};
use jsonwebtoken::{decode, DecodingKey, Validation};
use serde::{Deserialize, Serialize};
use tower_http::cors::{Any, CorsLayer};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use uuid::Uuid;

use config::Config;
use db::{WarrantyStats};
use error::{AppError, Result};
use models::{CreateWarrantyRequest, UpdateWarrantyRequest, Warranty, WarrantyFilters, WarrantyListResponse};

#[derive(Clone)]
pub struct AppState {
    pub pool: sqlx::PgPool,
    pub config: Config,
}

#[derive(Debug, Serialize, Deserialize)]
struct Claims {
    sub: String,
    exp: usize,
}

#[derive(Clone)]
struct AuthUser {
    user_id: String,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::registry()
        .with(tracing_subscriber::fmt::layer())
        .with(tracing_subscriber::EnvFilter::from_default_env())
        .init();

    let config = Config::from_env();

    let pool = match db::create_pool(&config.database_url).await {
        Ok(pool) => {
            tracing::info!("Connected to database");
            pool
        }
        Err(e) => {
            tracing::warn!("Database not available, running in-memory mode: {}", e);
            panic!("Database connection required");
        }
    };

    let state = AppState {
        pool,
        config: config.clone(),
    };

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let public_routes = Router::new()
        .route("/health", get(health_check))
        .route("/api/v1/categories", get(list_categories));

    let protected_routes = Router::new()
        .route("/api/v1/warranties", get(list_warranties).post(create_warranty))
        .route("/api/v1/warranties/:id", get(get_warranty).put(update_warranty).delete(delete_warranty_handler))
        .route("/api/v1/warranties/:id/receipt", post(upload_receipt))
        .route("/api/v1/warranties/expiring", get(list_expiring))
        .route("/api/v1/stats", get(get_stats))
        .layer(middleware::from_fn_with_state(state.clone(), auth_middleware));

    let app = Router::new()
        .merge(public_routes)
        .merge(protected_routes)
        .layer(cors)
        .with_state(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
    tracing::info!("Garry API starting on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn auth_middleware(
    State(state): State<AppState>,
    mut request: Request<axum::body::Body>,
    next: Next,
) -> std::result::Result<Response, AppError> {
    let auth_header = request
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|h| h.to_str().ok())
        .ok_or(AppError::Unauthorized)?;

    let token = auth_header
        .strip_prefix("Bearer ")
        .ok_or(AppError::Unauthorized)?;

    let token_data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(state.config.jwt_secret.as_bytes()),
        &Validation::default(),
    )
    .map_err(|_| AppError::Unauthorized)?;

    let user = AuthUser {
        user_id: token_data.claims.sub,
    };

    request.extensions_mut().insert(user);
    Ok(next.run(request).await)
}

#[derive(Debug, Serialize)]
struct HealthResponse {
    status: String,
    service: String,
    version: String,
}

async fn health_check() -> Json<HealthResponse> {
    Json(HealthResponse {
        status: "healthy".to_string(),
        service: "garry-api".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
    })
}

#[derive(Debug, Serialize)]
struct CategoryInfo {
    id: String,
    name: String,
    name_fr: String,
    default_warranty_months: i32,
}

async fn list_categories() -> Json<Vec<CategoryInfo>> {
    use models::WarrantyCategory;

    let categories = vec![
        WarrantyCategory::Electronics,
        WarrantyCategory::Appliances,
        WarrantyCategory::Furniture,
        WarrantyCategory::Clothing,
        WarrantyCategory::Automotive,
        WarrantyCategory::Sports,
        WarrantyCategory::Other,
    ];

    let info: Vec<CategoryInfo> = categories
        .into_iter()
        .map(|c| CategoryInfo {
            id: format!("{:?}", c).to_lowercase(),
            name: format!("{:?}", c),
            name_fr: c.display_name_fr().to_string(),
            default_warranty_months: c.default_warranty_months(),
        })
        .collect();

    Json(info)
}

async fn list_warranties(
    State(state): State<AppState>,
    Query(filters): Query<WarrantyFilters>,
    request: Request<axum::body::Body>,
) -> Result<Json<WarrantyListResponse>> {
    let user = request.extensions().get::<AuthUser>().ok_or(AppError::Unauthorized)?;

    let warranties = db::list_warranties(&state.pool, &user.user_id, filters).await?;
    let total = warranties.len();

    Ok(Json(WarrantyListResponse { warranties, total }))
}

async fn create_warranty(
    State(state): State<AppState>,
    request: Request<axum::body::Body>,
) -> Result<(StatusCode, Json<Warranty>)> {
    let user = request.extensions().get::<AuthUser>().ok_or(AppError::Unauthorized)?.clone();
    
    let body = axum::body::to_bytes(request.into_body(), 1024 * 1024)
        .await
        .map_err(|_| AppError::BadRequest("Invalid body".to_string()))?;
    
    let payload: CreateWarrantyRequest = serde_json::from_slice(&body)
        .map_err(|e| AppError::BadRequest(format!("Invalid JSON: {}", e)))?;

    let warranty = db::create_warranty(&state.pool, &user.user_id, payload).await?;
    Ok((StatusCode::CREATED, Json(warranty)))
}

async fn get_warranty(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    request: Request<axum::body::Body>,
) -> Result<Json<Warranty>> {
    let user = request.extensions().get::<AuthUser>().ok_or(AppError::Unauthorized)?;

    let warranty = db::get_warranty_by_id(&state.pool, id, &user.user_id).await?;
    Ok(Json(warranty))
}

async fn update_warranty(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    request: Request<axum::body::Body>,
) -> Result<Json<Warranty>> {
    let user = request.extensions().get::<AuthUser>().ok_or(AppError::Unauthorized)?.clone();

    let body = axum::body::to_bytes(request.into_body(), 1024 * 1024)
        .await
        .map_err(|_| AppError::BadRequest("Invalid body".to_string()))?;
    
    let payload: UpdateWarrantyRequest = serde_json::from_slice(&body)
        .map_err(|e| AppError::BadRequest(format!("Invalid JSON: {}", e)))?;

    let warranty = db::update_warranty(&state.pool, id, &user.user_id, payload).await?;
    Ok(Json(warranty))
}

async fn delete_warranty_handler(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    request: Request<axum::body::Body>,
) -> Result<StatusCode> {
    let user = request.extensions().get::<AuthUser>().ok_or(AppError::Unauthorized)?;

    db::delete_warranty(&state.pool, id, &user.user_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

#[derive(Debug, Deserialize)]
struct ExpiringQuery {
    days: Option<i64>,
}

async fn list_expiring(
    State(state): State<AppState>,
    Query(query): Query<ExpiringQuery>,
    request: Request<axum::body::Body>,
) -> Result<Json<WarrantyListResponse>> {
    let user = request.extensions().get::<AuthUser>().ok_or(AppError::Unauthorized)?;
    let days = query.days.unwrap_or(30);

    let warranties = db::get_expiring_warranties(&state.pool, &user.user_id, days).await?;
    let total = warranties.len();

    Ok(Json(WarrantyListResponse { warranties, total }))
}

async fn get_stats(
    State(state): State<AppState>,
    request: Request<axum::body::Body>,
) -> Result<Json<WarrantyStats>> {
    let user = request.extensions().get::<AuthUser>().ok_or(AppError::Unauthorized)?;

    let stats = db::get_warranty_stats(&state.pool, &user.user_id).await?;
    Ok(Json(stats))
}

async fn upload_receipt(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    request: Request<axum::body::Body>,
) -> Result<Json<Warranty>> {
    let user = request.extensions().get::<AuthUser>().ok_or(AppError::Unauthorized)?.clone();

    let receipt_url = format!("/uploads/{}/{}.jpg", user.user_id, id);

    let warranty = db::update_receipt_url(&state.pool, id, &user.user_id, &receipt_url).await?;
    Ok(Json(warranty))
}
