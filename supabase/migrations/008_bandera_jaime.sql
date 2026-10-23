-- Migración: Jaime pasa a la bandera España / Italia (doble nacionalidad).
update members set country = 'es-it' where email = 'jpoza3@gatech.edu';
