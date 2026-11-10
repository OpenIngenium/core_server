'use strict';

const HealthService = require('../../../api/controllers/HealthService');
const { createMockResponse } = require('../mocks/testHelpers');

describe('HealthService.health_get', () => {
  it('responds with an OK status payload as JSON', () => {
    const res = createMockResponse();

    HealthService.health_get({}, res, jest.fn());

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
    expect(res.end).toHaveBeenCalledTimes(1);

    const payload = JSON.parse(res.body);
    expect(payload).toEqual({ status: 'OK', message: '' });
  });
});
