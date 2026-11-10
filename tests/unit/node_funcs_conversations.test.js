'use strict';

// Coverage for the conversation/comment CRUD helpers, element move/copy, as_run
// and the redis-backed switch-wait timeout loop in api/node_funcs.js. All
// external collaborators (HTTP, redis, S3, JWT) are mocked; no real I/O occurs.

jest.mock('aws-sdk', () => require('./mocks/mockAwsSdk'));
jest.mock('async-redis', () => require('./mocks/mockRedis'));
jest.mock('jsonwebtoken', () => ({ verify: jest.fn() }));
jest.mock('axios', () => ({ get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn(), put: jest.fn() }));

const axios = require('axios');
const mockRedis = require('./mocks/mockRedis');
const node_funcs = require('../../api/node_funcs');

const redisClient = mockRedis.__client;

const AL = 'http://localhost:8010/api/v5';
const KEY = 'Bearer token';
const AUTH = { headers: { Authorization: KEY } };

beforeEach(() => {
  axios.get.mockReset();
  axios.post.mockReset();
  axios.patch.mockReset();
  axios.delete.mockReset();
  axios.put.mockReset();
  mockRedis.__reset();
});

describe('execution conversation helpers', () => {
  const EL = `${AL}/executions/e1/elements/el1/conversations`;

  it('addExecutionConversation posts and returns data', async () => {
    axios.post.mockResolvedValue({ data: { id: 'c1' } });
    await expect(node_funcs.addExecutionConversation('e1', 'el1', { t: 'x' }, KEY)).resolves.toEqual({ id: 'c1' });
    expect(axios.post).toHaveBeenCalledWith(EL, { t: 'x' }, AUTH);
  });
  it('addExecutionConversation rejects on error', async () => {
    axios.post.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.addExecutionConversation('e1', 'el1', {}, KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('getExecutionConversations passes offset/limit params', async () => {
    axios.get.mockResolvedValue({ data: [1] });
    await expect(node_funcs.getExecutionConversations('e1', 'el1', 5, 10, KEY)).resolves.toEqual([1]);
    expect(axios.get).toHaveBeenCalledWith(EL, { params: { offset: 5, limit: 10 }, headers: { Authorization: KEY } });
  });
  it('getExecutionConversations omits params when not provided', async () => {
    axios.get.mockResolvedValue({ data: [] });
    await node_funcs.getExecutionConversations('e1', 'el1', undefined, undefined, KEY);
    expect(axios.get).toHaveBeenCalledWith(EL, { params: {}, headers: { Authorization: KEY } });
  });
  it('getExecutionConversations rejects on error', async () => {
    axios.get.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.getExecutionConversations('e1', 'el1', 0, 0, KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('getExecutionConversation gets one', async () => {
    axios.get.mockResolvedValue({ data: { id: 'c1' } });
    await expect(node_funcs.getExecutionConversation('e1', 'el1', 'c1', KEY)).resolves.toEqual({ id: 'c1' });
    expect(axios.get).toHaveBeenCalledWith(`${EL}/c1`, AUTH);
  });
  it('getExecutionConversation rejects on error', async () => {
    axios.get.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.getExecutionConversation('e1', 'el1', 'c1', KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('updateExecutionConversation patches', async () => {
    axios.patch.mockResolvedValue({ data: { ok: true } });
    await expect(node_funcs.updateExecutionConversation('e1', 'el1', 'c1', { t: 'y' }, KEY)).resolves.toEqual({ ok: true });
    expect(axios.patch).toHaveBeenCalledWith(`${EL}/c1`, { t: 'y' }, AUTH);
  });
  it('updateExecutionConversation rejects on error', async () => {
    axios.patch.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.updateExecutionConversation('e1', 'el1', 'c1', {}, KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('deleteExecutionConversation deletes', async () => {
    axios.delete.mockResolvedValue({ data: { deleted: true } });
    await expect(node_funcs.deleteExecutionConversation('e1', 'el1', 'c1', KEY)).resolves.toEqual({ deleted: true });
    expect(axios.delete).toHaveBeenCalledWith(`${EL}/c1`, AUTH);
  });
  it('deleteExecutionConversation rejects on error', async () => {
    axios.delete.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.deleteExecutionConversation('e1', 'el1', 'c1', KEY)).rejects.toHaveProperty('message', 'boom');
  });
});

describe('execution comment helpers', () => {
  const CL = `${AL}/executions/e1/elements/el1/conversations/c1/comments`;

  it('addExecutionComment posts', async () => {
    axios.post.mockResolvedValue({ data: { id: 'm1' } });
    await expect(node_funcs.addExecutionComment('e1', 'el1', 'c1', { body: 'hi' }, KEY)).resolves.toEqual({ id: 'm1' });
    expect(axios.post).toHaveBeenCalledWith(CL, { body: 'hi' }, AUTH);
  });
  it('addExecutionComment rejects on error', async () => {
    axios.post.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.addExecutionComment('e1', 'el1', 'c1', {}, KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('getExecutionComments passes params', async () => {
    axios.get.mockResolvedValue({ data: [1] });
    await expect(node_funcs.getExecutionComments('e1', 'el1', 'c1', 2, 3, KEY)).resolves.toEqual([1]);
    expect(axios.get).toHaveBeenCalledWith(CL, { params: { offset: 2, limit: 3 }, headers: { Authorization: KEY } });
  });
  it('getExecutionComments omits params when not provided', async () => {
    axios.get.mockResolvedValue({ data: [] });
    await node_funcs.getExecutionComments('e1', 'el1', 'c1', undefined, undefined, KEY);
    expect(axios.get).toHaveBeenCalledWith(CL, { params: {}, headers: { Authorization: KEY } });
  });
  it('getExecutionComments rejects on error', async () => {
    axios.get.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.getExecutionComments('e1', 'el1', 'c1', 0, 0, KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('getExecutionComment gets one', async () => {
    axios.get.mockResolvedValue({ data: { id: 'm1' } });
    await expect(node_funcs.getExecutionComment('e1', 'el1', 'c1', 'm1', KEY)).resolves.toEqual({ id: 'm1' });
    expect(axios.get).toHaveBeenCalledWith(`${CL}/m1`, AUTH);
  });
  it('getExecutionComment rejects on error', async () => {
    axios.get.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.getExecutionComment('e1', 'el1', 'c1', 'm1', KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('updateExecutionComment patches', async () => {
    axios.patch.mockResolvedValue({ data: { ok: 1 } });
    await expect(node_funcs.updateExecutionComment('e1', 'el1', 'c1', 'm1', { body: 'z' }, KEY)).resolves.toEqual({ ok: 1 });
    expect(axios.patch).toHaveBeenCalledWith(`${CL}/m1`, { body: 'z' }, AUTH);
  });
  it('updateExecutionComment rejects on error', async () => {
    axios.patch.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.updateExecutionComment('e1', 'el1', 'c1', 'm1', {}, KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('deleteExecutionComment deletes', async () => {
    axios.delete.mockResolvedValue({ data: { deleted: 1 } });
    await expect(node_funcs.deleteExecutionComment('e1', 'el1', 'c1', 'm1', KEY)).resolves.toEqual({ deleted: 1 });
    expect(axios.delete).toHaveBeenCalledWith(`${CL}/m1`, AUTH);
  });
  it('deleteExecutionComment rejects on error', async () => {
    axios.delete.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.deleteExecutionComment('e1', 'el1', 'c1', 'm1', KEY)).rejects.toHaveProperty('message', 'boom');
  });
});

describe('procedure conversation helpers', () => {
  const PL = `${AL}/procedures/p1/versions/1/elements/el1/conversations`;

  it('addProcedureConversation posts', async () => {
    axios.post.mockResolvedValue({ data: { id: 'c1' } });
    await expect(node_funcs.addProcedureConversation('p1', 1, 'el1', { t: 'x' }, KEY)).resolves.toEqual({ id: 'c1' });
    expect(axios.post).toHaveBeenCalledWith(PL, { t: 'x' }, AUTH);
  });
  it('addProcedureConversation rejects on error', async () => {
    axios.post.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.addProcedureConversation('p1', 1, 'el1', {}, KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('getProcedureConversations passes params', async () => {
    axios.get.mockResolvedValue({ data: [1] });
    await expect(node_funcs.getProcedureConversations('p1', 1, 'el1', 5, 10, KEY)).resolves.toEqual([1]);
    expect(axios.get).toHaveBeenCalledWith(PL, { params: { offset: 5, limit: 10 }, headers: { Authorization: KEY } });
  });
  it('getProcedureConversations omits params when not provided', async () => {
    axios.get.mockResolvedValue({ data: [] });
    await node_funcs.getProcedureConversations('p1', 1, 'el1', undefined, undefined, KEY);
    expect(axios.get).toHaveBeenCalledWith(PL, { params: {}, headers: { Authorization: KEY } });
  });
  it('getProcedureConversations rejects on error', async () => {
    axios.get.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.getProcedureConversations('p1', 1, 'el1', 0, 0, KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('getProcedureConversation gets one', async () => {
    axios.get.mockResolvedValue({ data: { id: 'c1' } });
    await expect(node_funcs.getProcedureConversation('p1', 1, 'el1', 'c1', KEY)).resolves.toEqual({ id: 'c1' });
    expect(axios.get).toHaveBeenCalledWith(`${PL}/c1`, AUTH);
  });
  it('getProcedureConversation rejects on error', async () => {
    axios.get.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.getProcedureConversation('p1', 1, 'el1', 'c1', KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('updateProcedureConversation patches', async () => {
    axios.patch.mockResolvedValue({ data: { ok: true } });
    await expect(node_funcs.updateProcedureConversation('p1', 1, 'el1', 'c1', { t: 'y' }, KEY)).resolves.toEqual({ ok: true });
    expect(axios.patch).toHaveBeenCalledWith(`${PL}/c1`, { t: 'y' }, AUTH);
  });
  it('updateProcedureConversation rejects on error', async () => {
    axios.patch.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.updateProcedureConversation('p1', 1, 'el1', 'c1', {}, KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('deleteProcedureConversation deletes', async () => {
    axios.delete.mockResolvedValue({ data: { deleted: true } });
    await expect(node_funcs.deleteProcedureConversation('p1', 1, 'el1', 'c1', KEY)).resolves.toEqual({ deleted: true });
    expect(axios.delete).toHaveBeenCalledWith(`${PL}/c1`, AUTH);
  });
  it('deleteProcedureConversation rejects on error', async () => {
    axios.delete.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.deleteProcedureConversation('p1', 1, 'el1', 'c1', KEY)).rejects.toHaveProperty('message', 'boom');
  });
});

describe('procedure comment helpers', () => {
  const PCL = `${AL}/procedures/p1/versions/1/elements/el1/conversations/c1/comments`;

  it('addProcedureComment posts', async () => {
    axios.post.mockResolvedValue({ data: { id: 'm1' } });
    await expect(node_funcs.addProcedureComment('p1', 1, 'el1', 'c1', { body: 'hi' }, KEY)).resolves.toEqual({ id: 'm1' });
    expect(axios.post).toHaveBeenCalledWith(PCL, { body: 'hi' }, AUTH);
  });
  it('addProcedureComment rejects on error', async () => {
    axios.post.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.addProcedureComment('p1', 1, 'el1', 'c1', {}, KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('getProcedureComments passes params', async () => {
    axios.get.mockResolvedValue({ data: [1] });
    await expect(node_funcs.getProcedureComments('p1', 1, 'el1', 'c1', 2, 3, KEY)).resolves.toEqual([1]);
    expect(axios.get).toHaveBeenCalledWith(PCL, { params: { offset: 2, limit: 3 }, headers: { Authorization: KEY } });
  });
  it('getProcedureComments omits params when not provided', async () => {
    axios.get.mockResolvedValue({ data: [] });
    await node_funcs.getProcedureComments('p1', 1, 'el1', 'c1', undefined, undefined, KEY);
    expect(axios.get).toHaveBeenCalledWith(PCL, { params: {}, headers: { Authorization: KEY } });
  });
  it('getProcedureComments rejects on error', async () => {
    axios.get.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.getProcedureComments('p1', 1, 'el1', 'c1', 0, 0, KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('getProcedureComment gets one', async () => {
    axios.get.mockResolvedValue({ data: { id: 'm1' } });
    await expect(node_funcs.getProcedureComment('p1', 1, 'el1', 'c1', 'm1', KEY)).resolves.toEqual({ id: 'm1' });
    expect(axios.get).toHaveBeenCalledWith(`${PCL}/m1`, AUTH);
  });
  it('getProcedureComment rejects on error', async () => {
    axios.get.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.getProcedureComment('p1', 1, 'el1', 'c1', 'm1', KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('updateProcedureComment patches', async () => {
    axios.patch.mockResolvedValue({ data: { ok: 1 } });
    await expect(node_funcs.updateProcedureComment('p1', 1, 'el1', 'c1', 'm1', { body: 'z' }, KEY)).resolves.toEqual({ ok: 1 });
    expect(axios.patch).toHaveBeenCalledWith(`${PCL}/m1`, { body: 'z' }, AUTH);
  });
  it('updateProcedureComment rejects on error', async () => {
    axios.patch.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.updateProcedureComment('p1', 1, 'el1', 'c1', 'm1', {}, KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('deleteProcedureComment deletes', async () => {
    axios.delete.mockResolvedValue({ data: { deleted: 1 } });
    await expect(node_funcs.deleteProcedureComment('p1', 1, 'el1', 'c1', 'm1', KEY)).resolves.toEqual({ deleted: 1 });
    expect(axios.delete).toHaveBeenCalledWith(`${PCL}/m1`, AUTH);
  });
  it('deleteProcedureComment rejects on error', async () => {
    axios.delete.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.deleteProcedureComment('p1', 1, 'el1', 'c1', 'm1', KEY)).rejects.toHaveProperty('message', 'boom');
  });
});

describe('element move/copy and as_run', () => {
  it('moveElement posts to the move endpoint', async () => {
    axios.post.mockResolvedValue({ data: { moved: true } });
    await expect(node_funcs.moveElement('e1', { elem_ids: ['a'] }, KEY)).resolves.toEqual({ moved: true });
    expect(axios.post).toHaveBeenCalledWith(`${AL}/executions/e1/elements/move`, { elem_ids: ['a'] }, AUTH);
  });
  it('moveElement rejects on error', async () => {
    axios.post.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.moveElement('e1', {}, KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('copyElement posts to the copy endpoint', async () => {
    axios.post.mockResolvedValue({ data: { copied: true } });
    await expect(node_funcs.copyElement('e1', { elem_ids: ['a'] }, KEY)).resolves.toEqual({ copied: true });
    expect(axios.post).toHaveBeenCalledWith(`${AL}/executions/e1/elements/copy`, { elem_ids: ['a'] }, AUTH);
  });
  it('copyElement rejects on error', async () => {
    axios.post.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.copyElement('e1', {}, KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('as_run gets the as_run endpoint', async () => {
    axios.get.mockResolvedValue({ data: { as_run: [] } });
    await expect(node_funcs.as_run('e1', KEY)).resolves.toEqual({ as_run: [] });
    expect(axios.get).toHaveBeenCalledWith(`${AL}/executions/e1/as_run`, AUTH);
  });
  it('as_run rejects on error', async () => {
    axios.get.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.as_run('e1', KEY)).rejects.toHaveProperty('message', 'boom');
  });
});

describe('wait_switch_timeout', () => {
  it('does nothing when the configured wait is not positive', async () => {
    redisClient.get.mockResolvedValue('0');
    await node_funcs.wait_switch_timeout('e1');
    expect(redisClient.set).not.toHaveBeenCalled();
  });

  it('sets the flag and skips the loop when the flag is already clear', async () => {
    // 1st get: switch-wait secs; 2nd get: flag value (clear -> skip loop)
    redisClient.get
      .mockResolvedValueOnce('5')
      .mockResolvedValueOnce(null);
    redisClient.set.mockResolvedValue('OK');
    await node_funcs.wait_switch_timeout('e1');
    expect(redisClient.set).toHaveBeenCalledWith(
      'execution-switch-wait-flag:e1',
      expect.any(String),
      'EX',
      expect.anything()
    );
  });

  it('waits until the flag key is cleared', async () => {
    redisClient.get
      .mockResolvedValueOnce('5')     // switch-wait secs
      .mockResolvedValueOnce('flag')  // first loop check -> keep waiting
      .mockResolvedValueOnce(null);   // second check -> exit
    redisClient.set.mockResolvedValue('OK');
    await node_funcs.wait_switch_timeout('e1');
    expect(redisClient.get).toHaveBeenCalledTimes(3);
  });
});
