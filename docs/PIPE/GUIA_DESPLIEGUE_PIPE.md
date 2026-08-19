# GUÍA DE DESPLIEGUE — PIPE

---

## 1. Prerrequisitos

- Node.js instalado.
- Acceso a un entorno con puertos libres (backend típicamente `3000`).
- Recomendado: Git y un sistema de variables de entorno (no commitear `.env`).

---

## 2. Ejecutar localmente (desarrollo)

### 2.1 Backend
1. En la raíz del proyecto:
   ```bash
   npm install
   npm run dev
   ```
2. Configurar variables de entorno en un archivo `.env` (en la raíz del backend):
   - Variables observadas/esperadas:
     - `SUPABASE_URL` (requerida por `config/supabase.js` si se usa)
     - `SUPABASE_SERVICE_KEY` (requerida por `config/supabase.js` si se usa)
     - `JWT_SECRET` (usada por `middleware/auth.js`)
     - `PORT` (opcional; default 3000)

> **Nota importante:** aunque la lógica CRUD actual usa `config/db.js` (JSON local), `config/supabase.js` lanza error si faltan `SUPABASE_URL` o `SUPABASE_SERVICE_KEY`.

3. Verificar que el backend levanta:
   - `http://localhost:3000/`

### 2.2 Frontend
1. Entrar al directorio `frontend`:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
2. Abrir la URL que muestre Vite (típicamente `http://localhost:5173`).

---

## 3. Variables de entorno (documentadas)

Basado en el repo:

### Backend
- `SUPABASE_URL`
- `SUPABASE_SERVICE_KEY`
- `JWT_SECRET`
- `PORT`

**Archivos de ejemplo**
- El repo menciona `.env` y `.env.local`. Asegurar que NO se suben secretos a Git.

---

## 4. Despliegue en producción (recomendado)

### 4.1 Objetivo
Preparar el sistema para operación empresarial minimizando:
- inestabilidad del backend
- problemas de concurrencia
- exposición de secretos

### 4.2 Checklist de producción

#### Seguridad
- [ ] Definir `JWT_SECRET` en producción (sin defaults).
- [ ] Aplicar rate limiting en `/auth/login`.
- [ ] Eliminar cualquier retorno de información sensible (p.ej. `plain_password`) en entornos que no sean dev.

#### Estabilidad / Datos
- [ ] Asegurar persistencia consistente si se usa `data/db.json`.
- [ ] Si hay múltiples instancias del backend, **no usar JSON local compartido** sin un mecanismo de locking / persistencia central.
- [ ] Migraciones/validaciones: ejecutar y probar `migrateMissingFields()`.

#### Observabilidad
- [ ] Logs estructurados (nivel, timestamp) y trazabilidad por request.
- [ ] Manejo de errores con respuestas consistentes.

### 4.3 Empaquetado y ejecución
- Backend:
  - `npm ci` (preferible)
  - `npm start` (o `node app.js`)
- Frontend:
  - `npm run build`
  - servir estáticos con un servidor (si aplica) o proxy reverso.

---

## 5. Docker (si aplica)

En el repositorio actual **no se identifican archivos Dockerfile/compose** en el listado que se inspeccionó. Por lo tanto:
- **No se incluye configuración Docker “garantizada”** para evitar inventar artefactos.

> Si deseas, se puede crear una propuesta Docker estándar para:
> - servicio backend
> - build frontend
> - configuración de variables de entorno
> - volumen para `data/db.json`

---

## 6. Ruta rápida de verificación post-despliegue

1. Login con un usuario válido.
2. Acceso a `/dashboard`.
3. Verificar lectura de listas:
   - `/estudiantes`
   - `/alertas`
   - `/casos`
   - `/intervenciones`
   - `/citas`
4. Realizar alta/edición/borrado de al menos un recurso.
5. Validar métricas del dashboard:
   - casos abiertos
   - citas hoy
   - alto riesgo

---

**Fin — Guía de despliegue PIPE**

