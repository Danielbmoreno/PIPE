# MANUAL DE USUARIO — PIPE

**PIPE (Plataforma Integrada de Procesos Empresariales)** es un sistema web para gestionar información operativa asociada a estudiantes y acompañamiento (alertas, casos, intervenciones y citas), con acceso controlado por roles.

> **Nota sobre OKR:** en el código actual del repositorio no existe un módulo OKR con endpoints o UI específica. El apartado OKR se deja documentado como **“pendiente / no implementado”**.

---

## 1. Acceso al sistema (inicio de sesión)

### 1.1 Crear sesión (Login)
1. Ingrese a la ruta `/login`.
2. Proporcione su correo institucional y contraseña.
3. El sistema validará las credenciales y emitirá un **token JWT**.
4. Al completar correctamente, el sistema lo redirigirá al dashboard.

### 1.2 Registro (si su rol permite alta)
Dependiendo del despliegue/operación, puede existir la función de registro.
- Endpoint: **`POST /auth/register`**
- Requiere:
  - `nombre`
  - `correo` (debe terminar en `.edu`)
  - `password`
  - `rol_id` (`admin`, `docente`, `consejero`, `estudiante`)

---

## 2. Navegación del dashboard

El dashboard integra vistas relacionadas con:
- **Métricas (Dashboard)**: resumen operativo del sistema.
- **Estudiantes**: listado y gestión de estudiantes.
- **Alertas**: alertas asociadas a estudiantes.
- **Casos**: casos abiertos/cerrados y su seguimiento.
- **Intervenciones**: acciones/seguimientos sobre casos.
- **Citas**: agendamiento y estado de citas.

### Recomendación de uso por roles
- El control de acceso se realiza por **`rol_id`**.
- En el backend, algunas operaciones de escritura (crear/actualizar/eliminar) pueden estar restringidas según el recurso.

---

## 3. Gestión de estudiantes

### 3.1 Ver estudiantes
1. Ingrese al módulo **Estudiantes**.
2. Consulte el listado ordenado de manera descendente por identificador.

### 3.2 Crear estudiante
1. En **Estudiantes**, seleccione **Crear**.
2. Complete:
   - `nombre`
   - `codigo`
   - `programa` (opcional)
   - `semestre` (opcional)
   - `nivel_riesgo` (opcional)
   - `correo` (opcional; si no se envía, se genera con `codigo@universidad.edu`)
   - `password` (opcional; si no se envía, el sistema genera una contraseña)
3. Guardar.

**Validaciones comunes**
- El correo debe terminar en `.edu`.
- Si el correo ya existe en el sistema, se retornará un error **409 (conflicto)**.

### 3.3 Editar estudiante
1. Abra el registro.
2. Actualice campos permitidos:
   - `nombre`, `codigo`, `programa`, `semestre`, `nivel_riesgo`
3. Guardar.

### 3.4 Eliminar estudiante
1. Seleccione **Eliminar** en el registro.
2. Confirme la acción.

---

## 4. Gestión de tareas operativas (recursos)

En el repositorio, el equivalente funcional de “tareas” está representado por los recursos:
- **Alertas**
- **Casos**
- **Intervenciones**
- **Citas**

Cada recurso corresponde a un flujo de registro/actualización y su estado (cuando aplica) se refleja en métricas y listados.

---

## 5. Cómo crear, editar y asignar tareas

> En PIPE, “asignar” se modela mediante la relación con `usuario_id` (usuario responsable o creador según el flujo del cliente).

### 5.1 Alertas

#### Crear alerta
1. En **Alertas**, seleccione **Crear**.
2. Ingrese:
   - `estudiante_id`
   - `usuario_id`
   - `descripcion`
   - `nivel_riesgo`
3. Guardar.

#### Editar alerta
- Actualice `descripcion` y/o `nivel_riesgo`.

#### Eliminar alerta
- Eliminar el registro de alerta.

---

### 5.2 Casos

