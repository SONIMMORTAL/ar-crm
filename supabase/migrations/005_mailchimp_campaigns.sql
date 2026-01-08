-- 005_mailchimp_campaigns.sql

-- Add mailchimp_id to email_campaigns to link CRM campaigns with Mailchimp campaigns
alter table email_campaigns 
add column if not exists mailchimp_id text unique;

comment on column email_campaigns.mailchimp_id is 'The unique ID of the campaign in Mailchimp.';
