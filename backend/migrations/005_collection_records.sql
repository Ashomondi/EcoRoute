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
