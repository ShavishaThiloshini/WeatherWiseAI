require('dotenv').config();

const app = require('./app');
const { initializeDatabase } = require('./db');

const port = Number(process.env.PORT || 3000);

initializeDatabase()
  .then(() => {
    app.listen(port, '0.0.0.0', () => {
      console.log(`WeatherWise AI API listening on port ${port} (localhost and LAN)`);
    });
  })
  .catch((error) => {
    console.error('Database initialization failed:', error.message);
    process.exitCode = 1;
  });
