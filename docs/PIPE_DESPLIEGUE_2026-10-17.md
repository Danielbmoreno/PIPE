# PIPE original — publicación del 17 de octubre de 2026

La actualización institucional se publicó mediante GitHub Pages y utiliza la base Supabase existente. No se creó una aplicación paralela ni se publicaron los archivos privados del lote.

## Operaciones ejecutadas

- Frontend institucional: [implementación a6efd3a](https://github.com/Danielbmoreno/PIPE/commit/a6efd3a1765c0cc3d1848de030594fd3473285b2), con workflow de Pages aprobado. Los recursos HTTP publicados coinciden con el build comprobado.
- Migración `20261018003713_pipe_acompanamiento_rls_lote_autorizado`: esquema y lote autorizado aplicados juntos en una transacción. La versión corresponde al reloj UTC del servidor; en Colombia la ejecución fue el 17 de octubre.
- Incorporación autorizada: cuatro expedientes, cuatro asignaciones, cuatro casos de planificación, cuatro seguimientos pendientes y cinco citas programadas. Las citas no se marcaron atendidas ni los compromisos completados.
- Edge Function original `create-student`, versión 2: activa; conserva comprobación del usuario mediante Supabase Auth, autorización administrativa por RPC y CORS institucional.

Los nombres, correos, SQL personal, respaldos y evidencias individuales permanecen fuera de Git. El archivo de migración público contiene solo el esquema; el lote privado se aplicó dentro de la misma transacción remota y no se publica en este repositorio. El historial remoto evita volver a aplicar la misma versión; el lote comprueba coincidencias y duplicados.

## Validación

- 31 pruebas frontend, 152 comprobaciones SQL locales y 92 verificaciones de respaldo/integración aprobadas.
- 123 comprobaciones de permisos y CRUD sobre PostgreSQL de producción, mediante contextos de rol y una transacción revertida. No quedaron registros de prueba comprometidos.
- Conservación de los 26 registros previos comprobada. La cuenta anterior protegida conserva sus datos y credenciales.
- RLS continúa habilitado en todas las tablas públicas. Nueve tablas privadas rechazan el acceso HTTP anónimo.
- Función publicada: preflight del origen institucional aprobado; solicitudes sin sesión o con token inválido rechazadas con 401.
- Supabase Auth mantiene habilitado el acceso con correo y contraseña. La compilación contiene exclusivamente la configuración pública del proyecto.

Estas comprobaciones de roles en PostgreSQL no equivalen a un inicio de sesión interactivo. No hubo navegador conectado disponible para la inspección visual final ni se utilizaron contraseñas personales para probar sesiones. La verificación visual, responsive y con sesiones reales debe completarse con una cuenta institucional autorizada.

## Acceso sin SMTP

SMTP personalizado permanece desactivado por decisión del propietario. Los módulos principales no dependen del correo y la pantalla de ayuda informa que la recuperación por email no está disponible.

El nuevo perfil de consejería está habilitado bajo RLS y tiene únicamente los cuatro expedientes autorizados. Su acceso Auth todavía está protegido por el bloqueo inicial: un administrador debe establecer la contraseña individual desde **Estudiantes → Crear acceso de consejería**, conforme al [procedimiento privado de acceso inicial](PIPE_ACCESO_SIN_SMTP.md). No se generó, publicó o cambió una contraseña personal durante el despliegue. Las cuentas estudiantiles nuevas se gestionan mediante **Crear acceso** sobre sus expedientes existentes.

## Reversión y observaciones

El respaldo previo se conserva en el espacio privado, con hashes y restauración local comprobada. La contención preparada desactiva solamente el perfil nuevo y sus asignaciones, conserva los registros y mantiene RLS. No se aplicó una reversión porque las verificaciones del lanzamiento aprobaron.

El asesor de Supabase conserva avisos anteriores sobre tablas auxiliares sin políticas (acceso denegado por RLS) y protección de contraseñas filtradas deshabilitada. No se abrieron esas tablas ni se modificó esa configuración para ocultar avisos. La función exige contraseñas iniciales de al menos 12 caracteres. El build informa una advertencia de tamaño del bundle, sin impedir la compilación.

Los documentos de evolución y preparación conservan estados históricos; este registro y la [guía sin SMTP](PIPE_ACCESO_SIN_SMTP.md) describen la decisión y ejecución posteriores. El informe privado detalla identificadores, respaldo, pruebas e incidencias.
