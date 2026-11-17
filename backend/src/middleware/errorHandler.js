const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  if (process.env.NODE_ENV !== 'production') {
    console.error('[ERROR]', {
      message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      statusCode
    });
  } else {
    console.error(JSON.stringify({
      level: 'error',
      message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      statusCode,
      timestamp: new Date().toISOString()
    }));
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`
  });
};

module.exports = { errorHandler, notFoundHandler };
