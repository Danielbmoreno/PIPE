# Informe técnico — Proyecto PIPE

Fecha: 19 de mayo de 2026

## Resumen
Documento técnico que describe la arquitectura, el frontend, el backend, las APIs expuestas y las integraciones con Supabase del proyecto PIPE.

## Estructura general
- Entrada servidor: [app.js](app.js#L1-L60)
- Configuración Supabase: [config/supabase.js](config/supabase.js#L1-L14)
- Middleware de autenticación: [middleware/auth.js](middleware/auth.js#L1-L30)
- Controladores (backend): [controllers/](controllers/)
- Rutas (backend): [routes/](routes/)
- Frontend: [frontend/](frontend/)
  - Cliente API: [frontend/src/api/apiClient.js](frontend/src/api/apiClient.js#L1-L20)
  - Servicios que consumen la API: [frontend/src/services/](frontend/src/services/)

## Tecnologías
- Backend: Node.js, Express, @supabase/supabase-js, dotenv, bcrypt, jsonwebtoken
- Frontend: Vite, React (JSX), Axios

## Variables de entorno
Revisar `.env` o `.env.example` para las variables necesarias:
- `SUPABASE_URL`, `SUPABASE_KEY` — conexión a Supabase
- `JWT_SECRET` — secreto para firmar tokens JWT
- `PORT` — puerto del servidor

## Supabase: dónde y cómo se usa
- Archivo de inicialización: [config/supabase.js](config/supabase.js#L1-L14)
  - Crea un cliente con `createClient(supabaseUrl, supabaseKey)` leyendo variables de entorno.
- Uso principal: todos los controladores backend usan el cliente `supabase` para leer y modificar tablas mediante `from(...).select|insert|update|delete`.
  - Ejemplos: `controllers/estudiantesController.js`, `controllers/alertasController.js`, `controllers/casosController.js`, `controllers/intervencionesController.js`, `controllers/citasController.js`, `controllers/authController.js`.
- Middleware `authenticateToken` (en [middleware/auth.js](middleware/auth.js#L1-L30)) valida JWT y carga el usuario desde la tabla `usuarios` vía Supabase.

## Backend — Rutas y controladores (mapa rápido)
- `GET/POST/PUT/DELETE /estudiantes` → `controllers/estudiantesController.js` / `routes/estudiantesRoutes.js`
- `GET/POST/PUT/DELETE /alertas` → `controllers/alertasController.js` / `routes/alertasRoutes.js`
- `GET/POST/PUT/DELETE /casos` → `controllers/casosController.js` / `routes/casosRoutes.js`
- `GET/POST/PUT/DELETE /intervenciones` → `controllers/intervencionesController.js` / `routes/intervencionesRoutes.js`
- `GET/POST/PUT/DELETE /citas` → `controllers/citasController.js` / `routes/citasRoutes.js`
- `POST /auth/register` y `POST /auth/login` → `controllers/authController.js` / `routes/authRoutes.js`

Observaciones:
- Las operaciones CRUD en controladores usan directamente Supabase. No hay capa de repositorio adicional.
- Los controladores incluyen logs `console.log` para depuración y validaciones básicas de campos.

## Frontend — Consumo de APIs
- Cliente HTTP: [frontend/src/api/apiClient.js](frontend/src/api/apiClient.js#L1-L20) — `baseURL` apunta a `http://localhost:3000`.
- Servicios por recurso (ejemplos):
  - `frontend/src/services/estudiantesService.js` → consume `/estudiantes`
  - `frontend/src/services/alertasService.js` → consume `/alertas`
  - `frontend/src/services/casosService.js` → consume `/casos`
  - `frontend/src/services/intervencionesService.js` → consume `/intervenciones`
  - `frontend/src/services/citasService.js` → consume `/citas`

Autenticación en frontend:
- Actualmente no se observa un wrapper de autenticación en `apiClient.js` (p. ej. interceptor que añada `Authorization: Bearer <token>`). Si se requiere acceso a endpoints autenticados, recomendamos añadir lógica para guardar token (localStorage) y añadirlo en headers.

## Flujo típico de una petición
1. Frontend llama a `api` (Axios) hacia `http://localhost:3000/<recurso>`.
2. Express enruta la petición hacia la ruta correspondiente en `routes/`.
3. La lógica en `controllers/` usa el cliente `supabase` para leer o modificar tablas.
4. Si la ruta requiere autenticación, el middleware `authenticateToken` verifica el JWT y obtiene el usuario desde Supabase.

## Cómo ejecutar (desarrollo)
1. Backend:
   - Copiar `.env.example` a `.env` y configurar `SUPABASE_URL`, `SUPABASE_KEY`, `JWT_SECRET`.
   - Instalar dependencias: `npm install` (en la raíz del backend).
   - Iniciar: `npm run dev` o `node app.js`.
2. Frontend:
   - Entrar a `frontend/` e instalar: `npm install`.
   - Iniciar: `npm run dev` (Vite).

## Riesgos y recomendaciones
- Validación: mejorar validaciones de entrada (usar `Joi` o `express-validator`).
- Autorización: aplicar el middleware `authenticateToken` a rutas que deben protegerse.
- Manejo de errores: unificar manejo y respuestas de error.
- Tests: añadir pruebas de integración para endpoints y mocks de Supabase.
- Seguridad: usar la clave `service_role` solo en servidores seguros; preferir claves con menor privilegio si es posible.

## Archivos clave para revisar
- [config/supabase.js](config/supabase.js#L1-L14)
- [app.js](app.js#L1-L60)
- [middleware/auth.js](middleware/auth.js#L1-L30)
- [frontend/src/api/apiClient.js](frontend/src/api/apiClient.js#L1-L20)
- Carpeta rutas: [routes/](routes/)
- Carpeta controladores: [controllers/](controllers/)

---
Este documento se generó automáticamente a partir del estado actual del repositorio. Puedo:
- Añadir una lista completa de endpoints con ejemplos de request/response.
- Generar un diagrama de arquitectura.
- Implementar mejoras: interceptores de auth, validaciones, o tests.

Indícame qué quieres que haga a continuación.
