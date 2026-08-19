# MANUAL TÉCNICO — PIPE (Documentación Corporativa)

Fecha de referencia: 2026-05-19 (según `DOCUMENTO_TECNICO_PIPE.md` existente).

---

## 1. Visión general del sistema

**PIPE** es una aplicación full-stack para gestión operativa y acompañamiento de estudiantes. El backend provee APIs REST sobre recursos:
- Usuarios (auth)
- Estudiantes
- Alertas
- Casos
- Intervenciones
- Citas

La persistencia se realiza mediante una capa **Storage/DB layer** basada en un archivo JSON local en `data/db.json` (ver `config/db.js`). Existe además configuración para Supabase en `config/supabase.js`, pero el flujo observado en los controladores utiliza `config/db.js`.

---

## 2. Stack tecnológico

### Backend
- **Node.js**
- **Express**
- **JSON Web Token (JWT)**
- **bcrypt**
- **dotenv**
- (Config Supabase) `@supabase/supabase-js` pero no se usa de forma evidente en los controladores actuales.

### Frontend
- **React**
- **Vite**
- **Axios**

---

## 3. Estructura de carpetas (proyecto)

### Backend
- `app.js`
  - Inicializa Express, CORS, JSON parser
  - Monta rutas:
    - `/auth`
    - `/estudiantes`
    - `/alertas`
    - `/casos`
    - `/intervenciones`
    - `/citas`
    - `/dashboard`
  - Ejecuta `db.ensureStorage()` y si no existen usuarios crea **usuarios iniciales** (admin/docente/consejero/estudiante).
- `routes/`
  - Definición de endpoints por recurso.
- `controllers/`
  - Lógica de negocio por recurso.
- `middleware/`
  - `auth.js`: `authenticateToken`, `authorizeRoles`.
- `config/`
  - `db.js`: storage local JSON + migración para campos faltantes.
  - `supabase.js`: cliente Supabase basado en variables de entorno.

### Frontend
- `frontend/src/api/apiClient.js`
  - Configura Axios con `baseURL: http://localhost:3000`.
  - Interceptor request: lee token desde `localStorage` (`pipe_auth`) y agrega `Authorization: Bearer <token>`.
  - Interceptor response: maneja `401` removiendo token y redirigiendo a `/login`.
- `frontend/src/services/`
  - Services por recurso que consumen endpoints del backend.
- `frontend/src/pages/`
  - Vistas para cada módulo.

---

## 4. Flujo de datos (frontend → backend → DB)

### 4.1 Patrón general de request
1. Frontend ejecuta una llamada Axios hacia `http://localhost:3000/<recurso>`.
2. Axios interceptor agrega el header `Authorization: Bearer <token>`.
3. Express enruta a `routes/<resource>Routes.js`.
4. El `router.use(authenticateToken)` protege endpoints.
5. El controller usa `config/db.js`:
   - `db.getAll`, `db.getById`, `db.insert`, `db.update`, `db.remove`.
6. `config/db.js` persiste cambios en `data/db.json`.

### 4.2 Flujo específico: creación de un recurso (ejemplo genérico)
- Request:
  - `POST /casos` (o equivalente recurso)
- Controller:
  - valida campos requeridos
  - inserta registro en tabla JSON correspondiente
  - retorna `sendSuccess(res, data, ..., 201)`.

---

## 5. API Endpoints (REST) — Catálogo real

> Autenticación: la mayoría de endpoints de recursos usa `router.use(authenticateToken)`.

### 5.1 Auth
- `POST /auth/register`
  - **Body**: `{ nombre, correo, password, rol_id }`
  - **Validaciones clave**:
    - correo termina en `.edu`
    - `rol_id` en `admin|docente|consejero|estudiante`
  - **Respuestas**: 400/409/201.

- `POST /auth/login`
  - **Body**: `{ correo, password }`
  - **Respuestas**:
    - 200: retorna `token` y `usuario`.
    - 401: credenciales incorrectas.

### 5.2 Estudiantes (CRUD + roles)
- `GET /estudiantes`
- `GET /estudiantes/:id`
- `POST /estudiantes`
  - permitido a `authorizeRoles(['admin', 'consejero'])`
- `PUT /estudiantes/:id`
  - el archivo de rutas aplica `updateEstudiante` sin restricción y además vuelve a registrar otro `router.put('/:id', authorizeRoles(['admin','consejero']), updateEstudiante);`
  - **Nota técnica:** hay potencial solapamiento de handlers (doble `router.put`). Conviene revisar para eliminar duplicidad.
- `DELETE /estudiantes/:id`
  - el archivo de rutas registra `deleteEstudiante` y además otro handler con `authorizeRoles(['admin','consejero'])`.
  - **Nota técnica:** también hay solapamiento.

### 5.3 Alertas
- `GET /alertas`
- `POST /alertas`
- `PUT /alertas/:id`
- `DELETE /alertas/:id`

### 5.4 Casos
- `GET /casos`
- `POST /casos`
- `PUT /casos/:id`
- `DELETE /casos/:id`

### 5.5 Intervenciones
- `GET /intervenciones`
- `POST /intervenciones`
- `PUT /intervenciones/:id`
- `DELETE /intervenciones/:id`

### 5.6 Citas
- `GET /citas`
- `POST /citas`
- `PUT /citas/:id`
- `DELETE /citas/:id`

### 5.7 Dashboard
- `GET /dashboard`
  - Retorna métricas calculadas desde el storage:
    - `totalEstudiantes`
    - `alertasAbiertas`
    - `casosAbiertos`
    - `citasHoy`
    - `estudiantesAltoRiesgo`
    - `alertasCriticas`
    - `citasPerdidas`

---

