-- Migración: nuevo orden del calendario (desde la semana del 19-oct-2026) y banderas del medallero.

alter table members add column if not exists country text not null default 'es';

update members set rotation_order = 0, country = 'es'  where email = 'aalvarez90@gatech.edu';
update members set rotation_order = 1, country = 'es'  where email = 'ivangallegocuervo@gmail.com';
update members set rotation_order = 2, country = 'dz'  where email = 'lahuir3@gatech.edu';
update members set rotation_order = 3, country = 'cat' where email = 'clopez88@gatech.edu';
update members set rotation_order = 4, country = 'es'  where email = 'jpoza3@gatech.edu';
update members set rotation_order = 5, country = 'eus' where email = 'inaki.lopategui@gatech.edu';
