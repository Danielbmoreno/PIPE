# Avance del proyecto PIPE

## 1. Estado actual

- Backend en **Node.js + Express** listo.
- Conexión a **Supabase** configurada en `config/supabase.js`.
- Uso de variables de entorno en `.env`.
- Estructura modular con rutas separadas en `routes/` y controladores en `controllers/`.
- No se está obligando a usar autenticación JWT para las rutas CRUD principales.

## 2. Archivos clave

- `app.js`
- `package.json`
- `.env`
- `config/supabase.js`
- `routes/estudiantesRoutes.js`
- `routes/alertasRoutes.js`
- `routes/casosRoutes.js`
- `routes/intervencionesRoutes.js`
- `routes/citasRoutes.js`
- `controllers/estudiantesController.js`
- `controllers/alertasController.js`
- `controllers/casosController.js`
- `controllers/intervencionesController.js`
- `controllers/citasController.js`
- `middleware/auth.js` (listo para uso futuro)

## 3. Funcionalidades implementadas

### Estudiantes
- `GET /estudiantes` - Listar todos
- `GET /estudiantes/:id` - Obtener uno
- `POST /estudiantes` - Crear
- `PUT /estudiantes/:id` - Actualizar
- `DELETE /estudiantes/:id` - Eliminar

### Alertas
- `GET /alertas` - Listar todas
- `POST /alertas` - Crear
- `PUT /alertas/:id` - Actualizar
- `DELETE /alertas/:id` - Eliminar

### Casos
- `GET /casos` - Listar todos
- `POST /casos` - Crear
- `PUT /casos/:id` - Actualizar
- `DELETE /casos/:id` - Eliminar

### Intervenciones
- `GET /intervenciones` - Listar todas
- `POST /intervenciones` - Crear
- `PUT /intervenciones/:id` - Actualizar
- `DELETE /intervenciones/:id` - Eliminar

### Citas
- `GET /citas` - Listar todas
- `POST /citas` - Crear
- `PUT /citas/:id` - Actualizar
- `DELETE /citas/:id` - Eliminar

## 4. Conexión a Supabase

- Archivo: `config/supabase.js`
- Usa `@supabase/supabase-js`
- Lee `SUPABASE_URL` y `SUPABASE_KEY` desde `.env`

## 5. Consideraciones actuales

- Todas las rutas principales funcionan sin validación de token.
- Se mantuvo `authRoutes` en el código, pero el middleware JWT no se aplica a las rutas CRUD principales.
- Los endpoints usan `supabase.from(...).select(...)` para leer y `insert`, `update`, `delete` para modificar datos.
- Se agregó `console.log` en rutas y controladores para depuración.

## 6. Próximos pasos sugeridos

1. Verificar que `config/supabase.js` exista y tenga la URL y Key correctas.
2. Probar los endpoints con `curl` o Postman.
3. Si se desea, habilitar autenticación en un segundo paso.
4. Añadir validaciones más estrictas de datos.
5. Crear documentación de endpoints definitiva y tests automáticos.

## 7. Estado del repositorio

- `README.md` contiene información general.
- `TESTING.md` tiene ejemplos de peticiones.
- `REFERENCIA_RAPIDA.md` resume cambios y rutas.
- `RESUMEN_CAMBIOS.md` detalla ajustes por archivo.
- `EJEMPLOS.json` contiene ejemplos de payloads.

---

Documento generado automáticamente con el estado actual del proyecto PIPE.