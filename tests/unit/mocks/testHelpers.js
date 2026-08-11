'use strict';

// Small, reusable helpers shared across unit tests.

/**
 * Build a minimal Express-style response double that records what the handler
 * wrote. Supports the chained `status().json()` pattern as well as the
 * `setHeader()` / `end()` pattern used by the swagger-generated services.
 */
function createMockResponse() {
  const res = {
    statusCode: 200,
    headers: {},
    body: undefined,
    ended: false
  };

  res.status = jest.fn((code) => {
    res.statusCode = code;
    return res;
  });
  res.json = jest.fn((payload) => {
    res.body = payload;
    return res;
  });
  res.setHeader = jest.fn((name, value) => {
    res.headers[name] = value;
    return res;
  });
  res.end = jest.fn((payload) => {
    if (payload !== undefined) {
      res.body = payload;
    }
    res.ended = true;
    return res;
  });

  return res;
}

/**
 * Wrap a value the way the swagger-generated services expect their arguments,
 * i.e. `args[name].value`.
 */
function swaggerArg(value) {
  return { value };
}

module.exports = {
  createMockResponse,
  swaggerArg
};
