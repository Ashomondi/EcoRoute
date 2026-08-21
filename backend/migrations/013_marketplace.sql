-- EcoMarket: the circular-economy marketplace. Products are made from
-- materials recovered through EcoRoute's own recycling pipeline, so every
-- product can be traced back to a real material batch.

CREATE TABLE IF NOT EXISTS seller_profiles (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
    name          TEXT NOT NULL,
    description   TEXT NOT NULL DEFAULT '',
    logo_url      TEXT,
    contact_phone TEXT NOT NULL DEFAULT '',
    location      TEXT NOT NULL DEFAULT '',
    verified      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS products (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id          UUID NOT NULL REFERENCES seller_profiles (id) ON DELETE CASCADE,
    name               TEXT NOT NULL,
    slug               TEXT NOT NULL UNIQUE,
    description        TEXT NOT NULL DEFAULT '',
    category           TEXT NOT NULL CHECK (category IN ('plastic', 'paper', 'glass', 'organic', 'wood', 'textile', 'metal', 'other')),
    price              NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    stock              INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    image_url          TEXT,
    images             JSONB NOT NULL DEFAULT '[]'::jsonb,
    material_batch_id  UUID REFERENCES material_processing (id) ON DELETE SET NULL,
    recycled_percent   INTEGER NOT NULL DEFAULT 0 CHECK (recycled_percent BETWEEN 0 AND 100),
    waste_recovered_kg NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (waste_recovered_kg >= 0),
    unit               TEXT NOT NULL DEFAULT 'unit',
    is_active          BOOLEAN NOT NULL DEFAULT TRUE,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products (is_active);
CREATE INDEX IF NOT EXISTS idx_products_seller ON products (seller_id);
CREATE INDEX IF NOT EXISTS idx_products_batch ON products (material_batch_id);

CREATE TABLE IF NOT EXISTS product_reviews (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment    TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (product_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON product_reviews (product_id);

CREATE TABLE IF NOT EXISTS cart_items (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    quantity   INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items (user_id);

CREATE TABLE IF NOT EXISTS orders (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    order_number     TEXT NOT NULL UNIQUE,
    status           TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
    subtotal         NUMERIC(12, 2) NOT NULL DEFAULT 0,
    delivery_fee     NUMERIC(12, 2) NOT NULL DEFAULT 0,
    total            NUMERIC(12, 2) NOT NULL DEFAULT 0,
    payment_method   TEXT NOT NULL DEFAULT 'mpesa',
    delivery_address TEXT NOT NULL DEFAULT '',
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);

CREATE TABLE IF NOT EXISTS order_items (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id            UUID NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
    product_id          UUID NOT NULL REFERENCES products (id) ON DELETE RESTRICT,
    seller_id           UUID NOT NULL REFERENCES seller_profiles (id) ON DELETE RESTRICT,
    product_name        TEXT NOT NULL,
    unit_price          NUMERIC(12, 2) NOT NULL,
    quantity            INTEGER NOT NULL CHECK (quantity > 0),
    line_total          NUMERIC(12, 2) NOT NULL,
    ecoroute_fee        NUMERIC(12, 2) NOT NULL DEFAULT 0,
    seller_share        NUMERIC(12, 2) NOT NULL DEFAULT 0,
    waste_recovered_kg  NUMERIC(10, 2) NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_seller ON order_items (seller_id);

CREATE TABLE IF NOT EXISTS payments (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id  UUID NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
    amount    NUMERIC(12, 2) NOT NULL,
    method    TEXT NOT NULL DEFAULT 'mpesa',
    status    TEXT NOT NULL DEFAULT 'paid' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
    reference TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_order ON payments (order_id);

CREATE OR REPLACE VIEW marketplace_admin_summary AS
SELECT
    (SELECT count(*) FROM seller_profiles)                                  AS sellers,
    (SELECT count(*) FROM products WHERE is_active)                         AS active_products,
    (SELECT count(*) FROM products)                                         AS total_products,
    (SELECT count(*) FROM orders)                                           AS orders,
    (SELECT coalesce(sum(total), 0) FROM orders WHERE status != 'cancelled') AS gross_sales,
    (SELECT count(*) FROM orders WHERE status IN ('pending', 'paid', 'shipped')) AS open_orders,
    (SELECT coalesce(sum(waste_recovered_kg), 0) FROM products)             AS waste_recovered_kg,
    (SELECT coalesce(sum(recycled_kg), 0) FROM material_processing)         AS material_recycled_kg;
