const sendSuccess = (res, data = null, message = 'Operación exitosa', status = 200) => {
  return res.status(status).json({
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  });
};

const sendError = (res, message = 'Error interno', status = 500, details = null) => {
  console.error(`[ERROR ${status}]`, message, details);
  return res.status(status).json({
    success: false,
    error: message,
    details,
    timestamp: new Date().toISOString()
  });
};

module.exports = { sendSuccess, sendError };