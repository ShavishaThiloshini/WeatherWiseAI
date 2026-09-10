const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');

const apiRouter = require('./routes');
const authRouter = require('./routes/auth.routes');
const { initializeDatabase } = require('./db');
const { notFoundHandler, errorHandler } = require('./middleware/error-handler');

const app = express();

const databaseReady = initializeDatabase().catch((error) => {
  console.warn('Database initialization skipped or failed:', error.message);
  throw error;
});

app.disable('x-powered-by');
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/', (req, res) => {
  res.json({
    name: 'WeatherWise AI API',
    status: 'running',
    health: '/api/v1/health'
  });
});

app.use('/api/v1', apiRouter);
app.use('/api/v1/auth', authRouter);
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
module.exports.databaseReady = databaseReady;
