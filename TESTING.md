# 📋 PIPE Backend - Guía de Pruebas

## ✅ Instalación y ejecución

```bash
# Instalar dependencias
npm install

# Ejecutar con nodemon (desarrollo)
npm run dev

# O ejecutar directamente
npm start
```

El servidor estará en: **http://localhost:3000**

---

## 🧪 Ejemplos de peticiones

### 1. ESTUDIANTES

#### GET - Listar todos los estudiantes
```bash
curl -X GET http://localhost:3000/estudiantes
```

#### GET - Obtener un estudiante por ID
```bash
curl -X GET http://localhost:3000/estudiantes/1
```

#### POST - Crear un estudiante
```bash
curl -X POST http://localhost:3000/estudiantes \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan Pérez",
    "codigo": "2024001",
    "programa": "Ingeniería Informática",
    "semestre": 3,
    "nivel_riesgo": "bajo"
  }'
```

#### PUT - Actualizar un estudiante
```bash
curl -X PUT http://localhost:3000/estudiantes/1 \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Juan Carlos Pérez",
    "codigo": "2024001",
    "programa": "Ingeniería de Sistemas",
    "semestre": 4,
    "nivel_riesgo": "medio"
  }'
```

#### DELETE - Eliminar un estudiante
```bash
curl -X DELETE http://localhost:3000/estudiantes/1
```

---

### 2. ALERTAS

#### GET - Listar todas las alertas
```bash
curl -X GET http://localhost:3000/alertas
```

#### POST - Crear una alerta
```bash
curl -X POST http://localhost:3000/alertas \
  -H "Content-Type: application/json" \
  -d '{
    "estudiante_id": 1,
    "usuario_id": 5,
    "descripcion": "Bajo rendimiento académico en últimos exámenes",
    "nivel_riesgo": "alto"
  }'
```

#### PUT - Actualizar una alerta
```bash
curl -X PUT http://localhost:3000/alertas/1 \
  -H "Content-Type: application/json" \
  -d '{
    "descripcion": "Estudiante en seguimiento especial",
    "nivel_riesgo": "muy_alto"
  }'
```

#### DELETE - Eliminar una alerta
```bash
curl -X DELETE http://localhost:3000/alertas/1
```

---

### 3. CASOS

#### GET - Listar todos los casos
```bash
curl -X GET http://localhost:3000/casos
```

#### POST - Crear un caso
```bash
curl -X POST http://localhost:3000/casos \
  -H "Content-Type: application/json" \
  -d '{
    "estudiante_id": 1,
    "usuario_id": 5,
    "descripcion": "Caso de acompañamiento académico",
    "estado": "abierto"
  }'
```

#### PUT - Actualizar un caso
```bash
curl -X PUT http://localhost:3000/casos/1 \
  -H "Content-Type: application/json" \
  -d '{
    "descripcion": "Caso de acompañamiento en progreso",
    "estado": "en_proceso"
  }'
```

#### DELETE - Eliminar un caso
```bash
curl -X DELETE http://localhost:3000/casos/1
```

---

### 4. INTERVENCIONES

#### GET - Listar todas las intervenciones
```bash
curl -X GET http://localhost:3000/intervenciones
```

#### POST - Crear una intervención
```bash
curl -X POST http://localhost:3000/intervenciones \
  -H "Content-Type: application/json" \
  -d '{
    "caso_id": 1,
    "usuario_id": 5,
    "descripcion": "Primera sesión de tutoría realizada"
  }'
```

#### PUT - Actualizar una intervención
```bash
curl -X PUT http://localhost:3000/intervenciones/1 \
  -H "Content-Type: application/json" \
  -d '{
    "descripcion": "Sesión de tutoría completada con resultados positivos"
  }'
```

#### DELETE - Eliminar una intervención
```bash
curl -X DELETE http://localhost:3000/intervenciones/1
```

---

### 5. CITAS

#### GET - Listar todas las citas
```bash
curl -X GET http://localhost:3000/citas
```

#### POST - Crear una cita
```bash
curl -X POST http://localhost:3000/citas \
  -H "Content-Type: application/json" \
  -d '{
    "estudiante_id": 1,
    "usuario_id": 5,
    "fecha": "2026-05-15",
    "hora": "10:00",
    "motivo": "Acompañamiento académico",
    "estado": "programada"
  }'
```

#### PUT - Actualizar una cita
```bash
curl -X PUT http://localhost:3000/citas/1 \
  -H "Content-Type: application/json" \
  -d '{
    "fecha": "2026-05-20",
    "hora": "14:30",
    "motivo": "Seguimiento de progresos",
    "estado": "confirmada"
  }'
```

#### DELETE - Eliminar una cita
```bash
curl -X DELETE http://localhost:3000/citas/1
```

---

## 🔍 Notas importantes

- **Sin autenticación**: Todos los endpoints funcionan sin JWT por ahora
- **Console.logs**: Cada ruta imprime en consola qué operación está realizando
- **Validación básica**: Se validan campos requeridos
- **Manejo de errores**: Los errores se devuelven con status HTTP apropiado

---

## 📁 Estructura del proyecto

```
PIPEND/
├── app.js
├── package.json
├── .env
├── .gitignore
├── config/
│   └── supabase.js
├── middleware/
│   └── auth.js (para uso futuro)
├── controllers/
│   ├── authController.js
│   ├── estudiantesController.js
│   ├── alertasController.js
│   ├── casosController.js
│   ├── intervencionesController.js
│   └── citasController.js
└── routes/
    ├── authRoutes.js
    ├── estudiantesRoutes.js
    ├── alertasRoutes.js
    ├── casosRoutes.js
    ├── intervencionesRoutes.js
    └── citasRoutes.js
```

---

## 🚀 Próximos pasos

1. Integrar autenticación JWT cuando esté lista
2. Agregar validaciones más complejas
3. Implementar relaciones más profundas en Supabase
4. Agregar logs persistentes
5. Crear tests automatizados
