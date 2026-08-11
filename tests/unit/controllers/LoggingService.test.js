'use strict';

jest.mock('../../../api/node_funcs', () => ({
  log: {},
  getLogging: jest.fn(),
  updateLogging: jest.fn()
}));

const nodeFunctions = require('../../../api/node_funcs');
const LoggingService = require('../../../api/controllers/LoggingService');
const { createMockResponse, swaggerArg } = require('../mocks/testHelpers');

describe('LoggingService', () => {
  beforeEach(() => {
    nodeFunctions.getLogging.mockReset();
    nodeFunctions.updateLogging.mockReset();
  });

  describe('get_logging', () => {
    it('returns 200 with the current logging info', () => {
      nodeFunctions.getLogging.mockReturnValue({ level: 'DEBUG' });
      const res = createMockResponse();

      LoggingService.get_logging({}, res, jest.fn());

      expect(nodeFunctions.getLogging).toHaveBeenCalledTimes(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ level: 'DEBUG' });
    });
  });

  describe('update_logging', () => {
    it('updates logging and responds 204 on success', () => {
      const res = createMockResponse();
      const args = { logging_info: swaggerArg({ level: 'INFO' }) };

      LoggingService.update_logging(args, res, jest.fn());

      expect(nodeFunctions.updateLogging).toHaveBeenCalledWith({ level: 'INFO' });
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.end).toHaveBeenCalledTimes(1);
    });

    it('responds 400 with the error message when update fails', () => {
      nodeFunctions.updateLogging.mockImplementation(() => {
        throw new Error('bad level');
      });
      const res = createMockResponse();
      const args = { logging_info: swaggerArg({ level: 'NOPE' }) };

      LoggingService.update_logging(args, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Error: bad level' });
    });
  });
});
