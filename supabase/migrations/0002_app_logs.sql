-- App event log for diagnosing auth/UX issues
CREATE TABLE IF NOT EXISTS app_logs (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  timestamptz DEFAULT now(),
  user_id     uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  event       text        NOT NULL,
  level       text        NOT NULL DEFAULT 'info' CHECK (level IN ('info', 'warn', 'error')),
  data        jsonb
);

CREATE INDEX IF NOT EXISTS app_logs_created_at_idx ON app_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS app_logs_user_id_idx    ON app_logs (user_id);
CREATE INDEX IF NOT EXISTS app_logs_event_idx      ON app_logs (event);

ALTER TABLE app_logs ENABLE ROW LEVEL SECURITY;

-- Only the service-role key can read/write (server-side only)
CREATE POLICY "service_role_all" ON app_logs
  TO service_role USING (true) WITH CHECK (true);
