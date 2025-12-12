insert into events (name, slug, description, event_date, location, capacity)
values (
  'Product Launch Party',
  'launch-party',
  'Join us for the official launch of our new CRM product. Drinks and networking provided.',
  now() + interval '7 days',
  'Tech Hub Center, San Francisco',
  100
) on conflict (slug) do nothing;
