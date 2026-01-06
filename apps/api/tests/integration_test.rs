use axum::{
    body::Body,
    http::{Request, StatusCode},
};
use serde_json::{json, Value};
use tower::ServiceExt;

mod common;

#[tokio::test]
async fn health_check_returns_ok() {
    let app = common::create_test_app().await;

    let response = app
        .oneshot(
            Request::builder()
                .uri("/health")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .unwrap();
    let json: Value = serde_json::from_slice(&body).unwrap();

    assert_eq!(json["status"], "healthy");
    assert_eq!(json["service"], "garry-api");
}

#[tokio::test]
async fn list_categories_returns_all_categories() {
    let app = common::create_test_app().await;

    let response = app
        .oneshot(
            Request::builder()
                .uri("/api/v1/categories")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::OK);

    let body = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .unwrap();
    let categories: Vec<Value> = serde_json::from_slice(&body).unwrap();

    assert_eq!(categories.len(), 7);

    let category_ids: Vec<&str> = categories
        .iter()
        .map(|c| c["id"].as_str().unwrap())
        .collect();

    assert!(category_ids.contains(&"electronics"));
    assert!(category_ids.contains(&"appliances"));
    assert!(category_ids.contains(&"furniture"));
    assert!(category_ids.contains(&"clothing"));
    assert!(category_ids.contains(&"automotive"));
    assert!(category_ids.contains(&"sports"));
    assert!(category_ids.contains(&"other"));
}

#[tokio::test]
async fn list_warranties_without_auth_returns_unauthorized() {
    let app = common::create_test_app().await;

    let response = app
        .oneshot(
            Request::builder()
                .uri("/api/v1/warranties")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn create_warranty_without_auth_returns_unauthorized() {
    let app = common::create_test_app().await;

    let warranty_json = json!({
        "product_name": "Test Product",
        "brand": "Test Brand",
        "category": "electronics",
        "purchase_date": "2024-01-15",
        "warranty_months": 24,
        "store": "Test Store"
    });

    let response = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/api/v1/warranties")
                .header("Content-Type", "application/json")
                .body(Body::from(warranty_json.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn get_warranty_without_auth_returns_unauthorized() {
    let app = common::create_test_app().await;
    let fake_uuid = "00000000-0000-0000-0000-000000000001";

    let response = app
        .oneshot(
            Request::builder()
                .uri(format!("/api/v1/warranties/{}", fake_uuid))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn update_warranty_without_auth_returns_unauthorized() {
    let app = common::create_test_app().await;
    let fake_uuid = "00000000-0000-0000-0000-000000000001";

    let update_json = json!({
        "product_name": "Updated Product"
    });

    let response = app
        .oneshot(
            Request::builder()
                .method("PUT")
                .uri(format!("/api/v1/warranties/{}", fake_uuid))
                .header("Content-Type", "application/json")
                .body(Body::from(update_json.to_string()))
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn delete_warranty_without_auth_returns_unauthorized() {
    let app = common::create_test_app().await;
    let fake_uuid = "00000000-0000-0000-0000-000000000001";

    let response = app
        .oneshot(
            Request::builder()
                .method("DELETE")
                .uri(format!("/api/v1/warranties/{}", fake_uuid))
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn get_stats_without_auth_returns_unauthorized() {
    let app = common::create_test_app().await;

    let response = app
        .oneshot(
            Request::builder()
                .uri("/api/v1/stats")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn list_expiring_without_auth_returns_unauthorized() {
    let app = common::create_test_app().await;

    let response = app
        .oneshot(
            Request::builder()
                .uri("/api/v1/warranties/expiring")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn invalid_auth_token_returns_unauthorized() {
    let app = common::create_test_app().await;

    let response = app
        .oneshot(
            Request::builder()
                .uri("/api/v1/warranties")
                .header("Authorization", "Bearer invalid-token")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn malformed_auth_header_returns_unauthorized() {
    let app = common::create_test_app().await;

    let response = app
        .oneshot(
            Request::builder()
                .uri("/api/v1/warranties")
                .header("Authorization", "NotBearer token")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    assert_eq!(response.status(), StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn categories_have_french_names() {
    let app = common::create_test_app().await;

    let response = app
        .oneshot(
            Request::builder()
                .uri("/api/v1/categories")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    let body = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .unwrap();
    let categories: Vec<Value> = serde_json::from_slice(&body).unwrap();

    let electronics = categories
        .iter()
        .find(|c| c["id"] == "electronics")
        .unwrap();
    assert_eq!(electronics["name_fr"], "Électronique");

    let appliances = categories
        .iter()
        .find(|c| c["id"] == "appliances")
        .unwrap();
    assert_eq!(appliances["name_fr"], "Électroménager");
}

#[tokio::test]
async fn categories_have_default_warranty_months() {
    let app = common::create_test_app().await;

    let response = app
        .oneshot(
            Request::builder()
                .uri("/api/v1/categories")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();

    let body = axum::body::to_bytes(response.into_body(), usize::MAX)
        .await
        .unwrap();
    let categories: Vec<Value> = serde_json::from_slice(&body).unwrap();

    let electronics = categories
        .iter()
        .find(|c| c["id"] == "electronics")
        .unwrap();
    assert_eq!(electronics["default_warranty_months"], 24);

    let appliances = categories
        .iter()
        .find(|c| c["id"] == "appliances")
        .unwrap();
    assert_eq!(appliances["default_warranty_months"], 24);

    let clothing = categories
        .iter()
        .find(|c| c["id"] == "clothing")
        .unwrap();
    assert_eq!(clothing["default_warranty_months"], 6);
}
