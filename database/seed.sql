-- EcoRoute demo seed data.
-- Equivalent to the backend's `go run ./cmd/server -migrate -seed` flag.
-- The bcrypt hashes below match the demo passwords: admin123 / driver123 / community123.

INSERT INTO users (name, email, password_hash, role) VALUES
  ('Admin',    'admin@ecoroute.dev',    '$2a$10$U4tTd.JWIgMzEjBLwaARFeGLxfihfYe5uTKtt3GyZo1m5SJ56BFSO', 'admin'),
  ('Driver',   'driver@ecoroute.dev',   '$2a$10$T5uYLnJKKsL7rf7H42d/DerjKFHnN23f/3JjoPVzDKEQ4tSGVxC3i', 'driver'),
  ('Resident', 'community@ecoroute.dev','$2a$10$zKz9ca5GSBIFe/FnrBAp/ui8lfzNXA6A5Vdpx/T80GF/fBPVe42YO', 'community')
ON CONFLICT (email) DO NOTHING;

INSERT INTO waste_points (name, latitude, longitude, current_level_pct, status) VALUES
  ('Kondele',  -0.0900, 34.8000, 92, 'critical'),
  ('Market A', -0.0950, 34.7300, 76, 'warning'),
  ('Manyatta', -0.0950, 34.7900, 43, 'ok'),
  ('Nyalenda', -0.1100, 34.7200, 88, 'critical')
ON CONFLICT (id) DO NOTHING;

INSERT INTO trucks (registration_number, capacity_kg, driver_id, current_lat, current_lng, status)
SELECT 'KCA 123A', 5000, u.id, -0.1022, 34.7617, 'idle'
FROM users u WHERE u.email = 'driver@ecoroute.dev'
ON CONFLICT (registration_number) DO NOTHING;

INSERT INTO waste_reports (waste_point_id, reported_by, problem_type, description, priority, status)
SELECT wp.id, u.id, 'overflow', 'Kondele bin overflowing, not collected for 3 days', 'high', 'open'
FROM waste_points wp, users u
WHERE wp.name = 'Kondele' AND u.email = 'community@ecoroute.dev'
  AND NOT EXISTS (
    SELECT 1 FROM waste_reports w
    WHERE w.problem_type = 'overflow' AND w.description = 'Kondele bin overflowing, not collected for 3 days'
  );

INSERT INTO waste_reports (waste_point_id, reported_by, problem_type, description, priority, status)
SELECT wp.id, u.id, 'missed_collection', 'Missed collection all week', 'high', 'open'
FROM waste_points wp, users u
WHERE wp.name = 'Market A' AND u.email = 'community@ecoroute.dev'
  AND NOT EXISTS (
    SELECT 1 FROM waste_reports w
    WHERE w.problem_type = 'missed_collection' AND w.description = 'Missed collection all week'
  );
