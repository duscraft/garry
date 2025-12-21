use chrono::{Duration, Utc};
use sqlx::PgPool;
use utoipa::ToSchema;
use uuid::Uuid;

use crate::error::{AppError, Result};
use crate::models::{CreateWarrantyRequest, UpdateWarrantyRequest, Warranty, WarrantyFilters};

#[derive(Debug, Clone)]
pub struct PaginatedWarranties {
    pub warranties: Vec<Warranty>,
    pub total: i64,
}

pub async fn create_warranty(
    pool: &PgPool,
    user_id: &str,
    req: CreateWarrantyRequest,
) -> Result<Warranty> {
    let warranty_months = req
        .warranty_months
        .unwrap_or_else(|| req.category.default_warranty_months());
    let warranty_end_date = req.purchase_date + Duration::days(warranty_months as i64 * 30);

    let warranty = sqlx::query_as::<_, Warranty>(
        r#"
        INSERT INTO warranties (user_id, product_name, brand, category, purchase_date, warranty_end_date, warranty_months, store, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
        "#,
    )
    .bind(user_id)
    .bind(&req.product_name)
    .bind(&req.brand)
    .bind(&req.category)
    .bind(req.purchase_date)
    .bind(warranty_end_date)
    .bind(warranty_months)
    .bind(&req.store)
    .bind(&req.notes)
    .fetch_one(pool)
    .await?;

    Ok(warranty)
}

pub async fn get_warranty_by_id(pool: &PgPool, id: Uuid, user_id: &str) -> Result<Warranty> {
    sqlx::query_as::<_, Warranty>("SELECT * FROM warranties WHERE id = $1 AND user_id = $2")
        .bind(id)
        .bind(user_id)
        .fetch_optional(pool)
        .await?
        .ok_or_else(|| AppError::NotFound("Warranty not found".to_string()))
}

pub async fn list_warranties(
    pool: &PgPool,
    user_id: &str,
    filters: WarrantyFilters,
) -> Result<PaginatedWarranties> {
    let per_page = filters.per_page.unwrap_or(20).min(100).max(1);
    let page = filters.page.unwrap_or(1).max(1);
    let offset = (page - 1) * per_page;

    let (warranties, total) = match (&filters.category, &filters.status) {
        (Some(category), Some(status)) => {
            let (start_date, end_date) = get_status_date_range(status);
            let warranties = sqlx::query_as::<_, Warranty>(
                r#"
                SELECT * FROM warranties 
                WHERE user_id = $1 AND category = $2 AND warranty_end_date >= $3 AND warranty_end_date <= $4
                ORDER BY warranty_end_date ASC
                LIMIT $5 OFFSET $6
                "#,
            )
            .bind(user_id)
            .bind(category)
            .bind(start_date)
            .bind(end_date)
            .bind(per_page)
            .bind(offset)
            .fetch_all(pool)
            .await?;

            let count: (i64,) = sqlx::query_as(
                "SELECT COUNT(*) FROM warranties WHERE user_id = $1 AND category = $2 AND warranty_end_date >= $3 AND warranty_end_date <= $4"
            )
            .bind(user_id)
            .bind(category)
            .bind(start_date)
            .bind(end_date)
            .fetch_one(pool)
            .await?;

            (warranties, count.0)
        }
        (Some(category), None) => {
            let warranties = sqlx::query_as::<_, Warranty>(
                r#"
                SELECT * FROM warranties 
                WHERE user_id = $1 AND category = $2
                ORDER BY warranty_end_date ASC
                LIMIT $3 OFFSET $4
                "#,
            )
            .bind(user_id)
            .bind(category)
            .bind(per_page)
            .bind(offset)
            .fetch_all(pool)
            .await?;

            let count: (i64,) = sqlx::query_as(
                "SELECT COUNT(*) FROM warranties WHERE user_id = $1 AND category = $2",
            )
            .bind(user_id)
            .bind(category)
            .fetch_one(pool)
            .await?;

            (warranties, count.0)
        }
        (None, Some(status)) => {
            let (start_date, end_date) = get_status_date_range(status);
            let warranties = sqlx::query_as::<_, Warranty>(
                r#"
                SELECT * FROM warranties 
                WHERE user_id = $1 AND warranty_end_date >= $2 AND warranty_end_date <= $3
                ORDER BY warranty_end_date ASC
                LIMIT $4 OFFSET $5
                "#,
            )
            .bind(user_id)
            .bind(start_date)
            .bind(end_date)
            .bind(per_page)
            .bind(offset)
            .fetch_all(pool)
            .await?;

            let count: (i64,) = sqlx::query_as(
                "SELECT COUNT(*) FROM warranties WHERE user_id = $1 AND warranty_end_date >= $2 AND warranty_end_date <= $3"
            )
            .bind(user_id)
            .bind(start_date)
            .bind(end_date)
            .fetch_one(pool)
            .await?;

            (warranties, count.0)
        }
        (None, None) => {
            let warranties = sqlx::query_as::<_, Warranty>(
                r#"
                SELECT * FROM warranties 
                WHERE user_id = $1
                ORDER BY warranty_end_date ASC
                LIMIT $2 OFFSET $3
                "#,
            )
            .bind(user_id)
            .bind(per_page)
            .bind(offset)
            .fetch_all(pool)
            .await?;

            let count: (i64,) =
                sqlx::query_as("SELECT COUNT(*) FROM warranties WHERE user_id = $1")
                    .bind(user_id)
                    .fetch_one(pool)
                    .await?;

            (warranties, count.0)
        }
    };

    Ok(PaginatedWarranties { warranties, total })
}

pub async fn update_warranty(
    pool: &PgPool,
    id: Uuid,
    user_id: &str,
    req: UpdateWarrantyRequest,
) -> Result<Warranty> {
    let existing = get_warranty_by_id(pool, id, user_id).await?;

    let product_name = req.product_name.unwrap_or(existing.product_name);
    let brand = req.brand.or(existing.brand);
    let category = req.category.unwrap_or(existing.category);
    let purchase_date = req.purchase_date.unwrap_or(existing.purchase_date);
    let warranty_months = req.warranty_months.unwrap_or(existing.warranty_months);
    let store = req.store.or(existing.store);
    let notes = req.notes.or(existing.notes);
    let warranty_end_date = purchase_date + Duration::days(warranty_months as i64 * 30);

    let warranty = sqlx::query_as::<_, Warranty>(
        r#"
        UPDATE warranties 
        SET product_name = $1, brand = $2, category = $3, purchase_date = $4, 
            warranty_end_date = $5, warranty_months = $6, store = $7, notes = $8, updated_at = NOW()
        WHERE id = $9 AND user_id = $10
        RETURNING *
        "#,
    )
    .bind(&product_name)
    .bind(&brand)
    .bind(&category)
    .bind(purchase_date)
    .bind(warranty_end_date)
    .bind(warranty_months)
    .bind(&store)
    .bind(&notes)
    .bind(id)
    .bind(user_id)
    .fetch_one(pool)
    .await?;

    Ok(warranty)
}

pub async fn delete_warranty(pool: &PgPool, id: Uuid, user_id: &str) -> Result<()> {
    let result = sqlx::query("DELETE FROM warranties WHERE id = $1 AND user_id = $2")
        .bind(id)
        .bind(user_id)
        .execute(pool)
        .await?;

    if result.rows_affected() == 0 {
        return Err(AppError::NotFound("Warranty not found".to_string()));
    }

    Ok(())
}

pub async fn get_expiring_warranties(
    pool: &PgPool,
    user_id: &str,
    days: i64,
) -> Result<Vec<Warranty>> {
    let now = Utc::now();
    let future_date = now + Duration::days(days);

    let warranties = sqlx::query_as::<_, Warranty>(
        r#"
        SELECT * FROM warranties 
        WHERE user_id = $1 AND warranty_end_date > $2 AND warranty_end_date <= $3
        ORDER BY warranty_end_date ASC
        "#,
    )
    .bind(user_id)
    .bind(now)
    .bind(future_date)
    .fetch_all(pool)
    .await?;

    Ok(warranties)
}

pub async fn update_receipt_url(
    pool: &PgPool,
    id: Uuid,
    user_id: &str,
    receipt_url: &str,
) -> Result<Warranty> {
    let warranty = sqlx::query_as::<_, Warranty>(
        r#"
        UPDATE warranties 
        SET receipt_url = $1, updated_at = NOW()
        WHERE id = $2 AND user_id = $3
        RETURNING *
        "#,
    )
    .bind(receipt_url)
    .bind(id)
    .bind(user_id)
    .fetch_optional(pool)
    .await?
    .ok_or_else(|| AppError::NotFound("Warranty not found".to_string()))?;

    Ok(warranty)
}

pub async fn get_warranty_stats(pool: &PgPool, user_id: &str) -> Result<WarrantyStats> {
    let now = Utc::now();
    let thirty_days = now + Duration::days(30);

    let total: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM warranties WHERE user_id = $1")
        .bind(user_id)
        .fetch_one(pool)
        .await?;

    let active: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM warranties WHERE user_id = $1 AND warranty_end_date > $2",
    )
    .bind(user_id)
    .bind(now)
    .fetch_one(pool)
    .await?;

    let expiring_soon: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM warranties WHERE user_id = $1 AND warranty_end_date > $2 AND warranty_end_date <= $3",
    )
    .bind(user_id)
    .bind(now)
    .bind(thirty_days)
    .fetch_one(pool)
    .await?;

    let expired: (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM warranties WHERE user_id = $1 AND warranty_end_date <= $2",
    )
    .bind(user_id)
    .bind(now)
    .fetch_one(pool)
    .await?;

    Ok(WarrantyStats {
        total: total.0,
        active: active.0,
        expiring_soon: expiring_soon.0,
        expired: expired.0,
    })
}

#[derive(Debug, serde::Serialize, ToSchema)]
pub struct WarrantyStats {
    pub total: i64,
    pub active: i64,
    pub expiring_soon: i64,
    pub expired: i64,
}

fn get_status_date_range(status: &str) -> (chrono::DateTime<Utc>, chrono::DateTime<Utc>) {
    let now = Utc::now();
    match status {
        "expiring_soon" => (now, now + Duration::days(30)),
        "expired" => (chrono::DateTime::<Utc>::MIN_UTC, now),
        _ => (now, chrono::DateTime::<Utc>::MAX_UTC),
    }
}
