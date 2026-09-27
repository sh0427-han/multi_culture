CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL,
  grade TEXT NOT NULL,
  class_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  student_number TEXT NOT NULL,
  location_id TEXT NOT NULL,
  location_name TEXT NOT NULL,
  file_id TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL,
  submitted_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_submissions_class
ON submissions(class_id, submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_submissions_location
ON submissions(class_id, location_id, submitted_at DESC);
