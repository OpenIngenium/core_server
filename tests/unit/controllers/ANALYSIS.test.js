'use strict';

jest.mock('../../../api/controllers/ANALYSISService', () => ({
  create_analysis_step: jest.fn(),
  get_analysis_step: jest.fn(),
  get_execution_analysis_steps: jest.fn(),
  update_analysis_step: jest.fn()
}));

const ANALYSISService = require('../../../api/controllers/ANALYSISService');
const ANALYSIS = require('../../../api/controllers/ANALYSIS');

describe('ANALYSIS controller', () => {
  const res = {};
  const next = jest.fn();
  const headers = { authorization: 'Bearer t' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const cases = [
    'create_analysis_step',
    'get_analysis_step',
    'get_execution_analysis_steps',
    'update_analysis_step'
  ];

  cases.forEach((method) => {
    it(`delegates ${method} to the service with params and headers`, () => {
      const req = { swagger: { params: { p: 1 } }, headers };
      ANALYSIS[method](req, res, next);
      expect(ANALYSISService[method]).toHaveBeenCalledWith(req.swagger.params, res, next, headers);
    });
  });
});
