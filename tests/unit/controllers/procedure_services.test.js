'use strict';

// Data-driven coverage for the uniform "procedure step service" family. These
// mirror the execution step services but operate on a procedure_id and call
// getProcedureElements. Procedure_ANALYSIS has a reduced surface (no input
// endpoints); Procedure_VI adds get_procedure_vi_ids and uses the
// nonexecutable input updater. All are driven by a single mocked node_funcs.

jest.mock('../../../api/node_funcs', () => ({
  get_auth_key: jest.fn(),
  push_error: jest.fn(),
  log: { debug: jest.fn(), info: jest.fn(), warning: jest.fn(), error: jest.fn(), trace: jest.fn(), critical: jest.fn() },
  createArchiveElement: jest.fn(),
  getStep: jest.fn(),
  get_step_input: jest.fn(),
  getProcedureElements: jest.fn(),
  updateStep: jest.fn(),
  update_step_input: jest.fn(),
  update_step_input_nonexecutable: jest.fn(),
  getProcedureVIs: jest.fn()
}));

const node_funcs = require('../../../api/node_funcs');
const { swaggerArg: sv } = require('../mocks/testHelpers');

const modules = [
  'Procedure_ANALYSIS', 'Procedure_BUS_1553', 'Procedure_CHECK_CONFIG', 'Procedure_CMD',
  'Procedure_CMD_FILE', 'Procedure_CMD_SCMF', 'Procedure_CMD_SSE', 'Procedure_CUSTOM_SCRIPT',
  'Procedure_Environment', 'Procedure_GDS', 'Procedure_GET_CONFIG', 'Procedure_GRAPH_EHA',
  'Procedure_LIST_DATA_PRODUCTS', 'Procedure_MANUAL_VERFICATION', 'Procedure_Manual_EIP',
  'Procedure_Manual_Input', 'Procedure_QUERY_EVR', 'Procedure_TIME_REFERENCE',
  'Procedure_UPDATE_CONFIG', 'Procedure_VERIFY_EHA', 'Procedure_VI', 'Procedure_VI_STATUS',
  'Procedure_WAIT', 'Procedure_WAIT_DATA_PRODUCTS', 'Procedure_WAIT_EHA', 'Procedure_WAIT_EVR',
  'Procedure_Venue_Config'
];

const services = {};
modules.forEach((m) => { services[m] = require(`../../../api/controllers/${m}Service`); });

const HEADERS = { authorization: 'Bearer t' };
const noop = () => {};

function createRes() {
  const res = { statusCode: 0, body: undefined, headers: {}, ended: false };
  res.status = jest.fn((code) => { res.statusCode = code; return res; });
  res.json = jest.fn((payload) => { res.body = payload; return res; });
  res.set = jest.fn((name, value) => { res.headers[name] = value; return res; });
  res.end = jest.fn(() => { res.ended = true; return res; });
  return res;
}

function classify(name) {
  if (name.endsWith('_step_input')) return name.startsWith('update') ? 'update_input' : 'get_input';
  if (name.endsWith('_step_result')) return 'get_result';
  if (name.startsWith('get') && name.endsWith('_steps')) return 'get_steps';
  if (name.startsWith('create')) return 'create';
  if (name.startsWith('update') && name.endsWith('_step')) return 'update';
  if (name.startsWith('get') && name.endsWith('_step')) return 'get';
  return null;
}

beforeEach(() => {
  jest.clearAllMocks();
  node_funcs.get_auth_key.mockReturnValue('AUTHKEY');
  node_funcs.push_error.mockImplementation((message, err) => ({ message, cause: err }));
});

