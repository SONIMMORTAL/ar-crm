-- 001_initial_schema.sql

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- CONTACTS TABLE
create table contacts (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  first_name text,
  last_name text,
  phone text,
  tags text[] default '{}',
  metadata jsonb default '{}'::jsonb,
  nationbuilder_id text,
  mailchimp_id text,
  unsubscribed boolean default false,
  engagement_score integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table contacts is 'Core registry of all people in the CRM.';

-- EVENTS TABLE
create table events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  event_date timestamptz not null,
  location text,
  capacity integer,
  registration_open boolean default true,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table events is 'Calendar events that contacts can register for.';

-- ATTENDANCE TABLE
create table attendance (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references contacts(id),
  event_id uuid not null references events(id),
  status text not null check (status in ('registered','checked_in','cancelled')),
  qr_code_data text unique,
  registered_at timestamptz not null default now(),
  checked_in_at timestamptz,
  checked_in_by text,
  metadata jsonb default '{}'::jsonb,
  unique (contact_id, event_id)
);

comment on table attendance is 'Tracks registration and check-in status for contacts at events.';

-- EMAIL CAMPAIGNS TABLE
create table email_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subject text not null,
  body_html text not null,
  body_text text,
  from_email text,
  from_name text,
  status text not null check (status in ('draft','testing','sent')) default 'draft',
  deliverability_test_results jsonb,
  sent_at timestamptz,
  total_sent integer default 0,
  total_opens integer default 0,
  total_clicks integer default 0,
  total_bounces integer default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table email_campaigns is 'Outbound email blasts and stats.';

-- EMAIL EVENTS TABLE
create table email_events (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references email_campaigns(id),
  contact_id uuid not null references contacts(id),
  event_type text not null check (event_type in ('sent','delivered','opened','clicked','bounced','complained')),
  event_data jsonb default '{}'::jsonb,
  timestamp timestamptz not null default now()
);

comment on table email_events is 'Granular tracking logs for email interactions.';

-- SYNC LOGS TABLE
create table sync_logs (
  id uuid primary key default gen_random_uuid(),
  service text not null, -- 'nationbuilder' | 'mailchimp' | 'resend' | etc
  operation text not null, -- 'push' | 'pull' | 'webhook'
  status text not null, -- 'success' | 'error'
  records_affected integer default 0,
  error_message text,
  created_at timestamptz not null default now()
);

comment on table sync_logs is 'Audit trail for external integration syncs.';

-- INDEXES
create index idx_contacts_email on contacts(email);
create index idx_attendance_event_id on attendance(event_id);
create index idx_email_events_campaign_id on email_events(campaign_id);
create index idx_email_events_campaign_contact_timestamp on email_events(contact_id, timestamp);
create index idx_email_events_campaign_type on email_events(campaign_id, event_type);

-- UPDATED_AT TRIGGER FUNCTION
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

-- TRIGGERS
create trigger update_contacts_updated_at
    before update on contacts
    for each row
    execute function update_updated_at_column();

create trigger update_events_updated_at
    before update on events
    for each row
    execute function update_updated_at_column();

create trigger update_email_campaigns_updated_at
    before update on email_campaigns
    for each row
    execute function update_updated_at_column();

-- ROW LEVEL SECURITY (RLS)
-- Enabling RLS but keeping it permissive for now as requested (TODO commented)

alter table contacts enable row level security;
-- create policy "Allow all access for authenticated users" on contacts for all using (true) with check (true);

alter table events enable row level security;
alter table attendance enable row level security;
alter table email_campaigns enable row level security;
alter table email_events enable row level security;
alter table sync_logs enable row level security;
