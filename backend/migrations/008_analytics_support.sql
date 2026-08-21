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