## 6. Modelos de datos (inferidos del storage y controllers)

En `config/db.js` existen las “tablas” (propiedades) del JSON:
- `usuarios`
- `estudiantes`
- `alertas`
- `casos`
- `intervenciones`
- `citas`

A continuación se listan campos usados en controladores:

### 6.1 `usuarios`
Campos usados:
- `id` (num)
- `nombre` (string)
- `correo` (string, normalizado a minúsculas)
- `password` (bcrypt hash)
- `rol_id` (string)

Auth además utiliza `jwt.sign({ id, correo, rol_id })`.

### 6.2 `estudiantes`
Campos usados:
- `id` (num)
- `usuario_id` (relación a `usuarios.id`)
- `nombre`, `correo`
- `codigo`, `codigo_estudiante`
- `programa` (string)
- `semestre` (num o null)
- `nivel_riesgo` (string)
- `estado` (inicial: `activo`)
- `created_at` (ISO string)

### 6.3 `alertas`
- `id`
- `estudiante_id`
- `usuario_id`
- `descripcion`
- `nivel_riesgo`

### 6.4 `casos`
- `id`
- `estudiante_id`
- `usuario_id`
- `descripcion`
- `estado`

### 6.5 `intervenciones`
- `id`
- `caso_id`
- `usuario_id`
- `descripcion`

### 6.6 `citas`
- `id`
- `estudiante_id`
- `usuario_id`
- `fecha` (YYYY-MM-DD string)
- `hora`
- `motivo`
- `estado`

---

## 7. Autenticación y seguridad

### 7.1 JWT
- Middleware: `middleware/auth.js`
- Header esperado: `Authorization: Bearer <token>`
- Se valida con `JWT_SECRET` (default: `PIPE_DEFAULT_SECRET`).
- Si el token es válido:
  - `req.user = { id, nombre, correo, rol_id }`

### 7.2 Autorización por roles
- Middleware: `authorizeRoles(allowed)`
- Compara `req.user.rol_id` con la lista permitida.
- Respuestas:
  - `401` si no hay autenticación
  - `403` si no hay autorización

### 7.3 Interceptor del frontend
- `pipe_auth` guardado en `localStorage`
- En respuestas con `401`:
  - se elimina `pipe_auth`
  - se redirige a `/login`

---

## 8. Manejo de errores

Patrón de respuestas:
- Controladores usan `sendSuccess` y `sendError` desde `controllers/responseHelper.js`.

> **Nota:** el detalle exacto de payload de `responseHelper` puede revisarse en `controllers/responseHelper.js` (no lo abrí aquí por límite de pasos), pero el patrón se observa por los controladores.

Tipos comunes:
- 400: validación de campos
- 401: token faltante o inválido
- 403: rol no autorizado
- 404: recurso no encontrado
- 409: conflicto (por ejemplo correo ya registrado)
- 500: error interno

---

## 9. Estabilización del backend y recursión infinita (caso real del repo)

### 9.1 Problema
El storage local `config/db.js` incluye inicialización y migración de campos (`ensureStorage()` y `migrateMissingFields()`). Si una migración llamara a funciones que a su vez ejecutaran `ensureStorage()`, podría dispararse una **recursión infinita**.

### 9.2 Solución aplicada en el repo
En `config/db.js`:
- `migrateMissingFields()` lee el JSON usando `fs.readFileSync` **sin llamar** a `readDb()` (comentario explícito):
  - evita `ensureStorage -> migrateMissingFields -> readDb -> ensureStorage`.
- Además:
  - asegura estructura mínima de tablas en memoria
  - persiste solo si hubo cambios con `writeDb(dbNow)`.

### 9.3 Recomendaciones adicionales (hardening)
- Agregar un **guard** global o flag (por ejemplo `isMigrating`) en `config/db.js` para evitar reentradas.
- Implementar límites/telemetría:
  - contador de llamadas
  - logs por inicialización vs migración.

---

## 10. Buenas prácticas recomendadas (estabilización y producción)

1. **Eliminar solapamiento de handlers** en `estudiantesRoutes.js`:
   - hoy se registran `updateEstudiante` y `deleteEstudiante` dos veces con y sin `authorizeRoles`.
   - esto puede causar comportamientos inesperados.
2. **Validación robusta**:
   - introducir `express-validator` o `zod/joi` para contratos de request.
3. **Secretos y entornos**:
   - nunca usar `PIPE_DEFAULT_SECRET` en producción.
4. **Datos sensibles**:
   - evitar retornar `plain_password` fuera de entornos controlados.
5. **Consistencia de modelos**:
   - documentar `estado` permitido para `casos` y `citas`.
6. **Transición desde JSON storage**:
   - si se busca producción empresarial, migrar a una base real (PostgreSQL) con migraciones.

---

## 11. Estrategia de despliegue (local y producción)

### Local
- Backend:
  - configurar `.env` con `SUPABASE_URL`, `SUPABASE_KEY`, `JWT_SECRET`, `PORT`
  - `npm install`
  - `npm run dev`
- Frontend:
  - entrar a `frontend/`
  - `npm install`
  - `npm run dev` (Vite)

### Producción (ver guía completa en `GUIA_DESPLIEGUE_PIPE.md`)
- Recomendado:
  - contenedores (Docker) si se agrega en el repo
  - variables de entorno seguras
  - persistencia de datos fuera del contenedor (si persistes JSON)

---

## 12. Estado del módulo OKR

No se detectan entidades/endpoints/módulos OKR en el repositorio actual.
- En documentación de usuario se refleja como **pendiente / no implementado**.
- En documentación técnica se recomienda:
  - definir esquema de OKR
  - integrar con métricas del dashboard.

---

**Fin del Manual Técnico — PIPE**

