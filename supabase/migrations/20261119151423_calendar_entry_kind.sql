alter table public.deadline_events
add column if not exists entry_kind text
constraint deadline_events_entry_kind_check check (entry_kind in ('deadline','reminder'));
