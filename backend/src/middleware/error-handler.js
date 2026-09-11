function notFoundHandler(req, res) {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route not found: ${req.method} ${req.originalUrl}`
    }
  });
}

function errorHandler(error, req, res, next) {
  console.error(error);

  const status = error.statusCode || error.status || 500;
  res.status(status).json({
    error: {
      code: error.code || 'INTERNAL_SERVER_ERROR',
      message: status < 500 ? error.message : 'An unexpected error occurred'
    }
  });
}

module.exports = { notFoundHandler, errorHandler };
