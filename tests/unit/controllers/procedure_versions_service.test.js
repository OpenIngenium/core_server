'use strict';

// Coverage for Procedure_VersionsService (version lifecycle, status/permission
// checks, validation, outline/time-refs/data-paths derivation, export, search).

jest.mock('../../../api/node_funcs', () => ({
  get_auth_key: jest.fn(),
  push_error: jest.fn(),
  log: { debug: jest.fn(), info: jest.fn(), warning: jest.fn(), error: jest.fn() },
  time_references: ['CURRENT_TIME'],
  validate_procedure_version: jest.fn(),
  createProcedureVersion: jest.fn(),
  removeVersion: jest.fn(),
  getVersion: jest.fn(),
  getStructure: jest.fn(),
  getVersionElements: jest.fn(),
  getVersions: jest.fn(),
  updateVersion: jest.fn(),
  updateVersionStatus: jest.fn(),
  getProcedureOutline: jest.fn(),
  exportProcedureVersion: jest.fn(),
  searchProcedureVersion: jest.fn()
}));
jest.mock('fs-extra', () => ({ removeSync: jest.fn() }));

const node_funcs = require('../../../api/node_funcs');
const fse = require('fs-extra');
const { swaggerArg: sv } = require('../mocks/testHelpers');
const V = require('../../../api/controllers/Procedure_VersionsService');

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
  node_funcs.push_error.mockImplementation((message, err) => ({ message, cause: err }));
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

