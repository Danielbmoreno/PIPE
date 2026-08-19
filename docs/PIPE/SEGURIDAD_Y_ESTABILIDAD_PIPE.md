# SEGURIDAD Y ESTABILIDAD — PIPE

---

## 1. Resumen de la seguridad actual (estado del repo)

### 1.1 Autenticación
- Autenticación basada en **JWT**.
- Middleware: `middleware/auth.js`
  - `authenticateToken`: valida token y carga usuario desde `config/db.js`.
  - `authorizeRoles`: limita acciones por `rol_id`.
- El frontend envía el token en cada request vía interceptor de Axios usando:
  - `localStorage.getItem('pipe_auth')`.

### 1.2 Autorización (roles)
- Se aplican roles **principalmente** en `routes/estudiantesRoutes.js`.
- Otros recursos (alertas/casos/intervenciones/citas) usan `router.use(authenticateToken)` pero **no necesariamente** restricciones de `authorizeRoles` por recurso (según lo observado en las rutas).

### 1.3 Mensajes de error
- Los controladores retornan `sendError(res, message, statusCode)` con códigos típicos:
  - 400, 401, 403, 404, 409, 500.

---

## 2. Riesgos actuales (posibles fallos críticos)

### 2.1 Recursión infinita en capa Storage/DB
- Riesgo: inicialización/migración que llamara a funciones que a su vez re-invocarían inicialización.
- En este repo existe una corrección explícita en `config/db.js`:
  - `migrateMissingFields()` lee `db.json` usando `fs.readFileSync` y **no llama** a `readDb()` (comentario y código).
- Impacto si no existiera: el servidor podría entrar en bucle y bloquearse.

### 2.2 Secretos por defecto
- En `middleware/auth.js`:
  - `JWT_SECRET` usa `process.env.JWT_SECRET || 'PIPE_DEFAULT_SECRET'`.
- Riesgo: si se olvida configurar `JWT_SECRET`, todos los entornos podrían compartir el mismo secreto.

### 2.3 Persistencia local JSON en vez de DB empresarial
- `config/db.js` usa `data/db.json`.
- Riesgos en producción:
  - concurrencia (múltiples requests escribiendo el archivo)
  - corrupción del archivo
  - ausencia de transacciones
  - escalabilidad limitada

### 2.4 Validación y consistencia de esquemas
- Validaciones existen para campos requeridos, pero pueden mejorar:
  - validación de tipos/formatos (p.ej. `hora`, `fecha`, `estado`)
  - límites de longitud
  - normalización consistente

### 2.5 Potencial solapamiento de handlers en rutas
- `routes/estudiantesRoutes.js` registra dobles handlers `PUT` y `DELETE` para el mismo path.
- Riesgo: comportamiento inesperado o bypass parcial según el order de middlewares.

---

## 3. Recomendaciones de hardening (prioridad alta → media)

### 3.1 Prioridad alta
1. **Eliminar `PIPE_DEFAULT_SECRET`**
   - Falla segura: si falta `JWT_SECRET`, el proceso debe abortar.
2. **Eliminar solapamiento de rutas en `estudiantesRoutes.js`**
   - Dejar una única definición por método y aplicar `authorizeRoles` donde corresponda.
3. **Agregar controles de autorización consistentes**
   - Para endpoints críticos (crear/editar/eliminar), definir reglas por recurso y rol.

### 3.2 Prioridad media
4. **Validación formal de request**
   - Usar `zod` o `Joi` o `express-validator`.
5. **Normalización y catálogos de estado**
   - Definir enums para `estado` (casos/citas), `nivel_riesgo`, etc.
6. **Manejo unificado de errores**
   - Centralizar `sendError` / `sendSuccess` y un formato común.

### 3.3 Prioridad media-baja
7. **Rate limiting y protección básica**
   - Especialmente en `/auth/login`.
8. **Trazabilidad**
   - logs estructurados (p.ej. requestId) y niveles.

---

## 4. Control de errores y validación de datos (qué ya existe)

- Validación de campos requeridos en controllers.
- Manejo de `404` cuando el recurso no existe.
- Manejo de `409` en registro duplicado por correo.
- En frontend, interceptor maneja `401` limpiando token.

---

## 5. Checklist de estabilización específica contra recursión infinita

1. Confirmar que `migrateMissingFields()` no llame `readDb()`.
2. Mantener `ensureStorage()` sin llamadas recursivas.
3. Agregar un flag reentrante:
   - `let migrating = false` y si está activo, salir.
4. Añadir tests/escenarios:
   - db.json inexistente
   - db.json con estructura incompleta
   - db.json con datos antiguos (sin uuid/codigo_radicado)

---

## 6. Estado OKR en seguridad
- OKR no existe en el repo actual.
- No se documentan riesgos OKR específicos por ausencia de módulo.

---

**Fin — SEGURIDAD Y ESTABILIDAD PIPE**

