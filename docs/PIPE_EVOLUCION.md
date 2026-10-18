# Evolución de PIPE original — revisión del 17 de octubre de 2026

> Estado histórico de preparación. La decisión posterior del propietario permite desplegar sin SMTP; consultar [Acceso sin SMTP](PIPE_ACCESO_SIN_SMTP.md). Los resultados de ejecución se registran por separado.

Consultar también la [auditoría final, respaldo, reversión y operación](PIPE_OPERACION.md), actualizada el 17 de octubre.

## Estado de esta entrega

Implementación local sobre la aplicación original React/Vite, su autenticación Supabase y sus rutas `/app/*`. No se ha hecho push ni despliegue. Después de la autorización expresa del propietario se registró una cuenta nueva de consejería mediante la conexión Supabase existente: Auth, identidad de email y perfil institucional inactivo. No se cambiaron cuentas ni credenciales anteriores. La aplicación publicada conserva la versión anterior.

Se retiraron el código, los datos simulados, las rutas, las pruebas y los comandos exclusivos de la aplicación de demostración. Se reutilizaron iconos, calendario, filtros, línea de tiempo, gráfica y tratamiento visual en los módulos originales. No hay selección de perfiles ficticios ni base paralela. Los módulos nuevos no almacenan expedientes en localStorage. Las funciones personales preexistentes de “Mi espacio PIPE” conservan su almacenamiento de preferencias y actividades individuales.

## Cambios funcionales

