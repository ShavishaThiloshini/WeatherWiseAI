require('dotenv').config();

const app = require('./app');

const port = Number(process.env.PORT) || 3000;

app.databaseReady
  .then(() => {
    app.listen(port, () => {
      console.log(`WeatherWise AI API listening on port ${port}`);
    });
  })
  .catch((error) => {
    console.error(`Database initialization failed: ${error.message}`);
    process.exitCode = 1;
  });
