alter table public.deadline_events drop constraint if exists deadline_events_entry_kind_check;
alter table public.deadline_events add constraint deadline_events_entry_kind_check
check (entry_kind in ('deadline','reminder','time_off'));
alter table public.deadline_events add column if not exists end_date date
constraint deadline_events_end_date_check check (end_date is null or end_date >= event_date);
