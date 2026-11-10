'use strict';

jest.mock('../../../api/controllers/LoggingService', () => ({
  get_logging: jest.fn(),
  update_logging: jest.fn()
}));

const LoggingService = require('../../../api/controllers/LoggingService');
const Logging = require('../../../api/controllers/Logging');

describe('Logging controller', () => {
  beforeEach(() => {
    LoggingService.get_logging.mockReset();
    LoggingService.update_logging.mockReset();
  });

  it('delegates get_logging to the service with swagger params', () => {
    const req = { swagger: { params: { a: 1 } } };
    const res = {};
    const next = jest.fn();

    Logging.get_logging(req, res, next);

    expect(LoggingService.get_logging).toHaveBeenCalledWith(req.swagger.params, res, next);
  });

  it('delegates update_logging to the service with swagger params', () => {
    const req = { swagger: { params: { logging_info: { value: { level: 'INFO' } } } } };
    const res = {};
    const next = jest.fn();

    Logging.update_logging(req, res, next);

    expect(LoggingService.update_logging).toHaveBeenCalledWith(req.swagger.params, res, next);
  });
});
