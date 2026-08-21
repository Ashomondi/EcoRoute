ALTER TABLE waste_types ADD COLUMN IF NOT EXISTS value_per_kg DOUBLE PRECISION NOT NULL DEFAULT 0;

UPDATE waste_types SET value_per_kg = CASE slug
  WHEN 'metal'     THEN 1.80
  WHEN 'plastic'   THEN 0.40
  WHEN 'paper'     THEN 0.12
  WHEN 'glass'     THEN 0.05
  WHEN 'organic'   THEN 0.10
  WHEN 'e_waste'   THEN 3.50
  WHEN 'textile'   THEN 0.60
  ELSE 0
END
WHERE value_per_kg = 0;

CREATE TABLE IF NOT EXISTS collection_requests (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id   UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    requester_type TEXT NOT NULL CHECK (requester_type IN ('household', 'business')),
    waste_type     TEXT NOT NULL REFERENCES waste_types (slug),
    estimated_kg   DOUBLE PRECISION NOT NULL CHECK (estimated_kg > 0),
    latitude       DOUBLE PRECISION NOT NULL,
    longitude      DOUBLE PRECISION NOT NULL,
    address        TEXT NOT NULL DEFAULT '',
    notes          TEXT,
    status         TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'scheduled', 'collected', 'cancelled')),
    priority_score DOUBLE PRECISION NOT NULL DEFAULT 0,
    route_id       UUID REFERENCES routes (id) ON DELETE SET NULL,
    collected_at   TIMESTAMPTZ,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_collection_requests_status ON collection_requests (status);
CREATE INDEX IF NOT EXISTS idx_collection_requests_priority ON collection_requests (priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_collection_requests_requester ON collection_requests (requester_id, created_at DESC);
