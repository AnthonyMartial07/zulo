-- Migración: cartas de jugador, clubes para la clasificación de multas e importe fijo de multas.

alter table members
  add column if not exists club      text not null default 'rma',
  add column if not exists position  text not null default 'PG',
  add column if not exists overall   int  not null default 75,
  add column if not exists stat_suc  int  not null default 70,
  add column if not exists stat_rui  int  not null default 70,
  add column if not exists stat_bor  int  not null default 70,
  add column if not exists stat_cue  int  not null default 70,
  add column if not exists stat_aaa  int  not null default 70,
  add column if not exists stat_bbb  int  not null default 70,
  add column if not exists photo_url text;

update members set club = 'atm' where email = 'aalvarez90@gatech.edu';
update members set club = 'sfc' where email = 'ivangallegocuervo@gmail.com';
update members set club = 'vcf' where email = 'lahuir3@gatech.edu';
update members set club = 'fcb' where email = 'clopez88@gatech.edu';
update members set club = 'rma' where email = 'jpoza3@gatech.edu';
update members set club = 'ath' where email = 'inaki.lopategui@gatech.edu';

-- El importe de una multa es siempre el de su tipo.
drop policy if exists "fines_insert" on fines;
create policy "fines_insert" on fines for insert with check (
  is_member() and issued_by = current_member_id() and paid = false
  and amount = (select ft.amount from fine_types ft where ft.id = fine_type_id)
);
