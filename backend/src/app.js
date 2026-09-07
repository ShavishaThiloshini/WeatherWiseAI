const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');

const apiRouter = require('./routes');
const swaggerSpec = require('./swagger');
const { notFoundHandler, errorHandler } = require('./middleware/error-handler');

const app = express();

app.disable('x-powered-by');
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/', (req, res) => {
  res.json({
    name: 'WeatherWise AI API',
    status: 'running',
    health: '/api/v1/health',
    documentation: '/api-docs'
  });
});

// Swagger/OpenAPI documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (req, res) => {
  res.json(swaggerSpec);
});

app.use('/api/v1', apiRouter);
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
