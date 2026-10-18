# Corrección de vinculación de accesos

La creación de una cuenta desde un expediente existente devolvía HTTP 500.
El trigger de actualización del estudiante invoca `private.pipe_role()` con
el rol de base de datos de la Edge Function. Ese rol no tenía `USAGE` en
`private` ni `EXECUTE` en esa función. El atributo `BYPASSRLS` no concede
esos permisos.

La migración `20261018005645_pipe_account_link_service_permissions` concede
únicamente esos dos permisos a `service_role`. No cambia las políticas RLS,
los permisos del navegador, perfiles, contraseñas ni registros académicos.
La función conserva su autenticación y comprobación de administrador activo.

Los errores de creación y edición se muestran dentro del diálogo y permanecen
hasta el siguiente intento o hasta abrir otro formulario. Así son legibles
por encima del fondo desenfocado; antes el aviso global quedaba detrás del
diálogo nativo.

Verificación:

- 31 pruebas de frontend y compilación con configuración pública de producción.
- `node scripts/validate-account-link.mjs`: 10 comprobaciones en PostgreSQL local;
  reproduce ambos errores de permisos, comprueba la vinculación con el rol real
  del servidor y evita repetirla. Conserva la denegación de acceso anónimo.
- Prueba en producción con `SET LOCAL ROLE service_role`: alta de un perfil
  temporal, vinculación a un expediente pendiente y rechazo del segundo intento;
  toda la prueba termina en `ROLLBACK`. No conserva cuentas de prueba ni cambios.
- Las cuatro cuentas de estudiantes continúan pendientes de que un administrador
  establezca sus contraseñas individuales desde sus expedientes existentes.

No se utiliza SMTP para este flujo. La comprobación interactiva final requiere
que el administrador reintente desde su sesión; no se usó su contraseña.
