-- Zulo Gitano: esquema de base de datos
-- Pégalo en Supabase -> SQL Editor y ejecútalo una vez.

-- ============ TABLAS ============

-- Compañeros de piso. El email debe coincidir con el que usan para entrar.
create table members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  color text not null default '#888888',
  rotation_order int not null default 0,
  active boolean not null default true,
  is_admin boolean not null default false,
  country text not null default 'es',
  club text not null default 'rma',      -- escudo en la clasificación de multas: atm, vcf, ath, sfc, rma, fcb
  -- Carta de jugador del calendario
  position text not null default 'PG',
  overall int not null default 75,
  stat_suc int not null default 70,      -- Sucio
  stat_rui int not null default 70,      -- Ruido
  stat_bor int not null default 70,      -- Borde
  stat_cue int not null default 70,      -- Cueva
  stat_cry int not null default 70,      -- Lloros
  stat_deg int not null default 70,      -- Degenerado
  photo_url text                          -- null = foto por defecto
);

-- Tareas. 'weekly' = checklist de la persona a la que le toca la semana.
-- 'common' = cotidianas: cualquiera se suma una y cuentan para el medallero mensual.
create table tasks (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null check (kind in ('weekly', 'common')),
  rotation_order int not null default 0, -- orden en que se muestran
  active boolean not null default true
);

-- Registro de tareas hechas: marca los puntos de la checklist semanal y suma al medallero.
create table task_logs (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  week_start date,               -- solo para tareas semanales (lunes de esa semana)
  created_at timestamptz not null default now()
);

-- Una tarea semanal solo se puede completar una vez por semana.
create unique index task_logs_weekly_once on task_logs (task_id, week_start) where week_start is not null;

-- Tipos de multa con su importe por defecto.
create table fine_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  amount numeric(6,2) not null default 1
);

-- Multas puestas.
create table fines (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references members(id) on delete cascade,
  fine_type_id uuid references fine_types(id) on delete set null,
  amount numeric(6,2) not null,
  reason text,
  issued_by uuid references members(id) on delete set null,
  paid boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============ SEGURIDAD (RLS) ============
-- Solo los emails que estén en "members" pueden entrar.
-- El admin puede hacerlo todo. El resto puede:
--   · leerlo todo
--   · poner multas (a su nombre y sin marcarlas como pagadas)
--   · apuntarse tareas (solo a sí mismo)
--   · deshacer una tarea suya durante las primeras 24 h (por si se equivoca)

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

alter table members    enable row level security;
alter table tasks      enable row level security;
alter table task_logs  enable row level security;
alter table fine_types enable row level security;
alter table fines      enable row level security;

-- Compis, tareas y tipos de multa: todos leen, solo el admin edita.
create policy "members_read"     on members    for select using (is_member());
create policy "members_admin"    on members    for all    using (is_admin()) with check (is_admin());
create policy "tasks_read"       on tasks      for select using (is_member());
create policy "tasks_admin"      on tasks      for all    using (is_admin()) with check (is_admin());
create policy "fine_types_read"  on fine_types for select using (is_member());
create policy "fine_types_admin" on fine_types for all    using (is_admin()) with check (is_admin());

-- Multas: todos leen y ponen; solo el admin las marca como pagadas o las borra.
create policy "fines_read"   on fines for select using (is_member());
-- El importe es siempre el del tipo de multa (no se puede inventar).
create policy "fines_insert" on fines for insert with check (
  is_member() and issued_by = current_member_id() and paid = false
  and amount = (select ft.amount from fine_types ft where ft.id = fine_type_id)
);
create policy "fines_admin"  on fines for all using (is_admin()) with check (is_admin());

-- Tareas hechas: cada uno se apunta las suyas; solo el admin toca las de otros.
create policy "task_logs_read"   on task_logs for select using (is_member());
create policy "task_logs_insert" on task_logs for insert with check (
  member_id = current_member_id()
  and exists (select 1 from tasks t where t.id = task_id and t.active)
);
create policy "task_logs_undo"   on task_logs for delete using (
  member_id = current_member_id() and created_at > now() - interval '24 hours'
);
create policy "task_logs_admin"  on task_logs for all using (is_admin()) with check (is_admin());

-- ============ DATOS INICIALES (edítalos) ============

-- rotation_order = orden del calendario (el 0 le toca la semana del 19-oct-2026, ver src/lib/rotation.ts).
-- country = bandera: es, es-1945, es-it, lgtb, cat, eus, dz.
insert into members (name, email, color, rotation_order, is_admin, country, club, photo_url) values
  ('Álvaro Morata',   'aalvarez90@gatech.edu',       '#f4a261', 0, false, 'lgtb',    'atm', '/players/alvaro.webp'),
  ('Ivan Rakitic',    'ivangallegocuervo@gmail.com', '#e63946', 1, true,  'es-1945', 'sfc', '/players/ivan.webp'),
  ('Leandro Paredes', 'lahuir3@gatech.edu',          '#e416bf', 2, false, 'dz',      'vcf', '/players/leandro.webp'),
  ('Carles Puyol',    'clopez88@gatech.edu',         '#457b9d', 3, false, 'cat',     'fcb', '/players/carla.webp'),
  ('Jaime Latasa',    'jpoza3@gatech.edu',           '#2a9d8f', 4, false, 'es-it',   'rma', '/players/jaime.webp'),
  ('Iñaki Williams',  'inaki.lopategui@gatech.edu',  '#e9c46a', 5, false, 'eus',     'ath', '/players/inaki.webp');

-- Semanales: checklist que hace UNA persona cada semana (rota entre compis).
-- Cotidianas: cualquiera se suma una cuando la hace; cuentan para el medallero del mes.
insert into tasks (name, kind, rotation_order) values
  ('Aspirar entre semana', 'weekly', 0),
  ('Aspirar el finde',     'weekly', 1),
  ('Limpiar superficies',  'weekly', 2),
  ('Fregar suelos',        'weekly', 3),
  ('Sacar contenedores',   'weekly', 4),
  ('Sacar lavavajillas',   'common', 0),
  ('Guardar mercadillo',   'common', 1),
  ('Sacar basura',         'common', 2);

insert into fine_types (name, amount) values
  ('Cacharros sin fregar',                    1),
  ('No hacer la tarea semanal',    5),
  ('No recoger',                   1),
  ('Basura sin sacar',         1);
