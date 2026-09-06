const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
const GEMINI_TIMEOUT_MS = Number(process.env.GEMINI_TIMEOUT_MS) || 15000;

function buildSystemPrompt() {
  return [
    'You are WeatherWise AI, a concise weather assistant.',
    'Answer only weather-related questions and keep responses practical.',
    'Use the provided weather context when available.',
    'Return valid JSON only with these keys: answer, reasoning, safety, suggestedAction.',
    'answer: short direct answer for the user.',
    'reasoning: brief explanation based on the context or the question.',
    'safety: one short safety note or an empty string.',
    'suggestedAction: one short next step or an empty string.',
  ].join(' ');
}

function buildUserPrompt(message, context) {
  return JSON.stringify(
    {
      question: message,
      context,
    },
    null,
    2,
  );
}

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch {
    const match = value.match(/\{[\s\S]*\}/);

    if (!match) {
      return null;
    }

    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function extractGeminiText(payload) {
  const text = payload?.candidates?.[0]?.content?.parts
    ?.map((part) => part?.text || '')
    .join('');

  return typeof text === 'string' ? text : '';
}

async function askGeminiAssistant({ message, context }) {
  if (!GEMINI_API_KEY) {
    return {
      provider: 'gemini',
      model: GEMINI_MODEL,
      answer: 'Gemini API key is not configured.',
      reasoning: 'Set GEMINI_API_KEY in backend/.env first.',
      safety: 'No AI response was generated.',
      suggestedAction: 'Add GEMINI_API_KEY to backend/.env and restart the backend.',
      isFallback: true,
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GEMINI_MODEL)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`,
      {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: {
          role: 'system',
          parts: [{ text: buildSystemPrompt() }],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: buildUserPrompt(message, context) }],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      }),
    },
    );

    if (!response.ok) {
      throw new Error(`Gemini error: ${response.status} ${response.statusText}`);
    }

    const payload = await response.json();
    const content = extractGeminiText(payload);
    const parsed = safeJsonParse(content);

    if (parsed && typeof parsed.answer === 'string') {
      return {
        provider: 'gemini',
        model: GEMINI_MODEL,
        answer: parsed.answer.trim(),
        reasoning: typeof parsed.reasoning === 'string' ? parsed.reasoning.trim() : '',
        safety: typeof parsed.safety === 'string' ? parsed.safety.trim() : '',
        suggestedAction:
          typeof parsed.suggestedAction === 'string' ? parsed.suggestedAction.trim() : '',
        isFallback: false,
      };
    }

    return {
      provider: 'gemini',
      model: GEMINI_MODEL,
      answer: content.trim() || 'I could not produce a structured answer.',
      reasoning: '',
      safety: '',
      suggestedAction: '',
      isFallback: false,
    };
  } catch (error) {
    return {
      provider: 'gemini',
      model: GEMINI_MODEL,
      answer:
        'I could not reach Gemini. Check your API key and network connection, then try again.',
      reasoning: error?.message ? String(error.message) : 'Gemini unavailable.',
      safety: 'No AI response was generated.',
      suggestedAction: 'Verify GEMINI_API_KEY in backend/.env and restart the backend.',
      isFallback: true,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

module.exports = { askGeminiAssistant };