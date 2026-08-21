CREATE TABLE IF NOT EXISTS trucks (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_number TEXT NOT NULL UNIQUE,
    capacity_kg         DOUBLE PRECISION NOT NULL,
    driver_id           UUID REFERENCES users (id) ON DELETE SET NULL,
    current_lat         DOUBLE PRECISION NOT NULL DEFAULT 0,
    current_lng         DOUBLE PRECISION NOT NULL DEFAULT 0,
    status              TEXT NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'en_route', 'full', 'maintenance')),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trucks_driver_id ON trucks (driver_id);
