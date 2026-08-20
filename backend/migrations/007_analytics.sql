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

CREATE OR REPLACE VIEW daily_collection_summary AS
SELECT
    date_trunc('day', cr.collected_at)                                   AS day,
    count(*) FILTER (WHERE cr.outcome = 'collected')                     AS collected_count,
    count(*) FILTER (WHERE cr.outcome = 'failed')                        AS failed_count,
    coalesce(sum(wp.current_level_pct) FILTER (WHERE cr.outcome = 'collected'), 0) AS estimated_kg
FROM collection_records cr
JOIN waste_points wp ON wp.id = cr.waste_point_id
GROUP BY date_trunc('day', cr.collected_at);
