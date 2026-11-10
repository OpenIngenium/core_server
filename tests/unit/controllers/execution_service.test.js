'use strict';

// Coverage for ExecutionService (the largest controller service): execution
// CRUD, elements, steps, listing, run/halt/pause/continue, switch-wait,
// redline/blueline operations, export/import, and derived time-refs/data-paths.

jest.mock('../../../api/node_funcs', () => ({
  get_auth_key: jest.fn(),
  push_error: jest.fn(),
  log: { debug: jest.fn(), info: jest.fn(), warning: jest.fn(), error: jest.fn() },
  time_references: ['CURRENT_TIME'],
  createExecution: jest.fn(),
  createArchiveElement: jest.fn(),
  removeExecution: jest.fn(),
  getExecution: jest.fn(),
  as_run: jest.fn(),
  getExecutionElements: jest.fn(),
  getExecutionSimpleElements: jest.fn(),
  history_execution: jest.fn(),
  getExecutionStatus: jest.fn(),
  getAllSteps: jest.fn(),
  getAllExecutions: jest.fn(),
  halt_execution: jest.fn(),
  pause_execution: jest.fn(),
  continue_execution: jest.fn(),
  set_switch_wait: jest.fn(),
  get_switch_wait: jest.fn(),
  get_switch_wait_flag: jest.fn(),
  delete_switch_wait_flag: jest.fn(),
  getExecutionOutline: jest.fn(),
  moveElement: jest.fn(),
  copyElement: jest.fn(),
  updateElement: jest.fn(),
  compute_execution_element: jest.fn(),
  modifyElement: jest.fn(),
  justifyElement: jest.fn(),
  justifyElements: jest.fn(),
  approveElement: jest.fn(),
  approveElements: jest.fn(),
  discardElement: jest.fn(),
  discardElements: jest.fn(),
  delete_element: jest.fn(),
  runExecution: jest.fn(),
  updateExecution: jest.fn(),
  updateExecutionStatus: jest.fn(),
  refresh_execution: jest.fn(),
  setExecutionBoundary: jest.fn(),
  resume_execution: jest.fn(),
  suspend_resume_execution: jest.fn(),
  remove_break_points: jest.fn(),
  searchExecution: jest.fn(),
  exportExecution: jest.fn(),
  importExecution: jest.fn()
}));
jest.mock('fs-extra', () => ({ removeSync: jest.fn() }));

const node_funcs = require('../../../api/node_funcs');
const fse = require('fs-extra');
const { swaggerArg: sv } = require('../mocks/testHelpers');
const E = require('../../../api/controllers/ExecutionService');

const H = { authorization: 'Bearer t' };
const noop = () => {};

function createRes() {
  const res = { statusCode: 0, body: undefined, headers: {}, ended: false };
  res.status = jest.fn((code) => { res.statusCode = code; return res; });
  res.json = jest.fn((payload) => { res.body = payload; return res; });
  res.set = jest.fn((n, v) => { res.headers[n] = v; return res; });
  res.end = jest.fn(() => { res.ended = true; return res; });
  res.download = jest.fn();
  return res;
}

beforeEach(() => {
  jest.clearAllMocks();
  node_funcs.get_auth_key.mockReturnValue('AUTHKEY');
  node_funcs.push_error.mockImplementation((message, err) => ({ message, cause: err, http_code_at_source: 0 }));
});

async function okc(fn, nf, req, expected, code, resolved) {
  nf.mockResolvedValue(resolved !== undefined ? resolved : { ok: 1 });
  const res = createRes();
  await fn(req, res, noop, H);
  expect(nf).toHaveBeenCalledWith(...expected);
  expect(res.statusCode).toBe(code);
  return res;
}
async function plainErr(fn, nf, req) {
  nf.mockRejectedValue(new Error('x'));
  const res = createRes();
  await fn(req, res, noop, H);
  expect(res.statusCode).toBe(400);
}
async function httpErr(fn, nf, req) {
  node_funcs.push_error.mockReturnValueOnce({ http_code_at_source: 409 });
  nf.mockRejectedValueOnce(new Error('x'));
  let res = createRes();
  await fn(req, res, noop, H);
  expect(res.statusCode).toBe(409);
  node_funcs.push_error.mockReturnValueOnce({ http_code_at_source: 0 });
  nf.mockRejectedValueOnce(new Error('x'));
  res = createRes();
  await fn(req, res, noop, H);
  expect(res.statusCode).toBe(400);
}

