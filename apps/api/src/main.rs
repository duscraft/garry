mod config;
mod db;
mod error;
mod models;

use std::net::SocketAddr;
use std::sync::Arc;
use std::time::Duration;

use axum::{
    extract::{Path, Query, State},
    http::{header, Method, Request, StatusCode},
    middleware::{self, Next},
    response::Response,
    routing::{get, post},
    Json, Router,
};
use jsonwebtoken::{decode, DecodingKey, Validation};
use serde::{Deserialize, Serialize};
use tower_governor::{
    governor::GovernorConfigBuilder, key_extractor::PeerIpKeyExtractor, GovernorLayer,
};
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;
use tracing::{info, Span};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use utoipa::{OpenApi, ToSchema};
use utoipa_swagger_ui::SwaggerUi;
use uuid::Uuid;

use config::Config;
use db::{PaginatedWarranties, WarrantyStats};
use error::{AppError, ErrorResponse, Result};
use models::{
    CreateWarrantyRequest, UpdateWarrantyRequest, Warranty, WarrantyCategory, WarrantyFilters,
    WarrantyListResponse,
};

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

#[derive(OpenApi)]
#[openapi(
    info(
        title = "Garry API",
        version = "0.1.0",
        description = "Warranty management service API",
        license(name = "MIT")
    ),
    paths(
        health_check,
        list_categories,
        list_warranties,
        create_warranty,
        get_warranty,
        update_warranty,
        delete_warranty_handler,
        list_expiring,
        get_stats,
    ),
    components(
        schemas(
            HealthResponse,
            HealthChecks,
            CategoryInfo,
            Warranty,
            WarrantyCategory,
            CreateWarrantyRequest,
            UpdateWarrantyRequest,
            WarrantyListResponse,
            WarrantyFilters,
            WarrantyStats,
            ErrorResponse,
            ExpiringQuery,
        )
    ),
    tags(
        (name = "health", description = "Health check endpoints"),
        (name = "categories", description = "Warranty category endpoints"),
        (name = "warranties", description = "Warranty management endpoints"),
        (name = "stats", description = "Statistics endpoints")
    )
)]
struct ApiDoc;

#[tokio::main]
async fn main() {
    tracing_subscriber::registry()
        .with(tracing_subscriber::fmt::layer().json())
        .with(
            tracing_subscriber::EnvFilter::from_default_env()
                .add_directive("garry_api=info".parse().unwrap())
                .add_directive("tower_http=info".parse().unwrap()),
        )
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
            tracing::error!(error = %e, "failed to connect to database");
            panic!("Database connection required");
        }
    };

    let state = AppState {
        pool,
        config: config.clone(),
    };

    let governor_conf = Arc::new(
        GovernorConfigBuilder::default()
            .per_second(10)
            .burst_size(50)
            .key_extractor(PeerIpKeyExtractor)
            .finish()
            .unwrap(),
    );

    let cors = build_cors_layer(&config);

    let public_routes = Router::new()
        .route("/health", get(health_check))
        .route("/api/v1/categories", get(list_categories));

    let protected_routes = Router::new()
        .route(
            "/api/v1/warranties",
            get(list_warranties).post(create_warranty),
        )
        .route(
            "/api/v1/warranties/:id",
            get(get_warranty)
                .put(update_warranty)
                .delete(delete_warranty_handler),
        )
        .route("/api/v1/warranties/:id/receipt", post(upload_receipt))
        .route("/api/v1/warranties/expiring", get(list_expiring))
        .route("/api/v1/stats", get(get_stats))
        .layer(middleware::from_fn_with_state(
            state.clone(),
            auth_middleware,
        ))
        .layer(GovernorLayer {
            config: governor_conf,
        });

    let app = public_routes
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
                }),
        )
        .with_state(state)
        .merge(SwaggerUi::new("/swagger-ui").url("/api-docs/openapi.json", ApiDoc::openapi()));

    let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
    info!(address = %addr, "listening");

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(
        listener,
        app.into_make_service_with_connect_info::<SocketAddr>(),
    )
    .await
    .unwrap();
}

