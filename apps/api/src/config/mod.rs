use std::env;

#[derive(Clone, Debug)]
pub struct Config {
    pub database_url: String,
    pub jwt_secret: String,
    pub auth_service_url: String,
    pub port: u16,
    pub upload_dir: String,
    pub cors_origins: Vec<String>,
    pub environment: Environment,
}

#[derive(Clone, Debug, PartialEq)]
pub enum Environment {
    Development,
    Production,
}

impl Config {
    pub fn from_env() -> Self {
        dotenvy::dotenv().ok();

        let environment = match env::var("ENVIRONMENT").as_deref() {
            Ok("production") => Environment::Production,
            _ => Environment::Development,
        };

        let jwt_secret = match environment {
            Environment::Production => env::var("JWT_SECRET")
                .expect("JWT_SECRET must be set in production"),
            Environment::Development => env::var("JWT_SECRET")
                .unwrap_or_else(|_| "garry-dev-secret-change-in-production".to_string()),
        };

        let database_url = match environment {
            Environment::Production => env::var("DATABASE_URL")
                .expect("DATABASE_URL must be set in production"),
            Environment::Development => env::var("DATABASE_URL")
                .unwrap_or_else(|_| "postgres://garry:garry@localhost:5432/garry".to_string()),
        };

        let cors_origins = env::var("CORS_ORIGINS")
            .map(|s| s.split(',').map(|s| s.trim().to_string()).collect())
            .unwrap_or_else(|_| vec!["http://localhost:3000".to_string()]);

        Self {
            database_url,
            jwt_secret,
            auth_service_url: env::var("AUTH_SERVICE_URL")
                .unwrap_or_else(|_| "http://localhost:8081".to_string()),
            port: env::var("PORT")
                .unwrap_or_else(|_| "8080".to_string())
                .parse()
                .unwrap_or(8080),
            upload_dir: env::var("UPLOAD_DIR")
                .unwrap_or_else(|_| "./uploads".to_string()),
            cors_origins,
            environment,
        }
    }

    pub fn is_production(&self) -> bool {
        self.environment == Environment::Production
    }
}
