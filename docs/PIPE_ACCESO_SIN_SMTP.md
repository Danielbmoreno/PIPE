# Acceso de PIPE original sin SMTP personalizado

Decisión del propietario: 17 de octubre de 2026. El despliegue y los módulos principales no dependen del envío de correos. Se conserva Supabase Auth con correo y contraseña, RLS y los roles institucionales.

## Inicio y recuperación de acceso

El inicio de sesión usa el correo institucional y la contraseña individual. La recuperación por correo permanece deshabilitada en la publicación por defecto; la pantalla de ayuda comunica esta limitación y remite al equipo institucional. No se presentan solicitudes de correo como enviadas. No se cambia SMTP ni la configuración remota de correo.

`VITE_PIPE_EMAIL_RECOVERY_ENABLED` solo debe habilitarse después de configurar y comprobar envío y redirecciones. No es necesaria para utilizar expedientes, citas, consultas, seguimientos, casos, alertas, intervenciones, estadísticas o actividad reciente.

## Acceso inicial de consejería

Un administrador institucional autenticado debe abrir **Estudiantes → Crear acceso de consejería**, seleccionar el perfil profesional autorizado, comprobar el correo y la identidad, e introducir una contraseña individual de al menos 12 caracteres con su confirmación. Debe gestionarla mediante un canal institucional privado; no publicarla en Git, documentos, mensajes del proyecto o registros de consola.

La función original `create-student` valida la sesión con Supabase, exige el contrato RLS y el rol administrador, y comprueba que el perfil sea consejero activo. Para una cuenta previamente registrada solo acepta el estado protegido de activación pendiente y un correo coincidente. Establece su contraseña inicial en Supabase Auth, confirma el correo según la comprobación administrativa autorizada y elimina el bloqueo de esa cuenta nueva. Rechaza cambiar credenciales de cuentas ya activas.

La habilitación del perfil institucional bajo RLS y la activación de su acceso Auth son pasos distintos. Mientras no se establezca la credencial inicial, la cuenta pendiente continúa bloqueada y no puede iniciar sesión. El despliegue no genera una contraseña ni implica que su titular haya iniciado sesión.

## Acceso de estudiantes

Un administrador puede usar **Crear acceso** sobre un expediente existente que aún no tenga cuenta. Verifica su correo real, establece su contraseña individual por el procedimiento privado y crea un único vínculo con el expediente. La función fija el rol estudiante y conserva sus datos académicos. Las cuentas creadas por este procedimiento administrativo no requieren un correo automático de confirmación.

Las cuentas anteriores conservan sus credenciales. Los controles de Auth y las políticas RLS siguen aplicándose a todos los módulos. Los consejeros solo pueden consultar y gestionar estudiantes asignados; un estudiante solo puede consultar sus datos permitidos.

La [guía de operación](PIPE_OPERACION.md) y los informes privados conservan el historial de preparación. Su bloqueo previo por SMTP fue revocado expresamente por esta decisión del propietario; sus observaciones sobre pruebas todavía pendientes no deben interpretarse como verificaciones ya realizadas.
