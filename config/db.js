const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const dbFolder = path.join(__dirname, '..', 'data');
const dbFile = path.join(dbFolder, 'db.json');

const defaultData = {
  estudiantes: [],
  alertas: [],
  casos: [],
  intervenciones: [],
  citas: [],
  usuarios: []
};

const prefixes = {
  usuarios: 'USR',
  estudiantes: 'EST',
  alertas: 'ALT',
  casos: 'CAS',
  citas: 'CIT',
  intervenciones: 'INT'
};

const currentYear = () => new Date().getFullYear();

const formatRadicado = (prefix, year, sequence) => `${prefix}-${year}-${String(sequence).padStart(6, '0')}`;

const getRadicadoSequence = (rows, year) => {
  const yearRegex = new RegExp(`^[A-Z]{3}-${year}-(\\d{6})$`);
  const sequences = rows
    .map((item) => item.codigo_radicado)
    .filter(Boolean)
    .map((codigo) => {
      const match = String(codigo).match(yearRegex);
      return match ? Number(match[1]) : null;
    })
    .filter(Number.isFinite);
  return sequences.length ? Math.max(...sequences) : 0;
};

const generateCodigoRadicado = (table) => {
  const db = readDb();
  const rows = Array.isArray(db[table]) ? [...db[table]] : [];
  const year = currentYear();
  const prefix = prefixes[table] || String(table).slice(0, 3).toUpperCase();
  const nextSequence = getRadicadoSequence(rows, year) + 1;
  return formatRadicado(prefix, year, nextSequence);
};

const generateUuid = () => randomUUID();

const ensureUniqueRadicado = (table, codigoRadicado, rowsOverride) => {
  const rows = Array.isArray(rowsOverride)
    ? rowsOverride
    : (() => {
        const dbNow = readDb();
        return Array.isArray(dbNow[table]) ? dbNow[table] : [];
      })();

  if (!rows.some((item) => item.codigo_radicado === codigoRadicado)) {
    return codigoRadicado;
  }

  const year = currentYear();
  const prefix = prefixes[table] || String(table).slice(0, 3).toUpperCase();
  return formatRadicado(prefix, year, getRadicadoSequence(rows, year) + 1);
};


const migrateMissingFields = () => {
  // Lectura segura para NO disparar ensureStorage() otra vez
  // (evita recursión infinita: ensureStorage -> migrateMissingFields -> readDb -> ensureStorage...)
  let dbNow;
  try {
    if (!fs.existsSync(dbFile)) {
      dbNow = { ...defaultData };
    } else {
      const raw = fs.readFileSync(dbFile, 'utf8');
      dbNow = JSON.parse(raw || '{}');
    }
  } catch (e) {
    dbNow = { ...defaultData };
  }

  // Garantiza estructura mínima
  for (const key of Object.keys(defaultData)) {
    if (!Array.isArray(dbNow[key])) dbNow[key] = [];
  }

  let changed = false;


  const tablesToMigrate = Object.keys(prefixes);

  for (const table of tablesToMigrate) {
    const rows = Array.isArray(dbNow[table]) ? dbNow[table] : [];
    if (!Array.isArray(rows) || rows.length === 0) continue;

    const year = currentYear();
    const prefix = prefixes[table] || String(table).slice(0, 3).toUpperCase();

    for (let i = 0; i < rows.length; i++) {
      const item = rows[i];
      if (!item || typeof item !== 'object') continue;

      const needsUuid = !item.uuid || !String(item.uuid).trim();
      const needsCodigoRadicado = !item.codigo_radicado || !String(item.codigo_radicado).trim();

      if (needsUuid) {
        item.uuid = generateUuid();
        changed = true;
      }

      if (needsCodigoRadicado) {
        const seq = getRadicadoSequence(rows, year) + 1;
        const candidate = formatRadicado(prefix, year, seq);
        // Evita leer/asegurar almacenamiento durante migración (no usar readDb aquí)
        item.codigo_radicado = ensureUniqueRadicado(table, candidate, rows);
        changed = true;
      }
    }

    dbNow[table] = rows;
  }

  if (changed) {
    writeDb(dbNow);
  }
};

const ensureStorage = () => {
  if (!fs.existsSync(dbFolder)) {
    fs.mkdirSync(dbFolder, { recursive: true });
  }

  if (!fs.existsSync(dbFile)) {
    fs.writeFileSync(dbFile, JSON.stringify(defaultData, null, 2), 'utf8');
  }

  // Retrocompatibilidad: si el db tiene datos antiguos, agrega uuid y codigo_radicado sin borrar nada.
  migrateMissingFields();
};

const readDb = () => {
  ensureStorage();
  try {
    const raw = fs.readFileSync(dbFile, 'utf8');
    return JSON.parse(raw || '{}');
  } catch (error) {
    fs.writeFileSync(dbFile, JSON.stringify(defaultData, null, 2), 'utf8');
    return { ...defaultData };
  }
};

const writeDb = (db) => {
  fs.writeFileSync(dbFile, JSON.stringify({ ...defaultData, ...db }, null, 2), 'utf8');
  return db;
};

const getAll = (table) => {
  const db = readDb();
  return Array.isArray(db[table]) ? [...db[table]] : [];
};

const getById = (table, id) => {
  const rows = getAll(table);
  return rows.find((item) => Number(item.id) === Number(id)) || null;
};

const insert = (table, record) => {
  const db = readDb();
  const rows = Array.isArray(db[table]) ? [...db[table]] : [];
  const nextId = rows.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1;
  const baseRecord = { ...record, id: nextId };

  const recordWithUuid = {
    ...baseRecord,
    uuid: record.uuid && String(record.uuid).trim() ? String(record.uuid).trim() : generateUuid()
  };

  const codigoRadicado = recordWithUuid.codigo_radicado && String(recordWithUuid.codigo_radicado).trim()
    ? String(recordWithUuid.codigo_radicado).trim()
    : generateCodigoRadicado(table);

  const uniqueCodigoRadicado = ensureUniqueRadicado(table, codigoRadicado);
  const newRecord = { ...recordWithUuid, codigo_radicado: uniqueCodigoRadicado };

  rows.push(newRecord);
  db[table] = rows;
  writeDb(db);
  return newRecord;
};

const update = (table, id, changes) => {
  const db = readDb();
  const rows = Array.isArray(db[table]) ? [...db[table]] : [];
  const index = rows.findIndex((item) => Number(item.id) === Number(id));
  if (index === -1) return null;
  const safeChanges = { ...changes };
  // No modificar uuid ni codigo_radicado desde el update().
  delete safeChanges.uuid;
  delete safeChanges.codigo_radicado;
  rows[index] = { ...rows[index], ...safeChanges, id: Number(rows[index].id) };
  db[table] = rows;
  writeDb(db);
  return rows[index];
};

const remove = (table, id) => {
  const db = readDb();
  const rows = Array.isArray(db[table]) ? [...db[table]] : [];
  const index = rows.findIndex((item) => Number(item.id) === Number(id));
  if (index === -1) return false;
  rows.splice(index, 1);
  db[table] = rows;
  writeDb(db);
  return true;
};

const find = (table, predicate) => {
  return getAll(table).filter(predicate);
};

module.exports = {
  ensureStorage,
  getAll,
  getById,
  insert,
  update,
  remove,
  find
};
