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
