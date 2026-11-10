'use strict';

// Coverage for CommentService and Procedure_CommentService (conversation +
// comment CRUD). Both share the same shape; the procedure variant carries an
// extra `version` positional argument.

jest.mock('../../../api/node_funcs', () => ({
  get_auth_key: jest.fn(),
  push_error: jest.fn(),
  addExecutionConversation: jest.fn(),
  getExecutionConversations: jest.fn(),
  getExecutionConversation: jest.fn(),
  updateExecutionConversation: jest.fn(),
  deleteExecutionConversation: jest.fn(),
  addExecutionComment: jest.fn(),
  getExecutionComments: jest.fn(),
  getExecutionComment: jest.fn(),
  updateExecutionComment: jest.fn(),
  deleteExecutionComment: jest.fn(),
  addProcedureConversation: jest.fn(),
  getProcedureConversations: jest.fn(),
  getProcedureConversation: jest.fn(),
  updateProcedureConversation: jest.fn(),
  deleteProcedureConversation: jest.fn(),
  addProcedureComment: jest.fn(),
  getProcedureComments: jest.fn(),
  getProcedureComment: jest.fn(),
  updateProcedureComment: jest.fn(),
  deleteProcedureComment: jest.fn()
}));

const node_funcs = require('../../../api/node_funcs');
const { swaggerArg: sv } = require('../mocks/testHelpers');
const Comment = require('../../../api/controllers/CommentService');
const PComment = require('../../../api/controllers/Procedure_CommentService');

const H = { authorization: 'Bearer t' };
const noop = () => {};

function createRes() {
  const res = { statusCode: 0, body: undefined, ended: false };
  res.status = jest.fn((code) => { res.statusCode = code; return res; });
  res.json = jest.fn((payload) => { res.body = payload; return res; });
  res.end = jest.fn(() => { res.ended = true; return res; });
  return res;
}

beforeEach(() => {
  jest.clearAllMocks();
  node_funcs.get_auth_key.mockReturnValue('AUTHKEY');
  node_funcs.push_error.mockImplementation((message, err) => ({ message, cause: err }));
});

async function check(fn, nf, req, expected, code) {
  nf.mockResolvedValue({ ok: 1 });
  const res = createRes();
  await fn(req, res, noop, H);
  expect(nf).toHaveBeenCalledWith(...expected);
  expect(res.statusCode).toBe(code);
}
async function checkErr(fn, nf, req) {
  nf.mockRejectedValue(new Error('x'));
  const res = createRes();
  await fn(req, res, noop, H);
  expect(res.statusCode).toBe(400);
}

