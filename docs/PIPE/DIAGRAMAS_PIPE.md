# DIAGRAMAS DEL SISTEMA — PIPE (Mermaid)

> Formatos: Mermaid.js

---

## A) Arquitectura general

```mermaid
flowchart LR
  U[Usuarios por rol] -->|Login / JWT| FE[Frontend Web (React/Vite)]
  FE -->|REST + Authorization: Bearer| BE[Backend API (Node/Express)]
  BE -->|Lectura/Escritura| DB[(Storage JSON local: data/db.json)]
  BE -->|Config (no observado en controladores)| SB[(Supabase Config)]

  FE -->|Visualiza| DASH[Dashboard: métricas]
```

---

## B) Flujo de datos

### B1) Creación de “tarea” (ejemplo: Caso)

```mermaid
sequenceDiagram
  autonumber
  actor Usuario
  participant FE as Frontend
  participant BE as Backend Express
  participant DB as config/db.js

  Usuario->>FE: Completar formulario de creación
  FE->>FE: Axios interceptor agrega Authorization
  FE->>BE: POST /casos {estudiante_id, usuario_id, descripcion, estado}
  BE->>BE: Validar campos
  BE->>DB: insert('casos', payload)
  DB->>DB: ensureStorage() (si aplica) + migración de campos
  DB->>DB: writeDb(db)
  DB-->>BE: nuevo registro (con uuid/codigo_radicado)
  BE-->>FE: 201 OK (sendSuccess)
  FE-->>Usuario: Caso creado y visible en UI
```

### B2) Asignación a usuario (responsable)

```mermaid
flowchart TD
  A[Formulario/Entidad] -->|usuario_id| B[Registro en recurso]
  B --> C[Backend valida request]
  C --> D[Storage JSON persiste usuario_id]
  D --> E[Dashboard/Lista muestra información]
```

### B3) Actualización de estado (ejemplo: Caso / Cita)

```mermaid
sequenceDiagram
  autonumber
  actor Usuario
  participant FE as Frontend
  participant BE as Backend
  participant DB as Storage JSON

  Usuario->>FE: Cambiar estado
  FE->>BE: PUT /casos/:id o PUT /citas/:id
  BE->>DB: update(tabla, id, {estado, ...})
  DB-->>BE: Registro actualizado
  BE-->>FE: 200 OK
  FE-->>Usuario: Estado reflejado
```

### B4) “Sincronización con Dashboard OKR” (pendiente)

```mermaid
flowchart TD
  T[(OKR / Key Results)] -->|No implementado en repo| DBDASH[Dashboard actual]

  subgraph Dashboard actual
    M1[Recupera métricas desde data/db.json]
    M2[calcula casos abiertos, citas hoy, alto riesgo]
  end

  DBDASH --> UI[Visualización en Frontend]
```

---

## C) Diagrama de módulos

```mermaid
flowchart TB
  subgraph AUTH[Auth]
    M1[POST /auth/login]
    M2[POST /auth/register]
    MW1[authenticateToken]
    MW2[authorizeRoles]
  end

  subgraph TASKS[Tasks / Recursos]
    T1[Estudiantes]
    T2[Alertas]
    T3[Casos]
    T4[Intervenciones]
    T5[Citas]
  end

  subgraph OKR[OKR]
    O1[Pendiente / no implementado]
  end

  subgraph USERS[Users]
    U1[usuarios (tabla JSON)]
    U2[relación: usuario_id]
    U3[relación: estudiante.usuario_id]
  end

  subgraph STORAGE[Storage / DB layer]
    S1[config/db.js]
    S2[data/db.json]
    S3[migrateMissingFields(): uuid/codigo_radicado]
    S4[Prevención recursión infinita]
  end

  FE[Frontend] -->|REST| BE[Backend Express]
  BE --> MW1
  BE --> MW2
  BE --> TASKS
  BE --> USERS
  BE --> STORAGE
  BE --> OKR
```

---

**Fin — DIAGRAMAS PIPE**

