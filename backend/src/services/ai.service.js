const AI_SERVICE_URL = (process.env.AI_SERVICE_URL || 'http://127.0.0.1:8001').replace(/\/$/, '');

async function requestAI(path, payload) {
  let response;
  try {
    response = await fetch(`${AI_SERVICE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    const serviceError = new Error('AI service is unavailable');
    serviceError.code = 'AI_SERVICE_UNAVAILABLE';
    serviceError.cause = error;
    throw serviceError;
  }

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const serviceError = new Error(result.detail || 'AI service rejected the request');
    serviceError.code = 'AI_SERVICE_ERROR';
    serviceError.status = response.status;
    throw serviceError;
  }

  return result;
}

function recommend(payload) {
  return requestAI('/recommend', payload);
}

function askAssistant(payload) {
  return requestAI('/assistant', payload);
}

module.exports = { recommend, askAssistant };
