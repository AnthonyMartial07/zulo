-- Migración: tareas semanales como checklist de una persona + medallero de tareas cotidianas.
-- Solo si YA ejecutaste schema.sql antes de este cambio. En una base nueva usa schema.sql directamente.
-- OJO: borra las tareas antiguas y su historial (no toca compis ni multas).

drop policy if exists "task_logs_insert" on task_logs;

alter table task_logs drop column if exists points;
alter table tasks     drop column if exists points;

create policy "task_logs_insert" on task_logs for insert with check (
  member_id = current_member_id()
  and exists (select 1 from tasks t where t.id = task_id and t.active)
);

delete from tasks;

insert into tasks (name, kind, rotation_order) values
  ('Aspirar entre semana', 'weekly', 0),
  ('Aspirar el finde',     'weekly', 1),
  ('Limpiar superficies',  'weekly', 2),
  ('Fregar suelos',        'weekly', 3),
  ('Sacar contenedores',   'weekly', 4),
  ('Sacar lavavajillas',   'common', 0),
  ('Guardar mercadillo',   'common', 1),
  ('Sacar basura',         'common', 2);
