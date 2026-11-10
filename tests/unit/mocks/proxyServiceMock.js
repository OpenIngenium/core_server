'use strict';

// Returns a Proxy that lazily creates (and caches) a jest.fn for any accessed
// property. Used to mock swagger-generated *Service modules so thin controller
// delegation can be verified even when a controller references a service method
// that does not exist on the service (dangling delegations in the generated
// code).
module.exports = function createServiceMock() {
  const cache = {};
  return new Proxy(
    {},
    {
      get(target, prop) {
        if (typeof prop === 'symbol') return undefined;
        if (!cache[prop]) cache[prop] = jest.fn();
        return cache[prop];
      }
    }
  );
};
