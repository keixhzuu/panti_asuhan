function notFound(req, res) {
  res.status(404).json({ message: 'Endpoint tidak ditemukan.' });
}

function errorHandler(error, req, res, next) {
  console.error(error);
  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    message: error.message || 'Terjadi kesalahan pada server.',
    detail: process.env.NODE_ENV === 'production' ? undefined : error.stack
  });
}

module.exports = {
  notFound,
  errorHandler
};
