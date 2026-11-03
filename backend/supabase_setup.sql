-- Run this SQL in your Supabase project's SQL Editor
-- Dashboard → SQL Editor → New Query → Paste & Run

CREATE TABLE IF NOT EXISTS user_usage (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT UNIQUE NOT NULL,      -- Supabase Auth user ID
  monthly_count   INTEGER NOT NULL DEFAULT 0,
  is_pro          BOOLEAN NOT NULL DEFAULT false,
  last_reset_at   TIMESTAMPTZ DEFAULT now(),
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Only the server (service role) can read/write this table.
-- Disable public access for security:
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;

-- No public policies → only service_role key (used in backend) has access.

