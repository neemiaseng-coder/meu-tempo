alter table public.meetings
  add column organized_notes jsonb not null default '[]'::jsonb check (jsonb_typeof(organized_notes) = 'array'),
  add column action_items jsonb not null default '[]'::jsonb check (jsonb_typeof(action_items) = 'array'),
  add column finalized_at timestamptz;
