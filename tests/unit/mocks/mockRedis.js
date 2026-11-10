'use strict';

// Reusable mock for the `async-redis` client used by api/node_funcs.js.
// createClient() always returns the same shared client instance so tests can
// import this module to program return values and assert calls.

const client = {
  on: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn()
};

function reset() {
  client.on.mockReset();
  client.get.mockReset();
  client.set.mockReset();
  client.del.mockReset();
}

module.exports = {
  createClient: jest.fn(() => client),
  __client: client,
  __reset: reset
};
