-- Migración: las estadísticas AAA y BBB pasan a ser CRY (Lloros) y COM (Comunicación).
alter table members rename column stat_aaa to stat_cry;
alter table members rename column stat_bbb to stat_com;