fn build_cors_layer(config: &Config) -> CorsLayer {
    let origins: Vec<_> = config
        .cors_origins
        .iter()
        .filter_map(|origin| origin.parse().ok())
        .collect();

    if origins.is_empty() || config.cors_origins.contains(&"*".to_string()) {
        CorsLayer::permissive()
    } else {
        CorsLayer::new()
            .allow_origin(origins)
            .allow_methods([
                Method::GET,
                Method::POST,
                Method::PUT,
                Method::DELETE,
                Method::OPTIONS,
            ])
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

#[derive(Debug, Serialize, ToSchema)]
struct HealthResponse {
    status: String,
    service: String,
    version: String,
    checks: HealthChecks,
}

#[derive(Debug, Serialize, ToSchema)]
struct HealthChecks {
    database: bool,
}

#[utoipa::path(
    get,
    path = "/health",
    tag = "health",
    responses(
        (status = 200, description = "Service is healthy", body = HealthResponse),
        (status = 503, description = "Service is unhealthy", body = HealthResponse)
    )
)]
async fn health_check(State(state): State<AppState>) -> (StatusCode, Json<HealthResponse>) {
    let db_healthy = sqlx::query("SELECT 1").fetch_one(&state.pool).await.is_ok();

    let status = if db_healthy { "healthy" } else { "unhealthy" };
    let http_status = if db_healthy {
        StatusCode::OK
    } else {
        StatusCode::SERVICE_UNAVAILABLE
    };

    (
        http_status,
        Json(HealthResponse {
            status: status.to_string(),
            service: "garry-api".to_string(),
            version: env!("CARGO_PKG_VERSION").to_string(),
            checks: HealthChecks {
                database: db_healthy,
            },
        }),
    )
}

#[derive(Debug, Serialize, ToSchema)]
struct CategoryInfo {
    id: String,
    name: String,
    name_fr: String,
    default_warranty_months: i32,
}

#[utoipa::path(
    get,
    path = "/api/v1/categories",
    tag = "categories",
    responses(
        (status = 200, description = "List of warranty categories", body = Vec<CategoryInfo>)
    )
)]
async fn list_categories() -> Json<Vec<CategoryInfo>> {
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

#[utoipa::path(
    get,
    path = "/api/v1/warranties",
    tag = "warranties",
    params(
        ("category" = Option<String>, Query, description = "Filter by category"),
        ("status" = Option<String>, Query, description = "Filter by status (active, expiring_soon, expired)"),
        ("page" = Option<i64>, Query, description = "Page number (default: 1)"),
        ("per_page" = Option<i64>, Query, description = "Items per page (default: 20, max: 100)")
    ),
    responses(
        (status = 200, description = "Paginated list of warranties", body = WarrantyListResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse),
        (status = 429, description = "Too many requests", body = ErrorResponse)
    ),
    security(
        ("bearer_auth" = [])
    )
)]
async fn list_warranties(
    State(state): State<AppState>,
    Query(filters): Query<WarrantyFilters>,
    request: Request<axum::body::Body>,
) -> Result<Json<WarrantyListResponse>> {
    let user = request
        .extensions()
        .get::<AuthUser>()
        .ok_or(AppError::Unauthorized)?;

    let page = filters.page.unwrap_or(1).max(1);
    let per_page = filters.per_page.unwrap_or(20).min(100).max(1);

    let PaginatedWarranties { warranties, total } =
        db::list_warranties(&state.pool, &user.user_id, filters).await?;

    let total_pages = (total as f64 / per_page as f64).ceil() as i64;

    Ok(Json(WarrantyListResponse {
        warranties,
        total,
        page,
        per_page,
        total_pages,
    }))
}

