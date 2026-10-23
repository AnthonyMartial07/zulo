# 🏚️ Zulo Gitano

App del piso: multas, calendario de tareas semanales y ranking mensual.

**Stack (todo gratis):** React + Vite (frontend) · Supabase (base de datos + login por email) · Vercel (hosting).

## Estructura

```
zulo_gitano/
├── supabase/schema.sql      # Tablas, seguridad y datos iniciales
├── src/
│   ├── App.tsx              # Login, carga de compis/tareas y navegación
│   ├── lib/
│   │   ├── supabase.ts      # Cliente de Supabase
│   │   ├── household.tsx    # Contexto: yo, compis, tareas
│   │   ├── rotation.ts      # Cálculo de a quién le toca cada semana
│   │   └── types.ts
│   └── pages/
│       ├── Login.tsx        # Enlace mágico por email
│       ├── Calendar.tsx     # Tareas semanales rotativas
│       ├── Fines.tsx        # Poner multas, pendientes y bote
│       ├── Leaderboard.tsx  # Ranking del mes + registrar tareas comunes
│       └── Settings.tsx     # Editar compis, tareas y tipos de multa
│   └── components/
│       └── EditableTable.tsx # Tabla editable que guarda en Supabase
└── vercel.json              # Para que las rutas funcionen al recargar
```

## Cómo funciona

- **Calendario:** cada semana (de lunes a domingo) le toca a un compi, por turnos, hacer la checklist de tareas `weekly`. Solo esa persona (o el admin) puede ir marcándolas.
- **Multas:** cualquiera multa a cualquiera, eligiendo un tipo (rellena el importe) o poniendo uno a mano. No se pagan sobre la marcha: se acumulan en la hucha y se paga todo al final de la convivencia.
- **Medallero:** cada uno se suma +1 cuando hace una tarea cotidiana (`common`). Se cuentan las veces que ha hecho cada uno cada tarea en el mes y se ordena por el total, con 🥇🥈🥉.
- **Acceso:** solo pueden entrar los emails que estén en la tabla `members`.
- **Permisos:** el admin (`is_admin` en `members`) puede hacerlo todo y es el único que ve **Ajustes**. El resto puede poner multas, marcar sus tareas semanales y apuntarse tareas comunes; solo puede deshacer lo suyo durante las primeras 24 h. No puede borrar multas ni editar compis, tareas o tipos de multa. Esto se controla en la propia base de datos (RLS), no solo en la interfaz.

## Puesta en marcha

### 1. Supabase (base de datos)
1. Crea una cuenta en https://supabase.com y un proyecto nuevo.
2. Abre **SQL Editor**, edita en `supabase/schema.sql` los nombres y emails reales de los compis (al final del archivo) y ejecútalo. Si ya habías ejecutado una versión anterior, ejecuta en su lugar las migraciones de `supabase/migrations/` que te falten, en orden.
3. En **Authentication → URL Configuration** pon como *Site URL* la URL de Vercel (y `http://localhost:5173` en *Redirect URLs* para desarrollo).
4. Copia la *Project URL* y la *anon key* de **Project Settings → API**.

### 2. En local
```bash
cp .env.example .env.local   # y pega ahí la URL y la anon key
npm install
npm run dev
```

### 3. Desplegar en Vercel
1. Sube la carpeta a un repo de GitHub.
2. En https://vercel.com → *Add New Project* → importa el repo.
3. Añade las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
4. Deploy. Pásales la URL a los compis.

## Ideas para afinar
- Intercambiar turnos entre compis / saltar a alguien que está de viaje.
- Multa automática si la tarea semanal no está hecha el domingo.
- Votación para aceptar/recurrir multas.
- Instalarla como app en el móvil (PWA) y notificaciones.
