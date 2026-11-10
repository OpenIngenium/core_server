'use strict';

// Data-driven coverage for the uniform "step service" family. Every step
// service delegates to api/node_funcs with an identical try/catch shape, so a
// single mocked node_funcs drives all of them. Non-uniform behavior (VI ids,
// CUSTOM_SCRIPT script fields, MANUAL_VERFICATION verification defaults) is
// covered by the bespoke tests at the bottom of this file.

jest.mock('../../../api/node_funcs', () => ({
  get_auth_key: jest.fn(),
  push_error: jest.fn(),
  parse_username: jest.fn(),
  createArchiveElement: jest.fn(),
  getStep: jest.fn(),
  get_step_input: jest.fn(),
  get_step_result: jest.fn(),
  getExecutionElements: jest.fn(),
  updateStep: jest.fn(),
  update_step_input: jest.fn(),
  update_step_input_nonexecutable: jest.fn(),
  getVIs: jest.fn()
}));

const node_funcs = require('../../../api/node_funcs');
const { swaggerArg: sv } = require('../mocks/testHelpers');

const services = {
  BUS_1553: require('../../../api/controllers/BUS_1553Service'),
  CHECK_CONFIG: require('../../../api/controllers/CHECK_CONFIGService'),
  CMD: require('../../../api/controllers/CMDService'),
  CMD_FILE: require('../../../api/controllers/CMD_FILEService'),
  CMD_SCMF: require('../../../api/controllers/CMD_SCMFService'),
  CMD_SSE: require('../../../api/controllers/CMD_SSEService'),
  Environment: require('../../../api/controllers/EnvironmentService'),
  GDS: require('../../../api/controllers/GDSService'),
  GET_CONFIG: require('../../../api/controllers/GET_CONFIGService'),
  GRAPH_EHA: require('../../../api/controllers/GRAPH_EHAService'),
  LIST_DATA_PRODUCTS: require('../../../api/controllers/LIST_DATA_PRODUCTSService'),
  Manual_EIP: require('../../../api/controllers/Manual_EIPService'),
  Manual_Input: require('../../../api/controllers/Manual_InputService'),
  QUERY_EVR: require('../../../api/controllers/QUERY_EVRService'),
  TIME_REFERENCE: require('../../../api/controllers/TIME_REFERENCEService'),
  UPDATE_CONFIG: require('../../../api/controllers/UPDATE_CONFIGService'),
  VERIFY_EHA: require('../../../api/controllers/VERIFY_EHAService'),
  WAIT: require('../../../api/controllers/WAITService'),
  WAIT_DATA_PRODUCTS: require('../../../api/controllers/WAIT_DATA_PRODUCTSService'),
  WAIT_EHA: require('../../../api/controllers/WAIT_EHAService'),
  WAIT_EVR: require('../../../api/controllers/WAIT_EVRService'),
  VI: require('../../../api/controllers/VIService'),
  VI_STATUS: require('../../../api/controllers/VI_STATUSService'),
  CUSTOM_SCRIPT: require('../../../api/controllers/CUSTOM_SCRIPTService'),
  MANUAL_VERFICATION: require('../../../api/controllers/MANUAL_VERFICATIONService'),
  Venue_Config: require('../../../api/controllers/Venue_ConfigService')
};

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
  if (name.endsWith('_step_input')) {
    return name.startsWith('update') ? 'update_input' : 'get_input';
  }
  if (name.endsWith('_step_result')) return 'get_result';
  if (name.startsWith('get_execution_') && name.endsWith('_steps')) return 'get_execution';
  if (name.startsWith('create')) return 'create';
  if (name.startsWith('update') && name.endsWith('_step')) return 'update';
  if (name.startsWith('get') && name.endsWith('_step')) return 'get';
  return null;
}

beforeEach(() => {
  jest.clearAllMocks();
  node_funcs.get_auth_key.mockReturnValue('AUTHKEY');
  node_funcs.push_error.mockImplementation((message, err) => ({ message, cause: err }));
  node_funcs.parse_username.mockReturnValue('tester');
});

