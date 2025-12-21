use axum::Router;
use tower_http::cors::{Any, CorsLayer};

pub async fn create_test_app() -> Router {
    use axum::{
        extract::State,
        http::{header, StatusCode, Request},
        middleware::{self, Next},
        response::Response,
        routing::{get, post},
        Json,
    };
    use jsonwebtoken::{decode, DecodingKey, Validation};
    use serde::{Deserialize, Serialize};

    #[derive(Clone)]
    struct TestConfig {
        jwt_secret: String,
    }

    #[derive(Clone)]
    struct AppState {
        config: TestConfig,
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

    #[derive(Debug, Serialize)]
    struct HealthResponse {
        status: String,
        service: String,
        version: String,
    }

    #[derive(Debug, Serialize)]
    struct CategoryInfo {
        id: String,
        name: String,
        name_fr: String,
        default_warranty_months: i32,
    }

    #[derive(Debug, Serialize)]
    struct WarrantyListResponse {
        warranties: Vec<()>,
        total: usize,
    }

    #[derive(Debug, Serialize)]
    struct WarrantyStats {
        total: i64,
        active: i64,
        expiring_soon: i64,
        expired: i64,
    }

    #[derive(Debug, thiserror::Error)]
    enum AppError {
        #[error("Unauthorized")]
        Unauthorized,
    }

    impl axum::response::IntoResponse for AppError {
        fn into_response(self) -> axum::response::Response {
            (StatusCode::UNAUTHORIZED, "Unauthorized").into_response()
        }
    }

    async fn auth_middleware(
        State(state): State<AppState>,
        mut request: Request<axum::body::Body>,
        next: Next,
    ) -> Result<Response, AppError> {
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

    async fn health_check() -> Json<HealthResponse> {
        Json(HealthResponse {
            status: "healthy".to_string(),
            service: "garry-api".to_string(),
            version: env!("CARGO_PKG_VERSION").to_string(),
        })
    }

    async fn list_categories() -> Json<Vec<CategoryInfo>> {
        let categories = vec![
            ("electronics", "Electronics", "Électronique", 24),
            ("appliances", "Appliances", "Électroménager", 24),
            ("furniture", "Furniture", "Mobilier", 24),
            ("clothing", "Clothing", "Vêtements", 6),
            ("automotive", "Automotive", "Automobile", 24),
            ("sports", "Sports", "Sport", 12),
            ("other", "Other", "Autre", 12),
        ];

        let info: Vec<CategoryInfo> = categories
            .into_iter()
            .map(|(id, name, name_fr, months)| CategoryInfo {
                id: id.to_string(),
                name: name.to_string(),
                name_fr: name_fr.to_string(),
                default_warranty_months: months,
            })
            .collect();

        Json(info)
    }

    async fn list_warranties() -> Json<WarrantyListResponse> {
        Json(WarrantyListResponse {
            warranties: vec![],
            total: 0,
        })
    }

    async fn get_stats() -> Json<WarrantyStats> {
        Json(WarrantyStats {
            total: 0,
            active: 0,
            expiring_soon: 0,
            expired: 0,
        })
    }

    async fn list_expiring() -> Json<WarrantyListResponse> {
        Json(WarrantyListResponse {
            warranties: vec![],
            total: 0,
        })
    }

    async fn create_warranty() -> StatusCode {
        StatusCode::CREATED
    }

    async fn get_warranty() -> StatusCode {
        StatusCode::OK
    }

    async fn update_warranty() -> StatusCode {
        StatusCode::OK
    }

    async fn delete_warranty() -> StatusCode {
        StatusCode::NO_CONTENT
    }

    async fn upload_receipt() -> StatusCode {
        StatusCode::OK
    }

    let state = AppState {
        config: TestConfig {
            jwt_secret: "test-secret-key-for-testing-only".to_string(),
        },
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
        .route("/api/v1/warranties/:id", get(get_warranty).put(update_warranty).delete(delete_warranty))
        .route("/api/v1/warranties/:id/receipt", post(upload_receipt))
        .route("/api/v1/warranties/expiring", get(list_expiring))
        .route("/api/v1/stats", get(get_stats))
        .layer(middleware::from_fn_with_state(state.clone(), auth_middleware));

    Router::new()
        .merge(public_routes)
        .merge(protected_routes)
        .layer(cors)
        .with_state(state)
}