#### Crear caso
1. En **Casos**, seleccione **Crear**.
2. Ingrese:
   - `estudiante_id`
   - `usuario_id`
   - `descripcion`
   - `estado`
3. Guardar.

> El estado impacta métricas del dashboard.

#### Editar caso
- Actualice `descripcion` y/o `estado`.

#### Eliminar caso
- Eliminar el registro de caso.

---

### 5.3 Intervenciones

#### Crear intervención
1. En **Intervenciones**, seleccione **Crear**.
2. Ingrese:
   - `caso_id`
   - `usuario_id`
   - `descripcion`
3. Guardar.

#### Editar intervención
- Actualice `descripcion`.

#### Eliminar intervención
- Eliminar el registro de intervención.

---

### 5.4 Citas

#### Crear cita
1. En **Citas**, seleccione **Crear**.
2. Ingrese:
   - `estudiante_id`
   - `usuario_id`
   - `fecha`
   - `hora`
   - `motivo`
   - `estado`
3. Guardar.

#### Editar cita
- Actualice `fecha`, `hora`, `motivo`, `estado`.

#### Eliminar cita
- Eliminar el registro de cita.

---

## 6. Cómo funciona el sistema de OKR (pendiente)

En el estado actual del repositorio:
- No se identifican módulos, tablas o endpoints relacionados explícitamente con OKR (Objetivos y Key Results).

### Impacto en operación
- Las métricas del dashboard presentes en el backend se basan en:
  - cantidad de estudiantes
  - alertas
  - casos abiertos
  - citas del día
  - estudiantes en alto riesgo

### Recomendación
- Si desea implementar OKR real, se debe definir:
  - entidades (Objective, KeyResult, Owner, Status)
  - relaciones con usuarios y tareas (casos/citas)
  - endpoints y UI

---

## 7. Casos de uso (paso a paso)

### Caso de uso A: Registrar un estudiante y generar gestión
1. Crear estudiante en **Estudiantes**.
2. Crear una **Alerta** o **Caso** para iniciar acompañamiento.
3. Registrar **Intervención** asociada a un caso.
4. Agendar **Cita** y actualizar su estado.

### Caso de uso B: Cerrar seguimiento
1. Actualizar `estado` del **Caso**.
2. Registrar intervenciones necesarias.
3. Confirmar citas completadas actualizando `estado`.
4. Ver cambios en el **Dashboard**.

---

## 8. Errores comunes y solución básica

### 8.1 `401 Unauthorized` — Token no proporcionado o inválido
**Síntomas:** el usuario es redirigido a login o se bloquean operaciones.
- Causa típica: token expirado o no existe.
- Solución:
  - iniciar sesión nuevamente
  - confirmar que `pipe_auth` está presente en localStorage

### 8.2 `403 Forbidden` — No autorizado por rol
- Causa típica: el rol no está permitido para esa acción (ej. crear/editar donde hay `authorizeRoles`).
- Solución:
  - validar `rol_id` del usuario

### 8.3 `400 Bad Request` — Validación de campos
- Causa típica: campos requeridos vacíos o formato inválido.
- Solución:
  - completar campos obligatorios (`descripcion`, `nivel_riesgo`, `estado`, etc.)

### 8.4 `404 Not Found`
- Causa típica: se intenta editar/eliminar un recurso que no existe.
- Solución:
  - volver al listado y reintentar

### 8.5 `409 Conflict` — Recurso duplicado (ej. correo)
- Causa típica: correo institucional ya existe.
- Solución:
  - usar otro correo o validar unicidad previa

---

## 9. Apéndice — Mensajes del sistema (referencia rápida)
- **“Ruta no encontrada”**: endpoint inexistente.
- **“Usuario no válido” / “Token inválido”**: autenticación.
- **“Se debe enviar al menos un campo para actualizar”**: body sin cambios.

---

**Estado actual:** documentación basada en el repositorio existente. El módulo OKR se documenta como **pendiente/no implementado** dado que no aparece en código. 

