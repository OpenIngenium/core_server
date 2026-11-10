'use strict';

// Coverage for ProcedureService (working-copy, elements, steps, structure,
// move/copy/update/delete/replace element, and tag operations).

jest.mock('../../../api/node_funcs', () => ({
  get_auth_key: jest.fn(),
  push_error: jest.fn(),
  log: { debug: jest.fn(), info: jest.fn(), warning: jest.fn(), error: jest.fn() },
  loadProcedure: jest.fn(),
  importProcedureVersion: jest.fn(),
  createArchiveElement: jest.fn(),
  getProcedureElements: jest.fn(),
  getAllSteps: jest.fn(),
  getStructure: jest.fn(),
  moveProcedureElement: jest.fn(),
  copyProcedureElement: jest.fn(),
  updateElement: jest.fn(),
  delete_element: jest.fn(),
  replace_element: jest.fn(),
  procedure_create_tag: jest.fn(),
  procedure_update_tag: jest.fn(),
  procedure_delete_tag: jest.fn(),
  procedure_element_apply_tag: jest.fn(),
  procedure_element_remove_tag: jest.fn()
}));

const node_funcs = require('../../../api/node_funcs');
const { swaggerArg: sv } = require('../mocks/testHelpers');
const P = require('../../../api/controllers/ProcedureService');

const H = { authorization: 'Bearer t' };
const noop = () => {};