const roleRunners = {
  create(fn) {
    it('create: success with explicit args', async () => {
      node_funcs.createArchiveElement.mockResolvedValue({ ok: 1 });
      const res = createRes();
      await fn({ procedure_id: sv('p'), step: sv({ t: 1 }), insert_after_id: sv('a'), level: sv('CHILD') }, res, noop, HEADERS);
      expect(node_funcs.createArchiveElement).toHaveBeenCalledWith(
        null, 'p', 'STEP', expect.any(String), { t: 1 }, 'a', 'CHILD', 'AUTHKEY'
      );
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ ok: 1 });
    });
    it('create: applies defaults', async () => {
      node_funcs.createArchiveElement.mockResolvedValue({});
      const res = createRes();
      await fn({ procedure_id: sv('p') }, res, noop, HEADERS);
      expect(node_funcs.createArchiveElement).toHaveBeenCalledWith(
        null, 'p', 'STEP', expect.any(String), null, '-1', 'SIBLING', 'AUTHKEY'
      );
    });
    it('create: rejects -> 400', async () => {
      node_funcs.createArchiveElement.mockRejectedValue(new Error('x'));
      const res = createRes();
      await fn({ procedure_id: sv('p') }, res, noop, HEADERS);
      expect(res.statusCode).toBe(400);
    });
  },
  get(fn) {
    it('get: success', async () => {
      node_funcs.getStep.mockResolvedValue({ id: 1 });
      const res = createRes();
      await fn({ procedure_id: sv('p'), elem_id: sv('el') }, res, noop, HEADERS);
      expect(node_funcs.getStep).toHaveBeenCalledWith(null, 'p', 'el', 'AUTHKEY');
      expect(res.body).toEqual({ id: 1 });
    });
    it('get: rejects -> 400', async () => {
      node_funcs.getStep.mockRejectedValue(new Error('x'));
      const res = createRes();
      await fn({ procedure_id: sv('p'), elem_id: sv('el') }, res, noop, HEADERS);
      expect(res.statusCode).toBe(400);
    });
  },
  get_input(fn) {
    it('get_input: success', async () => {
      node_funcs.get_step_input.mockResolvedValue({ in: 1 });
      const res = createRes();
      await fn({ procedure_id: sv('p'), elem_id: sv('el') }, res, noop, HEADERS);
      expect(node_funcs.get_step_input).toHaveBeenCalledWith(null, 'p', 'el', 'AUTHKEY');
      expect(res.body).toEqual({ in: 1 });
    });
    it('get_input: rejects -> 400', async () => {
      node_funcs.get_step_input.mockRejectedValue(new Error('x'));
      const res = createRes();
      await fn({ procedure_id: sv('p'), elem_id: sv('el') }, res, noop, HEADERS);
      expect(res.statusCode).toBe(400);
    });
  },
  get_steps(fn) {
    it('get_steps: returns elements and sets total-count', async () => {
      node_funcs.getProcedureElements.mockResolvedValue({ elems: [{ id: 1 }], total_count: 2 });
      const res = createRes();
      await fn({ procedure_id: sv('p'), offset: sv(0), limit: sv(10), sort: sv('ASC') }, res, noop, HEADERS);
      expect(node_funcs.getProcedureElements).toHaveBeenCalledWith(
        'p', 'STEP', expect.any(String), 0, 10, 'ASC', null, 'AUTHKEY'
      );
      expect(res.headers['x-total-count']).toBe(2);
      expect(res.body).toEqual([{ id: 1 }]);
    });
    it('get_steps: coerces undefined args to null', async () => {
      node_funcs.getProcedureElements.mockResolvedValue({ elems: [], total_count: 0 });
      const res = createRes();
      await fn({ procedure_id: sv(undefined), offset: sv(undefined), limit: sv(undefined), sort: sv(undefined) }, res, noop, HEADERS);
      expect(node_funcs.getProcedureElements).toHaveBeenCalledWith(
        null, 'STEP', expect.any(String), null, null, null, null, 'AUTHKEY'
      );
    });
    it('get_steps: rejects -> 400', async () => {
      node_funcs.getProcedureElements.mockRejectedValue(new Error('x'));
      const res = createRes();
      await fn({ procedure_id: sv('p'), offset: sv(0), limit: sv(10), sort: sv('ASC') }, res, noop, HEADERS);
      expect(res.statusCode).toBe(400);
    });
  },
  update(fn) {
    it('update: success', async () => {
      node_funcs.updateStep.mockResolvedValue({ ok: true });
      const res = createRes();
      await fn({ procedure_id: sv('p'), elem_id: sv('el'), step: sv({ t: 1 }) }, res, noop, HEADERS);
      expect(node_funcs.updateStep).toHaveBeenCalledWith(null, 'p', 'el', { t: 1 }, 'AUTHKEY');
      expect(res.body).toEqual({ ok: true });
    });
    it('update: rejects -> 400', async () => {
      node_funcs.updateStep.mockRejectedValue(new Error('x'));
      const res = createRes();
      await fn({ procedure_id: sv('p'), elem_id: sv('el'), step: sv({}) }, res, noop, HEADERS);
      expect(res.statusCode).toBe(400);
    });
  },
  update_input(fn) {
    it('update_input: returns 204', async () => {
      node_funcs.update_step_input.mockResolvedValue({});
      node_funcs.update_step_input_nonexecutable.mockResolvedValue({});
      const res = createRes();
      await fn({ procedure_id: sv('p'), elem_id: sv('el'), user_input: sv({}) }, res, noop, HEADERS);
      const calls = node_funcs.update_step_input.mock.calls.length +
        node_funcs.update_step_input_nonexecutable.mock.calls.length;
      expect(calls).toBe(1);
      expect(res.statusCode).toBe(204);
      expect(res.ended).toBe(true);
    });
    it('update_input: rejects -> 400', async () => {
      node_funcs.update_step_input.mockRejectedValue(new Error('x'));
      node_funcs.update_step_input_nonexecutable.mockRejectedValue(new Error('x'));
      const res = createRes();
      await fn({ procedure_id: sv('p'), elem_id: sv('el'), user_input: sv({}) }, res, noop, HEADERS);
      expect(res.statusCode).toBe(400);
    });
  }
};

