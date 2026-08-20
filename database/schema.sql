-- EcoRoute database schema --
-- Generated from backend/migrations/001-009 (applied automatically by the server on startup).

-- >>> migrations/001_users.sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL CHECK (role IN ('admin', 'driver', 'community')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- >>> migrations/002_waste_points.sql
CREATE TABLE IF NOT EXISTS waste_points (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name              TEXT NOT NULL,
    latitude          DOUBLE PRECISION NOT NULL,
    longitude         DOUBLE PRECISION NOT NULL,
    current_level_pct INTEGER NOT NULL DEFAULT 0 CHECK (current_level_pct BETWEEN 0 AND 100),
    status            TEXT NOT NULL DEFAULT 'ok' CHECK (status IN ('ok', 'warning', 'critical')),
    last_collected_at TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_waste_points_status ON waste_points (status);

-- >>> migrations/003_trucks.sql
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

-- >>> migrations/004_routes.sql
CREATE TABLE IF NOT EXISTS routes (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    truck_id          UUID NOT NULL REFERENCES trucks (id) ON DELETE CASCADE,
    ordered_point_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    distance_km       DOUBLE PRECISION NOT NULL DEFAULT 0,
    estimated_fuel_l  DOUBLE PRECISION NOT NULL DEFAULT 0,
    estimated_minutes INTEGER NOT NULL DEFAULT 0,
    status            TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed')),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_routes_truck_id ON routes (truck_id);

-- >>> migrations/005_collection_records.sql
CREATE TABLE IF NOT EXISTS collection_records (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    route_id       UUID NOT NULL REFERENCES routes (id) ON DELETE CASCADE,
    waste_point_id UUID NOT NULL REFERENCES waste_points (id) ON DELETE CASCADE,
    truck_id       UUID NOT NULL REFERENCES trucks (id) ON DELETE CASCADE,
    outcome        TEXT NOT NULL CHECK (outcome IN ('collected', 'failed')),
    collected_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_collection_records_route_id ON collection_records (route_id);
CREATE INDEX IF NOT EXISTS idx_collection_records_point_id ON collection_records (waste_point_id);
CREATE INDEX IF NOT EXISTS idx_collection_records_truck_id ON collection_records (truck_id);

-- >>> migrations/006_waste_reports.sql
CREATE TABLE IF NOT EXISTS waste_reports (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    waste_point_id UUID REFERENCES waste_points (id) ON DELETE SET NULL,
    reported_by    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    problem_type   TEXT NOT NULL CHECK (problem_type IN ('overflow', 'illegal_dumping', 'missed_collection', 'other')),
    description    TEXT,
    photo_url      TEXT,
    priority       TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    status         TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_waste_reports_status ON waste_reports (status);
CREATE INDEX IF NOT EXISTS idx_waste_reports_priority ON waste_reports (priority);

-- >>> migrations/007_analytics.sql
CREATE OR REPLACE VIEW route_summary AS
SELECT
    r.id              AS route_id,
    r.truck_id,
    r.distance_km,
    r.estimated_fuel_l,
    r.estimated_minutes,
    r.status,
    r.created_at
FROM routes r;

-- >>> migrations/008_analytics_support.sql
ALTER TABLE collection_records ADD COLUMN IF NOT EXISTS estimated_kg DOUBLE PRECISION NOT NULL DEFAULT 0;

ALTER TABLE routes ADD COLUMN IF NOT EXISTS baseline_distance_km DOUBLE PRECISION NOT NULL DEFAULT 0;

UPDATE routes SET baseline_distance_km = distance_km WHERE baseline_distance_km = 0;

DROP VIEW IF EXISTS daily_collection_summary;

CREATE VIEW daily_collection_summary AS
SELECT
    date_trunc('day', cr.collected_at)                                                           AS day,
    count(*) FILTER (WHERE cr.outcome = 'collected')                                             AS collected_count,
    count(*) FILTER (WHERE cr.outcome = 'failed')                                                AS failed_count,
    coalesce(sum(cr.estimated_kg) FILTER (WHERE cr.outcome = 'collected'), 0)                    AS collected_kg
FROM collection_records cr
GROUP BY date_trunc('day', cr.collected_at);

-- >>> migrations/009_add_users_name.sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '';

