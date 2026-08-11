'use strict';

// Coverage for FileService and Procedure_FileService (upload/list/get/delete
// for elements, executions/procedures, and comment attachments).

jest.mock('../../../api/node_funcs', () => ({
  get_auth_key: jest.fn(),
  push_error: jest.fn(),
  log: { debug: jest.fn(), info: jest.fn(), warning: jest.fn(), error: jest.fn() },
  writeFile: jest.fn(),
  getFiles: jest.fn(),
  readFile: jest.fn(),
  deleteFile: jest.fn(),
  getAllFilesExec: jest.fn(),
  readFileExec: jest.fn(),
  deleteFileExec: jest.fn(),
  writeFileComment: jest.fn(),
  getFilesComment: jest.fn(),
  readFileComment: jest.fn(),
  deleteFileComment: jest.fn(),
  procedureWriteFile: jest.fn(),
  getProcedureElementFiles: jest.fn(),
  readProcedureElementFile: jest.fn(),
  deleteProcedureElementFile: jest.fn(),
  getProcedureFiles: jest.fn(),
  readProcedureFile: jest.fn(),
  deleteProcedureFile: jest.fn(),
  writeFileProcedureComment: jest.fn(),
  getFilesProcedureComment: jest.fn(),
  readFileProcedureComment: jest.fn(),
  deleteFileProcedureComment: jest.fn()
}));

const node_funcs = require('../../../api/node_funcs');
const { swaggerArg: sv } = require('../mocks/testHelpers');
const File = require('../../../api/controllers/FileService');
const PFile = require('../../../api/controllers/Procedure_FileService');

const H = { authorization: 'Bearer t' };
const noop = () => {};
const FC = { originalname: 'orig.txt' };

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

