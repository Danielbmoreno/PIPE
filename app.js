require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const db = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const estudiantesRoutes = require('./routes/estudiantesRoutes');
const alertasRoutes = require('./routes/alertasRoutes');
const casosRoutes = require('./routes/casosRoutes');
const intervencionesRoutes = require('./routes/intervencionesRoutes');
const citasRoutes = require('./routes/citasRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();
const port = process.env.PORT || 3000;

db.ensureStorage();

const seedInitialUsers = async () => {
  const existing = db.getAll('usuarios');
  if (existing.length === 0) {
    const defaultUsers = [
      { nombre: 'Administrador PIPE', correo: 'admin@universidad.edu', password: 'Password123', rol_id: 'admin' },
      { nombre: 'Profesor PIPE', correo: 'docente@universidad.edu', password: 'Password123', rol_id: 'docente' },
      { nombre: 'Consejero PIPE', correo: 'consejero@universidad.edu', password: 'Password123', rol_id: 'consejero' },
      { nombre: 'Estudiante PIPE', correo: 'estudiante@universidad.edu', password: 'Password123', rol_id: 'estudiante' }
    ];

    for (const user of defaultUsers) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      db.insert('usuarios', {
        nombre: user.nombre,
        correo: user.correo.toLowerCase(),
        password: hashedPassword,
        rol_id: user.rol_id
      });
    }

    console.log('Usuarios iniciales creados: admin@universidad.edu, docente@universidad.edu, consejero@universidad.edu, estudiante@universidad.edu');
  }
};

seedInitialUsers().catch((err) => console.error('Error al crear usuarios iniciales:', err));

app.use(cors());
app.use(express.json());

// Rutas de prueba
app.get('/', (req, res) => {
  res.json({ message: 'Backend PIPE funcionando correctamente' });
});

app.use('/auth', authRoutes);
app.use('/estudiantes', estudiantesRoutes);
app.use('/alertas', alertasRoutes);
app.use('/casos', casosRoutes);
app.use('/intervenciones', intervencionesRoutes);
app.use('/citas', citasRoutes);
app.use('/dashboard', dashboardRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Error interno del servidor' });
});

app.listen(port, () => {
  console.log(`\n🚀 Servidor PIPE escuchando en http://localhost:${port}`);
  console.log(`📋 Rutas disponibles:`);
  console.log(`   GET  http://localhost:${port}/ (prueba)`);
  console.log(`   CRUD http://localhost:${port}/estudiantes`);
  console.log(`   CRUD http://localhost:${port}/alertas`);
  console.log(`   CRUD http://localhost:${port}/casos`);
  console.log(`   CRUD http://localhost:${port}/intervenciones`);
  console.log(`   CRUD http://localhost:${port}/citas\n`);
});
