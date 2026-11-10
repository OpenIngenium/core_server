'use strict';

// Coverage for ProcedureSectionService (execution side) and
// Procedure_ProcedureSectionService (authoring side). Both use
// `== undefined ? null : value` argument normalization, so each function is
// exercised with values present and absent to cover both branches.

jest.mock('../../../api/node_funcs', () => ({
  get_auth_key: jest.fn(),
  push_error: jest.fn(),
  createArchiveElement: jest.fn(),
  get_procedure_sections: jest.fn(),
  get_procedure_section: jest.fn(),
  get_procedure_section_structure: jest.fn(),
  get_procedure_section_elements: jest.fn(),
  get_procedure_section_input: jest.fn(),
  update_procedure_section: jest.fn(),
  update_procedure_section_input: jest.fn(),
  import_procedure_section: jest.fn(),
  call_procedure_section: jest.fn()
}));

const node_funcs = require('../../../api/node_funcs');
const { swaggerArg: sv } = require('../mocks/testHelpers');
const PS = require('../../../api/controllers/ProcedureSectionService');
const PPS = require('../../../api/controllers/Procedure_ProcedureSectionService');

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
  node_funcs.push_error.mockImplementation((message, err) => ({ message, cause: err }));
});

async function ok(fn, nf, req, expected, code, resolved) {
  nf.mockResolvedValue(resolved !== undefined ? resolved : { ok: 1 });
  const res = createRes();
  await fn(req, res, noop, H);
  expect(nf).toHaveBeenCalledWith(...expected);
  expect(res.statusCode).toBe(code);
  return res;
}
async function err(fn, nf, req) {
  nf.mockRejectedValue(new Error('x'));
  const res = createRes();
  await fn(req, res, noop, H);
  expect(res.statusCode).toBe(400);
}

describe('ProcedureSectionService', () => {
  it('create_procedure_section: explicit + defaults + error', async () => {
    await ok(PS.create_procedure_section, node_funcs.createArchiveElement, { execution_id: sv('e'), procedure_section: sv({ s: 1 }), insert_after_id: sv('a'), level: sv('CHILD') }, ['e', null, 'PROCEDURE_SECTION', null, { s: 1 }, 'a', 'CHILD', 'AUTHKEY'], 200);
    await ok(PS.create_procedure_section, node_funcs.createArchiveElement, { execution_id: sv('e') }, ['e', null, 'PROCEDURE_SECTION', null, null, '-1', 'SIBLING', 'AUTHKEY'], 200);
    await err(PS.create_procedure_section, node_funcs.createArchiveElement, { execution_id: sv('e') });
  });

  it('get_execution_procedure_sections: values + undefined + error', async () => {
    const res = await ok(PS.get_execution_procedure_sections, node_funcs.get_procedure_sections, { execution_id: sv('e'), offset: sv(0), limit: sv(10), sort: sv('ASC'), description: sv('d') }, ['e', null, 0, 10, 'ASC', 'd', 'AUTHKEY'], 200, { elems: [1], total_count: 1 });
    expect(res.headers['x-total-count']).toBe(1);
    await ok(PS.get_execution_procedure_sections, node_funcs.get_procedure_sections, { execution_id: sv(undefined), offset: sv(undefined), limit: sv(undefined), sort: sv(undefined), description: sv(undefined) }, [null, null, null, null, null, null, 'AUTHKEY'], 200, { elems: [], total_count: 0 });
    await err(PS.get_execution_procedure_sections, node_funcs.get_procedure_sections, { execution_id: sv('e'), offset: sv(0), limit: sv(10), sort: sv('ASC'), description: sv('d') });
  });

  const simpleGetters = [
    ['get_procedure_section', 'get_procedure_section'],
    ['get_procedure_section_structure', 'get_procedure_section_structure'],
    ['get_procedure_section_elements', 'get_procedure_section_elements'],
    ['get_procedure_section_input', 'get_procedure_section_input']
  ];
  simpleGetters.forEach(([fnName, nfName]) => {
    it(`${fnName}: values + undefined + error`, async () => {
      await ok(PS[fnName], node_funcs[nfName], { execution_id: sv('e'), elem_id: sv('el') }, ['e', null, 'el', 'AUTHKEY'], 200);
      await ok(PS[fnName], node_funcs[nfName], { execution_id: sv(undefined), elem_id: sv(undefined) }, [null, null, null, 'AUTHKEY'], 200);
      await err(PS[fnName], node_funcs[nfName], { execution_id: sv('e'), elem_id: sv('el') });
    });
  });

  const passthrough = [
    ['import_procedure_section', 'import_procedure_section'],
    ['call_procedure_section', 'call_procedure_section']
  ];
  passthrough.forEach(([fnName, nfName]) => {
    it(`${fnName}: values + undefined + error`, async () => {
      await ok(PS[fnName], node_funcs[nfName], { execution_id: sv('e'), elem_id: sv('el') }, ['e', 'el', 'AUTHKEY'], 200);
      await ok(PS[fnName], node_funcs[nfName], { execution_id: sv(undefined), elem_id: sv(undefined) }, [null, null, 'AUTHKEY'], 200);
      await err(PS[fnName], node_funcs[nfName], { execution_id: sv('e'), elem_id: sv('el') });
    });
  });

  it('update_procedure_section: values + undefined + error', async () => {
    await ok(PS.update_procedure_section, node_funcs.update_procedure_section, { execution_id: sv('e'), elem_id: sv('el'), procedure_section: sv({ s: 1 }) }, ['e', null, 'el', { s: 1 }, 'AUTHKEY'], 200);
    await ok(PS.update_procedure_section, node_funcs.update_procedure_section, { execution_id: sv(undefined), elem_id: sv(undefined), procedure_section: sv(undefined) }, [null, null, null, null, 'AUTHKEY'], 200);
    await err(PS.update_procedure_section, node_funcs.update_procedure_section, { execution_id: sv('e'), elem_id: sv('el'), procedure_section: sv({}) });
  });

  it('update_procedure_section_input: values + undefined + error (204)', async () => {
    await ok(PS.update_procedure_section_input, node_funcs.update_procedure_section_input, { execution_id: sv('e'), elem_id: sv('el'), user_input: sv({ u: 1 }) }, ['e', null, 'el', { u: 1 }, 'AUTHKEY'], 204);
    await ok(PS.update_procedure_section_input, node_funcs.update_procedure_section_input, { execution_id: sv(undefined), elem_id: sv(undefined), user_input: sv(undefined) }, [null, null, null, null, 'AUTHKEY'], 204);
    await err(PS.update_procedure_section_input, node_funcs.update_procedure_section_input, { execution_id: sv('e'), elem_id: sv('el'), user_input: sv({}) });
  });
});