describe('FileService', () => {
  it('element_upload_file: named, default-name, error', async () => {
    await ok(File.element_upload_file, node_funcs.writeFile, { elem_id: sv('el'), file_content: sv(FC), file_name: sv('n.txt') }, ['n.txt', FC, undefined, 'el', 'AUTHKEY'], 200);
    await ok(File.element_upload_file, node_funcs.writeFile, { elem_id: sv('el'), file_content: sv(FC), file_name: sv(undefined) }, ['orig.txt', FC, undefined, 'el', 'AUTHKEY'], 200);
    await err(File.element_upload_file, node_funcs.writeFile, { elem_id: sv('el'), file_content: sv(FC), file_name: sv('n') });
  });

  it('element_get_files: total-count, offset/limit branches, error', async () => {
    const res = await ok(File.element_get_files, node_funcs.getFiles, { execution_id: sv('e'), elem_id: sv('el'), offset: sv(5), limit: sv(10) }, ['e', 'el', 5, 10, 'AUTHKEY'], 200, { files: [1], total_count: 1 });
    expect(res.headers['x-total-count']).toBe(1);
    await ok(File.element_get_files, node_funcs.getFiles, { execution_id: sv('e'), elem_id: sv('el'), offset: sv(0), limit: sv(0) }, ['e', 'el', undefined, undefined, 'AUTHKEY'], 200, { files: [], total_count: 0 });
    await err(File.element_get_files, node_funcs.getFiles, { execution_id: sv('e'), elem_id: sv('el'), offset: sv(5), limit: sv(10) });
  });

  it('element_get_file + element_delete_file', async () => {
    await ok(File.element_get_file, node_funcs.readFile, { execution_id: sv('e'), elem_id: sv('el'), file_id: sv('f') }, ['e', 'el', 'f', 'AUTHKEY'], 200);
    await err(File.element_get_file, node_funcs.readFile, { execution_id: sv('e'), elem_id: sv('el'), file_id: sv('f') });
    await ok(File.element_delete_file, node_funcs.deleteFile, { execution_id: sv('e'), elem_id: sv('el'), file_id: sv('f') }, ['e', 'el', 'f', 'AUTHKEY'], 204);
    await err(File.element_delete_file, node_funcs.deleteFile, { execution_id: sv('e'), elem_id: sv('el'), file_id: sv('f') });
  });

  it('execution_upload_file: named, default-name, error', async () => {
    await ok(File.execution_upload_file, node_funcs.writeFile, { execution_id: sv('e'), file_content: sv(FC), file_name: sv('n.txt') }, ['n.txt', FC, 'e', undefined, 'AUTHKEY'], 200);
    await ok(File.execution_upload_file, node_funcs.writeFile, { execution_id: sv('e'), file_content: sv(FC), file_name: sv(undefined) }, ['orig.txt', FC, 'e', undefined, 'AUTHKEY'], 200);
    await err(File.execution_upload_file, node_funcs.writeFile, { execution_id: sv('e'), file_content: sv(FC), file_name: sv('n') });
  });

  it('execution_get_files: offset/limit branches, error', async () => {
    const res = await ok(File.execution_get_files, node_funcs.getAllFilesExec, { execution_id: sv('e'), offset: sv(5), limit: sv(10) }, ['e', 'AUTHKEY', 5, 10], 200, { files: [1], total_count: 2 });
    expect(res.headers['x-total-count']).toBe(2);
    await ok(File.execution_get_files, node_funcs.getAllFilesExec, { execution_id: sv('e'), offset: sv(0), limit: sv(0) }, ['e', 'AUTHKEY', undefined, undefined], 200, { files: [], total_count: 0 });
    await err(File.execution_get_files, node_funcs.getAllFilesExec, { execution_id: sv('e'), offset: sv(5), limit: sv(10) });
  });

  it('execution_get_file + execution_delete_file', async () => {
    await ok(File.execution_get_file, node_funcs.readFileExec, { execution_id: sv('e'), file_id: sv('f') }, ['f', 'e', 'AUTHKEY'], 200);
    await err(File.execution_get_file, node_funcs.readFileExec, { execution_id: sv('e'), file_id: sv('f') });
    await ok(File.execution_delete_file, node_funcs.deleteFileExec, { execution_id: sv('e'), file_id: sv('f') }, ['e', 'f', 'AUTHKEY'], 204);
    await err(File.execution_delete_file, node_funcs.deleteFileExec, { execution_id: sv('e'), file_id: sv('f') });
  });

  it('element_post_comment_file: named, default-name, error', async () => {
    const base = { execution_id: sv('e'), elem_id: sv('el'), conversation_id: sv('c'), comment_id: sv('cm'), file_content: sv(FC) };
    await ok(File.element_post_comment_file, node_funcs.writeFileComment, { ...base, file_name: sv('n.txt') }, ['n.txt', FC, 'e', 'el', 'c', 'cm', 'AUTHKEY'], 200);
    await ok(File.element_post_comment_file, node_funcs.writeFileComment, { ...base, file_name: sv(undefined) }, ['orig.txt', FC, 'e', 'el', 'c', 'cm', 'AUTHKEY'], 200);
    await err(File.element_post_comment_file, node_funcs.writeFileComment, { ...base, file_name: sv('n') });
  });

  it('element_get_comment_files: offset/limit branches, error', async () => {
    const base = { execution_id: sv('e'), elem_id: sv('el'), conversation_id: sv('c'), comment_id: sv('cm') };
    const res = await ok(File.element_get_comment_files, node_funcs.getFilesComment, { ...base, offset: sv(5), limit: sv(10) }, ['e', 'el', 'c', 'cm', 5, 10, 'AUTHKEY'], 200, { files: [1], total_count: 1 });
    expect(res.headers['x-total-count']).toBe(1);
    await ok(File.element_get_comment_files, node_funcs.getFilesComment, { ...base, offset: sv(0), limit: sv(0) }, ['e', 'el', 'c', 'cm', undefined, undefined, 'AUTHKEY'], 200, { files: [], total_count: 0 });
    await err(File.element_get_comment_files, node_funcs.getFilesComment, { ...base, offset: sv(5), limit: sv(10) });
  });

  it('element_get_comment_file + element_delete_comment_file', async () => {
    const base = { execution_id: sv('e'), elem_id: sv('el'), conversation_id: sv('c'), comment_id: sv('cm'), file_id: sv('f') };
    await ok(File.element_get_comment_file, node_funcs.readFileComment, base, ['e', 'el', 'c', 'cm', 'f', 'AUTHKEY'], 200);
    await err(File.element_get_comment_file, node_funcs.readFileComment, base);
    await ok(File.element_delete_comment_file, node_funcs.deleteFileComment, base, ['e', 'el', 'c', 'cm', 'f', 'AUTHKEY'], 204);
    await err(File.element_delete_comment_file, node_funcs.deleteFileComment, base);
  });
});

