# PIPE con GitHub Pages y Supabase

## Arquitectura

- `frontend/` contiene la aplicación React/Vite.
- `.github/workflows/deploy-pages.yml` construye `frontend/dist` y lo publica en GitHub Pages.
- `app.js`, `routes/`, `controllers/`, `middleware/`, `config/` y `data/` son el backend Node.js separado. GitHub Pages no lo ejecuta.
- El frontend usa `@supabase/supabase-js` y solo recibe la URL del proyecto y la clave `anon`/pública.

## Variables de frontend

En desarrollo, crea `frontend/.env.local` (no se debe subir):

```env
VITE_SUPABASE_URL=https://TU_PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_CLAVE_ANON_PUBLICA
```

En GitHub, crea estas **Variables** del repositorio en `Settings > Secrets and variables > Actions > Variables`:

- `VITE_SUPABASE_URL`: URL pública del proyecto Supabase.
- `VITE_SUPABASE_ANON_KEY`: clave `anon`/public del proyecto.

No crees ni uses `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_SERVICE_KEY` ni ninguna clave privada en el frontend o en GitHub Pages.

## Tablas que espera PIPE

El código existente y `data/db.json` esperan estas tablas, con esos nombres:

- `usuarios`: `id`, `uuid`, `nombre`, `correo`, `rol_id`, `activo`, `created_at`.
- `estudiantes`: `id`, `uuid`, `usuario_id`, `nombre`, `correo`, `codigo`, `codigo_estudiante`, `programa`, `semestre`, `nivel_riesgo`, `estado`, `created_at`.
- `alertas`: `id`, `uuid`, `codigo_radicado`, `estudiante_id`, `usuario_id`, `descripcion`, `nivel_riesgo`.
- `casos`: `id`, `uuid`, `codigo_radicado`, `estudiante_id`, `usuario_id`, `descripcion`, `estado`.
- `intervenciones`: `id`, `uuid`, `codigo_radicado`, `caso_id`, `usuario_id`, `descripcion`.
- `citas`: `id`, `uuid`, `codigo_radicado`, `estudiante_id`, `usuario_id`, `fecha`, `hora`, `motivo`, `estado`.

Relaciones esperadas: `estudiantes.usuario_id -> usuarios.id`, `alertas/casos/citas.estudiante_id -> estudiantes.id`, `alertas/casos/intervenciones/citas.usuario_id -> usuarios.id`, e `intervenciones.caso_id -> casos.id`.

No se incluyen migraciones SQL porque el esquema debe verificarse en el proyecto Supabase antes de aplicar restricciones o políticas. Activa RLS en las tablas y crea políticas basadas en `auth.uid()` y el perfil de `usuarios`; las restricciones visuales de React no sustituyen RLS.

## Autenticación y límites conocidos

El login del frontend usa Supabase Auth (`signInWithPassword`) y busca el perfil de aplicación en `usuarios` por `correo`. Los usuarios deben existir también en `auth.users`; los hashes bcrypt del backend Node no son reutilizables directamente por Supabase Auth.

Los CRUD de estudiantes, alertas, casos, intervenciones y citas, además del dashboard, consultan Supabase directamente. Crear un estudiante con una nueva cuenta requiere una Edge Function configurada mediante la variable opcional `VITE_SUPABASE_CREATE_STUDENT_FUNCTION`; esa función debe usar la clave de servicio solo en Supabase y nunca devolver secretos al navegador. Sin ella, el alta de estudiantes se mantiene disponible en el backend Node externo, no en GitHub Pages.

## GitHub Pages

En `Settings > Pages`, selecciona `Source: GitHub Actions`. Cada push a `main` ejecuta el workflow y publica `frontend/dist` en:

`https://danielmoreno01.github.io/PIPE/`

La configuración `base: '/PIPE/'` y `HashRouter` mantienen correctos los assets y las rutas al recargar una página.