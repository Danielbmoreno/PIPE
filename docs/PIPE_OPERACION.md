# Preparación de producción de PIPE original

> Estado histórico de preparación. La decisión posterior del propietario permite desplegar sin SMTP; consultar [Acceso sin SMTP](PIPE_ACCESO_SIN_SMTP.md). Los resultados de ejecución se registran por separado.

Revisión: 17 de octubre de 2026. Estado: preparado localmente; producción pendiente de aprobación expresa. Esta guía complementa [la evolución funcional](PIPE_EVOLUCION.md).

## Configuración y compilación verificadas

El build anterior podía terminar sin variables Supabase; eso no demostraba una conexión funcional. Ahora `vite.config.js` exige URL y clave pública válidas antes de compilar. `publicConfig.js` rechaza claves secretas, JWT `service_role` y JWT de otro proyecto. El mismo control protege la inicialización del cliente. Supabase JS queda fijado a 2.112.3 en el frontend, el lockfile y la Edge Function.

GitHub Actions conserva `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`; el nombre de esta última también admite la clave moderna `sb_publishable_`. La inspección de solo lectura verificó el proyecto, la clave pública y el acceso a Auth. No se alteraron variables, secretos ni archivos `.env`.

Para compilar con variables ya disponibles en el entorno:

```powershell
cd frontend
npm.cmd ci
npm.cmd test
npm.cmd run build
```

Para esta estación de trabajo, sin escribir archivos de credenciales, se preparó:

```powershell
python scripts/check-release-remote.py --build
```

Lee las variables públicas existentes de Actions usando la credencial GitHub disponible, comprueba Auth, seis tablas sin sesión y la publicación actual, respalda los recursos publicados y compila con esas variables solo en la memoria del proceso. Si falta acceso, aborta; no inicia autenticación interactiva. La evidencia privada no guarda claves ni respuestas con expedientes.

## Autenticación de la función

El endpoint público JWKS anuncia ES256. La configuración local `supabase/config.toml` prepara `verify_jwt = false` para el verificador antiguo del gateway de `create-student`. La función exige `Authorization: Bearer`, valida al usuario con `auth.getUser()` y exige un administrador activo mediante `pipe_access_context` antes de usar el cliente administrativo. No autoriza por claims editables ni por el origen CORS. La ausencia o invalidez de sesión produce 401 y la falta de permisos, 403.

