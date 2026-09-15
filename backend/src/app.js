const express = require('express');
const authRouter = require('./routes/auth.routes');
const apiRouter = require('./routes');

const app = express();

app.use(express.json());

app.use('/api/v1/auth', authRouter);
app.use('/api/v1', apiRouter);

app.get('/api', (req, res) => {
  res.json({ name: 'WeatherWise AI API', version: 'v1' });
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);

  const statusCode = Number.isInteger(error.status) ? error.status : 500;
  const errorCode = error.code || 'INTERNAL_SERVER_ERROR';
  const message = error.message || 'An unexpected error occurred';

  return res.status(statusCode).json({
    error: { code: errorCode, message },
  });
});

module.exports = app;
