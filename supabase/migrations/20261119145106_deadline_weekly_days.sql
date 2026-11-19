alter table public.deadline_events
add column if not exists recurrence_days integer[] not null default '{}'::integer[]
constraint deadline_events_recurrence_days_check
check (recurrence_days <@ array[0,1,2,3,4,5,6]);
