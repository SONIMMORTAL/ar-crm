-- 006_enhanced_analytics.sql
-- Enhanced analytics tracking for campaign performance

-- Add unique tracking columns to email_campaigns
ALTER TABLE email_campaigns 
ADD COLUMN IF NOT EXISTS unique_opens INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS unique_clicks INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_complaints INTEGER DEFAULT 0;

-- Comments for documentation
COMMENT ON COLUMN email_campaigns.unique_opens IS 'Number of unique contacts who opened the email';
COMMENT ON COLUMN email_campaigns.unique_clicks IS 'Number of unique contacts who clicked a link';
COMMENT ON COLUMN email_campaigns.total_complaints IS 'Total spam complaints received';

-- Click tracking table for link-level analytics
CREATE TABLE IF NOT EXISTS email_link_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES email_campaigns(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  link_url TEXT NOT NULL,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_link_clicks_campaign ON email_link_clicks(campaign_id);
CREATE INDEX IF NOT EXISTS idx_link_clicks_contact ON email_link_clicks(contact_id);
CREATE INDEX IF NOT EXISTS idx_link_clicks_url ON email_link_clicks(campaign_id, link_url);

-- Enable RLS
ALTER TABLE email_link_clicks ENABLE ROW LEVEL SECURITY;

-- Analytics helper view for campaign stats with calculated rates
CREATE OR REPLACE VIEW campaign_stats AS
SELECT 
  c.id,
  c.name,
  c.subject,
  c.status,
  c.sent_at,
  c.created_at,
  c.total_sent,
  c.total_opens,
  c.unique_opens,
  c.total_clicks,
  c.unique_clicks,
  c.total_bounces,
  c.total_complaints,
  -- Calculated rates (as percentages)
  CASE WHEN c.total_sent > 0 
    THEN ROUND(c.unique_opens::NUMERIC / c.total_sent * 100, 1) 
    ELSE 0 
  END as open_rate,
  CASE WHEN c.unique_opens > 0 
    THEN ROUND(c.unique_clicks::NUMERIC / c.unique_opens * 100, 1) 
    ELSE 0 
  END as click_to_open_rate,
  CASE WHEN c.total_sent > 0 
    THEN ROUND(c.total_bounces::NUMERIC / c.total_sent * 100, 1) 
    ELSE 0 
  END as bounce_rate,
  -- Delivery rate (sent - bounces)
  CASE WHEN c.total_sent > 0 
    THEN ROUND((c.total_sent - COALESCE(c.total_bounces, 0))::NUMERIC / c.total_sent * 100, 1) 
    ELSE 0 
  END as delivery_rate
FROM email_campaigns c
WHERE c.status = 'sent';

COMMENT ON VIEW campaign_stats IS 'Aggregated campaign statistics with calculated engagement rates';
