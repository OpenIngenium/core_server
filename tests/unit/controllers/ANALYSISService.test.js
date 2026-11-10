'use strict';

jest.mock('../../../api/node_funcs', () => ({
  get_auth_key: jest.fn(() => 'AUTHKEY'),
  push_error: jest.fn((message, err) => ({ message, cause: err })),
  createArchiveElement: jest.fn(),
  getStep: jest.fn(),
  getExecutionElements: jest.fn(),
  updateStep: jest.fn()
}));

const node_funcs = require('../../../api/node_funcs');
const ANALYSIS = require('../../../api/controllers/ANALYSISService');
const { swaggerArg } = require('../mocks/testHelpers');

function createRes() {
  const res = { statusCode: 0, body: undefined, headers: {} };
  res.status = jest.fn((code) => {
    res.statusCode = code;
    return res;
  });
  res.json = jest.fn((payload) => {
    res.body = payload;
    return res;
  });
  res.set = jest.fn((name, value) => {
    res.headers[name] = value;
    return res;
  });
  return res;
}

const HEADERS = { authorization: 'Bearer t' };

describe('ANALYSISService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    node_funcs.get_auth_key.mockReturnValue('AUTHKEY');
    node_funcs.push_error.mockImplementation((message, err) => ({ message, cause: err }));
  });

  describe('create_analysis_step', () => {
    it('creates a step with explicit args and returns 200', async () => {
      node_funcs.createArchiveElement.mockResolvedValue({ id: 'e1' });
      const res = createRes();
      const args = {
        execution_id: swaggerArg('exec1'),
        step: swaggerArg({ title: 's' }),
        insert_after_id: swaggerArg('after1'),
        level: swaggerArg('CHILD')
      };

      await ANALYSIS.create_analysis_step(args, res, jest.fn(), HEADERS);

      expect(node_funcs.get_auth_key).toHaveBeenCalledWith(HEADERS);
      expect(node_funcs.createArchiveElement).toHaveBeenCalledWith(
        'exec1', null, 'STEP', 'ANALYSIS', { title: 's' }, 'after1', 'CHILD', 'AUTHKEY'
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.body).toEqual({ id: 'e1' });
    });

    it('applies defaults when optional args are missing', async () => {
      node_funcs.createArchiveElement.mockResolvedValue({});
      const res = createRes();
      const args = { execution_id: swaggerArg('exec1') };

      await ANALYSIS.create_analysis_step(args, res, jest.fn(), HEADERS);

      expect(node_funcs.createArchiveElement).toHaveBeenCalledWith(
        'exec1', null, 'STEP', 'ANALYSIS', null, '-1', 'SIBLING', 'AUTHKEY'
      );
    });

    it('returns 400 with pushed error on failure', async () => {
      const boom = new Error('db down');
      node_funcs.createArchiveElement.mockRejectedValue(boom);
      const res = createRes();

      await ANALYSIS.create_analysis_step({ execution_id: swaggerArg('e') }, res, jest.fn(), HEADERS);

      expect(node_funcs.push_error).toHaveBeenCalledWith('Error when creating a step', boom);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.body).toEqual({ message: 'Error when creating a step', cause: boom });
    });
  });

  describe('get_analysis_step', () => {
    it('returns the step on success', async () => {
      node_funcs.getStep.mockResolvedValue({ id: 'e1' });
      const res = createRes();
      const args = { execution_id: swaggerArg('exec1'), elem_id: swaggerArg('elem1') };

      await ANALYSIS.get_analysis_step(args, res, jest.fn(), HEADERS);

      expect(node_funcs.getStep).toHaveBeenCalledWith('exec1', null, 'elem1', 'AUTHKEY');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.body).toEqual({ id: 'e1' });
    });

    it('returns 400 on failure', async () => {
      node_funcs.getStep.mockRejectedValue(new Error('x'));
      const res = createRes();
      const args = { execution_id: swaggerArg('exec1'), elem_id: swaggerArg('elem1') };

      await ANALYSIS.get_analysis_step(args, res, jest.fn(), HEADERS);

      expect(node_funcs.push_error).toHaveBeenCalledWith('Error when getting a step', expect.any(Error));
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('get_execution_analysis_steps', () => {
    it('returns elements and sets total-count header', async () => {
      node_funcs.getExecutionElements.mockResolvedValue({ elems: [{ id: 'e1' }], total_count: 1 });
      const res = createRes();
      const args = {
        execution_id: swaggerArg('exec1'),
        offset: swaggerArg(0),
        limit: swaggerArg(10),
        sort: swaggerArg('ASC')
      };

      await ANALYSIS.get_execution_analysis_steps(args, res, jest.fn(), HEADERS);

      expect(node_funcs.getExecutionElements).toHaveBeenCalledWith(
        'exec1', 'STEP', 'ANALYSIS', 0, 10, 'ASC', null, null, null, null, null, 'AUTHKEY'
      );
      expect(res.headers['x-total-count']).toBe(1);
      expect(res.body).toEqual([{ id: 'e1' }]);
    });

    it('coerces undefined optional args to null', async () => {
      node_funcs.getExecutionElements.mockResolvedValue({ elems: [], total_count: 0 });
      const res = createRes();
      const args = {
        execution_id: swaggerArg(undefined),
        offset: swaggerArg(undefined),
        limit: swaggerArg(undefined),
        sort: swaggerArg(undefined)
      };

      await ANALYSIS.get_execution_analysis_steps(args, res, jest.fn(), HEADERS);

      expect(node_funcs.getExecutionElements).toHaveBeenCalledWith(
        null, 'STEP', 'ANALYSIS', null, null, null, null, null, null, null, null, 'AUTHKEY'
      );
    });

    it('returns 400 on failure', async () => {
      node_funcs.getExecutionElements.mockRejectedValue(new Error('x'));
      const res = createRes();
      const args = {
        execution_id: swaggerArg('exec1'),
        offset: swaggerArg(0),
        limit: swaggerArg(10),
        sort: swaggerArg('ASC')
      };

      await ANALYSIS.get_execution_analysis_steps(args, res, jest.fn(), HEADERS);

      expect(node_funcs.push_error).toHaveBeenCalledWith('Error when getting steps', expect.any(Error));
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('update_analysis_step', () => {
    it('updates the step on success', async () => {
      node_funcs.updateStep.mockResolvedValue({ updated: true });
      const res = createRes();
      const args = {
        execution_id: swaggerArg('exec1'),
        elem_id: swaggerArg('elem1'),
        step: swaggerArg({ title: 's' })
      };

      await ANALYSIS.update_analysis_step(args, res, jest.fn(), HEADERS);

      expect(node_funcs.updateStep).toHaveBeenCalledWith('exec1', null, 'elem1', { title: 's' }, 'AUTHKEY');
      expect(res.body).toEqual({ updated: true });
    });

    it('returns 400 on failure', async () => {
      node_funcs.updateStep.mockRejectedValue(new Error('x'));
      const res = createRes();
      const args = {
        execution_id: swaggerArg('exec1'),
        elem_id: swaggerArg('elem1'),
        step: swaggerArg({})
      };

      await ANALYSIS.update_analysis_step(args, res, jest.fn(), HEADERS);

      expect(node_funcs.push_error).toHaveBeenCalledWith('Error when updating step', expect.any(Error));
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