#[utoipa::path(
    post,
    path = "/api/v1/warranties",
    tag = "warranties",
    request_body = CreateWarrantyRequest,
    responses(
        (status = 201, description = "Warranty created successfully", body = Warranty),
        (status = 400, description = "Invalid request", body = ErrorResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse),
        (status = 429, description = "Too many requests", body = ErrorResponse)
    ),
    security(
        ("bearer_auth" = [])
    )
)]
async fn create_warranty(
    State(state): State<AppState>,
    request: Request<axum::body::Body>,
) -> Result<(StatusCode, Json<Warranty>)> {
    let user = request
        .extensions()
        .get::<AuthUser>()
        .ok_or(AppError::Unauthorized)?
        .clone();

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
        return Err(AppError::BadRequest(
            "Product name must be less than 200 characters".to_string(),
        ));
    }
    if let Some(ref brand) = req.brand {
        if brand.len() > 100 {
            return Err(AppError::BadRequest(
                "Brand must be less than 100 characters".to_string(),
            ));
        }
    }
    if let Some(ref store) = req.store {
        if store.len() > 200 {
            return Err(AppError::BadRequest(
                "Store must be less than 200 characters".to_string(),
            ));
        }
    }
    if let Some(ref notes) = req.notes {
        if notes.len() > 2000 {
            return Err(AppError::BadRequest(
                "Notes must be less than 2000 characters".to_string(),
            ));
        }
    }
    if let Some(months) = req.warranty_months {
        if months < 1 || months > 120 {
            return Err(AppError::BadRequest(
                "Warranty months must be between 1 and 120".to_string(),
            ));
        }
    }
    Ok(())
}

#[utoipa::path(
    get,
    path = "/api/v1/warranties/{id}",
    tag = "warranties",
    params(
        ("id" = Uuid, Path, description = "Warranty ID")
    ),
    responses(
        (status = 200, description = "Warranty details", body = Warranty),
        (status = 401, description = "Unauthorized", body = ErrorResponse),
        (status = 404, description = "Warranty not found", body = ErrorResponse),
        (status = 429, description = "Too many requests", body = ErrorResponse)
    ),
    security(
        ("bearer_auth" = [])
    )
)]
async fn get_warranty(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    request: Request<axum::body::Body>,
) -> Result<Json<Warranty>> {
    let user = request
        .extensions()
        .get::<AuthUser>()
        .ok_or(AppError::Unauthorized)?;

    let warranty = db::get_warranty_by_id(&state.pool, id, &user.user_id).await?;
    Ok(Json(warranty))
}

#[utoipa::path(
    put,
    path = "/api/v1/warranties/{id}",
    tag = "warranties",
    params(
        ("id" = Uuid, Path, description = "Warranty ID")
    ),
    request_body = UpdateWarrantyRequest,
    responses(
        (status = 200, description = "Warranty updated successfully", body = Warranty),
        (status = 400, description = "Invalid request", body = ErrorResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse),
        (status = 404, description = "Warranty not found", body = ErrorResponse),
        (status = 429, description = "Too many requests", body = ErrorResponse)
    ),
    security(
        ("bearer_auth" = [])
    )
)]
async fn update_warranty(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    request: Request<axum::body::Body>,
) -> Result<Json<Warranty>> {
    let user = request
        .extensions()
        .get::<AuthUser>()
        .ok_or(AppError::Unauthorized)?
        .clone();

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
            return Err(AppError::BadRequest(
                "Product name cannot be empty".to_string(),
            ));
        }
        if name.len() > 200 {
            return Err(AppError::BadRequest(
                "Product name must be less than 200 characters".to_string(),
            ));
        }
    }
    if let Some(ref brand) = req.brand {
        if brand.len() > 100 {
            return Err(AppError::BadRequest(
                "Brand must be less than 100 characters".to_string(),
            ));
        }
    }
    if let Some(ref store) = req.store {
        if store.len() > 200 {
            return Err(AppError::BadRequest(
                "Store must be less than 200 characters".to_string(),
            ));
        }
    }
    if let Some(ref notes) = req.notes {
        if notes.len() > 2000 {
            return Err(AppError::BadRequest(
                "Notes must be less than 2000 characters".to_string(),
            ));
        }
    }
    if let Some(months) = req.warranty_months {
        if months < 1 || months > 120 {
            return Err(AppError::BadRequest(
                "Warranty months must be between 1 and 120".to_string(),
            ));
        }
    }
    Ok(())
}

