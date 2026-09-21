const DEFAULT_AI_SERVICE_URL = 'http://127.0.0.1:8001';

async function getDashboardRecommendations({ location, current, forecast }) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.AI_SERVICE_TIMEOUT_MS || 8000));

  try {
    const response = await fetch(`${process.env.AI_SERVICE_URL || DEFAULT_AI_SERVICE_URL}/recommend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ location, current, forecast }),
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload) {
      const error = new Error('Recommendation service is unavailable');
      error.code = 'RECOMMENDATION_UNAVAILABLE';
      error.status = 503;
      throw error;
    }
    return payload;
  } catch (error) {
    if (error.code === 'RECOMMENDATION_UNAVAILABLE') throw error;
    const unavailable = new Error('Recommendation service is unavailable');
    unavailable.code = 'RECOMMENDATION_UNAVAILABLE';
    unavailable.status = 503;
    throw unavailable;
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { getDashboardRecommendations };
