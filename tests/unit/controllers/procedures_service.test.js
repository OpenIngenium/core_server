'use strict';

// Coverage for ProceduresService (procedure CRUD, labels, replace, import,
// and the gzip export/download-with-cleanup path).

jest.mock('../../../api/node_funcs', () => ({
  get_auth_key: jest.fn(),
  push_error: jest.fn(),
  log: { debug: jest.fn(), info: jest.fn(), warning: jest.fn(), error: jest.fn() },
  createProcedure: jest.fn(),
  removeProcedure: jest.fn(),
  importProcedureVersions: jest.fn(),
  getProcedure: jest.fn(),
  getProcedures: jest.fn(),
  createProcedureLabel: jest.fn(),
  getProcedureLabels: jest.fn(),
  removeProcedureLabel: jest.fn(),
  updateProcedure: jest.fn(),
  replaceProcedure: jest.fn(),
  exportProcedureVersions: jest.fn()
}));
jest.mock('fs-extra', () => ({ removeSync: jest.fn() }));

const node_funcs = require('../../../api/node_funcs');
const fse = require('fs-extra');
const { swaggerArg: sv } = require('../mocks/testHelpers');
const P = require('../../../api/controllers/ProceduresService');

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

describe('ProceduresService', () => {
  it('create_procedure: value + null + error', async () => {
    await ok(P.create_procedure, node_funcs.createProcedure, { procedure: sv({ p: 1 }) }, [{ p: 1 }, 'AUTHKEY'], 200);
    await ok(P.create_procedure, node_funcs.createProcedure, { procedure: sv(undefined) }, [null, 'AUTHKEY'], 200);
    await err(P.create_procedure, node_funcs.createProcedure, { procedure: sv({}) });
  });

  it('delete_procedure: value + null + error (204)', async () => {
    await ok(P.delete_procedure, node_funcs.removeProcedure, { procedure_id: sv('p') }, ['p', 'AUTHKEY'], 204);
    await ok(P.delete_procedure, node_funcs.removeProcedure, { procedure_id: sv(undefined) }, [null, 'AUTHKEY'], 204);
    await err(P.delete_procedure, node_funcs.removeProcedure, { procedure_id: sv('p') });
  });

  it('import_procedure_versions: value + null + error', async () => {
    await ok(P.import_procedure_versions, node_funcs.importProcedureVersions, { procedure_versions_file: sv('f') }, ['f', 'AUTHKEY'], 200);
    await ok(P.import_procedure_versions, node_funcs.importProcedureVersions, { procedure_versions_file: sv(undefined) }, [null, 'AUTHKEY'], 200);
    await err(P.import_procedure_versions, node_funcs.importProcedureVersions, { procedure_versions_file: sv('f') });
  });

  it('get_procedure: value + null + error', async () => {
    await ok(P.get_procedure, node_funcs.getProcedure, { procedure_id: sv('p') }, ['p', 'AUTHKEY'], 200);
    await ok(P.get_procedure, node_funcs.getProcedure, { procedure_id: sv(undefined) }, [null, 'AUTHKEY'], 200);
    await err(P.get_procedure, node_funcs.getProcedure, { procedure_id: sv('p') });
  });

  it('get_procedures: all values + all null + error', async () => {
    const full = {
      title: sv('t'), description: sv('d'), author: sv('a'), versioned: sv(true),
      procedure_type: sv('type'), hazardous: sv(false), label: sv('l'), released: sv(true),
      offset: sv(0), limit: sv(10), obsolete: sv(false), sort: sv('ASC'), sort_by: sv('sb'),
      procedure_id: sv('pid'), institutional_id: sv('iid')
    };
    const res = await ok(P.get_procedures, node_funcs.getProcedures, full,
      [0, 10, 't', 'd', 'a', true, 'type', false, 'l', true, false, 'ASC', 'sb', 'pid', 'iid', 'AUTHKEY'],
      200, { procedures: [1], total_count: 1 });
    expect(res.headers['x-total-count']).toBe(1);

    const empty = {
      title: sv(undefined), description: sv(undefined), author: sv(undefined), versioned: sv(undefined),
      procedure_type: sv(undefined), hazardous: sv(undefined), label: sv(undefined), released: sv(undefined),
      offset: sv(undefined), limit: sv(undefined), obsolete: sv(undefined), sort: sv(undefined), sort_by: sv(undefined),
      procedure_id: sv(undefined), institutional_id: sv(undefined)
    };
    await ok(P.get_procedures, node_funcs.getProcedures, empty,
      [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 'AUTHKEY'],
      200, { procedures: [], total_count: 0 });

    await err(P.get_procedures, node_funcs.getProcedures, full);
  });

  it('create_procedure_label: value + null + error', async () => {
    await ok(P.create_procedure_label, node_funcs.createProcedureLabel, { procedure_label: sv({ n: 1 }) }, [{ n: 1 }, 'AUTHKEY'], 200);
    await ok(P.create_procedure_label, node_funcs.createProcedureLabel, { procedure_label: sv(undefined) }, [null, 'AUTHKEY'], 200);
    await err(P.create_procedure_label, node_funcs.createProcedureLabel, { procedure_label: sv({}) });
  });

  it('get_procedure_labels: values + null + error', async () => {
    const full = { procedure_label_name: sv('n'), description: sv('d'), offset: sv(0), limit: sv(10), sort: sv('ASC') };
    const res = await ok(P.get_procedure_labels, node_funcs.getProcedureLabels, full, [0, 10, 'ASC', 'n', 'd', 'AUTHKEY'], 200, { procedure_labels: [1], total_count: 1 });
    expect(res.headers['x-total-count']).toBe(1);
    const empty = { procedure_label_name: sv(undefined), description: sv(undefined), offset: sv(undefined), limit: sv(undefined), sort: sv(undefined) };
    await ok(P.get_procedure_labels, node_funcs.getProcedureLabels, empty, [null, null, null, null, null, 'AUTHKEY'], 200, { procedure_labels: [], total_count: 0 });
    await err(P.get_procedure_labels, node_funcs.getProcedureLabels, full);
  });

  it('delete_procedure_label: value + null + error (204)', async () => {
    await ok(P.delete_procedure_label, node_funcs.removeProcedureLabel, { label_id: sv('l') }, ['l', 'AUTHKEY'], 204);
    await ok(P.delete_procedure_label, node_funcs.removeProcedureLabel, { label_id: sv(undefined) }, [null, 'AUTHKEY'], 204);
    await err(P.delete_procedure_label, node_funcs.removeProcedureLabel, { label_id: sv('l') });
  });

  it('update_procedure: values + null + error (204)', async () => {
    await ok(P.update_procedure, node_funcs.updateProcedure, { procedure_id: sv('p'), procedure_meta_data: sv({ m: 1 }) }, ['p', { m: 1 }, 'AUTHKEY'], 204);
    await ok(P.update_procedure, node_funcs.updateProcedure, { procedure_id: sv(undefined), procedure_meta_data: sv(undefined) }, [null, null, 'AUTHKEY'], 204);
    await err(P.update_procedure, node_funcs.updateProcedure, { procedure_id: sv('p'), procedure_meta_data: sv({}) });
  });

  it('replace_procedure: values + null + error', async () => {
    await ok(P.replace_procedure, node_funcs.replaceProcedure, { procedure_id: sv('p'), replace_input: sv({ r: 1 }) }, ['p', { r: 1 }, 'AUTHKEY'], 200);
    await ok(P.replace_procedure, node_funcs.replaceProcedure, { procedure_id: sv(undefined), replace_input: sv(undefined) }, [null, null, 'AUTHKEY'], 200);
    await err(P.replace_procedure, node_funcs.replaceProcedure, { procedure_id: sv('p'), replace_input: sv({}) });
  });

  describe('export_procedure_versions', () => {
    const args = { procedure_id: sv('p'), version: sv('1'), released_only: sv(false) };

    it('downloads the file and cleans up the temp dir (no download error)', async () => {
      node_funcs.exportProcedureVersions.mockResolvedValue('/tmp/xdir/f.gz');
      const res = createRes();
      res.download = jest.fn((fp, name, cb) => cb());
      await P.export_procedure_versions(args, res, noop, H);
      expect(node_funcs.exportProcedureVersions).toHaveBeenCalledWith('p', '1', false, 'AUTHKEY');
      expect(res.download).toHaveBeenCalled();
      expect(fse.removeSync).toHaveBeenCalledWith('/tmp/xdir');
    });

    it('logs a download error but still cleans up', async () => {
      node_funcs.exportProcedureVersions.mockResolvedValue('/tmp/xdir/f.gz');
      const res = createRes();
      res.download = jest.fn((fp, name, cb) => cb(new Error('dl')));
      await P.export_procedure_versions(args, res, noop, H);
      expect(node_funcs.log.error).toHaveBeenCalled();
      expect(fse.removeSync).toHaveBeenCalledWith('/tmp/xdir');
    });

    it('coerces undefined args to null', async () => {
      node_funcs.exportProcedureVersions.mockResolvedValue('/tmp/xdir/f.gz');
      const res = createRes();
      res.download = jest.fn((fp, name, cb) => cb());
      await P.export_procedure_versions({ procedure_id: sv(undefined), version: sv(undefined), released_only: sv(undefined) }, res, noop, H);
      expect(node_funcs.exportProcedureVersions).toHaveBeenCalledWith(null, null, null, 'AUTHKEY');
    });

    it('returns 400 when export fails', async () => {
      node_funcs.exportProcedureVersions.mockRejectedValue(new Error('x'));
      const res = createRes();
      await P.export_procedure_versions(args, res, noop, H);
      expect(res.statusCode).toBe(400);
    });
  });
});
