# Operaciones pendientes de aprobación

- `schema-observado.json`: inspección estructural de solo lectura, sin registros personales.
- `01_acompanamiento_y_permisos.sql`: propuesta de esquema, RLS y validaciones; no ejecutada en Supabase. Aborta salvo que se habilite explícitamente la aprobación indicada en el archivo.
- Los registros personales y su SQL se conservan fuera de Git en `.local/approval/`.

El SQL de esquema se aplica una sola vez sobre el estado observado. No es un comando automático de arranque ni una migración que deba ejecutarse repetidamente. El lote de incorporación privado sí comprueba duplicados y su reejecución local se ha probado.

La sustitución de políticas amplias es necesaria porque PostgreSQL combina las políticas permisivas con OR. No basta con añadir otra política restrictiva. Se conserva RLS habilitado y no se eliminan filas existentes.

Consultar la [implementación y secuencia de activación](../../docs/PIPE_EVOLUCION.md) antes de aprobar. El perfil nuevo de consejería y el lote personal deben coordinarse con el nuevo contrato de acceso y la publicación autorizada.

La migración versionada equivalente, creada mediante Supabase CLI 2.121.0, es `../migrations/20261017233904_pipe_acompanamiento_rls.sql`. Mantiene la misma guardia de aprobación y no está aplicada. No contiene los datos personales del lote. La [guía de operación](../../docs/PIPE_OPERACION.md) documenta la contención sin borrar registros y las pruebas adicionales de restauración.