function runCommentSuite(label, svc, mkId, lead, n) {
  describe(label, () => {
    describe(n.add_conversation, () => {
      it('with + without conversation, and error', async () => {
        await check(svc[n.add_conversation], node_funcs[n.nfAddConv], { ...mkId(), conversation: sv({ c: 1 }) }, [...lead, { c: 1 }, 'AUTHKEY'], 200);
        await check(svc[n.add_conversation], node_funcs[n.nfAddConv], { ...mkId() }, [...lead, null, 'AUTHKEY'], 200);
        await checkErr(svc[n.add_conversation], node_funcs[n.nfAddConv], { ...mkId() });
      });
    });
    describe(n.get_conversations, () => {
      it('with values + undefined coercion + error', async () => {
        await check(svc[n.get_conversations], node_funcs[n.nfGetConvs], { ...mkId(), offset: sv(0), limit: sv(10) }, [...lead, 0, 10, 'AUTHKEY'], 200);
        await check(svc[n.get_conversations], node_funcs[n.nfGetConvs], { ...mkId(), offset: sv(undefined), limit: sv(undefined) }, [...lead, null, null, 'AUTHKEY'], 200);
        await checkErr(svc[n.get_conversations], node_funcs[n.nfGetConvs], { ...mkId(), offset: sv(0), limit: sv(10) });
      });
    });
    describe(n.get_conversation, () => {
      it('success + error', async () => {
        await check(svc[n.get_conversation], node_funcs[n.nfGetConv], { ...mkId(), conversation_id: sv('c') }, [...lead, 'c', 'AUTHKEY'], 200);
        await checkErr(svc[n.get_conversation], node_funcs[n.nfGetConv], { ...mkId(), conversation_id: sv('c') });
      });
    });
    describe(n.update_conversation, () => {
      it('with + without conversation, and error', async () => {
        await check(svc[n.update_conversation], node_funcs[n.nfUpdConv], { ...mkId(), conversation_id: sv('c'), conversation: sv({ c: 1 }) }, [...lead, 'c', { c: 1 }, 'AUTHKEY'], 200);
        await check(svc[n.update_conversation], node_funcs[n.nfUpdConv], { ...mkId(), conversation_id: sv('c') }, [...lead, 'c', null, 'AUTHKEY'], 200);
        await checkErr(svc[n.update_conversation], node_funcs[n.nfUpdConv], { ...mkId(), conversation_id: sv('c') });
      });
    });
    describe(n.delete_conversation, () => {
      it('204 + error', async () => {
        await check(svc[n.delete_conversation], node_funcs[n.nfDelConv], { ...mkId(), conversation_id: sv('c') }, [...lead, 'c', 'AUTHKEY'], 204);
        await checkErr(svc[n.delete_conversation], node_funcs[n.nfDelConv], { ...mkId(), conversation_id: sv('c') });
      });
    });
    describe(n.add_comment, () => {
      it('with + without comment, and error', async () => {
        await check(svc[n.add_comment], node_funcs[n.nfAddCmt], { ...mkId(), conversation_id: sv('c'), comment: sv({ m: 1 }) }, [...lead, 'c', { m: 1 }, 'AUTHKEY'], 200);
        await check(svc[n.add_comment], node_funcs[n.nfAddCmt], { ...mkId(), conversation_id: sv('c') }, [...lead, 'c', null, 'AUTHKEY'], 200);
        await checkErr(svc[n.add_comment], node_funcs[n.nfAddCmt], { ...mkId(), conversation_id: sv('c') });
      });
    });
    describe(n.get_comments, () => {
      it('with values + undefined coercion + error', async () => {
        await check(svc[n.get_comments], node_funcs[n.nfGetCmts], { ...mkId(), conversation_id: sv('c'), offset: sv(0), limit: sv(10) }, [...lead, 'c', 0, 10, 'AUTHKEY'], 200);
        await check(svc[n.get_comments], node_funcs[n.nfGetCmts], { ...mkId(), conversation_id: sv('c'), offset: sv(undefined), limit: sv(undefined) }, [...lead, 'c', null, null, 'AUTHKEY'], 200);
        await checkErr(svc[n.get_comments], node_funcs[n.nfGetCmts], { ...mkId(), conversation_id: sv('c'), offset: sv(0), limit: sv(10) });
      });
    });
    describe(n.get_comment, () => {
      it('success + error', async () => {
        await check(svc[n.get_comment], node_funcs[n.nfGetCmt], { ...mkId(), conversation_id: sv('c'), comment_id: sv('cm') }, [...lead, 'c', 'cm', 'AUTHKEY'], 200);
        await checkErr(svc[n.get_comment], node_funcs[n.nfGetCmt], { ...mkId(), conversation_id: sv('c'), comment_id: sv('cm') });
      });
    });
    describe(n.update_comment, () => {
      it('with + without comment, and error', async () => {
        await check(svc[n.update_comment], node_funcs[n.nfUpdCmt], { ...mkId(), conversation_id: sv('c'), comment_id: sv('cm'), comment: sv({ m: 1 }) }, [...lead, 'c', 'cm', { m: 1 }, 'AUTHKEY'], 200);
        await check(svc[n.update_comment], node_funcs[n.nfUpdCmt], { ...mkId(), conversation_id: sv('c'), comment_id: sv('cm') }, [...lead, 'c', 'cm', null, 'AUTHKEY'], 200);
        await checkErr(svc[n.update_comment], node_funcs[n.nfUpdCmt], { ...mkId(), conversation_id: sv('c'), comment_id: sv('cm') });
      });
    });
    describe(n.delete_comment, () => {
      it('204 + error', async () => {
        await check(svc[n.delete_comment], node_funcs[n.nfDelCmt], { ...mkId(), conversation_id: sv('c'), comment_id: sv('cm') }, [...lead, 'c', 'cm', 'AUTHKEY'], 204);
        await checkErr(svc[n.delete_comment], node_funcs[n.nfDelCmt], { ...mkId(), conversation_id: sv('c'), comment_id: sv('cm') });
      });
    });
  });
}

runCommentSuite('CommentService', Comment, () => ({ execution_id: sv('e'), elem_id: sv('el') }), ['e', 'el'], {
  add_conversation: 'element_add_conversation', nfAddConv: 'addExecutionConversation',
  get_conversations: 'element_get_conversations', nfGetConvs: 'getExecutionConversations',
  get_conversation: 'element_get_conversation', nfGetConv: 'getExecutionConversation',
  update_conversation: 'element_update_conversation', nfUpdConv: 'updateExecutionConversation',
  delete_conversation: 'element_delete_conversation', nfDelConv: 'deleteExecutionConversation',
  add_comment: 'element_add_comment', nfAddCmt: 'addExecutionComment',
  get_comments: 'element_get_comments', nfGetCmts: 'getExecutionComments',
  get_comment: 'element_get_comment', nfGetCmt: 'getExecutionComment',
  update_comment: 'element_update_comment', nfUpdCmt: 'updateExecutionComment',
  delete_comment: 'element_delete_comment', nfDelCmt: 'deleteExecutionComment'
});

runCommentSuite('Procedure_CommentService', PComment, () => ({ procedure_id: sv('p'), version: sv('v'), elem_id: sv('el') }), ['p', 'v', 'el'], {
  add_conversation: 'procedure_element_add_conversation', nfAddConv: 'addProcedureConversation',
  get_conversations: 'procedure_element_get_conversations', nfGetConvs: 'getProcedureConversations',
  get_conversation: 'procedure_element_get_conversation', nfGetConv: 'getProcedureConversation',
  update_conversation: 'procedure_element_update_conversation', nfUpdConv: 'updateProcedureConversation',
  delete_conversation: 'procedure_element_delete_conversation', nfDelConv: 'deleteProcedureConversation',
  add_comment: 'procedure_element_add_comment', nfAddCmt: 'addProcedureComment',
  get_comments: 'procedure_element_get_comments', nfGetCmts: 'getProcedureComments',
  get_comment: 'procedure_element_get_comment', nfGetCmt: 'getProcedureComment',
  update_comment: 'procedure_element_update_comment', nfUpdCmt: 'updateProcedureComment',
  delete_comment: 'procedure_element_delete_comment', nfDelCmt: 'deleteProcedureComment'
});
