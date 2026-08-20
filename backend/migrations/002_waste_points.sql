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
