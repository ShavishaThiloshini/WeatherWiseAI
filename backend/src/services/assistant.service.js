const DEFAULT_AI_SERVICE_URL = 'http://127.0.0.1:8001';

async function getAssistantAnswer(question, weather) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.AI_SERVICE_TIMEOUT_MS || 8000));

  try {
    let response;
    try {
      response = await fetch(`${process.env.AI_SERVICE_URL || DEFAULT_AI_SERVICE_URL}/assistant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, weather }),
        signal: controller.signal,
      });
    } catch {
      const error = new Error('Weather assistant is unavailable');
      error.code = 'ASSISTANT_UNAVAILABLE';
      error.status = 503;
      throw error;
    }

    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload || typeof payload.answer !== 'string') {
      const error = new Error('Weather assistant could not answer right now');
      error.code = 'ASSISTANT_UNAVAILABLE';
      error.status = 503;
      throw error;
    }
    return payload;
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { getAssistantAnswer };
