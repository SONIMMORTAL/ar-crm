-- 003_enable_rls_policies.sql

-- Policy for EMAIL CAMPAIGNS (Admin only)
create policy "Enable all access for authenticated users"
  on email_campaigns for all
  to authenticated
  using (true)
  with check (true);

-- Policy for CONTACTS (Admin only)
-- Note: We might want public insert in future but for now Admin full access
create policy "Enable all access for authenticated users"
  on contacts for all
  to authenticated
  using (true)
  with check (true);

-- Policy for EVENTS (Public read, Admin all)
create policy "Enable public read access"
  on events for select
  to anon
  using (true);

create policy "Enable all access for authenticated users"
  on events for all
  to authenticated
  using (true)
  with check (true);

-- Policy for ATTENDANCE (Admin all, Public insert via API usually, but let's allow auth just in case)
create policy "Enable all access for authenticated users"
  on attendance for all
  to authenticated
  using (true)
  with check (true);
