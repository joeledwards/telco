CREATE TABLE IF NOT EXISTS cdr_files (
  id SERIAL PRIMARY KEY,
  file_name TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_lines INTEGER NOT NULL,
  parsed_records INTEGER NOT NULL DEFAULT 0,
  skipped_lines INTEGER NOT NULL DEFAULT 0,
  invalid_records INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS cdr_records (
  id SERIAL PRIMARY KEY,
  file_id INTEGER NOT NULL REFERENCES cdr_files(id) ON DELETE CASCADE,
  line_number INTEGER NOT NULL,
  raw_line TEXT NOT NULL,
  cdr_id INTEGER NOT NULL,
  bytes_used INTEGER NOT NULL,
  mnc INTEGER,
  dmcc TEXT,
  cell_id INTEGER,
  ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cdr_records_file_id ON cdr_records(file_id);
CREATE INDEX IF NOT EXISTS idx_cdr_records_cdr_id ON cdr_records(cdr_id);
CREATE INDEX IF NOT EXISTS idx_cdr_records_ip ON cdr_records(ip);
