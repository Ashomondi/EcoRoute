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