Object.entries(services).forEach(([name, mod]) => {
  describe(`${name}Service (uniform roles)`, () => {
    Object.keys(mod)
      .filter((key) => typeof mod[key] === 'function')
      .forEach((key) => {
        const role = classify(key);
        if (role && roleRunners[role]) {
          describe(key, () => roleRunners[role](mod[key]));
        }
      });
  });
});

describe('Procedure_CUSTOM_SCRIPTService.create (script fields)', () => {
  const CS = services.Procedure_CUSTOM_SCRIPT;
  const fieldMap = [
    ['script_id', 'script_id'],
    ['script_name', 'script_name'],
    ['script_path', 'script_path'],
    ['script_display_name', 'script_display_name'],
    ['script_hash', 'hash'],
    ['script_spec_hash', 'spec_hash']
  ];

  fieldMap.forEach(([argName, targetKey]) => {
    it(`merges only ${argName} into a new step's authoring_user_input`, async () => {
      node_funcs.createArchiveElement.mockResolvedValue({});
      const res = createRes();
      await CS.create_procedure_custom_script_step(
        { procedure_id: sv('p'), [argName]: sv('val') }, res, noop, HEADERS
      );
      const stepArg = node_funcs.createArchiveElement.mock.calls[0][4];
      expect(stepArg.authoring_user_input).toEqual({ [targetKey]: 'val' });
    });
  });

  it('merges all script fields together', async () => {
    node_funcs.createArchiveElement.mockResolvedValue({});
    const res = createRes();
    await CS.create_procedure_custom_script_step(
      {
        procedure_id: sv('p'),
        script_id: sv('sid'), script_name: sv('sname'), script_path: sv('spath'),
        script_display_name: sv('sdisp'), script_hash: sv('shash'), script_spec_hash: sv('sspec')
      },
      res, noop, HEADERS
    );
    const stepArg = node_funcs.createArchiveElement.mock.calls[0][4];
    expect(stepArg.authoring_user_input).toEqual({
      script_id: 'sid', script_name: 'sname', script_path: 'spath',
      script_display_name: 'sdisp', hash: 'shash', spec_hash: 'sspec'
    });
  });

  it('merges script fields into an existing step object', async () => {
    node_funcs.createArchiveElement.mockResolvedValue({});
    const res = createRes();
    await CS.create_procedure_custom_script_step(
      { procedure_id: sv('p'), step: sv({ authoring_user_input: { existing: true } }), script_id: sv('sid') },
      res, noop, HEADERS
    );
    const stepArg = node_funcs.createArchiveElement.mock.calls[0][4];
    expect(stepArg.authoring_user_input.existing).toBe(true);
    expect(stepArg.authoring_user_input.script_id).toBe('sid');
  });
});

describe('Procedure_VIService.get_procedure_vi_ids', () => {
  const VI = services.Procedure_VI;
  it('passes the status filter when provided', async () => {
    node_funcs.getProcedureVIs.mockResolvedValue(['vi1']);
    const res = createRes();
    await VI.get_procedure_vi_ids({ procedure_id: sv('p'), status: sv('OPEN') }, res, noop, HEADERS);
    expect(node_funcs.getProcedureVIs).toHaveBeenCalledWith('p', 'OPEN', 'AUTHKEY');
    expect(res.body).toEqual(['vi1']);
  });
  it('passes undefined filter and coerces procedure_id when absent', async () => {
    node_funcs.getProcedureVIs.mockResolvedValue([]);
    const res = createRes();
    await VI.get_procedure_vi_ids({ procedure_id: sv(undefined) }, res, noop, HEADERS);
    expect(node_funcs.getProcedureVIs).toHaveBeenCalledWith(null, undefined, 'AUTHKEY');
  });
  it('rejects -> 400', async () => {
    node_funcs.getProcedureVIs.mockRejectedValue(new Error('x'));
    const res = createRes();
    await VI.get_procedure_vi_ids({ procedure_id: sv('p') }, res, noop, HEADERS);
    expect(res.statusCode).toBe(400);
  });
});
