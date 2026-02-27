-- Email Sequence Engine — Migration
-- Run in Supabase SQL Editor
-- Prereq: is_admin() function must already exist (from admin-migration.sql)

-- =============================================================
-- 1. Tables
-- =============================================================

-- Sequences (e.g., "Welcome", "Onboarding", "Win-Back")
CREATE TABLE email_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  trigger_event text NOT NULL,
  is_active boolean DEFAULT true,
  cancel_on_event text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Steps within a sequence (individual emails)
CREATE TABLE email_sequence_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id uuid REFERENCES email_sequences(id) ON DELETE CASCADE,
  step_number integer NOT NULL,
  subject text NOT NULL,
  body_html text NOT NULL,
  delay_hours integer NOT NULL DEFAULT 0,
  send_condition text,
  created_at timestamptz DEFAULT now()
);

-- Individual email sends (the queue)
CREATE TABLE email_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  sequence_id uuid REFERENCES email_sequences(id),
  step_id uuid REFERENCES email_sequence_steps(id),
  resend_message_id text,
  status text DEFAULT 'queued',
  scheduled_at timestamptz NOT NULL,
  sent_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  cancelled boolean DEFAULT false,
  cancel_reason text,
  created_at timestamptz DEFAULT now()
);

-- Unsubscribe list (checked before every send)
CREATE TABLE email_unsubscribes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  unsubscribed_at timestamptz DEFAULT now()
);

-- Indexes for the queue processor
CREATE INDEX idx_email_sends_pending ON email_sends (scheduled_at)
  WHERE status = 'queued' AND cancelled = false;
CREATE INDEX idx_email_sends_user ON email_sends (user_id);
CREATE INDEX idx_email_sends_sequence ON email_sends (sequence_id);
CREATE INDEX idx_email_unsubscribes_email ON email_unsubscribes (email);

-- =============================================================
-- 2. Row Level Security
-- =============================================================

ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_unsubscribes ENABLE ROW LEVEL SECURITY;

-- Admin full access to sequences, steps, sends
CREATE POLICY "Admins manage sequences" ON email_sequences
  FOR ALL USING (is_admin());

CREATE POLICY "Admins manage steps" ON email_sequence_steps
  FOR ALL USING (is_admin());

CREATE POLICY "Admins manage sends" ON email_sends
  FOR ALL USING (is_admin());

-- Users can manage their own unsubscribes
CREATE POLICY "Users manage own unsubscribes" ON email_unsubscribes
  FOR ALL USING (auth.uid() = user_id);

-- Admin can also view unsubscribes
CREATE POLICY "Admins view unsubscribes" ON email_unsubscribes
  FOR SELECT USING (is_admin());

-- =============================================================
-- 3. Admin RPC Functions (metrics)
-- =============================================================

-- Per-sequence aggregate metrics
CREATE OR REPLACE FUNCTION admin_email_sequence_metrics()
RETURNS TABLE (
  sequence_id uuid,
  sequence_name text,
  step_count bigint,
  total_sends bigint,
  queued bigint,
  sent bigint,
  delivered bigint,
  opened bigint,
  clicked bigint,
  bounced bigint,
  failed bigint,
  cancelled bigint
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    es.id AS sequence_id,
    es.name AS sequence_name,
    (SELECT COUNT(*) FROM email_sequence_steps ss WHERE ss.sequence_id = es.id) AS step_count,
    COUNT(em.id) AS total_sends,
    COUNT(em.id) FILTER (WHERE em.status = 'queued' AND em.cancelled = false) AS queued,
    COUNT(em.id) FILTER (WHERE em.status = 'sent') AS sent,
    COUNT(em.id) FILTER (WHERE em.status = 'delivered') AS delivered,
    COUNT(em.id) FILTER (WHERE em.status = 'opened') AS opened,
    COUNT(em.id) FILTER (WHERE em.status = 'clicked') AS clicked,
    COUNT(em.id) FILTER (WHERE em.status = 'bounced') AS bounced,
    COUNT(em.id) FILTER (WHERE em.status = 'failed') AS failed,
    COUNT(em.id) FILTER (WHERE em.cancelled = true) AS cancelled
  FROM email_sequences es
  LEFT JOIN email_sends em ON em.sequence_id = es.id
  GROUP BY es.id, es.name
  ORDER BY es.name;
END;
$$;

-- Per-step metrics for one sequence
CREATE OR REPLACE FUNCTION admin_email_step_metrics(p_sequence_id uuid)
RETURNS TABLE (
  step_id uuid,
  step_number integer,
  subject text,
  total_sends bigint,
  sent bigint,
  delivered bigint,
  opened bigint,
  clicked bigint,
  bounced bigint
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    s.id AS step_id,
    s.step_number,
    s.subject,
    COUNT(em.id) AS total_sends,
    COUNT(em.id) FILTER (WHERE em.status = 'sent') AS sent,
    COUNT(em.id) FILTER (WHERE em.status = 'delivered') AS delivered,
    COUNT(em.id) FILTER (WHERE em.status = 'opened') AS opened,
    COUNT(em.id) FILTER (WHERE em.status = 'clicked') AS clicked,
    COUNT(em.id) FILTER (WHERE em.status = 'bounced') AS bounced
  FROM email_sequence_steps s
  LEFT JOIN email_sends em ON em.step_id = s.id
  WHERE s.sequence_id = p_sequence_id
  GROUP BY s.id, s.step_number, s.subject
  ORDER BY s.step_number;
END;
$$;