#[utoipa::path(
    delete,
    path = "/api/v1/warranties/{id}",
    tag = "warranties",
    params(
        ("id" = Uuid, Path, description = "Warranty ID")
    ),
    responses(
        (status = 204, description = "Warranty deleted successfully"),
        (status = 401, description = "Unauthorized", body = ErrorResponse),
        (status = 404, description = "Warranty not found", body = ErrorResponse),
        (status = 429, description = "Too many requests", body = ErrorResponse)
    ),
    security(
        ("bearer_auth" = [])
    )
)]
async fn delete_warranty_handler(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    request: Request<axum::body::Body>,
) -> Result<StatusCode> {
    let user = request
        .extensions()
        .get::<AuthUser>()
        .ok_or(AppError::Unauthorized)?;

    db::delete_warranty(&state.pool, id, &user.user_id).await?;

    info!(warranty_id = %id, user_id = %user.user_id, "warranty deleted");

    Ok(StatusCode::NO_CONTENT)
}

#[derive(Debug, Deserialize, ToSchema)]
struct ExpiringQuery {
    days: Option<i64>,
}

#[utoipa::path(
    get,
    path = "/api/v1/warranties/expiring",
    tag = "warranties",
    params(
        ("days" = Option<i64>, Query, description = "Number of days to look ahead (default: 30, max: 365)")
    ),
    responses(
        (status = 200, description = "List of expiring warranties", body = WarrantyListResponse),
        (status = 401, description = "Unauthorized", body = ErrorResponse),
        (status = 429, description = "Too many requests", body = ErrorResponse)
    ),
    security(
        ("bearer_auth" = [])
    )
)]
async fn list_expiring(
    State(state): State<AppState>,
    Query(query): Query<ExpiringQuery>,
    request: Request<axum::body::Body>,
) -> Result<Json<WarrantyListResponse>> {
    let user = request
        .extensions()
        .get::<AuthUser>()
        .ok_or(AppError::Unauthorized)?;
    let days = query.days.unwrap_or(30).min(365).max(1);

    let warranties = db::get_expiring_warranties(&state.pool, &user.user_id, days).await?;
    let total = warranties.len() as i64;

    Ok(Json(WarrantyListResponse {
        warranties,
        total,
        page: 1,
        per_page: total,
        total_pages: 1,
    }))
}

#[utoipa::path(
    get,
    path = "/api/v1/stats",
    tag = "stats",
    responses(
        (status = 200, description = "Warranty statistics", body = WarrantyStats),
        (status = 401, description = "Unauthorized", body = ErrorResponse),
        (status = 429, description = "Too many requests", body = ErrorResponse)
    ),
    security(
        ("bearer_auth" = [])
    )
)]
async fn get_stats(
    State(state): State<AppState>,
    request: Request<axum::body::Body>,
) -> Result<Json<WarrantyStats>> {
    let user = request
        .extensions()
        .get::<AuthUser>()
        .ok_or(AppError::Unauthorized)?;

    let stats = db::get_warranty_stats(&state.pool, &user.user_id).await?;
    Ok(Json(stats))
}

async fn upload_receipt(
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    request: Request<axum::body::Body>,
) -> Result<Json<Warranty>> {
    let user = request
        .extensions()
        .get::<AuthUser>()
        .ok_or(AppError::Unauthorized)?
        .clone();

    let receipt_url = format!("/uploads/{}/{}.jpg", user.user_id, id);

    let warranty = db::update_receipt_url(&state.pool, id, &user.user_id, &receipt_url).await?;

    info!(warranty_id = %id, user_id = %user.user_id, "receipt uploaded");

    Ok(Json(warranty))
}