describe('Procedure_ProcedureSectionService', () => {
  it('procedure_create_procedure_section: explicit + defaults + error', async () => {
    await ok(PPS.procedure_create_procedure_section, node_funcs.createArchiveElement, { procedure_id: sv('p'), procedure_section: sv({ s: 1 }), insert_after_id: sv('a'), level: sv('CHILD') }, [null, 'p', 'PROCEDURE_SECTION', null, { s: 1 }, 'a', 'CHILD', 'AUTHKEY'], 200);
    await ok(PPS.procedure_create_procedure_section, node_funcs.createArchiveElement, { procedure_id: sv('p') }, [null, 'p', 'PROCEDURE_SECTION', null, null, '-1', 'SIBLING', 'AUTHKEY'], 200);
    await err(PPS.procedure_create_procedure_section, node_funcs.createArchiveElement, { procedure_id: sv('p') });
  });

  it('procedure_get_procedure_sections: values + undefined + error', async () => {
    const res = await ok(PPS.procedure_get_procedure_sections, node_funcs.get_procedure_sections, { procedure_id: sv('p'), offset: sv(0), limit: sv(10), sort: sv('ASC'), description: sv('d') }, [null, 'p', 0, 10, 'ASC', 'd', 'AUTHKEY'], 200, { elems: [1], total_count: 1 });
    expect(res.headers['x-total-count']).toBe(1);
    await ok(PPS.procedure_get_procedure_sections, node_funcs.get_procedure_sections, { procedure_id: sv(undefined), offset: sv(undefined), limit: sv(undefined), sort: sv(undefined), description: sv(undefined) }, [null, null, null, null, null, null, 'AUTHKEY'], 200, { elems: [], total_count: 0 });
    await err(PPS.procedure_get_procedure_sections, node_funcs.get_procedure_sections, { procedure_id: sv('p'), offset: sv(0), limit: sv(10), sort: sv('ASC'), description: sv('d') });
  });

  const simpleGetters = [
    ['procedure_get_procedure_section', 'get_procedure_section'],
    ['procedure_get_procedure_section_input', 'get_procedure_section_input'],
    ['procedure_get_procedure_section_structure', 'get_procedure_section_structure'],
    ['procedure_get_procedure_section_elements', 'get_procedure_section_elements']
  ];
  simpleGetters.forEach(([fnName, nfName]) => {
    it(`${fnName}: values + undefined + error`, async () => {
      await ok(PPS[fnName], node_funcs[nfName], { procedure_id: sv('p'), elem_id: sv('el') }, [null, 'p', 'el', 'AUTHKEY'], 200);
      await ok(PPS[fnName], node_funcs[nfName], { procedure_id: sv(undefined), elem_id: sv(undefined) }, [null, null, null, 'AUTHKEY'], 200);
      await err(PPS[fnName], node_funcs[nfName], { procedure_id: sv('p'), elem_id: sv('el') });
    });
  });

  it('procedure_update_procedure_section: values + undefined + error', async () => {
    await ok(PPS.procedure_update_procedure_section, node_funcs.update_procedure_section, { procedure_id: sv('p'), elem_id: sv('el'), procedure_section: sv({ s: 1 }) }, [null, 'p', 'el', { s: 1 }, 'AUTHKEY'], 200);
    await ok(PPS.procedure_update_procedure_section, node_funcs.update_procedure_section, { procedure_id: sv(undefined), elem_id: sv(undefined), procedure_section: sv(undefined) }, [null, null, null, null, 'AUTHKEY'], 200);
    await err(PPS.procedure_update_procedure_section, node_funcs.update_procedure_section, { procedure_id: sv('p'), elem_id: sv('el'), procedure_section: sv({}) });
  });

  it('procedure_update_procedure_section_input: values + undefined + error (204)', async () => {
    await ok(PPS.procedure_update_procedure_section_input, node_funcs.update_procedure_section_input, { procedure_id: sv('p'), elem_id: sv('el'), user_input: sv({ u: 1 }) }, [null, 'p', 'el', { u: 1 }, 'AUTHKEY'], 204);
    await ok(PPS.procedure_update_procedure_section_input, node_funcs.update_procedure_section_input, { procedure_id: sv(undefined), elem_id: sv(undefined), user_input: sv(undefined) }, [null, null, null, null, 'AUTHKEY'], 204);
    await err(PPS.procedure_update_procedure_section_input, node_funcs.update_procedure_section_input, { procedure_id: sv('p'), elem_id: sv('el'), user_input: sv({}) });
  });
});
