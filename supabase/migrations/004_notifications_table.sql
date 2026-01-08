-- Create Notifications Table
create table if not exists notifications (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users not null,
    title text not null,
    message text,
    type text default 'info',
    read boolean default false,
    link text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table notifications enable row level security;

create policy "Users can view their own notifications"
    on notifications for select
    using (auth.uid() = user_id);

create policy "Users can update their own notifications"
    on notifications for update
    using (auth.uid() = user_id);
    
-- Enable Realtime
alter publication supabase_realtime add table notifications;
