# PIPE — Plataforma de Permanencia Estudiantil

Aplicación original React/Vite, conectada a Supabase Auth y PostgreSQL y preparada para GitHub Pages. La evolución actual integra expedientes, citas, consultas, seguimientos e indicadores en los módulos reales.

- Plataforma publicada: https://danielbmoreno.github.io/PIPE/
- Repositorio: https://github.com/Danielbmoreno/PIPE
- [Cambios, validación y operaciones pendientes de aprobación](docs/PIPE_EVOLUCION.md).

**Estado:** cambios preparados localmente. No se ha publicado esta versión. Por autorización expresa se registró una cuenta de consejería nueva, inactiva y pendiente de habilitación segura; el lote académico y las demás altas no se han ejecutado. El nuevo frontend bloquea la consulta de expedientes mientras el contrato de autorización por estudiante no esté aprobado y activo en Supabase.

## Módulos y permisos previstos

| Módulo | Administración | Consejería | Estudiante |
| --- | --- | --- | --- |
| Dashboard | Indicadores institucionales | Indicadores de asignados | Panel propio |
| Expedientes | Consultar y gestionar | Consultar asignados; actualizar acompañamiento académico | Consultar el propio |
| Alertas, casos e intervenciones | Gestionar | Documentar y actualizar los de asignados | Sin acceso interno |
| Citas | Gestionar | Gestionar las de asignados | Consultar las propias |
| Consultas y seguimientos | Gestionar | Documentar los de asignados | Consultar los propios |
| Cuentas y asignaciones | Gestionar | Sin altas ni cambio de rol | Sin gestión |
| Eliminación | Solo administración | Sin eliminación | Sin eliminación |

Los identificadores de roles son `1 = admin`, `2 = consejero`, `3 = estudiante`. Las políticas RLS propuestas son la autorización efectiva; el menú no sustituye esos permisos. El contrato `pipe_access_context` impide cargar expedientes usando las políticas amplias antiguas.

Los indicadores cuentan registros reales autorizados. No existe un modelo predictivo de deserción y la gráfica representa seguimientos completados, no notas oficiales. Los campos académicos no confirmados se muestran pendientes.

## Ejecutar localmente

Se ha validado con Node.js 24. Desde `frontend/`:

```powershell
npm.cmd ci
npm.cmd run dev
```

Crear `frontend/.env.local` con las variables públicas del proyecto, si no existe:

```env
VITE_SUPABASE_URL=https://TU_PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_CLAVE_PUBLICA
VITE_SUPABASE_CREATE_STUDENT_FUNCTION=create-student
```

No usar claves de servicio en variables `VITE_*`. La tercera variable es opcional. El desarrollo utiliza el mismo cliente Supabase y respeta RLS; no crea una base local paralela. Abrir `http://localhost:5173/PIPE/`.

El acceso requiere una cuenta institucional real en Auth y un perfil activo en `usuarios`. Se aceptan direcciones `.edu` y `.edu.co`; un dominio válido por sí solo no concede acceso. Cada estudiante debe estar vinculado al perfil propio y cada consejero a sus asignaciones autorizadas.

## Pruebas y compilación

```powershell
cd frontend
npm.cmd test
npm.cmd run build # requiere las variables públicas de Supabase
npm.cmd run preview
```

La [revisión de operación y seguridad](docs/PIPE_OPERACION.md) documenta el respaldo, la reversión y los controles de compilación. Para compilar en esta estación con las variables ya existentes de Actions: `python scripts/check-release-remote.py --build`, desde la raíz. No se modifican archivos de credenciales.

El build se genera en `frontend/dist`, con base `/PIPE/` y `HashRouter`. Las pruebas usan fixtures y transportes aislados, sin escribir en Supabase. La [validación SQL local](docs/PIPE_EVOLUCION.md) reconstruye el esquema observado en PostgreSQL temporal y comprueba RLS y duplicados; no forma parte del despliegue.

## Alta de cuentas

El propietario decidió mantener SMTP personalizado desactivado. Consultar el [procedimiento de acceso sin SMTP](docs/PIPE_ACCESO_SIN_SMTP.md): los módulos utilizan correo y contraseña; el acceso inicial se gestiona por un administrador y la recuperación por correo está limitada. Esta decisión sustituye el bloqueo previo de entrega por email.

En **Estudiantes**, un administrador puede crear un registro nuevo o usar **Crear acceso** sobre un expediente que todavía no tenga cuenta. “Crear acceso de consejería” permite vincular una nueva cuenta a un perfil profesional aprobado, con rol de consejero, sin modificar cuentas anteriores. La función original `create-student` preparada en este repositorio vincula `usuarios.auth_user_id` y `estudiantes.usuario_id`, con el rol del perfil institucional correspondiente. No reemplaza cuentas ni contraseñas existentes.

Se requiere verificar con la persona su correo institucional real y definir una contraseña individual de al menos 12 caracteres. No se almacenan contraseñas en el expediente ni en archivos de datos. El código y el nivel de riesgo no se deben inventar para completar un formulario.

La versión actualizada de la función todavía requiere aprobación y despliegue. Su CORS conserva el origen de GitHub Pages existente; el alta desde localhost no está habilitada.

## Supabase y publicación

La [propuesta de esquema y RLS](supabase/proposals/README.md) responde al esquema inspeccionado. Añade consultas, seguimientos, asignaciones y campos faltantes sin borrar filas existentes. El SQL y los lotes personales están pendientes de aprobación; no se ejecutan al iniciar o compilar la aplicación.

El workflow `.github/workflows/deploy-pages.yml` instala dependencias, ejecuta pruebas, compila y publica `frontend/dist` al subir a `main` o al activarlo manualmente. Requiere `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en variables de Actions y GitHub Pages configurado con Source **GitHub Actions**. Por tanto, **no hacer push a main antes de autorizar el despliegue**.

La publicación del frontend, la función y el SQL son operaciones distintas y deben coordinarse siguiendo la [secuencia de activación](docs/PIPE_EVOLUCION.md). No aplicar el SQL RLS histórico como sustituto de la propuesta revisada.

## Arquitectura

```text
Navegador → React/Vite → Supabase Auth
                     → Repositorio con alcance autorizado → PostgreSQL y RLS
                     → Edge Function create-student para altas administrativas
GitHub Actions → frontend/dist → GitHub Pages
```

Los componentes originales están en `frontend/src/pages/` y `frontend/src/components/`. El repositorio de datos está en `frontend/src/lib/pipeRepository.js`; los servicios conservan sus interfaces y usan ese control central. Las propuestas se encuentran en `supabase/proposals/`.

Se conserva el backend Express independiente con JWT y `data/db.json`; la aplicación publicada no lo utiliza. No se ha iniciado, modificado su almacenamiento ni migrado información desde él. La documentación histórica de `docs/PIPE/`, `SUPABASE_SETUP.md`, `SUPABASE_RLS_ADMIN.sql` y `TESTING.md` describe otros estados del proyecto; consultar la documentación de evolución para esta entrega.

## Publicación institucional

La [publicación del 17 de octubre de 2026](docs/PIPE_DESPLIEGUE_2026-10-17.md) registra la integración ejecutada, la migración, las verificaciones reales y los pasos de acceso inicial todavía pendientes. Los informes anteriores describen estados históricos de preparación.
