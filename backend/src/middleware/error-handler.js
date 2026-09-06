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

  res.status(error.statusCode || 500).json({
    error: {
      code: error.code || 'INTERNAL_SERVER_ERROR',
      message: error.statusCode ? error.message : 'An unexpected error occurred'
    }
  });
}

module.exports = { notFoundHandler, errorHandler };
