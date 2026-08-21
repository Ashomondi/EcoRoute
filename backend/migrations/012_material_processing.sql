CREATE TABLE IF NOT EXISTS material_processing (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_type  TEXT NOT NULL CHECK (source_type IN ('collection', 'dropoff')),
    source_id    UUID NOT NULL,
    material     TEXT NOT NULL REFERENCES waste_types (slug),
    received_kg  DOUBLE PRECISION NOT NULL CHECK (received_kg > 0),
    sorted_kg    DOUBLE PRECISION NOT NULL DEFAULT 0,
    recycled_kg  DOUBLE PRECISION NOT NULL DEFAULT 0,
    status       TEXT NOT NULL DEFAULT 'received'
                 CHECK (status IN ('received', 'sorted', 'processing', 'recycled', 'sold')),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_material_processing_status ON material_processing (status);
CREATE INDEX IF NOT EXISTS idx_material_processing_material ON material_processing (material);

CREATE OR REPLACE VIEW material_value_summary AS
SELECT
    mp.material,
    wt.name                                                       AS material_name,
    count(*)::int                                                 AS batches,
    coalesce(sum(mp.received_kg), 0)                              AS received_kg,
    coalesce(sum(mp.sorted_kg), 0)                                AS sorted_kg,
    coalesce(sum(mp.recycled_kg), 0)                              AS recycled_kg,
    coalesce(sum(mp.recycled_kg * wt.value_per_kg), 0)            AS material_value,
    coalesce(sum(mp.recycled_kg * wt.co2_per_kg), 0)              AS co2_saved_kg,
    coalesce(sum(mp.recycled_kg * wt.energy_kwh_per_kg), 0)       AS energy_saved_kwh
FROM material_processing mp
JOIN waste_types wt ON wt.slug = mp.material
GROUP BY mp.material, wt.name, wt.sort_order
ORDER BY wt.sort_order;
