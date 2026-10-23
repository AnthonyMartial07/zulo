-- Migración: añade el rol de admin y restringe permisos.
-- Solo si YA ejecutaste la versión anterior de schema.sql. En una base nueva usa schema.sql directamente.

alter table members add column if not exists is_admin boolean not null default false;

insert into members (name, email, color, rotation_order, is_admin)
values ('Iván', 'ivangallegocuervo@gmail.com', '#e63946', 0, true)
on conflict (email) do update set is_admin = true, active = true;

create unique index if not exists task_logs_weekly_once
  on task_logs (task_id, week_start) where week_start is not null;

create or replace function current_member_id() returns uuid
language sql security definer stable set search_path = public as $$
  select id from members
  where lower(email) = lower(auth.jwt() ->> 'email') and active;
$$;

create or replace function is_member() returns boolean
language sql security definer stable set search_path = public as $$
  select current_member_id() is not null;
$$;

create or replace function is_admin() returns boolean
language sql security definer stable set search_path = public as $$
  select coalesce((select is_admin from members where id = current_member_id()), false);
$$;

drop policy if exists "members_all"    on members;
drop policy if exists "tasks_all"      on tasks;
drop policy if exists "task_logs_all"  on task_logs;
drop policy if exists "fine_types_all" on fine_types;
drop policy if exists "fines_all"      on fines;

create policy "members_read"     on members    for select using (is_member());
create policy "members_admin"    on members    for all    using (is_admin()) with check (is_admin());
create policy "tasks_read"       on tasks      for select using (is_member());
create policy "tasks_admin"      on tasks      for all    using (is_admin()) with check (is_admin());
create policy "fine_types_read"  on fine_types for select using (is_member());
create policy "fine_types_admin" on fine_types for all    using (is_admin()) with check (is_admin());

create policy "fines_read"   on fines for select using (is_member());
create policy "fines_insert" on fines for insert with check (
  is_member() and issued_by = current_member_id() and paid = false
);
create policy "fines_admin"  on fines for all using (is_admin()) with check (is_admin());

create policy "task_logs_read"   on task_logs for select using (is_member());
create policy "task_logs_insert" on task_logs for insert with check (
  member_id = current_member_id()
  and points = (select t.points from tasks t where t.id = task_id and t.active)
);
create policy "task_logs_undo"   on task_logs for delete using (
  member_id = current_member_id() and created_at > now() - interval '24 hours'
);
create policy "task_logs_admin"  on task_logs for all using (is_admin()) with check (is_admin());