Esto requiere desplegar la configuración junto con el código; modificar el archivo local no cambia la función publicada. Supabase documenta esta compatibilidad en [JWT signing keys](https://supabase.com/docs/guides/auth/signing-keys) y [authorization headers](https://supabase.com/docs/guides/functions/auth-headers). RLS permanece habilitado.

## Módulos institucionales

Estadísticas (`/app/estadisticas`) y Actividad reciente (`/app/actividad`) están integrados en el router y menú originales. Consultan el mismo repositorio con alcance RLS; admiten filtros por estudiante y fechas, desglosan estados reales y muestran historial paginado. El estudiante recibe solo sus datos permitidos, sin notas internas del equipo. No usan datos de presentación ni almacenamiento académico local.

## Evidencia y limitaciones

| Comprobación | Resultado local o de solo lectura |
| --- | --- |
| Frontend, rutas, fechas, indicadores, repositorio y altas simuladas | 27 pruebas aprobadas |
| RLS por rol y operación, relaciones, fechas y lote idempotente | 152 comprobaciones aprobadas |
| Restauración del respaldo, integración y contención | 92 comprobaciones aprobadas |
| Edge Function, `deno check --no-config` con Deno 2.9.6 | Tipos correctos; no ejecuta el handler ni despliega |
| Compilación con configuración real de GitHub | Correcta; conexión pública comprobada en el bundle |
| Seis tablas privadas sin sesión | Ninguna devolvió filas |
| Publicación actual | HTTP 200; versión anterior |

Las 92 comprobaciones restauran las 16 tablas con sus claves foráneas activas, comparan todos los campos respaldados, aplican el lote a esa copia y prueban el alcance de consejería y de cada estudiante. Los accesos se emulan en el motor PostgreSQL local; no representan sesiones Supabase Auth reales. Los registros de prueba solo existen en bases temporales.

No se validó visualmente la interfaz: el control del navegador se detuvo al no poder determinar su URL con confianza. No se ha probado login real de las cuentas nuevas, porque siguen pendientes la integración, sus credenciales iniciales y la activación. No se hicieron CRUD de prueba en producción. El build informa una advertencia de tamaño de 507,58 kB; no impide compilar.

## Respaldo y reversión conservadora

Los respaldos privados están en `.local/backups/`, excluidos de Git. Contienen datos institucionales, columnas, restricciones, políticas, privilegios, estados RLS, código de la función publicada y recursos de Pages. El manifiesto registra SHA-256. Se excluyen `usuarios.password` y los secretos de Auth porque no forman parte de los cambios autorizables sobre datos existentes. No es un respaldo integral de Supabase Auth, Storage o configuración SMTP.

La consulta del catálogo de respaldos físicos no ofreció puntos disponibles y PITR aparece deshabilitado. No se habilitaron servicios ni se incurrió en costos. Para este lote se verificó la restauración lógica de los registros afectados; antes de ejecutar se debe refrescar el respaldo y comparar cualquier cambio concurrente.

La transacción principal revierte automáticamente si falla antes de `COMMIT`. Después del commit, `.local/approval/05_contencion_reversion_pendiente.sql` prepara una contención: desactiva solamente el perfil nuevo y sus asignaciones previstas, manteniendo expedientes, citas, casos, seguimientos, RLS y toda actividad registrada. Aborta ante una identidad distinta u otras asignaciones. Requiere autorización propia dentro del plan aprobado.

No se ha preparado un borrado masivo ni una restauración de políticas permisivas. La contención reduce el acceso; no devuelve todo el esquema al estado anterior. Para el frontend se debe usar una versión compatible con el contrato seguro o mantener el bloqueo de acceso. El bundle anterior respaldado es evidencia y no debe restaurarse como cliente definitivo tras cambiar los permisos.

## Credenciales y procedimiento de rotación

`python scripts/audit-release.py --verify-remote` revisa los objetos Git alcanzables y los archivos publicables. Solo guarda hashes, ubicaciones y resultados de consultas de lectura. No imprime claves ni firma tokens nuevos. No encontró claves privilegiadas literales en el código publicable actual.

Se observó una clave administrativa en el historial. Tanto esa clave como la otra configuración administrativa local recibieron 401 en Auth admin y REST. Esto prueba el rechazo de esas credenciales exactas en los dos endpoints comprobados; no prueba por sí solo la revocación de todos los secretos relacionados o su ausencia en servicios externos.

Las configuraciones `JWT_SECRET` observadas pertenecen al backend Express histórico. Ninguna coincide con la firma de los tokens Supabase observados. No deben confundirse con la clave de firma vigente de Supabase. El frontend de Pages no usa ese backend; no se inició ni publicó el servidor histórico.

Procedimiento preparado, pendiente de decisión cuando se identifique un secreto vigente:

1. Identificar emisor, alcance, huella y consumidores reales: función, backend, CI y sesiones afectadas. No rotar una clave global por el nombre de una variable local.
2. Para una clave secreta activa de Supabase: crear un reemplazo específico del servidor, actualizar únicamente sus consumidores en canales privados y probar Auth/función. Revocar la antigua después de confirmar el cambio. Nunca colocarla en `VITE_*`.
3. Para una clave de firma: revisar la migración y revocación mediante [JWT signing keys](https://supabase.com/docs/guides/auth/signing-keys), la duración de tokens, clientes y compatibilidad de Edge Functions. No revocar antes de evaluar el impacto sobre sesiones.
4. Para el JWT del backend histórico: confirmar si existe un servidor activo antes de sustituir su secreto; coordinar el cierre de sesiones de ese servidor. No requiere cambiar las contraseñas personales.
5. Comprobar el rechazo del secreto antiguo y el funcionamiento del nuevo sin registrar sus valores. Limpiar el historial solo después de neutralizar el secreto y con una decisión específica sobre la reescritura de Git.

La rotación o revocación es un cambio de producción y no se ha ejecutado. El procedimiento oficial distingue [API keys y claves de firma](https://supabase.com/docs/guides/getting-started/api-keys). Cualquier credencial vigente expuesta confirmada bloqueará la publicación hasta su tratamiento autorizado.

## Secuencia autorizable

1. Revisar el paquete privado y aprobar el alcance exacto: permisos, lote, habilitación del perfil nuevo y despliegue. Las fechas son propuestas de programación; la aprobación debe confirmarlas como compromisos a registrar.
2. Revalidar identidades, coincidencias, fechas, respaldos y claves inmediatamente antes de ejecutar. Detenerse si hay conflictos, una credencial privilegiada vigente expuesta o una diferencia no contemplada.
3. Publicar el frontend que bloquea expedientes sin contrato, dentro de una ventana coordinada. Puede mostrar temporalmente «Autorización de expedientes pendiente». El cliente anterior usa `select('*')` sobre usuarios y es incompatible con los nuevos permisos por columna.
4. Aplicar la transacción privada combinada aprobada una sola vez: incluye la migración versionada y el lote idempotente. No aplicar únicamente la parte de esquema y abandonar el despliegue. Las tres guardias permanecen deshabilitadas en los archivos.
5. Verificar RLS, cantidades e identificadores reales. Desplegar `create-student` con la configuración de autenticación descrita. Las altas se gestionan mediante la función original.
6. Establecer las credenciales individuales iniciales de las cuentas nuevas por el procedimiento institucional. Activar únicamente la cuenta nueva marcada como pendiente; no restablecer las cuentas anteriores. Sin este paso no se debe anunciar que el nuevo acceso funciona.
7. Iniciar sesiones reales de administrador, consejería y estudiantes; comprobar expedientes, permisos negativos, citas programadas, cuatro compromisos pendientes, indicadores y errores. Registrar el resultado publicado. No crear actividades ficticias completadas para esas pruebas.

No se hizo commit, push, despliegue, migración remota, alta estudiantil ni activación durante esta preparación.
