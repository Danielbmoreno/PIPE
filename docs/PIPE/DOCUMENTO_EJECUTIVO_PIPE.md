# DOCUMENTO EJECUTIVO — PIPE

---

## 1. ¿Qué es PIPE?

**PIPE (Plataforma Integrada de Procesos Empresariales)** es una aplicación web full-stack diseñada para operar y hacer seguimiento a información relacionada con estudiantes y acompañamiento institucional, mediante un conjunto de módulos:
- **Estudiantes**
- **Alertas**
- **Casos**
- **Intervenciones**
- **Citas**
- **Dashboard de métricas**

El sistema incluye control de acceso por roles basado en **JWT**.

---

## 2. ¿Qué problema resuelve?

Centraliza datos y procesos de acompañamiento, permitiendo:
- gestionar el ciclo de vida de seguimientos (alertas → casos → intervenciones → citas)
- medir indicadores operativos desde un dashboard
- asegurar que las acciones estén restringidas según el rol del usuario

---

## 3. Valor del sistema (beneficios)

- **Trazabilidad operativa:** cada módulo registra información con relaciones mediante `estudiante_id`, `usuario_id` y `caso_id`.
- **Visibilidad:** el dashboard resume métricas calculadas desde los datos.
- **Seguridad de acceso:** autenticación con JWT e inferencia de rol (`rol_id`).
- **Arquitectura modular:** backend con controladores, rutas y middleware.

---

## 4. Estado actual (según el repo)

- Backend Express con endpoints REST y middleware de seguridad.
- Persistencia implementada mediante storage JSON local (`data/db.json`) usando `config/db.js`.
- Existe configuración de Supabase (`config/supabase.js`), pero el flujo observado de CRUD en controllers usa storage local.
- Se documenta (y el repo contiene) prevención de **recursión infinita** en migraciones/missing fields.
- El módulo **OKR no aparece implementado** en el código actual.

---

## 5. Riesgos y limitaciones actuales

- Storage JSON local limita concurrencia, escalabilidad y robustez para entornos empresariales.
- Secretos por defecto deben eliminarse en producción.
- Potencial solapamiento de handlers en rutas (observado en `estudiantesRoutes.js`).

---

## 6. Roadmap sugerido (orientado a producción)

1. **Estabilización y hardening**
   - eliminar solapamiento de middlewares
   - validaciones formales por esquema
   - eliminación de default secretos
2. **Gestión de datos empresarial**
   - migrar de `data/db.json` a una base relacional con migraciones (p.ej. PostgreSQL)
3. **OKR (si es requisito del producto)**
   - definir entidades OKR y su relación con tareas/casos
   - crear endpoints e integración con el dashboard
4. **Operación continua**
   - observabilidad (logs/metrics)
   - rate limiting para auth
   - estrategia de despliegue con contenedores

---

## 7. Conclusión

PIPE está en un estado funcional con módulos core, autenticación JWT y métricas en dashboard. Para convertirlo en **producto listo para producción empresarial**, se recomienda priorizar: consistencia de seguridad, robustez de persistencia, validaciones y completar el alcance del módulo OKR (si aplica).

---

**Fin — Documento Ejecutivo PIPE**

