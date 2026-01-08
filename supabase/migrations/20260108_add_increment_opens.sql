-- Create function to increment campaign opens
CREATE OR REPLACE FUNCTION increment_campaign_opens(cid UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE email_campaigns
  SET total_opens = COALESCE(total_opens, 0) + 1
  WHERE id = cid;
END;
$$;
