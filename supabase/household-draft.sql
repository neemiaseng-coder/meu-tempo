-- Review against the restored database and register as a migration before applying.
-- Provision the two existing auth user IDs in household_members as the database owner.
begin;

create table public.household_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  member text not null unique check (member in ('neemias', 'anelisa'))
);
alter table public.household_members enable row level security;
revoke all on public.household_members from public, anon, authenticated;
grant select on public.household_members to authenticated;
create policy household_member_self on public.household_members for select to authenticated
using (user_id = (select auth.uid()));

create table public.household_items (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  created_by uuid not null references auth.users(id),
  kind text not null check (kind in ('routine', 'task', 'purchase')),
  title text not null check (length(btrim(title)) > 0),
  description text not null default '',
  estimated_price numeric(10,2) check (estimated_price >= 0),
  starts_on date,
  recurrence text check (recurrence in ('daily', 'weekly', 'biweekly', 'monthly')),
  recurrence_days integer[] not null default '{}',
  done boolean not null default false,
  check (kind = 'purchase' or estimated_price is null),
  check (
    (kind = 'routine' and starts_on is not null and recurrence is not null)
    or (kind <> 'routine' and starts_on is null and recurrence is null and cardinality(recurrence_days) = 0)
  ),
  check (case recurrence
    when 'weekly' then cardinality(recurrence_days) > 0 and recurrence_days <@ array[0,1,2,3,4,5,6]
    when 'biweekly' then cardinality(recurrence_days) > 0 and recurrence_days <@ array[0,1,2,3,4,5,6]
    when 'monthly' then cardinality(recurrence_days) = 1 and recurrence_days[1] between 1 and 31
    else cardinality(recurrence_days) = 0
  end)
);
alter table public.household_items enable row level security;
revoke all on public.household_items from public, anon, authenticated;
grant select on public.household_items to authenticated;
grant insert (created_by, kind, title, description, estimated_price, starts_on, recurrence, recurrence_days)
  on public.household_items to authenticated;
grant update (done) on public.household_items to authenticated;
create policy household_item_read on public.household_items for select to authenticated
using ((select exists (select 1 from public.household_members)));
create policy household_item_create on public.household_items for insert to authenticated
with check (created_by = (select auth.uid()) and (select exists (select 1 from public.household_members)));
create policy household_item_complete on public.household_items for update to authenticated
using (kind <> 'routine' and (select exists (select 1 from public.household_members)))
with check (kind <> 'routine' and (select exists (select 1 from public.household_members)));

create table public.household_checks (
  item_id uuid not null references public.household_items(id) on delete cascade,
  occurrence_date date not null,
  primary key (item_id, occurrence_date)
);
create index household_checks_date_idx on public.household_checks (occurrence_date);
alter table public.household_checks enable row level security;
revoke all on public.household_checks from public, anon, authenticated;
grant select, insert, delete on public.household_checks to authenticated;
create policy household_check_read on public.household_checks for select to authenticated
using ((select exists (select 1 from public.household_members)));
create policy household_check_complete on public.household_checks for insert to authenticated
with check ((select exists (select 1 from public.household_members)) and exists (
  select 1 from public.household_items item where item.id = item_id and item.kind = 'routine'
));
create policy household_check_reopen on public.household_checks for delete to authenticated
using ((select exists (select 1 from public.household_members)));

commit;
