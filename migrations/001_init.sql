-- Snipr: URL shortener database schema
-- Run this migration against your PostgreSQL database before starting the server.

CREATE TABLE IF NOT EXISTS links (
  id          BIGSERIAL       PRIMARY KEY,
  short_code  VARCHAR(32)     UNIQUE NOT NULL,
  original_url TEXT           NOT NULL,
  is_custom   BOOLEAN         DEFAULT false,
  clicks      BIGINT          DEFAULT 0,
  created_at  TIMESTAMPTZ     DEFAULT now()
);

-- Index for fast lookups by short_code (the UNIQUE constraint already creates one,
-- but this makes the intent explicit and allows future partial-index tweaks).
CREATE INDEX IF NOT EXISTS idx_links_short_code ON links (short_code);