function createRes() {
  const res = { statusCode: 0, body: undefined, headers: {}, ended: false };
  res.status = jest.fn((code) => { res.statusCode = code; return res; });
  res.json = jest.fn((payload) => { res.body = payload; return res; });
  res.set = jest.fn((n, v) => { res.headers[n] = v; return res; });
  res.end = jest.fn(() => { res.ended = true; return res; });
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

describe('ProcedureService', () => {
  it('load_working_copy: values + undefined + error (204)', async () => {
    await okc(P.load_working_copy, node_funcs.loadProcedure, { procedure_id: sv('p'), procedure_info: sv({ i: 1 }) }, ['p', { i: 1 }, 'AUTHKEY'], 204);
    await okc(P.load_working_copy, node_funcs.loadProcedure, { procedure_id: sv(undefined), procedure_info: sv(undefined) }, [null, undefined, 'AUTHKEY'], 204);
    await plainErr(P.load_working_copy, node_funcs.loadProcedure, { procedure_id: sv('p'), procedure_info: sv({}) });
  });

  it('import_procedure_version: values + undefined + error', async () => {
    await okc(P.import_procedure_version, node_funcs.importProcedureVersion, { procedure_id: sv('p'), procedure_version_file: sv('f') }, ['p', 'f', 'AUTHKEY'], 200);
    await okc(P.import_procedure_version, node_funcs.importProcedureVersion, { procedure_id: sv(undefined), procedure_version_file: sv(undefined) }, [null, null, 'AUTHKEY'], 200);
    await plainErr(P.import_procedure_version, node_funcs.importProcedureVersion, { procedure_id: sv('p'), procedure_version_file: sv('f') });
  });

  it('procedure_create_step: success + error', async () => {
    await okc(P.procedure_create_step, node_funcs.createArchiveElement, { procedure_id: sv('p'), level: sv('CHILD'), insert_after_id: sv('a') }, [null, 'p', 'STEP', null, 'a', 'CHILD', 'AUTHKEY'], 200);
    await plainErr(P.procedure_create_step, node_funcs.createArchiveElement, { procedure_id: sv('p'), level: sv('CHILD'), insert_after_id: sv('a') });
  });

  it('procedure_get_elements: values + undefined + http-code error', async () => {
    const full = { procedure_id: sv('p'), elem_type: sv('STEP'), step_type: sv('CMD'), offset: sv(0), limit: sv(10), sort: sv('ASC'), description: sv('d') };
    const res = await okc(P.procedure_get_elements, node_funcs.getProcedureElements, full, ['p', 'STEP', 'CMD', 0, 10, 'ASC', 'd', 'AUTHKEY'], 200, { elems: [1], total_count: 1 });
    expect(res.headers['x-total-count']).toBe(1);
    await okc(P.procedure_get_elements, node_funcs.getProcedureElements, { procedure_id: sv(undefined), elem_type: sv(undefined), step_type: sv(undefined), offset: sv(undefined), limit: sv(undefined), sort: sv(undefined), description: sv(undefined) }, [null, null, null, null, null, null, null, 'AUTHKEY'], 200, { elems: [], total_count: 0 });
    await httpErr(P.procedure_get_elements, node_funcs.getProcedureElements, full);
  });

  it('procedure_get_steps: params built + empty params + http-code error', async () => {
    const res = await okc(P.procedure_get_steps, node_funcs.getAllSteps, { procedure_id: sv('p'), sort: sv('ASC'), offset: sv(0), limit: sv(10) }, [null, 'p', { sort: 'ASC', offset: '0', limit: '10' }, 'AUTHKEY'], 200, { elems: [1], total_count: 1 });
    expect(res.headers['x-total-count']).toBe(1);
    await okc(P.procedure_get_steps, node_funcs.getAllSteps, { procedure_id: sv('p'), sort: sv(undefined), offset: sv(undefined), limit: sv(undefined) }, [null, 'p', {}, 'AUTHKEY'], 200, { elems: [], total_count: 0 });
    await httpErr(P.procedure_get_steps, node_funcs.getAllSteps, { procedure_id: sv('p'), sort: sv('ASC'), offset: sv(0), limit: sv(10) });
  });

  it('procedure_get_structure: values + undefined + http-code error', async () => {
    await okc(P.procedure_get_structure, node_funcs.getStructure, { procedure_id: sv('p'), offset: sv(0), limit: sv(10), sort: sv('ASC') }, ['p', 0, 10, 'ASC', false, 'AUTHKEY'], 200);
    await okc(P.procedure_get_structure, node_funcs.getStructure, { procedure_id: sv(undefined), offset: sv(undefined), limit: sv(undefined), sort: sv(undefined) }, [null, null, null, null, false, 'AUTHKEY'], 200);
    await httpErr(P.procedure_get_structure, node_funcs.getStructure, { procedure_id: sv('p'), offset: sv(0), limit: sv(10), sort: sv('ASC') });
  });

  it('procedure_move_element: values + undefined + http-code error', async () => {
    await okc(P.procedure_move_element, node_funcs.moveProcedureElement, { procedure_id: sv('p'), move_element_input: sv({ m: 1 }) }, ['p', { m: 1 }, 'AUTHKEY'], 200);
    await okc(P.procedure_move_element, node_funcs.moveProcedureElement, { procedure_id: sv(undefined), move_element_input: sv({ m: 1 }) }, [null, { m: 1 }, 'AUTHKEY'], 200);
    await httpErr(P.procedure_move_element, node_funcs.moveProcedureElement, { procedure_id: sv('p'), move_element_input: sv({}) });
  });

  it('procedure_copy_element: values + undefined + http-code error', async () => {
    await okc(P.procedure_copy_element, node_funcs.copyProcedureElement, { procedure_id: sv('p'), copy_element_input: sv({ c: 1 }) }, ['p', { c: 1 }, 'AUTHKEY'], 200);
    await okc(P.procedure_copy_element, node_funcs.copyProcedureElement, { procedure_id: sv(undefined), copy_element_input: sv({ c: 1 }) }, [null, { c: 1 }, 'AUTHKEY'], 200);
    await httpErr(P.procedure_copy_element, node_funcs.copyProcedureElement, { procedure_id: sv('p'), copy_element_input: sv({}) });
  });

  it('procedure_update_element: success + http-code error', async () => {
    await okc(P.procedure_update_element, node_funcs.updateElement, { procedure_id: sv('p'), elem_id: sv('el'), elem_input: sv({ e: 1 }) }, [null, 'p', 'el', { e: 1 }, 'AUTHKEY'], 200);
    await httpErr(P.procedure_update_element, node_funcs.updateElement, { procedure_id: sv('p'), elem_id: sv('el'), elem_input: sv({}) });
  });

  it('procedure_delete_element: success + http-code error', async () => {
    await okc(P.procedure_delete_element, node_funcs.delete_element, { procedure_id: sv('p'), elem_id: sv('el') }, [null, 'p', 'el', 'AUTHKEY'], 200);
    await httpErr(P.procedure_delete_element, node_funcs.delete_element, { procedure_id: sv('p'), elem_id: sv('el') });
  });

  it('procedure_replace_element: success + http-code error', async () => {
    await okc(P.procedure_replace_element, node_funcs.replace_element, { procedure_id: sv('p'), elem_id: sv('el'), replace_element_input: sv({ r: 1 }) }, ['p', 'el', { r: 1 }, 'AUTHKEY'], 200);
    await httpErr(P.procedure_replace_element, node_funcs.replace_element, { procedure_id: sv('p'), elem_id: sv('el'), replace_element_input: sv({}) });
  });

  it('procedure_create_tag: success + error', async () => {
    await okc(P.procedure_create_tag, node_funcs.procedure_create_tag, { procedure_id: sv('p'), tag_input: sv({ t: 1 }) }, ['p', { t: 1 }, 'AUTHKEY'], 200);
    await plainErr(P.procedure_create_tag, node_funcs.procedure_create_tag, { procedure_id: sv('p'), tag_input: sv({}) });
  });

  it('procedure_update_tag: success + error', async () => {
    await okc(P.procedure_update_tag, node_funcs.procedure_update_tag, { procedure_id: sv('p'), tag_id: sv('t'), tag_input: sv({ t: 1 }) }, ['p', 't', { t: 1 }, 'AUTHKEY'], 200);
    await plainErr(P.procedure_update_tag, node_funcs.procedure_update_tag, { procedure_id: sv('p'), tag_id: sv('t'), tag_input: sv({}) });
  });

  it('procedure_delete_tag: success + error', async () => {
    await okc(P.procedure_delete_tag, node_funcs.procedure_delete_tag, { procedure_id: sv('p'), tag_id: sv('t') }, ['p', 't', 'AUTHKEY'], 200);
    await plainErr(P.procedure_delete_tag, node_funcs.procedure_delete_tag, { procedure_id: sv('p'), tag_id: sv('t') });
  });

  it('procedure_element_apply_tag: success + error', async () => {
    await okc(P.procedure_element_apply_tag, node_funcs.procedure_element_apply_tag, { procedure_id: sv('p'), elem_id: sv('el'), tag_id: sv('t') }, ['p', 'el', 't', 'AUTHKEY'], 200);
    await plainErr(P.procedure_element_apply_tag, node_funcs.procedure_element_apply_tag, { procedure_id: sv('p'), elem_id: sv('el'), tag_id: sv('t') });
  });

  it('procedure_element_remove_tag: success + error', async () => {
    await okc(P.procedure_element_remove_tag, node_funcs.procedure_element_remove_tag, { procedure_id: sv('p'), elem_id: sv('el'), tag_id: sv('t') }, ['p', 'el', 't', 'AUTHKEY'], 200);
    await plainErr(P.procedure_element_remove_tag, node_funcs.procedure_element_remove_tag, { procedure_id: sv('p'), elem_id: sv('el'), tag_id: sv('t') });
  });
});
