-- Create email_events table if it doesn't exist
CREATE TABLE IF NOT EXISTS email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained')),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  event_data JSONB DEFAULT '{}'::jsonb
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_events_campaign ON email_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_events_contact ON email_events(contact_id);
CREATE INDEX IF NOT EXISTS idx_email_events_type ON email_events(event_type);

-- RLS
ALTER TABLE email_events ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users (admin)
CREATE POLICY "Allow read access for admins" ON email_events
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow insert by service role (API)
CREATE POLICY "Allow insert by service role" ON email_events
  FOR INSERT WITH CHECK (true);
