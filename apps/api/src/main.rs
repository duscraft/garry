mod config;
mod db;
mod error;
mod models;

use std::net::SocketAddr;
use std::time::Duration;

use axum::{
    extract::{Path, Query, State},
    http::{header, Method, StatusCode, Request},
    middleware::{self, Next},
    response::Response,
    routing::{get, post, put, delete},
    Json, Router,
};
use jsonwebtoken::{decode, DecodingKey, Validation};
use serde::{Deserialize, Serialize};
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;
use tracing::{info, warn, error, Span};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use uuid::Uuid;

use config::{Config, Environment};
use db::WarrantyStats;
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
        .with(tracing_subscriber::fmt::layer().json())
        .with(tracing_subscriber::EnvFilter::from_default_env()
            .add_directive("garry_api=info".parse().unwrap())
            .add_directive("tower_http=info".parse().unwrap()))
        .init();

    let config = Config::from_env();
    
    info!(
        environment = ?config.environment,
        port = config.port,
        "starting garry-api"
    );

    let pool = match db::create_pool(&config.database_url).await {
        Ok(pool) => {
            info!("connected to database");
            pool
        }
        Err(e) => {
            error!(error = %e, "failed to connect to database");
            panic!("Database connection required");
        }
    };

    let state = AppState {
        pool,
        config: config.clone(),
    };

    let cors = build_cors_layer(&config);

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
        .layer(
            TraceLayer::new_for_http()
                .make_span_with(|request: &Request<_>| {
                    let request_id = uuid::Uuid::new_v4().to_string();
                    tracing::info_span!(
                        "request",
                        method = %request.method(),
                        uri = %request.uri(),
                        request_id = %request_id,
                    )
                })
                .on_response(|response: &Response, latency: Duration, _span: &Span| {
                    info!(
                        status = response.status().as_u16(),
                        latency_ms = latency.as_millis(),
                        "response"
                    );
                })
        )
        .with_state(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
    info!(address = %addr, "listening");

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

fn build_cors_layer(config: &Config) -> CorsLayer {
    let origins: Vec<_> = config.cors_origins
        .iter()
        .filter_map(|origin| origin.parse().ok())
        .collect();

    if origins.is_empty() || config.cors_origins.contains(&"*".to_string()) {
        CorsLayer::permissive()
    } else {
        CorsLayer::new()
            .allow_origin(origins)
            .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE, Method::OPTIONS])
            .allow_headers([header::AUTHORIZATION, header::CONTENT_TYPE, header::ACCEPT])
            .allow_credentials(true)
    }
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
    checks: HealthChecks,
}

#[derive(Debug, Serialize)]
struct HealthChecks {
    database: bool,
}

async fn health_check(State(state): State<AppState>) -> (StatusCode, Json<HealthResponse>) {
    let db_healthy = sqlx::query("SELECT 1")
        .fetch_one(&state.pool)
        .await
        .is_ok();

    let status = if db_healthy { "healthy" } else { "unhealthy" };
    let http_status = if db_healthy { StatusCode::OK } else { StatusCode::SERVICE_UNAVAILABLE };

    (http_status, Json(HealthResponse {
        status: status.to_string(),
        service: "garry-api".to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        checks: HealthChecks {
            database: db_healthy,
        },
    }))
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

    validate_create_warranty(&payload)?;

    let warranty = db::create_warranty(&state.pool, &user.user_id, payload).await?;
    
    info!(warranty_id = %warranty.id, user_id = %user.user_id, "warranty created");
    
    Ok((StatusCode::CREATED, Json(warranty)))
}

fn validate_create_warranty(req: &CreateWarrantyRequest) -> Result<()> {
    if req.product_name.trim().is_empty() {
        return Err(AppError::BadRequest("Product name is required".to_string()));
    }
    if req.product_name.len() > 200 {
        return Err(AppError::BadRequest("Product name must be less than 200 characters".to_string()));
    }
    if let Some(ref brand) = req.brand {
        if brand.len() > 100 {
            return Err(AppError::BadRequest("Brand must be less than 100 characters".to_string()));
        }
    }
    if let Some(ref store) = req.store {
        if store.len() > 200 {
            return Err(AppError::BadRequest("Store must be less than 200 characters".to_string()));
        }
    }
    if let Some(ref notes) = req.notes {
        if notes.len() > 2000 {
            return Err(AppError::BadRequest("Notes must be less than 2000 characters".to_string()));
        }
    }
    if let Some(months) = req.warranty_months {
        if months < 1 || months > 120 {
            return Err(AppError::BadRequest("Warranty months must be between 1 and 120".to_string()));
        }
    }
    Ok(())
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

    validate_update_warranty(&payload)?;

    let warranty = db::update_warranty(&state.pool, id, &user.user_id, payload).await?;
    
    info!(warranty_id = %warranty.id, user_id = %user.user_id, "warranty updated");
    
    Ok(Json(warranty))
}

fn validate_update_warranty(req: &UpdateWarrantyRequest) -> Result<()> {
    if let Some(ref name) = req.product_name {
        if name.trim().is_empty() {
            return Err(AppError::BadRequest("Product name cannot be empty".to_string()));
        }
        if name.len() > 200 {
            return Err(AppError::BadRequest("Product name must be less than 200 characters".to_string()));
        }
    }
    if let Some(ref brand) = req.brand {
        if brand.len() > 100 {
            return Err(AppError::BadRequest("Brand must be less than 100 characters".to_string()));
        }
    }
    if let Some(ref store) = req.store {
        if store.len() > 200 {
            return Err(AppError::BadRequest("Store must be less than 200 characters".to_string()));
        }
    }
    if let Some(ref notes) = req.notes {
        if notes.len() > 2000 {
            return Err(AppError::BadRequest("Notes must be less than 2000 characters".to_string()));
        }
    }
    if let Some(months) = req.warranty_months {
        if months < 1 || months > 120 {
            return Err(AppError::BadRequest("Warranty months must be between 1 and 120".to_string()));
        }
    }
    Ok(())
}

async fn delete_warranty_handler(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    request: Request<axum::body::Body>,
) -> Result<StatusCode> {
    let user = request.extensions().get::<AuthUser>().ok_or(AppError::Unauthorized)?;

    db::delete_warranty(&state.pool, id, &user.user_id).await?;
    
    info!(warranty_id = %id, user_id = %user.user_id, "warranty deleted");
    
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
    let days = query.days.unwrap_or(30).min(365).max(1);

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
    
    info!(warranty_id = %id, user_id = %user.user_id, "receipt uploaded");
    
    Ok(Json(warranty))
}
