'use strict';

jest.mock('../../../api/controllers/HealthService', () => ({
  health_get: jest.fn()
}));

const HealthService = require('../../../api/controllers/HealthService');
const Health = require('../../../api/controllers/Health');

describe('Health controller', () => {
  beforeEach(() => {
    HealthService.health_get.mockReset();
  });

  it('delegates health_get to the service with swagger params', () => {
    const req = { swagger: { params: { foo: 'bar' } } };
    const res = {};
    const next = jest.fn();

    Health.health_get(req, res, next);

    expect(HealthService.health_get).toHaveBeenCalledWith(req.swagger.params, res, next);
  });
});