describe('Procedure_VersionsService', () => {
  describe('create_version', () => {
    it('validates then creates (200)', async () => {
      node_funcs.validate_procedure_version.mockResolvedValue({});
      node_funcs.createProcedureVersion.mockResolvedValue({ v: 1 });
      const res = createRes();
      await V.create_version({ procedure_id: sv('p'), version_meta_data: sv({ m: 1 }) }, res, noop, H);
      expect(node_funcs.validate_procedure_version).toHaveBeenCalledWith('p', 0, { update: true, vi_map: null, script_map: null }, 'AUTHKEY');
      expect(node_funcs.createProcedureVersion).toHaveBeenCalledWith('p', { m: 1 }, 'AUTHKEY');
      expect(res.statusCode).toBe(200);
    });

    it('logs a warning when validation fails but still creates', async () => {
      node_funcs.validate_procedure_version.mockRejectedValue(new Error('vfail'));
      node_funcs.createProcedureVersion.mockResolvedValue({});
      const res = createRes();
      await V.create_version({ procedure_id: sv(undefined), version_meta_data: sv(undefined) }, res, noop, H);
      expect(node_funcs.log.warning).toHaveBeenCalled();
      expect(node_funcs.createProcedureVersion).toHaveBeenCalledWith(null, null, 'AUTHKEY');
      expect(res.statusCode).toBe(200);
    });

    it('returns 400 when create fails', async () => {
      node_funcs.validate_procedure_version.mockResolvedValue({});
      node_funcs.createProcedureVersion.mockRejectedValue(new Error('x'));
      const res = createRes();
      await V.create_version({ procedure_id: sv('p'), version_meta_data: sv({}) }, res, noop, H);
      expect(res.statusCode).toBe(400);
    });
  });

  it('delete_version: values + undefined + error (204)', async () => {
    await okc(V.delete_version, node_funcs.removeVersion, { procedure_id: sv('p'), version: sv(1) }, ['p', 1, 'AUTHKEY'], 204);
    await okc(V.delete_version, node_funcs.removeVersion, { procedure_id: sv(undefined), version: sv(undefined) }, [null, null, 'AUTHKEY'], 204);
    await plainErr(V.delete_version, node_funcs.removeVersion, { procedure_id: sv('p'), version: sv(1) });
  });

  it('get_version: values + undefined + error', async () => {
    await okc(V.get_version, node_funcs.getVersion, { procedure_id: sv('p'), version: sv(1) }, ['p', 1, 'AUTHKEY'], 200);
    await okc(V.get_version, node_funcs.getVersion, { procedure_id: sv(undefined), version: sv(undefined) }, [null, null, 'AUTHKEY'], 200);
    await plainErr(V.get_version, node_funcs.getVersion, { procedure_id: sv('p'), version: sv(1) });
  });

  it('get_version_structure: values + undefined + error', async () => {
    await okc(V.get_version_structure, node_funcs.getStructure, { procedure_id: sv('p'), offset: sv(0), limit: sv(10), sort: sv('ASC'), version: sv(1) }, ['p', 0, 10, 'ASC', 1, 'AUTHKEY'], 200);
    await okc(V.get_version_structure, node_funcs.getStructure, { procedure_id: sv(undefined), offset: sv(undefined), limit: sv(undefined), sort: sv(undefined), version: sv(undefined) }, [null, null, null, null, null, 'AUTHKEY'], 200);
    await plainErr(V.get_version_structure, node_funcs.getStructure, { procedure_id: sv('p'), offset: sv(0), limit: sv(10), sort: sv('ASC'), version: sv(1) });
  });

  it('get_version_elements: values + undefined + error', async () => {
    const full = { procedure_id: sv('p'), version: sv(1), elem_type: sv('STEP'), step_type: sv('CMD'), offset: sv(0), limit: sv(10), sort: sv('ASC'), description: sv('d'), all_elements: sv('ON'), comment_filter: sv('OFF') };
    const res = await okc(V.get_version_elements, node_funcs.getVersionElements, full, ['p', 1, 'STEP', 'CMD', 0, 10, 'ASC', 'd', 'ON', 'OFF', 'AUTHKEY'], 200, { elems: [1], total_count: 1 });
    expect(res.headers['x-total-count']).toBe(1);
    await okc(V.get_version_elements, node_funcs.getVersionElements, { procedure_id: sv(undefined), version: sv(undefined), elem_type: sv(undefined), step_type: sv(undefined), offset: sv(undefined), limit: sv(undefined), sort: sv(undefined), description: sv(undefined), all_elements: sv(undefined), comment_filter: sv(undefined) }, [null, null, null, null, null, null, null, null, null, null, 'AUTHKEY'], 200, { elems: [], total_count: 0 });
    await plainErr(V.get_version_elements, node_funcs.getVersionElements, full);
  });

  it('get_versions: values + undefined + error', async () => {
    const full = { procedure_id: sv('p'), version_description: sv('vd'), version_author: sv('va'), status: sv('RELEASED'), offset: sv(0), limit: sv(10), sort: sv('ASC'), institutional_release_id: sv('iid') };
    const res = await okc(V.get_versions, node_funcs.getVersions, full, ['p', 0, 10, 'vd', 'va', 'RELEASED', 'ASC', 'iid', 'AUTHKEY'], 200, { versions: [1], total_count: 1 });
    expect(res.headers['x-total-count']).toBe(1);
    await okc(V.get_versions, node_funcs.getVersions, { procedure_id: sv(undefined), version_description: sv(undefined), version_author: sv(undefined), status: sv(undefined), offset: sv(undefined), limit: sv(undefined), sort: sv(undefined), institutional_release_id: sv(undefined) }, [null, null, null, null, null, null, null, null, 'AUTHKEY'], 200, { versions: [], total_count: 0 });
    await plainErr(V.get_versions, node_funcs.getVersions, full);
  });

  it('update_version: values + undefined + error', async () => {
    await okc(V.update_version, node_funcs.updateVersion, { procedure_id: sv('p'), version: sv(1), version_meta_data: sv({ m: 1 }) }, ['p', 1, { m: 1 }, 'AUTHKEY'], 200);
    await okc(V.update_version, node_funcs.updateVersion, { procedure_id: sv(undefined), version: sv(undefined), version_meta_data: sv(undefined) }, [null, null, null, 'AUTHKEY'], 200);
    await plainErr(V.update_version, node_funcs.updateVersion, { procedure_id: sv('p'), version: sv(1), version_meta_data: sv({}) });
  });

  describe('update_version_status', () => {
    const base = { procedure_id: sv('p'), version: sv(1) };

    it('APPROVE with test_lead scope proceeds', async () => {
      node_funcs.updateVersionStatus.mockResolvedValue({ ok: 1 });
      const res = createRes();
      await V.update_version_status({ ...base, version_status_input: sv({ action: 'APPROVE' }) }, res, noop, H, { scopes: ['test_lead'] });
      expect(node_funcs.updateVersionStatus).toHaveBeenCalledWith('p', 1, { action: 'APPROVE' }, 'AUTHKEY');
      expect(res.statusCode).toBe(200);
    });

    it('APPROVE without test_lead scope is forbidden (403)', async () => {
      const res = createRes();
      await V.update_version_status({ ...base, version_status_input: sv({ action: 'UNAPPROVE' }) }, res, noop, H, { scopes: [] });
      expect(res.statusCode).toBe(403);
      expect(node_funcs.updateVersionStatus).not.toHaveBeenCalled();
    });

    it('RELEASE with imcm scope (object form) proceeds', async () => {
      node_funcs.updateVersionStatus.mockResolvedValue({});
      const res = createRes();
      await V.update_version_status({ ...base, version_status_input: sv({ action: 'RELEASE' }) }, res, noop, H, { scopes: [{ scope: 'imcm' }] });
      expect(res.statusCode).toBe(200);
    });

    it('UNRELEASE without imcm scope is forbidden (403)', async () => {
      const res = createRes();
      await V.update_version_status({ ...base, version_status_input: sv({ action: 'UNRELEASE' }) }, res, noop, H, { scopes: ['other'] });
      expect(res.statusCode).toBe(403);
    });

    it('other action proceeds without special scope', async () => {
      node_funcs.updateVersionStatus.mockResolvedValue({});
      const res = createRes();
      await V.update_version_status({ ...base, version_status_input: sv({ action: 'SUBMIT' }) }, res, noop, H, { scopes: [] });
      expect(res.statusCode).toBe(200);
    });

    it('coerces undefined procedure_id/version to null', async () => {
      node_funcs.updateVersionStatus.mockResolvedValue({});
      const res = createRes();
      await V.update_version_status({ procedure_id: sv(undefined), version: sv(undefined), version_status_input: sv({ action: 'SUBMIT' }) }, res, noop, H, { scopes: [] });
      expect(node_funcs.updateVersionStatus).toHaveBeenCalledWith(null, null, { action: 'SUBMIT' }, 'AUTHKEY');
    });

    it('returns 400 when update fails', async () => {
      node_funcs.updateVersionStatus.mockRejectedValue(new Error('x'));
      const res = createRes();
      await V.update_version_status({ ...base, version_status_input: sv({ action: 'SUBMIT' }) }, res, noop, H, { scopes: [] });
      expect(res.statusCode).toBe(400);
    });
  });

  it('validate_procedure_version: value + default-null + error', async () => {
    await okc(V.validate_procedure_version, node_funcs.validate_procedure_version, { procedure_id: sv('p'), version: sv(1), validation_input: sv({ v: 1 }) }, ['p', 1, { v: 1 }, 'AUTHKEY'], 200);
    await okc(V.validate_procedure_version, node_funcs.validate_procedure_version, { procedure_id: sv(undefined), version: sv(undefined), validation_input: sv(null) }, [null, null, null, 'AUTHKEY'], 200);
    await plainErr(V.validate_procedure_version, node_funcs.validate_procedure_version, { procedure_id: sv('p'), version: sv(1), validation_input: sv({ v: 1 }) });
  });

  it('get_version_outline: values + undefined + error', async () => {
    await okc(V.get_version_outline, node_funcs.getProcedureOutline, { procedure_id: sv('p'), version: sv(1), tag_ids: sv('t1,t2') }, ['p', 1, 't1,t2', 'AUTHKEY'], 200);
    await okc(V.get_version_outline, node_funcs.getProcedureOutline, { procedure_id: sv(undefined), version: sv(undefined), tag_ids: sv(undefined) }, [null, null, null, 'AUTHKEY'], 200);
    await plainErr(V.get_version_outline, node_funcs.getProcedureOutline, { procedure_id: sv('p'), version: sv(1), tag_ids: sv('t') });
  });

  describe('get_version_time_references', () => {
    it('derives time references from elements and defaults', async () => {
      node_funcs.getVersionElements.mockResolvedValue({
        elems: [
          { authoring_user_input: { name: 'REF1' } },
          { authoring_user_input: { name: 'CURRENT_TIME' } },
          { authoring_user_input: {} },
          {}
        ],
        total_count: 4
      });
      const res = createRes();
      await V.get_version_time_references({ procedure_id: sv('p'), version: sv(1) }, res, noop, H);
      expect(node_funcs.getVersionElements).toHaveBeenCalledWith('p', 1, 'STEP', 'TIME_REFERENCE', 0, 10000, null, null, null, null, 'AUTHKEY');
      expect(res.body).toEqual(['CURRENT_TIME', 'REF1']);
    });
    it('coerces undefined procedure_id/version to null', async () => {
      node_funcs.getVersionElements.mockResolvedValue({ elems: [], total_count: 0 });
      const res = createRes();
      await V.get_version_time_references({ procedure_id: sv(undefined), version: sv(undefined) }, res, noop, H);
      expect(node_funcs.getVersionElements).toHaveBeenCalledWith(null, null, 'STEP', 'TIME_REFERENCE', 0, 10000, null, null, null, null, 'AUTHKEY');
    });
    it('returns 400 on error', async () => {
      node_funcs.getVersionElements.mockRejectedValue(new Error('x'));
      const res = createRes();
      await V.get_version_time_references({ procedure_id: sv('p'), version: sv(1) }, res, noop, H);
      expect(res.statusCode).toBe(400);
    });
  });

  describe('get_version_data_paths', () => {
    it('derives unique data paths from GDS_MANUAL entries', async () => {
      node_funcs.getVersionElements.mockResolvedValue({
        elems: [
          { authoring_user_input: { entries: [{ data_path: '/a' }, { data_path: '/a' }, {}] } },
          { authoring_user_input: {} },
          {}
        ],
        total_count: 3
      });
      const res = createRes();
      await V.get_version_data_paths({ procedure_id: sv('p'), version: sv(1) }, res, noop, H);
      expect(node_funcs.getVersionElements).toHaveBeenCalledWith('p', 1, 'STEP', 'GDS_MANUAL', 0, 10000, null, null, null, null, 'AUTHKEY');
      expect(res.body).toEqual(['/a']);
    });
    it('coerces undefined procedure_id/version to null', async () => {
      node_funcs.getVersionElements.mockResolvedValue({ elems: [], total_count: 0 });
      const res = createRes();
      await V.get_version_data_paths({ procedure_id: sv(undefined), version: sv(undefined) }, res, noop, H);
      expect(node_funcs.getVersionElements).toHaveBeenCalledWith(null, null, 'STEP', 'GDS_MANUAL', 0, 10000, null, null, null, null, 'AUTHKEY');
    });
    it('returns 400 on error', async () => {
      node_funcs.getVersionElements.mockRejectedValue(new Error('x'));
      const res = createRes();
      await V.get_version_data_paths({ procedure_id: sv('p'), version: sv(1) }, res, noop, H);
      expect(res.statusCode).toBe(400);
    });
  });

  describe('export_procedure_version', () => {
    const args = { procedure_id: sv('p'), version: sv(1) };
    it('downloads and cleans up (no error)', async () => {
      node_funcs.exportProcedureVersion.mockResolvedValue('/tmp/xdir/f.gz');
      const res = createRes();
      res.download = jest.fn((fp, name, cb) => cb());
      await V.export_procedure_version(args, res, noop, H);
      expect(node_funcs.exportProcedureVersion).toHaveBeenCalledWith('p', 1, 'AUTHKEY');
      expect(fse.removeSync).toHaveBeenCalledWith('/tmp/xdir');
    });
    it('logs download error but cleans up', async () => {
      node_funcs.exportProcedureVersion.mockResolvedValue('/tmp/xdir/f.gz');
      const res = createRes();
      res.download = jest.fn((fp, name, cb) => cb(new Error('dl')));
      await V.export_procedure_version(args, res, noop, H);
      expect(node_funcs.log.error).toHaveBeenCalled();
      expect(fse.removeSync).toHaveBeenCalledWith('/tmp/xdir');
    });
    it('coerces undefined procedure_id/version to null', async () => {
      node_funcs.exportProcedureVersion.mockResolvedValue('/tmp/xdir/f.gz');
      const res = createRes();
      res.download = jest.fn((fp, name, cb) => cb());
      await V.export_procedure_version({ procedure_id: sv(undefined), version: sv(undefined) }, res, noop, H);
      expect(node_funcs.exportProcedureVersion).toHaveBeenCalledWith(null, null, 'AUTHKEY');
    });
    it('returns 400 when export fails', async () => {
      node_funcs.exportProcedureVersion.mockRejectedValue(new Error('x'));
      const res = createRes();
      await V.export_procedure_version(args, res, noop, H);
      expect(res.statusCode).toBe(400);
    });
  });

  it('search_procedure_version: values + undefined + error', async () => {
    await okc(V.search_procedure_version, node_funcs.searchProcedureVersion, { procedure_id: sv('p'), version: sv(1), search_input: sv({ q: 'x' }) }, ['p', 1, { q: 'x' }, 'AUTHKEY'], 200);
    await okc(V.search_procedure_version, node_funcs.searchProcedureVersion, { procedure_id: sv(undefined), version: sv(undefined), search_input: sv(undefined) }, [null, null, null, 'AUTHKEY'], 200);
    await plainErr(V.search_procedure_version, node_funcs.searchProcedureVersion, { procedure_id: sv('p'), version: sv(1), search_input: sv({}) });
  });
});
