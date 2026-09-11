const test = require('node:test');
const assert = require('node:assert/strict');

const { rateLimit } = require('../src/middleware/rate-limit');

function responseRecorder() {
  return {
    headers: {},
    statusCode: 200,
    body: null,
    set(name, value) {
      this.headers[name.toLowerCase()] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

test('rate limiter rejects requests after the configured limit', () => {
  const req = { ip: `rate-limit-test-${Date.now()}` };
  let lastResponse;
  let nextCalls = 0;
  const next = () => { nextCalls += 1; };

  for (let requestNumber = 0; requestNumber < 101; requestNumber += 1) {
    lastResponse = responseRecorder();
    rateLimit(req, lastResponse, next);
  }

  assert.equal(nextCalls, 100);
  assert.equal(lastResponse.statusCode, 429);
  assert.equal(lastResponse.body.error.code, 'RATE_LIMIT_EXCEEDED');
  assert.match(lastResponse.headers['retry-after'], /^\d+$/);
});