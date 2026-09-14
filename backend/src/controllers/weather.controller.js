const { getCurrentWeather, getForecast, getHourlyForecast } = require('../services/weather.service');

function coordinatesFromQuery(query) {
  return { latitude: query.lat ?? query.latitude, longitude: query.lon ?? query.longitude };
}

async function current(req, res, next) {
  try {
    const { latitude, longitude } = coordinatesFromQuery(req.query);
    return res.json(await getCurrentWeather(latitude, longitude));
  } catch (error) {
    return next(error);
  }
}

async function forecast(req, res, next) {
  try {
    const { latitude, longitude } = coordinatesFromQuery(req.query);
    return res.json(await getForecast(latitude, longitude));
  } catch (error) {
    return next(error);
  }
}
async function hourly(req, res, next) {
  try {
    const { latitude, longitude } = coordinatesFromQuery(req.query);
    return res.json(await getHourlyForecast(latitude, longitude));
  } catch (error) {
    return next(error);
  }
}

module.exports = { current, forecast, hourly };
