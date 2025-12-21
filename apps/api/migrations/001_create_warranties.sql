CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE warranty_category AS ENUM (
    'electronics',
    'appliances', 
    'furniture',
    'clothing',
    'automotive',
    'sports',
    'other'
);

CREATE TYPE warranty_status AS ENUM (
    'active',
    'expiring_soon',
    'expired'
);

CREATE TABLE warranties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    brand VARCHAR(255),
    category warranty_category NOT NULL DEFAULT 'other',
    purchase_date TIMESTAMPTZ NOT NULL,
    warranty_end_date TIMESTAMPTZ NOT NULL,
    warranty_months INTEGER NOT NULL DEFAULT 24,
    store VARCHAR(255),
    receipt_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_warranties_user_id ON warranties(user_id);
CREATE INDEX idx_warranties_warranty_end_date ON warranties(warranty_end_date);
CREATE INDEX idx_warranties_category ON warranties(category);