const roleRunners = {
  create(fn) {
    it('create: success with explicit args returns 200', async () => {
      node_funcs.createArchiveElement.mockResolvedValue({ ok: 1 });
      const res = createRes();
      await fn(
        { execution_id: sv('e'), step: sv({ t: 1 }), insert_after_id: sv('a'), level: sv('CHILD') },
        res, noop, HEADERS
      );
      expect(node_funcs.get_auth_key).toHaveBeenCalledWith(HEADERS);
      expect(node_funcs.createArchiveElement).toHaveBeenCalledWith(
        'e', null, 'STEP', expect.any(String), { t: 1 }, 'a', 'CHILD', 'AUTHKEY'
      );
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ ok: 1 });
    });

    it('create: applies defaults when optional args missing', async () => {
      node_funcs.createArchiveElement.mockResolvedValue({});
      const res = createRes();
      await fn({ execution_id: sv('e') }, res, noop, HEADERS);
      expect(node_funcs.createArchiveElement).toHaveBeenCalledWith(
        'e', null, 'STEP', expect.any(String), null, '-1', 'SIBLING', 'AUTHKEY'
      );
    });

    it('create: rejects -> 400 with pushed error', async () => {
      node_funcs.createArchiveElement.mockRejectedValue(new Error('boom'));
      const res = createRes();
      await fn({ execution_id: sv('e') }, res, noop, HEADERS);
      expect(node_funcs.push_error).toHaveBeenCalledWith('Error when creating a step', expect.any(Error));
      expect(res.statusCode).toBe(400);
    });
  },

  get(fn) {
    it('get: returns step on success', async () => {
      node_funcs.getStep.mockResolvedValue({ id: 'x' });
      const res = createRes();
      await fn({ execution_id: sv('e'), elem_id: sv('el') }, res, noop, HEADERS);
      expect(node_funcs.getStep).toHaveBeenCalledWith('e', null, 'el', 'AUTHKEY');
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ id: 'x' });
    });
    it('get: rejects -> 400', async () => {
      node_funcs.getStep.mockRejectedValue(new Error('x'));
      const res = createRes();
      await fn({ execution_id: sv('e'), elem_id: sv('el') }, res, noop, HEADERS);
      expect(res.statusCode).toBe(400);
    });
  },

  get_input(fn) {
    it('get_input: returns input on success', async () => {
      node_funcs.get_step_input.mockResolvedValue({ in: 1 });
      const res = createRes();
      await fn({ execution_id: sv('e'), elem_id: sv('el') }, res, noop, HEADERS);
      expect(node_funcs.get_step_input).toHaveBeenCalledWith('e', null, 'el', 'AUTHKEY');
      expect(res.body).toEqual({ in: 1 });
    });
    it('get_input: rejects -> 400', async () => {
      node_funcs.get_step_input.mockRejectedValue(new Error('x'));
      const res = createRes();
      await fn({ execution_id: sv('e'), elem_id: sv('el') }, res, noop, HEADERS);
      expect(res.statusCode).toBe(400);
    });
  },

  get_result(fn) {
    it('get_result: returns result on success', async () => {
      node_funcs.get_step_result.mockResolvedValue({ r: 1 });
      const res = createRes();
      await fn({ execution_id: sv('e'), elem_id: sv('el') }, res, noop, HEADERS);
      expect(node_funcs.get_step_result).toHaveBeenCalledWith('e', 'el', 'AUTHKEY');
      expect(res.body).toEqual({ r: 1 });
    });
    it('get_result: rejects -> 400', async () => {
      node_funcs.get_step_result.mockRejectedValue(new Error('x'));
      const res = createRes();
      await fn({ execution_id: sv('e'), elem_id: sv('el') }, res, noop, HEADERS);
      expect(res.statusCode).toBe(400);
    });
  },

  get_execution(fn) {
    it('get_execution: returns elements and sets total-count', async () => {
      node_funcs.getExecutionElements.mockResolvedValue({ elems: [{ id: 1 }], total_count: 3 });
      const res = createRes();
      await fn(
        { execution_id: sv('e'), offset: sv(0), limit: sv(10), sort: sv('ASC') },
        res, noop, HEADERS
      );
      expect(node_funcs.getExecutionElements).toHaveBeenCalledWith(
        'e', 'STEP', expect.any(String), 0, 10, 'ASC', null, null, null, null, null, 'AUTHKEY'
      );
      expect(res.headers['x-total-count']).toBe(3);
      expect(res.body).toEqual([{ id: 1 }]);
    });
    it('get_execution: coerces undefined args to null', async () => {
      node_funcs.getExecutionElements.mockResolvedValue({ elems: [], total_count: 0 });
      const res = createRes();
      await fn(
        { execution_id: sv(undefined), offset: sv(undefined), limit: sv(undefined), sort: sv(undefined) },
        res, noop, HEADERS
      );
      expect(node_funcs.getExecutionElements).toHaveBeenCalledWith(
        null, 'STEP', expect.any(String), null, null, null, null, null, null, null, null, 'AUTHKEY'
      );
    });
    it('get_execution: rejects -> 400', async () => {
      node_funcs.getExecutionElements.mockRejectedValue(new Error('x'));
      const res = createRes();
      await fn(
        { execution_id: sv('e'), offset: sv(0), limit: sv(10), sort: sv('ASC') },
        res, noop, HEADERS
      );
      expect(res.statusCode).toBe(400);
    });
  },

  update(fn) {
    it('update: updates step on success', async () => {
      node_funcs.updateStep.mockResolvedValue({ ok: true });
      const res = createRes();
      await fn({ execution_id: sv('e'), elem_id: sv('el'), step: sv({ t: 1 }) }, res, noop, HEADERS);
      expect(node_funcs.updateStep).toHaveBeenCalledWith('e', null, 'el', { t: 1 }, 'AUTHKEY');
      expect(res.body).toEqual({ ok: true });
    });
    it('update: rejects -> 400', async () => {
      node_funcs.updateStep.mockRejectedValue(new Error('x'));
      const res = createRes();
      await fn({ execution_id: sv('e'), elem_id: sv('el'), step: sv({}) }, res, noop, HEADERS);
      expect(res.statusCode).toBe(400);
    });
  },

  update_input(fn) {
    it('update_input: updates input and returns 204', async () => {
      node_funcs.update_step_input.mockResolvedValue({});
      node_funcs.update_step_input_nonexecutable.mockResolvedValue({});
      const res = createRes();
      await fn(
        { execution_id: sv('e'), elem_id: sv('el'), user_input: sv({}) },
        res, noop, HEADERS
      );
      const calls =
        node_funcs.update_step_input.mock.calls.length +
        node_funcs.update_step_input_nonexecutable.mock.calls.length;
      expect(calls).toBe(1);
      expect(res.statusCode).toBe(204);
      expect(res.ended).toBe(true);
    });
    it('update_input: rejects -> 400', async () => {
      node_funcs.update_step_input.mockRejectedValue(new Error('x'));
      node_funcs.update_step_input_nonexecutable.mockRejectedValue(new Error('x'));
      const res = createRes();
      await fn(
        { execution_id: sv('e'), elem_id: sv('el'), user_input: sv({}) },
        res, noop, HEADERS
      );
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

// --- Bespoke coverage for non-uniform behavior ---------------------------

describe('VIService.get_execution_vi_ids', () => {
  const VI = services.VI;
  it('passes the status filter when provided', async () => {
    node_funcs.getVIs.mockResolvedValue(['vi1']);
    const res = createRes();
    await VI.get_execution_vi_ids(
      { execution_id: sv('e'), status: sv('OPEN') }, res, noop, HEADERS
    );
    expect(node_funcs.getVIs).toHaveBeenCalledWith('e', 'OPEN', 'AUTHKEY');
    expect(res.body).toEqual(['vi1']);
  });

  it('passes undefined filter when status arg absent, coerces execution_id', async () => {
    node_funcs.getVIs.mockResolvedValue([]);
    const res = createRes();
    await VI.get_execution_vi_ids({ execution_id: sv(undefined) }, res, noop, HEADERS);
    expect(node_funcs.getVIs).toHaveBeenCalledWith(null, undefined, 'AUTHKEY');
  });

  it('rejects -> 400', async () => {
    node_funcs.getVIs.mockRejectedValue(new Error('x'));
    const res = createRes();
    await VI.get_execution_vi_ids({ execution_id: sv('e') }, res, noop, HEADERS);
    expect(res.statusCode).toBe(400);
  });
});

describe('CUSTOM_SCRIPTService.create_custom_script_step (script fields)', () => {
  const CS = services.CUSTOM_SCRIPT;

  // arg name -> resulting key on execution_user_input
  const fieldMap = [
    ['script_id', 'script_id'],
    ['script_name', 'script_name'],
    ['script_path', 'script_path'],
    ['script_display_name', 'script_display_name'],
    ['script_hash', 'hash'],
    ['script_spec_hash', 'spec_hash']
  ];

  fieldMap.forEach(([argName, targetKey]) => {
    it(`merges only ${argName} into a new step when it is the sole field`, async () => {
      node_funcs.createArchiveElement.mockResolvedValue({});
      const res = createRes();
      await CS.create_custom_script_step(
        { execution_id: sv('e'), [argName]: sv('val') },
        res, noop, HEADERS
      );
      const stepArg = node_funcs.createArchiveElement.mock.calls[0][4];
      expect(stepArg.execution_user_input).toEqual({ [targetKey]: 'val' });
    });
  });

  it('merges all script fields together into a new step', async () => {
    node_funcs.createArchiveElement.mockResolvedValue({});
    const res = createRes();
    await CS.create_custom_script_step(
      {
        execution_id: sv('e'),
        script_id: sv('sid'),
        script_name: sv('sname'),
        script_path: sv('spath'),
        script_display_name: sv('sdisp'),
        script_hash: sv('shash'),
        script_spec_hash: sv('sspec')
      },
      res, noop, HEADERS
    );
    const stepArg = node_funcs.createArchiveElement.mock.calls[0][4];
    expect(stepArg.execution_user_input).toEqual({
      script_id: 'sid',
      script_name: 'sname',
      script_path: 'spath',
      script_display_name: 'sdisp',
      hash: 'shash',
      spec_hash: 'sspec'
    });
  });

  it('merges script fields into an existing step object', async () => {
    node_funcs.createArchiveElement.mockResolvedValue({});
    const res = createRes();
    await CS.create_custom_script_step(
      {
        execution_id: sv('e'),
        step: sv({ execution_user_input: { existing: true } }),
        script_id: sv('sid')
      },
      res, noop, HEADERS
    );
    const stepArg = node_funcs.createArchiveElement.mock.calls[0][4];
    expect(stepArg.execution_user_input.existing).toBe(true);
    expect(stepArg.execution_user_input.script_id).toBe('sid');
  });
});

describe('MANUAL_VERFICATIONService.update_manual_verification_step_input', () => {
  const MV = services.MANUAL_VERFICATION;
  it('fills verified_by and time_verified when missing', async () => {
    node_funcs.update_step_input.mockResolvedValue({});
    const res = createRes();
    const user_input = {};
    await MV.update_manual_verification_step_input(
      { execution_id: sv('e'), elem_id: sv('el'), user_input: sv(user_input) },
      res, noop, HEADERS
    );
    expect(node_funcs.parse_username).toHaveBeenCalledWith('AUTHKEY');
    expect(user_input.verified_by).toBe('tester');
    expect(user_input.time_verified).toBeInstanceOf(Date);
    expect(res.statusCode).toBe(204);
  });

  it('preserves provided verified_by and time_verified', async () => {
    node_funcs.update_step_input.mockResolvedValue({});
    const res = createRes();
    const when = new Date('2020-01-01T00:00:00Z');
    const user_input = { verified_by: 'alice', time_verified: when };
    await MV.update_manual_verification_step_input(
      { execution_id: sv('e'), elem_id: sv('el'), user_input: sv(user_input) },
      res, noop, HEADERS
    );
    expect(node_funcs.parse_username).not.toHaveBeenCalled();
    expect(user_input.verified_by).toBe('alice');
    expect(user_input.time_verified).toBe(when);
    expect(res.statusCode).toBe(204);
  });
});