- Dashboard del equipo con indicadores calculados sobre los registros autorizados, filtros por estudiante y fecha, calendario, agenda e historial. Los errores de carga se muestran como errores; no se sustituyen por cifras de ejemplo.
- Expediente `/app/estudiantes/:id`: información académica confirmada, módulos relacionados, historial y evolución del acompañamiento. Los campos desconocidos quedan pendientes de confirmar.
- Citas: profesional asignado, caso opcional, motivo, fecha, horas inicial/final en Bogotá y estados diferenciados. Una cita pasada no se convierte automáticamente en atención realizada. Se rechazan atenciones futuras y horarios superpuestos del consejero.
- Consultas y observaciones: solo atenciones u observaciones efectivamente realizadas. Seguimientos: compromisos pendientes, cancelados o completados, con fecha efectiva de realización.
- Alertas, casos e intervenciones conservan sus módulos reales y ahora admiten filtros de expediente. Los selectores y las validaciones verifican que las relaciones correspondan al mismo estudiante.
- Consejeros pueden documentar intervenciones de sus estudiantes asignados. Solo administración conserva eliminación y alta; los consejeros no editan identidad ni vínculos de acceso de estudiantes.
- Mensajes motivacionales, estados vacíos, calendario responsive y modales con foco y cierre mediante Escape.
- Inicio de sesión acepta formatos institucionales `.edu` y `.edu.co`; Supabase Auth, el perfil activo y RLS siguen autorizando el acceso. UNIMINUTO documenta ambos dominios en su [manual de Tu clave](https://tuclave.uniminuto.edu/assets/ManualUsuario.pdf).
- “Crear acceso” en un expediente sin cuenta prepara la invocación de la función original `create-student`. El administrador debe verificar el correo real e introducir una contraseña individual. “Crear acceso de consejería” vincula una nueva cuenta al perfil institucional aprobado. La función vincula la cuenta al estudiante existente, fija rol 3 y nunca actualiza credenciales de una cuenta previa. Su código está preparado localmente; no se ha desplegado. También contempla activar únicamente una cuenta nueva previamente registrada como pendiente, después de habilitar su perfil bajo RLS; rechaza cambiar credenciales de cuentas ya activas.

La gráfica cuenta seguimientos efectivamente completados. No representa calificaciones oficiales, diagnósticos ni una predicción de deserción. No se crean alertas o intervenciones para rellenar los módulos.

## Esquema real verificado

La inspección de Supabase fue de solo lectura en el proyecto PIPE.1.0 correspondiente a la configuración existente. La evidencia estructural, sin filas personales, está en [`schema-observado.json`](../supabase/proposals/schema-observado.json).

Se observaron 16 tablas en `public`, todas con RLS habilitado. Existen estudiantes, programas, usuarios, citas, alertas, casos e intervenciones. No existen tablas de consultas, seguimientos o asignaciones de consejero. La tabla de citas no tiene profesional separado de autor, hora final ni vínculo al caso. Los indicadores nuevos no pueden completarse únicamente con el esquema actual.

Las políticas observadas de varios módulos permiten operaciones a cualquier usuario autenticado mediante expresiones `true`. También existen privilegios de tabla excesivos. Los controles visuales por rol no corrigen esa exposición. La propuesta sustituye esas políticas y conserva RLS habilitado.

## Contrato de acceso propuesto

[`01_acompanamiento_y_permisos.sql`](../supabase/proposals/01_acompanamiento_y_permisos.sql) está preparado para revisión, con una guardia que impide ejecutarlo sin una decisión explícita. Incluye:

1. Campos académicos adicionales y relaciones de citas, sin borrar filas existentes.
2. Tablas `consejero_estudiantes`, `consultas` y `seguimientos`, índices y restricciones.
3. Identidad institucional enlazada con Auth mediante `auth_user_id`. La compatibilidad por correo usa el email del JWT verificado cuando el vínculo aún es nulo; nunca usa el rol de `user_metadata`.
4. RLS: administración institucional, consejeros solo sobre sus asignados activos y estudiantes solo sobre su expediente, citas, consultas y seguimientos. Alertas, casos e intervenciones permanecen internos al equipo.
5. Conservación de autoría y estudiante original, consistencia de relaciones, validaciones de fechas y bloqueo de superposición de citas.
6. Revocación de accesos anónimos y de privilegios de tabla como `TRUNCATE`. La columna histórica `usuarios.password` no se concede al navegador.
7. RPC `pipe_access_context`, ejecutada con los permisos del solicitante y limitada por RLS. Los helpers con privilegios están en esquema privado, con `search_path` fijo y permisos mínimos.

El frontend solicita este contrato antes de leer expedientes o escribir. Si falta, no consulta las tablas académicas y muestra “Autorización de expedientes pendiente”. No recurre a las políticas amplias antiguas.

## Datos personales preparados para aprobación

Los registros concretos están únicamente en archivos privados ignorados por Git:

- `.local/approval/registros-previstos.json`: personas, información aportada, asignaciones y cinco citas propuestas con fechas futuras. Incluye cinco cuentas nuevas con los correos reales aportados: cuatro estudiantes y una consejera.
- `.local/approval/00_transaccion_completa_pendiente.sql`: esquema y lote personal ensamblados en una única transacción, con las tres decisiones de aprobación deshabilitadas.
- `.local/approval/03_altas_cuentas_pendientes.json`: cuatro solicitudes de alta estudiantil y una activación de consejería pendientes, sin contraseñas; sus identificadores se resolverán por el correo confirmado después del lote.
- `.local/approval/04_alta_consejera_autorizada.sql`: alta puntual ejecutada únicamente para la cuenta nueva inactiva; no actualizar ni repetir sobre cuentas existentes.
- `.local/approval/verificacion-alta-consejera.json`: comprobación posterior de existencia, rol, inactividad, ausencia de sesiones y conservación de la cuenta anterior.
- `.local/approval/manifest.json`: hashes de los archivos revisables, sin secretos.
- `.local/approval/02_incorporacion_pendiente.sql`: incorporación transaccional con comprobaciones de identidad y duplicados; reutiliza coincidencias compatibles y aborta ante discrepancias. Cada reejecución conserva las cantidades y no duplica registros.

El correo institucional aportado para la consejera no coincide con el perfil anterior. El propietario pidió expresamente conservar la cuenta anterior sin cambios y crear una nueva cuenta institucional. El alta puntual ya se ejecutó y verificó; el perfil nuevo y el acceso Auth permanecen inactivos, sin contraseña inicial, confirmación de correo ni sesiones. La cuenta anterior conserva intactos sus datos, rol y credenciales. El lote pendiente reutiliza el perfil nuevo con rol 2, lo vincula a su cuenta Auth y habilita su perfil únicamente dentro de la transacción que aplica RLS y sus cuatro asignaciones. El bloqueo de Auth se conserva hasta completar la activación con una contraseña individual. El lote propone cuatro asignaciones, hasta cuatro casos administrativos de planificación, cinco citas programadas y cuatro compromisos pendientes. No propone consultas históricas, intervenciones realizadas, alertas sin fundamento, notas o diagnósticos.

La conformidad de las personas fue comunicada por el propietario. Eso no sustituye la comprobación de sus correos, identidades y disponibilidad antes del alta de acceso o de confirmar las citas. Los horarios de 17:00 a 18:00 son propuestas de programación, no evidencia de asistencia.

No se deben publicar estos archivos ni introducir nombres o correos reales en el bundle, en fixtures públicos o en variables `VITE_*`. Los cinco correos fueron aportados por el propietario y verificados mediante SELECT antes del alta: no tenían coincidencias en Auth o usuarios. Tras la autorización puntual, el de consejería tiene exactamente una cuenta Auth, una identidad de email y un perfil institucional inactivo; los cuatro estudiantiles permanecen pendientes. No se han inventado direcciones ni contraseñas. Esta comprobación se repetirá antes de incorporar datos para detectar cambios concurrentes.

## Validación realizada

Desde `frontend/`, `npm.cmd test`: **27 pruebas aprobadas**. Cubren fechas de Bogotá, estados, filtros, indicadores, paginación, acceso cerrado sin RPC, alcance del repositorio, rutas, gráfica, ausencia de demo en el build y altas con cliente simulado. Las pruebas de la función transforman su TypeScript y usan transportes falsos; no llaman a Supabase ni crean cuentas.

Desde la raíz, `node scripts/validate-rls.mjs`: **152 comprobaciones aprobadas** con PostgreSQL PGlite temporal en memoria, reconstruido desde el esquema observado. Comprueba consejeros separados, lectura propia, escrituras ajenas denegadas, autoría, relaciones, horarios, revocación de asignación, privilegios anónimos y el lote privado aplicado dos veces sin duplicados. También comprueba la transacción combinada: una aprobación incompleta revierte los cambios de esquema. La cuenta anterior permanece intacta y el nuevo perfil de consejería solo puede consultar sus cuatro asignaciones. Todos sus usuarios de prueba son ficticios y solo existen dentro de esa base temporal. Si los archivos privados no están presentes, omite las comprobaciones del lote privado e informa el total ejecutado.

Preparar esa herramienta local, sin alterar dependencias del frontend:

```powershell
npm.cmd install --prefix .local/validation --no-package-lock --no-save --ignore-scripts --no-audit --no-fund @electric-sql/pglite@0.5.10
node scripts/validate-rls.mjs
```

`npm.cmd run build`, con las variables públicas verificadas, comprueba la compilación para `/PIPE/`. Si faltan o incluyen una clave privilegiada, el build ahora aborta. En esta estación `python scripts/check-release-remote.py --build` obtiene las variables públicas existentes de GitHub sin editar archivos de credenciales. La conexión del bundle con el proyecto se comprobó. Los builds anteriores sin variables solo demostraban compilación, no una conexión funcional. Vite informa una advertencia no bloqueante por el bundle principal de 507,58 kB (144,09 kB gzip), superior al umbral informativo de 500 kB. El workflow preparado ejecuta las pruebas antes de compilar. No se ha disparado GitHub Actions. La URL publicada respondió HTTP 200; corresponde a la versión anterior, sin estos cambios.

La restauración del respaldo, integración y contención conservadora superaron otras **92 comprobaciones locales** con `node scripts/validate-release.mjs`. La inspección visual se interrumpió por una restricción del control del navegador al determinar la URL. Quedan pendientes esa inspección, las pruebas con sesiones reales después de activar el esquema aprobado y la comprobación del resultado publicado. Las pruebas locales no prueban la configuración efectiva de Supabase Auth, CORS, SMTP o PostgREST en producción. La función mantiene el origen de GitHub Pages existente; no se amplió CORS a localhost.

## Activación coordinada, después de aprobación

1. Aprobar los archivos SQL concretos, el nuevo perfil de consejería, los registros y la publicación correspondiente. Revalidar coincidencias y fechas contra producción justo antes de escribir. Revisar los respaldos de la base y la versión publicada.
2. Publicar primero el frontend que bloquea expedientes sin el nuevo contrato, solo con autorización de despliegue. El frontend anterior usa lecturas incompatibles con la revocación del acceso a la columna histórica de contraseña; no aplicar el SQL dejando esa versión como cliente definitivo.
3. Aplicar el archivo privado `00_transaccion_completa_pendiente.sql` aprobado como **una sola transacción coordinada**. Ya contiene un único `BEGIN` y `COMMIT`; habilitar solo las tres decisiones expresamente aprobadas. Las asignaciones y citas usan el identificador del nuevo perfil de consejería. La cuenta anterior no recibe las nuevas asignaciones ni cambia de rol.
4. Verificar desde sesiones separadas que el consejero ve únicamente sus cuatro asignaciones, que un estudiante no ve las de otro y que las tablas mantienen RLS. Confirmar que los indicadores coinciden con los registros efectivamente incorporados.
5. Desplegar la función actualizada solo con autorización. Crear y vincular las cuatro cuentas estudiantiles desde sus expedientes. La nueva cuenta profesional se vincula desde “Crear acceso de consejería” al perfil preparado por el lote; la función comprueba que su rol sea consejero y no cambia cuentas previas. Entregar las contraseñas individuales mediante el procedimiento privado institucional; no usar una contraseña común ni publicarlas en el repositorio.
6. Verificar login, expedientes y citas de cada rol en la publicación final. No volver al SQL RLS histórico ni al frontend incompatible como solución de rollback; restaurar una versión que conserve el contrato de acceso o mantener el bloqueo mientras se corrige el problema.

La autorización puntual recibida cubre la creación de la cuenta nueva conservando la anterior. El lote académico, la activación de los permisos, las cuatro altas estudiantiles y el despliegue siguen pendientes de aprobación; la compilación no autoriza su ejecución.
