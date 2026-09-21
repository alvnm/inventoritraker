function notFound(req, res) {
  res.status(404).json({ error: 'Ruta no encontrada' });
}

function errorHandler(err, req, res, next) {
  console.error(err);
  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'Ya existe un registro con ese valor único' });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Registro no encontrado' });
  }
  res.status(err.status || 500).json({ error: err.message || 'Error interno del servidor' });
}

module.exports = { notFound, errorHandler };
