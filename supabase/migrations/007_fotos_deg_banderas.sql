-- Migración: fotos de las cartas, COM -> DEG (Degenerado) y banderas nuevas.

alter table members rename column stat_com to stat_deg;

update members set photo_url = '/players/alvaro.webp', country = 'lgtb'     where email = 'aalvarez90@gatech.edu';
update members set photo_url = '/players/ivan.webp',   country = 'es-1945'  where email = 'ivangallegocuervo@gmail.com';
update members set photo_url = '/players/leandro.webp'                      where email = 'lahuir3@gatech.edu';
update members set photo_url = '/players/carla.webp'                        where email = 'clopez88@gatech.edu';
update members set photo_url = '/players/jaime.webp'                        where email = 'jpoza3@gatech.edu';
update members set photo_url = '/players/inaki.webp'                        where email = 'inaki.lopategui@gatech.edu';
