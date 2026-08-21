-- Smart bins: each bin collects a designated waste stream and hosts an AI
-- reader. When the bin fills up, an AI read reports the category composition
-- and estimated weight (kg) of the waste inside. Readings resolve into
-- material batches when the bin is collected, feeding the recycling pipeline
-- and the EcoMarket product trace.

ALTER TABLE waste_points
    ADD COLUMN IF NOT EXISTS category           TEXT REFERENCES waste_types (slug),
    ADD COLUMN IF NOT EXISTS max_capacity_kg    DOUBLE PRECISION NOT NULL DEFAULT 200,
    ADD COLUMN IF NOT EXISTS current_estimated_kg DOUBLE PRECISION NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS smart_bin_readings (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    waste_point_id   UUID NOT NULL REFERENCES waste_points (id) ON DELETE CASCADE,
    total_kg         DOUBLE PRECISION NOT NULL CHECK (total_kg >= 0),
    composition      JSONB NOT NULL DEFAULT '{}'::jsonb,
    primary_category TEXT,
    confidence       DOUBLE PRECISION NOT NULL DEFAULT 0 CHECK (confidence BETWEEN 0 AND 1),
    trigger_type     TEXT NOT NULL DEFAULT 'manual' CHECK (trigger_type IN ('manual', 'full', 'scheduled')),
    status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'collected', 'cleared')),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_smart_bin_readings_bin ON smart_bin_readings (waste_point_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_smart_bin_readings_status ON smart_bin_readings (status);

CREATE OR REPLACE VIEW smart_bin_summary AS
SELECT
    wp.category,
    count(DISTINCT wp.id)                                                          AS bins,
    coalesce(sum(sbr.total_kg), 0)                                                 AS total_kg,
    count(sbr.id)::int                                                             AS readings
FROM waste_points wp
LEFT JOIN smart_bin_readings sbr
       ON sbr.waste_point_id = wp.id
      AND sbr.status = 'pending'
WHERE wp.category IS NOT NULL
GROUP BY wp.category
ORDER BY total_kg DESC;
