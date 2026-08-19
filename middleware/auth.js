const jwt = require('jsonwebtoken');
const db = require('../config/db');
const jwtSecret = process.env.JWT_SECRET || 'PIPE_DEFAULT_SECRET';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Token no proporcionado' });

  try {
    const payload = jwt.verify(token, jwtSecret);
    const user = db.getById('usuarios', payload.id);

    if (!user) {
      return res.status(401).json({ error: 'Usuario no válido' });
    }

    req.user = {
      id: user.id,
      nombre: user.nombre,
      correo: user.correo,
      rol_id: user.rol_id
    };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

const authorizeRoles = (allowed = []) => {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'No autenticado' });
    const role = String(req.user.rol_id || '').toLowerCase();
    const ok = allowed.map((r) => String(r).toLowerCase()).includes(role);
    if (!ok) return res.status(403).json({ error: 'No autorizado' });
    next();
  };
};

module.exports = { authenticateToken, authorizeRoles };