describe('Procedure_FileService', () => {
  it('procedure_element_upload_file: named, default-name, error', async () => {
    await ok(PFile.procedure_element_upload_file, node_funcs.procedureWriteFile, { procedure_id: sv('p'), elem_id: sv('el'), file_content: sv(FC), file_name: sv('n.txt') }, ['n.txt', FC, 'p', '0', 'el', 'AUTHKEY'], 200);
    await ok(PFile.procedure_element_upload_file, node_funcs.procedureWriteFile, { procedure_id: sv('p'), elem_id: sv('el'), file_content: sv(FC), file_name: sv(undefined) }, ['orig.txt', FC, 'p', '0', 'el', 'AUTHKEY'], 200);
    await err(PFile.procedure_element_upload_file, node_funcs.procedureWriteFile, { procedure_id: sv('p'), elem_id: sv('el'), file_content: sv(FC), file_name: sv('n') });
  });

  it('procedure_element_get_files: offset/limit branches, error', async () => {
    await ok(PFile.procedure_element_get_files, node_funcs.getProcedureElementFiles, { procedure_id: sv('p'), elem_id: sv('el'), offset: sv(5), limit: sv(10) }, ['p', 'el', 5, 10, 'AUTHKEY'], 200, { files: [1], total_count: 1 });
    await ok(PFile.procedure_element_get_files, node_funcs.getProcedureElementFiles, { procedure_id: sv('p'), elem_id: sv('el'), offset: sv(0), limit: sv(0) }, ['p', 'el', undefined, undefined, 'AUTHKEY'], 200, { files: [], total_count: 0 });
    await err(PFile.procedure_element_get_files, node_funcs.getProcedureElementFiles, { procedure_id: sv('p'), elem_id: sv('el'), offset: sv(5), limit: sv(10) });
  });

  it('procedure_element_get_file + procedure_element_delete_file', async () => {
    await ok(PFile.procedure_element_get_file, node_funcs.readProcedureElementFile, { procedure_id: sv('p'), elem_id: sv('el'), file_id: sv('f') }, ['p', 'el', 'f', 'AUTHKEY'], 200);
    await err(PFile.procedure_element_get_file, node_funcs.readProcedureElementFile, { procedure_id: sv('p'), elem_id: sv('el'), file_id: sv('f') });
    await ok(PFile.procedure_element_delete_file, node_funcs.deleteProcedureElementFile, { procedure_id: sv('p'), elem_id: sv('el'), file_id: sv('f') }, ['p', 'el', 'f', 'AUTHKEY'], 204);
    await err(PFile.procedure_element_delete_file, node_funcs.deleteProcedureElementFile, { procedure_id: sv('p'), elem_id: sv('el'), file_id: sv('f') });
  });

  it('procedure_upload_file: named, default-name, error', async () => {
    await ok(PFile.procedure_upload_file, node_funcs.procedureWriteFile, { procedure_id: sv('p'), file_content: sv(FC), file_name: sv('n.txt') }, ['n.txt', FC, 'p', '0', null, 'AUTHKEY'], 200);
    await ok(PFile.procedure_upload_file, node_funcs.procedureWriteFile, { procedure_id: sv('p'), file_content: sv(FC), file_name: sv(undefined) }, ['orig.txt', FC, 'p', '0', null, 'AUTHKEY'], 200);
    await err(PFile.procedure_upload_file, node_funcs.procedureWriteFile, { procedure_id: sv('p'), file_content: sv(FC), file_name: sv('n') });
  });

  it('procedure_get_files: offset/limit branches, error', async () => {
    await ok(PFile.procedure_get_files, node_funcs.getProcedureFiles, { procedure_id: sv('p'), offset: sv(5), limit: sv(10) }, ['p', 5, 10, 'AUTHKEY'], 200, { files: [1], total_count: 1 });
    await ok(PFile.procedure_get_files, node_funcs.getProcedureFiles, { procedure_id: sv('p'), offset: sv(0), limit: sv(0) }, ['p', undefined, undefined, 'AUTHKEY'], 200, { files: [], total_count: 0 });
    await err(PFile.procedure_get_files, node_funcs.getProcedureFiles, { procedure_id: sv('p'), offset: sv(5), limit: sv(10) });
  });

  it('procedure_get_file + procedure_delete_file', async () => {
    await ok(PFile.procedure_get_file, node_funcs.readProcedureFile, { procedure_id: sv('p'), file_id: sv('f') }, ['p', 'f', 'AUTHKEY'], 200);
    await err(PFile.procedure_get_file, node_funcs.readProcedureFile, { procedure_id: sv('p'), file_id: sv('f') });
    await ok(PFile.procedure_delete_file, node_funcs.deleteProcedureFile, { procedure_id: sv('p'), file_id: sv('f') }, ['p', 'f', 'AUTHKEY'], 204);
    await err(PFile.procedure_delete_file, node_funcs.deleteProcedureFile, { procedure_id: sv('p'), file_id: sv('f') });
  });

  it('procedure_element_post_comment_file: named, default-name, error', async () => {
    const base = { procedure_id: sv('p'), version: sv('v'), elem_id: sv('el'), conversation_id: sv('c'), comment_id: sv('cm'), file_content: sv(FC) };
    await ok(PFile.procedure_element_post_comment_file, node_funcs.writeFileProcedureComment, { ...base, file_name: sv('n.txt') }, ['n.txt', FC, 'p', 'v', 'el', 'c', 'cm', 'AUTHKEY'], 200);
    await ok(PFile.procedure_element_post_comment_file, node_funcs.writeFileProcedureComment, { ...base, file_name: sv(undefined) }, ['orig.txt', FC, 'p', 'v', 'el', 'c', 'cm', 'AUTHKEY'], 200);
    await err(PFile.procedure_element_post_comment_file, node_funcs.writeFileProcedureComment, { ...base, file_name: sv('n') });
  });

  it('procedure_element_get_comment_files: offset/limit branches, error', async () => {
    const base = { procedure_id: sv('p'), version: sv('v'), elem_id: sv('el'), conversation_id: sv('c'), comment_id: sv('cm') };
    await ok(PFile.procedure_element_get_comment_files, node_funcs.getFilesProcedureComment, { ...base, offset: sv(5), limit: sv(10) }, ['p', 'v', 'el', 'c', 'cm', 5, 10, 'AUTHKEY'], 200, { files: [1], total_count: 1 });
    await ok(PFile.procedure_element_get_comment_files, node_funcs.getFilesProcedureComment, { ...base, offset: sv(0), limit: sv(0) }, ['p', 'v', 'el', 'c', 'cm', undefined, undefined, 'AUTHKEY'], 200, { files: [], total_count: 0 });
    await err(PFile.procedure_element_get_comment_files, node_funcs.getFilesProcedureComment, { ...base, offset: sv(5), limit: sv(10) });
  });

  it('procedure_element_get_comment_file + procedure_element_delete_comment_file', async () => {
    const base = { procedure_id: sv('p'), version: sv('v'), elem_id: sv('el'), conversation_id: sv('c'), comment_id: sv('cm'), file_id: sv('f') };
    await ok(PFile.procedure_element_get_comment_file, node_funcs.readFileProcedureComment, base, ['p', 'v', 'el', 'c', 'cm', 'f', 'AUTHKEY'], 200);
    await err(PFile.procedure_element_get_comment_file, node_funcs.readFileProcedureComment, base);
    await ok(PFile.procedure_element_delete_comment_file, node_funcs.deleteFileProcedureComment, base, ['p', 'v', 'el', 'c', 'cm', 'f', 'AUTHKEY'], 204);
    await err(PFile.procedure_element_delete_comment_file, node_funcs.deleteFileProcedureComment, base);
  });
});
