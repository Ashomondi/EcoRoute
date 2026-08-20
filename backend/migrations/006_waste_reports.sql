CREATE TABLE IF NOT EXISTS waste_reports (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    waste_point_id UUID REFERENCES waste_points (id) ON DELETE SET NULL,
    reported_by    UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    problem_type   TEXT NOT NULL CHECK (problem_type IN ('overflow', 'illegal_dumping', 'missed_collection', 'other')),
    description    TEXT,
    photo_url      TEXT,
    priority       TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    status         TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_waste_reports_status ON waste_reports (status);
CREATE INDEX IF NOT EXISTS idx_waste_reports_priority ON waste_reports (priority);
