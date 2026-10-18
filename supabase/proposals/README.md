# Referencias de esquema y RLS

- `schema-observado.json`: estructura previa a la integración, sin registros personales.
- `01_acompanamiento_y_permisos.sql`: referencia del SQL revisado, con guardia de aprobación; no es un comando de arranque ni debe repetirse como SQL bruto.
- `../migrations/20261018003713_pipe_acompanamiento_rls_lote_autorizado.sql`: esquema de la versión registrada en producción. El lote personal fue aplicado en la misma transacción remota y permanece fuera de Git.

El historial de migraciones registra la versión aplicada para evitar repetirla. El lote privado también comprueba coincidencias y su idempotencia fue validada en PostgreSQL local y, sin commit, en producción. No se deshabilitó RLS ni se borraron filas anteriores.

La sustitución de políticas amplias es necesaria porque las políticas permisivas se combinan con OR. Ver la [publicación ejecutada](../../docs/PIPE_DESPLIEGUE_2026-10-17.md) y el [acceso sin SMTP](../../docs/PIPE_ACCESO_SIN_SMTP.md).