describe('ExecutionService', () => {
  it('create_execution', async () => {
    await okc(E.create_execution, node_funcs.createExecution, { execution: sv({ e: 1 }) }, [{ e: 1 }, 'AUTHKEY'], 200);
    await plainErr(E.create_execution, node_funcs.createExecution, { execution: sv({}) });
  });

  it('create_execution_step: with step + default + error', async () => {
    await okc(E.create_execution_step, node_funcs.createArchiveElement, { execution_id: sv('e'), step: sv({ s: 1 }), level: sv('CHILD'), insert_after_id: sv('a') }, ['e', null, 'STEP', null, { s: 1 }, 'a', 'CHILD', 'AUTHKEY'], 200);
    await okc(E.create_execution_step, node_funcs.createArchiveElement, { execution_id: sv('e'), level: sv('SIBLING'), insert_after_id: sv('-1') }, ['e', null, 'STEP', null, null, '-1', 'SIBLING', 'AUTHKEY'], 200);
    await plainErr(E.create_execution_step, node_funcs.createArchiveElement, { execution_id: sv('e'), level: sv('SIBLING'), insert_after_id: sv('-1') });
  });

  it('delete_execution (204) + http error', async () => {
    await okc(E.delete_execution, node_funcs.removeExecution, { execution_id: sv('e') }, ['e', 'AUTHKEY'], 204);
    await httpErr(E.delete_execution, node_funcs.removeExecution, { execution_id: sv('e') });
  });

  // Simple (execution_id, key) getters with http-code errors.
  const simple = [
    ['get_execution', 'getExecution', 200],
    ['get_execution_as_run', 'as_run', 200],
    ['get_execution_status', 'getExecutionStatus', 200],
    ['get_execution_outline', 'getExecutionOutline', 200],
    ['halt_execution', 'halt_execution', 200],
    ['pause_execution', 'pause_execution', 200],
    ['refresh_execution', 'refresh_execution', 200],
    ['remove_break_points', 'remove_break_points', 200],
    ['continue_execution', 'continue_execution', 204]
  ];
  simple.forEach(([fn, nf, code]) => {
    it(`${fn}: success + http error`, async () => {
      await okc(E[fn], node_funcs[nf], { execution_id: sv('e') }, ['e', 'AUTHKEY'], code);
      await httpErr(E[fn], node_funcs[nf], { execution_id: sv('e') });
    });
  });

  // Switch-wait endpoints do not resolve an auth key.
  it('set_switch_wait', async () => {
    await okc(E.set_switch_wait, node_funcs.set_switch_wait, { execution_id: sv('e'), switch_wait_input: sv({ switch_wait_secs: 5 }) }, ['e', { switch_wait_secs: 5 }], 200);
    await httpErr(E.set_switch_wait, node_funcs.set_switch_wait, { execution_id: sv('e'), switch_wait_input: sv({}) });
  });
  const switchGetters = [['get_switch_wait', 'get_switch_wait'], ['get_switch_wait_flag', 'get_switch_wait_flag'], ['delete_switch_wait_flag', 'delete_switch_wait_flag']];
  switchGetters.forEach(([fn, nf]) => {
    it(`${fn}: success + http error`, async () => {
      await okc(E[fn], node_funcs[nf], { execution_id: sv('e') }, ['e'], 200);
      await httpErr(E[fn], node_funcs[nf], { execution_id: sv('e') });
    });
  });

  // (execution_id, X, key) endpoints.
  const withInput = [
    ['move_execution_element', 'moveElement', 'move_element_input'],
    ['copy_execution_element', 'copyElement', 'copy_element_input'],
    ['execution_discard_elements', 'discardElements', 'discard_input'],
    ['update_execution', 'updateExecution', 'execution_meta_data'],
    ['update_execution_status', 'updateExecutionStatus', 'execution_status'],
    ['set_boundary_element', 'setExecutionBoundary', 'elem_id'],
    ['resume_execution', 'resume_execution', 'resume_input'],
    ['suspend_resume_execution', 'suspend_resume_execution', 'suspend_resume_input']
  ];
  withInput.forEach(([fn, nf, argName]) => {
    it(`${fn}: success + http error`, async () => {
      await okc(E[fn], node_funcs[nf], { execution_id: sv('e'), [argName]: sv({ v: 1 }) }, ['e', { v: 1 }, 'AUTHKEY'], 200);
      await httpErr(E[fn], node_funcs[nf], { execution_id: sv('e'), [argName]: sv({}) });
    });
  });

  // (execution_id, elem_id, key) endpoints.
  const withElem = [
    ['execution_compute_element', 'compute_execution_element'],
    ['execution_modify_element', 'modifyElement'],
    ['execution_discard_element', 'discardElement']
  ];
  withElem.forEach(([fn, nf]) => {
    it(`${fn}: success + http error`, async () => {
      await okc(E[fn], node_funcs[nf], { execution_id: sv('e'), elem_id: sv('el') }, ['e', 'el', 'AUTHKEY'], 200);
      await httpErr(E[fn], node_funcs[nf], { execution_id: sv('e'), elem_id: sv('el') });
    });
  });

  // (execution_id, elem_id, X, key) endpoints.
  const withElemInput = [
    ['execution_justify_element', 'justifyElement', 'justification_input'],
    ['execution_approve_element', 'approveElement', 'approval_input']
  ];
  withElemInput.forEach(([fn, nf, argName]) => {
    it(`${fn}: success + http error`, async () => {
      await okc(E[fn], node_funcs[nf], { execution_id: sv('e'), elem_id: sv('el'), [argName]: sv({ v: 1 }) }, ['e', 'el', { v: 1 }, 'AUTHKEY'], 200);
      await httpErr(E[fn], node_funcs[nf], { execution_id: sv('e'), elem_id: sv('el'), [argName]: sv({}) });
    });
  });

  it('execution_update_element', async () => {
    await okc(E.execution_update_element, node_funcs.updateElement, { execution_id: sv('e'), elem_id: sv('el'), elem_input: sv({ i: 1 }) }, ['e', null, 'el', { i: 1 }, 'AUTHKEY'], 200);
    await httpErr(E.execution_update_element, node_funcs.updateElement, { execution_id: sv('e'), elem_id: sv('el'), elem_input: sv({}) });
  });

  it('execution_delete_element', async () => {
    await okc(E.execution_delete_element, node_funcs.delete_element, { execution_id: sv('e'), elem_id: sv('el') }, ['e', null, 'el', 'AUTHKEY'], 200);
    await httpErr(E.execution_delete_element, node_funcs.delete_element, { execution_id: sv('e'), elem_id: sv('el') });
  });

  it('execution_bulk_justify: unpacks input', async () => {
    await okc(E.execution_bulk_justify, node_funcs.justifyElements, { execution_id: sv('e'), bulk_justification_input: sv({ elem_ids: ['a'], justification_input: { j: 1 } }) }, ['e', ['a'], { j: 1 }, 'AUTHKEY'], 200);
    await httpErr(E.execution_bulk_justify, node_funcs.justifyElements, { execution_id: sv('e'), bulk_justification_input: sv({ elem_ids: ['a'], justification_input: {} }) });
  });

  it('execution_bulk_approve: unpacks input', async () => {
    await okc(E.execution_bulk_approve, node_funcs.approveElements, { execution_id: sv('e'), bulk_approval_input: sv({ elem_ids: ['a'], approval_input: { a: 1 } }) }, ['e', ['a'], { a: 1 }, 'AUTHKEY'], 200);
    await httpErr(E.execution_bulk_approve, node_funcs.approveElements, { execution_id: sv('e'), bulk_approval_input: sv({ elem_ids: ['a'], approval_input: {} }) });
  });

  it('get_execution_elements: values + undefined + http error', async () => {
    const full = { execution_id: sv('e'), elem_type: sv('STEP'), step_type: sv('CMD'), offset: sv(0), limit: sv(10), sort: sv('ASC'), description: sv('d'), all_elements: sv('ON'), comment_filter: sv('OFF'), ar_comment_filter: sv('OFF'), dr_comment_filter: sv('OFF') };
    const res = await okc(E.get_execution_elements, node_funcs.getExecutionElements, full, ['e', 'STEP', 'CMD', 0, 10, 'ASC', 'd', 'ON', 'OFF', 'OFF', 'OFF', 'AUTHKEY'], 200, { elems: [1], total_count: 1 });
    expect(res.headers['x-total-count']).toBe(1);
    await okc(E.get_execution_elements, node_funcs.getExecutionElements, { execution_id: sv(undefined), elem_type: sv(undefined), step_type: sv(undefined), offset: sv(undefined), limit: sv(undefined), sort: sv(undefined), description: sv(undefined), all_elements: sv(undefined), comment_filter: sv(undefined), ar_comment_filter: sv(undefined), dr_comment_filter: sv(undefined) }, [null, null, null, null, null, null, null, null, null, null, null, 'AUTHKEY'], 200, { elems: [], total_count: 0 });
    await httpErr(E.get_execution_elements, node_funcs.getExecutionElements, full);
  });

  it('get_execution_simple_elements: sets total-count from length + http error', async () => {
    const res = await okc(E.get_execution_simple_elements, node_funcs.getExecutionSimpleElements, { execution_id: sv('e') }, ['e', 'AUTHKEY'], 200, [1, 2, 3]);
    expect(res.headers['x-total-count']).toBe(3);
    await httpErr(E.get_execution_simple_elements, node_funcs.getExecutionSimpleElements, { execution_id: sv('e') });
  });

  it('get_execution_history: values + undefined + http error', async () => {
    await okc(E.get_execution_history, node_funcs.history_execution, { execution_id: sv('e'), offset: sv(0), limit: sv(10), sort: sv('ASC') }, ['e', 0, 10, 'ASC', 'AUTHKEY'], 200);
    await okc(E.get_execution_history, node_funcs.history_execution, { execution_id: sv('e'), offset: sv(undefined), limit: sv(undefined), sort: sv(undefined) }, ['e', null, null, null, 'AUTHKEY'], 200);
    await httpErr(E.get_execution_history, node_funcs.history_execution, { execution_id: sv('e'), offset: sv(0), limit: sv(10), sort: sv('ASC') });
  });

  it('get_execution_steps: params built + empty + http error', async () => {
    const res = await okc(E.get_execution_steps, node_funcs.getAllSteps, { execution_id: sv('e'), sort: sv('ASC'), offset: sv(0), limit: sv(10) }, ['e', null, { sort: 'ASC', offset: '0', limit: '10' }, 'AUTHKEY'], 200, { elems: [1], total_count: 1 });
    expect(res.headers['x-total-count']).toBe(1);
    await okc(E.get_execution_steps, node_funcs.getAllSteps, { execution_id: sv('e'), sort: sv(undefined), offset: sv(undefined), limit: sv(undefined) }, ['e', null, {}, 'AUTHKEY'], 200, { elems: [], total_count: 0 });
    await httpErr(E.get_execution_steps, node_funcs.getAllSteps, { execution_id: sv('e'), sort: sv('ASC'), offset: sv(0), limit: sv(10) });
  });

  it('get_executions: all params + defaults + http error', async () => {
    const full = {
      offset: sv(5), limit: sv(20), sort: sv('ASC'), sort_by: sv('NAME'), execution_id: sv('e'),
      description: sv('d'), status: sv('CLOSED'), statuses: sv(['A']), from_time: sv('t1'), to_time: sv('t2'),
      completed: sv(true), venue_id: sv('v'), venue_name: sv('vn'), venue_type: sv('vt'), run_for_score: sv(false),
      test_conductor: sv('tc'), procedure_id: sv('p'), version: sv(2), institutional_id: sv('iid'), institutional_release_id: sv('irid')
    };
    const res = await okc(E.get_executions, node_funcs.getAllExecutions, full, [{
      offset: '5', limit: '20', sort: 'ASC', sort_by: 'NAME', execution_id: 'e', description: 'd', status: 'CLOSED',
      statuses: ['A'], from_time: 't1', to_time: 't2', completed: 'true', venue_id: 'v', venue_name: 'vn', venue_type: 'vt',
      run_for_score: 'false', test_conductor: 'tc', procedure_id: 'p', version: '2', institutional_id: 'iid', institutional_release_id: 'irid'
    }, 'AUTHKEY'], 200, { executions: [1], total_count: 1 });
    expect(res.headers['x-total-count']).toBe(1);

    const empty = {
      offset: sv(undefined), limit: sv(undefined), sort: sv(undefined), sort_by: sv(undefined), execution_id: sv(undefined),
      description: sv(undefined), status: sv(undefined), statuses: sv(undefined), from_time: sv(undefined), to_time: sv(undefined),
      completed: sv(undefined), venue_id: sv(undefined), venue_name: sv(undefined), venue_type: sv(undefined), run_for_score: sv(undefined),
      test_conductor: sv(undefined), procedure_id: sv(undefined), version: sv(undefined), institutional_id: sv(undefined), institutional_release_id: sv(undefined)
    };
    await okc(E.get_executions, node_funcs.getAllExecutions, empty, [{ offset: '0', limit: '50', sort: 'DESC', sort_by: 'TIME_STARTED' }, 'AUTHKEY'], 200, { executions: [], total_count: 0 });
    await httpErr(E.get_executions, node_funcs.getAllExecutions, full);
  });

  describe('run_execution', () => {
    it('SYNC returns 200', async () => {
      await okc(E.run_execution, node_funcs.runExecution, { execution_id: sv('e'), current_step_id: sv('s'), run_mode: sv('SYNC') }, ['e', 's', 'SYNC', 'AUTHKEY'], 200);
    });
    it('ASYNC returns 202', async () => {
      await okc(E.run_execution, node_funcs.runExecution, { execution_id: sv('e'), current_step_id: sv('s'), run_mode: sv('ASYNC') }, ['e', 's', 'ASYNC', 'AUTHKEY'], 202);
    });
    it('defaults current_step_id and run_mode', async () => {
      await okc(E.run_execution, node_funcs.runExecution, { execution_id: sv('e'), current_step_id: sv(undefined), run_mode: sv(undefined) }, ['e', '', 'SYNC', 'AUTHKEY'], 200);
    });
    it('logs and returns http error', async () => {
      await httpErr(E.run_execution, node_funcs.runExecution, { execution_id: sv('e'), current_step_id: sv('s'), run_mode: sv('SYNC') });
      expect(node_funcs.log.error).toHaveBeenCalled();
    });
  });

  describe('get_execution_time_references', () => {
    it('derives from run_records and execution_user_input', async () => {
      node_funcs.getExecutionElements.mockResolvedValue({
        elems: [
          { run_records: [{ execution_user_input: { name: 'RR1' } }, { execution_user_input: { name: 'CURRENT_TIME' } }, { execution_user_input: {} }] },
          { execution_user_input: { name: 'UI1' } },
          { execution_user_input: { name: 'UI1' } },
          { execution_user_input: {} },
          {}
        ],
        total_count: 5
      });
      const res = createRes();
      await E.get_execution_time_references({ execution_id: sv('e') }, res, noop, H);
      expect(node_funcs.getExecutionElements).toHaveBeenCalledWith('e', 'STEP', 'TIME_REFERENCE', 0, 10000, null, null, null, null, null, null, 'AUTHKEY');
      expect(res.body).toEqual(['CURRENT_TIME', 'RR1', 'UI1']);
    });
    it('returns http error', async () => {
      await httpErr(E.get_execution_time_references, node_funcs.getExecutionElements, { execution_id: sv('e') });
    });
  });

  describe('get_execution_data_paths', () => {
    it('derives unique data paths', async () => {
      node_funcs.getExecutionElements.mockResolvedValue({
        elems: [
          { execution_user_input: { entries: [{ data_path: '/a' }, { data_path: '/a' }, {}] } },
          { execution_user_input: {} },
          {}
        ],
        total_count: 3
      });
      const res = createRes();
      await E.get_execution_data_paths({ execution_id: sv('e') }, res, noop, H);
      expect(node_funcs.getExecutionElements).toHaveBeenCalledWith('e', 'STEP', 'GDS_MANUAL', 0, 10000, null, null, null, null, null, null, 'AUTHKEY');
      expect(res.body).toEqual(['/a']);
    });
    it('returns http error', async () => {
      await httpErr(E.get_execution_data_paths, node_funcs.getExecutionElements, { execution_id: sv('e') });
    });
  });

  it('search_execution: value + undefined + error', async () => {
    await okc(E.search_execution, node_funcs.searchExecution, { execution_id: sv('e'), search_input: sv({ q: 1 }) }, ['e', { q: 1 }, 'AUTHKEY'], 200);
    await okc(E.search_execution, node_funcs.searchExecution, { execution_id: sv('e'), search_input: sv(undefined) }, ['e', null, 'AUTHKEY'], 200);
    await plainErr(E.search_execution, node_funcs.searchExecution, { execution_id: sv('e'), search_input: sv({ q: 1 }) });
  });

  describe('post_execution_message', () => {
    it('is a no-op returning 204', async () => {
      const res = createRes();
      await E.post_execution_message({}, res, noop, H);
      expect(res.statusCode).toBe(204);
    });
    it('handles unexpected errors with 400', async () => {
      const res = createRes();
      res.end = jest.fn(() => { throw new Error('boom'); });
      await E.post_execution_message({}, res, noop, H);
      expect(node_funcs.push_error).toHaveBeenCalled();
      expect(res.statusCode).toBe(400);
    });
  });

  describe('export_execution', () => {
    it('downloads and cleans up (no error)', async () => {
      node_funcs.exportExecution.mockResolvedValue('/tmp/xdir/f.gz');
      const res = createRes();
      res.download = jest.fn((fp, name, cb) => cb());
      await E.export_execution({ execution_id: sv('e') }, res, noop, H);
      expect(node_funcs.exportExecution).toHaveBeenCalledWith('e', 'AUTHKEY');
      expect(fse.removeSync).toHaveBeenCalledWith('/tmp/xdir');
    });
    it('logs download error but cleans up', async () => {
      node_funcs.exportExecution.mockResolvedValue('/tmp/xdir/f.gz');
      const res = createRes();
      res.download = jest.fn((fp, name, cb) => cb(new Error('dl')));
      await E.export_execution({ execution_id: sv('e') }, res, noop, H);
      expect(node_funcs.log.error).toHaveBeenCalled();
      expect(fse.removeSync).toHaveBeenCalledWith('/tmp/xdir');
    });
    it('returns 400 when export fails', async () => {
      node_funcs.exportExecution.mockRejectedValue(new Error('x'));
      const res = createRes();
      await E.export_execution({ execution_id: sv('e') }, res, noop, H);
      expect(res.statusCode).toBe(400);
    });
  });

  it('import_execution: value + undefined + error', async () => {
    await okc(E.import_execution, node_funcs.importExecution, { execution_file: sv('f') }, ['f', 'AUTHKEY'], 200);
    await okc(E.import_execution, node_funcs.importExecution, { execution_file: sv(undefined) }, [null, 'AUTHKEY'], 200);
    await plainErr(E.import_execution, node_funcs.importExecution, { execution_file: sv('f') });
  });
});
