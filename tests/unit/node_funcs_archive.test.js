'use strict';

// Coverage for the archive-facing CRUD helpers in api/node_funcs.js. These are
// the business-logic wrappers the retired Python integration tests exercised
// end-to-end (venues, venue groups, procedures, versions). HTTP is mocked.

jest.mock('aws-sdk', () => require('./mocks/mockAwsSdk'));
jest.mock('async-redis', () => require('./mocks/mockRedis'));
jest.mock('jsonwebtoken', () => ({ verify: jest.fn() }));
jest.mock('axios', () => ({ get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn(), put: jest.fn() }));

const axios = require('axios');
const jwt = require('jsonwebtoken');
const mockAwsSdk = require('./mocks/mockAwsSdk');
const mockRedis = require('./mocks/mockRedis');
const config = require('../../config');
const node_funcs = require('../../api/node_funcs');

const s3 = mockAwsSdk.__s3;
const redisClient = mockRedis.__client;

const AL = 'http://localhost:8010/api/v5';
const EL2 = 'http://localhost:9999/api/v4';
const DL = 'http://localhost:5000/api/v4';
const KEY = 'Bearer token';
const AUTH = { headers: { Authorization: KEY } };

beforeEach(() => {
  axios.get.mockReset();
  axios.post.mockReset();
  axios.patch.mockReset();
  axios.delete.mockReset();
  axios.put.mockReset();
  jwt.verify.mockReset();
  s3.putObject.mockReset();
  // default: S3 upload succeeds (callback style)
  s3.putObject.mockImplementation((params, cb) => cb(null));
  redisClient.get.mockReset();
  redisClient.set.mockReset();
  redisClient.del.mockReset();
});

describe('node_funcs venue group helpers', () => {
  it('createVenueGroup posts and returns data', async () => {
    axios.post.mockResolvedValue({ data: { id: 'g1' } });
    await expect(node_funcs.createVenueGroup({ name: 'g' }, KEY)).resolves.toEqual({ id: 'g1' });
    expect(axios.post).toHaveBeenCalledWith(`${AL}/venue_groups`, { name: 'g' }, AUTH);
  });
  it('createVenueGroup rejects with a transformed error', async () => {
    axios.post.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.createVenueGroup({}, KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('getVenueGroup gets and returns data', async () => {
    axios.get.mockResolvedValue({ data: { id: 'g1' } });
    await expect(node_funcs.getVenueGroup('g1', KEY)).resolves.toEqual({ id: 'g1' });
    expect(axios.get).toHaveBeenCalledWith(`${AL}/venue_groups/g1`, AUTH);
  });
  it('getVenueGroup rejects on error', async () => {
    axios.get.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.getVenueGroup('g1', KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('updateVenueGroup patches', async () => {
    axios.patch.mockResolvedValue({});
    await expect(node_funcs.updateVenueGroup('g1', { name: 'x' }, KEY)).resolves.toBeUndefined();
    expect(axios.patch).toHaveBeenCalledWith(`${AL}/venue_groups/g1`, { name: 'x' }, AUTH);
  });
  it('updateVenueGroup rejects on error', async () => {
    axios.patch.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.updateVenueGroup('g1', {}, KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('getVenueGroups returns list with total_count header', async () => {
    axios.get.mockResolvedValue({ data: [1, 2], headers: { 'x-total-count': 2 } });
    await expect(node_funcs.getVenueGroups({ limit: 10 }, KEY)).resolves.toEqual({ venue_groups: [1, 2], total_count: 2 });
    expect(axios.get).toHaveBeenCalledWith(`${AL}/venue_groups`, { params: { limit: 10 }, headers: { Authorization: KEY } });
  });
  it('getVenueGroups defaults total_count to 0 when header missing', async () => {
    axios.get.mockResolvedValue({ data: [], headers: {} });
    await expect(node_funcs.getVenueGroups({}, KEY)).resolves.toEqual({ venue_groups: [], total_count: 0 });
  });
  it('getVenueGroups rejects on error', async () => {
    axios.get.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.getVenueGroups({}, KEY)).rejects.toHaveProperty('message', 'boom');
  });
});

describe('node_funcs venue helpers', () => {
  it('createVenue posts and returns data', async () => {
    axios.post.mockResolvedValue({ data: { id: 'v1' } });
    await expect(node_funcs.createVenue({ name: 'v' }, KEY)).resolves.toEqual({ id: 'v1' });
    expect(axios.post).toHaveBeenCalledWith(`${AL}/venues`, { name: 'v' }, AUTH);
  });
  it('createVenue rejects on error', async () => {
    axios.post.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.createVenue({}, KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('getVenue gets and returns data', async () => {
    axios.get.mockResolvedValue({ data: { id: 'v1' } });
    await expect(node_funcs.getVenue('v1', KEY)).resolves.toEqual({ id: 'v1' });
    expect(axios.get).toHaveBeenCalledWith(`${AL}/venues/v1`, AUTH);
  });
  it('getVenue rejects on error', async () => {
    axios.get.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.getVenue('v1', KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('updateVenue patches', async () => {
    axios.patch.mockResolvedValue({});
    await expect(node_funcs.updateVenue('v1', { name: 'x' }, KEY)).resolves.toBeUndefined();
    expect(axios.patch).toHaveBeenCalledWith(`${AL}/venues/v1`, { name: 'x' }, AUTH);
  });
  it('updateVenue rejects on error', async () => {
    axios.patch.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.updateVenue('v1', {}, KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('getVenueStatus returns data', async () => {
    axios.get.mockResolvedValue({ data: { status: 'AVAILABLE' } });
    await expect(node_funcs.getVenueStatus('v1', KEY)).resolves.toEqual({ status: 'AVAILABLE' });
    expect(axios.get).toHaveBeenCalledWith(`${AL}/venues/v1/status`, AUTH);
  });
  it('getVenueStatus rejects on error', async () => {
    axios.get.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.getVenueStatus('v1', KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('updateVenueStatus patches', async () => {
    axios.patch.mockResolvedValue({});
    await expect(node_funcs.updateVenueStatus('v1', { status: 'DOWN' }, KEY)).resolves.toBeUndefined();
    expect(axios.patch).toHaveBeenCalledWith(`${AL}/venues/v1/status`, { status: 'DOWN' }, AUTH);
  });
  it('updateVenueStatus rejects on error', async () => {
    axios.patch.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.updateVenueStatus('v1', {}, KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('getVenues returns list with total_count', async () => {
    axios.get.mockResolvedValue({ data: [1], headers: { 'x-total-count': 1 } });
    await expect(node_funcs.getVenues({ limit: 5 }, KEY)).resolves.toEqual({ venues: [1], total_count: 1 });
  });
  it('getVenues defaults total_count to 0', async () => {
    axios.get.mockResolvedValue({ data: [], headers: {} });
    await expect(node_funcs.getVenues({}, KEY)).resolves.toEqual({ venues: [], total_count: 0 });
  });
  it('getVenues rejects on error', async () => {
    axios.get.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.getVenues({}, KEY)).rejects.toHaveProperty('message', 'boom');
  });

  describe('deleteVenue', () => {
    it('rejects when venue is in use', async () => {
      axios.get.mockResolvedValue({ data: { status: 'IN_USE' } });
      await expect(node_funcs.deleteVenue('v1', KEY)).rejects.toHaveProperty('message', 'Cannot delete venue that is in use');
      expect(axios.delete).not.toHaveBeenCalled();
    });
    it('deletes when venue is available', async () => {
      axios.get.mockResolvedValue({ data: { status: 'AVAILABLE' }, status: 200 });
      axios.delete.mockResolvedValue({});
      await node_funcs.deleteVenue('v1', KEY);
      expect(axios.delete).toHaveBeenCalledWith(`${AL}/venues/v1`, AUTH);
    });
    it('rejects when status lookup fails', async () => {
      axios.get.mockRejectedValue(new Error('boom'));
      await expect(node_funcs.deleteVenue('v1', KEY)).rejects.toHaveProperty('message', 'boom');
    });
  });
});

describe('node_funcs procedure/version helpers', () => {
  it('getProcedure derives status WORKING by default', async () => {
    axios.get.mockResolvedValue({ data: { id: 'p1' } });
    await expect(node_funcs.getProcedure('p1', KEY)).resolves.toEqual({ id: 'p1', status: 'WORKING' });
    expect(axios.get).toHaveBeenCalledWith(`${AL}/procedures/p1`, AUTH);
  });
  it('getProcedure derives status OBSOLETE / RELEASED / VERSIONED', async () => {
    axios.get.mockResolvedValueOnce({ data: { id: 'p1', deprecated: true } });
    await expect(node_funcs.getProcedure('p1', KEY)).resolves.toHaveProperty('status', 'OBSOLETE');
    axios.get.mockResolvedValueOnce({ data: { id: 'p1', current_released_version: 2 } });
    await expect(node_funcs.getProcedure('p1', KEY)).resolves.toHaveProperty('status', 'RELEASED');
    axios.get.mockResolvedValueOnce({ data: { id: 'p1', current_version: 3 } });
    await expect(node_funcs.getProcedure('p1', KEY)).resolves.toHaveProperty('status', 'VERSIONED');
  });
  it('getProcedure rejects on error', async () => {
    axios.get.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.getProcedure('p1', KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('getVersion derives status and returns data', async () => {
    axios.get.mockResolvedValue({ data: { version: 1 } });
    await expect(node_funcs.getVersion('p1', 1, KEY)).resolves.toEqual({ version: 1, status: 'WORKING' });
    expect(axios.get).toHaveBeenCalledWith(`${AL}/procedures/p1/versions/1`, AUTH);
  });
  it('getVersion preserves an existing status', async () => {
    axios.get.mockResolvedValue({ data: { version: 1, status: 'RELEASED' } });
    await expect(node_funcs.getVersion('p1', 1, KEY)).resolves.toHaveProperty('status', 'RELEASED');
  });
  it('getVersion rejects on error', async () => {
    axios.get.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.getVersion('p1', 1, KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('removeProcedure deletes', async () => {
    axios.delete.mockResolvedValue({});
    await node_funcs.removeProcedure('p1', KEY);
    expect(axios.delete).toHaveBeenCalledWith(`${AL}/procedures/p1`, AUTH);
  });
  it('removeProcedure rejects on error', async () => {
    axios.delete.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.removeProcedure('p1', KEY)).rejects.toHaveProperty('message', 'boom');
  });
});

describe('node_funcs createArchiveElement', () => {
  it('rejects when neither execution_id nor procedure_id is given', async () => {
    await expect(node_funcs.createArchiveElement(null, null, 'STEP', 'CMD', {}, null, null, KEY))
      .rejects.toBe('execution_id or procedure_id was not specified');
  });

  it('creates a STEP with explicit step_type and posts to executions/steps', async () => {
    axios.post.mockResolvedValue({ data: { id: 's1' } });
    await expect(node_funcs.createArchiveElement('e', null, 'STEP', 'CMD', {}, 'a', 'CHILD', KEY)).resolves.toEqual({ id: 's1' });
    expect(axios.post).toHaveBeenCalledWith(
      `${AL}/executions/e/steps`,
      expect.objectContaining({ elem_type: 'STEP', step_type: 'CMD' }),
      { params: { insert_after_id: 'a', level: 'CHILD' }, headers: { Authorization: KEY } }
    );
  });

  it('derives step_type from the posted data', async () => {
    axios.post.mockResolvedValue({ data: { id: 's2' } });
    await node_funcs.createArchiveElement('e', null, 'STEP', null, { step_type: 'CMD' }, null, null, KEY);
    expect(axios.post).toHaveBeenCalledWith(
      `${AL}/executions/e/steps`,
      expect.objectContaining({ step_type: 'CMD' }),
      { params: {}, headers: { Authorization: KEY } }
    );
  });

  it('rejects an unrecognized step_type', async () => {
    await expect(node_funcs.createArchiveElement('e', null, 'STEP', 'NOPE', {}, null, null, KEY))
      .rejects.toMatch(/Step type was not recognized/);
  });

  it('rejects when the archive call fails', async () => {
    axios.post.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.createArchiveElement('e', null, 'STEP', 'CMD', {}, null, null, KEY))
      .rejects.toHaveProperty('message', 'boom');
  });

  it('creates a PROCEDURE_SECTION on a procedure', async () => {
    axios.post.mockResolvedValue({ data: { id: 'ps1' } });
    await node_funcs.createArchiveElement(null, 'p', 'PROCEDURE_SECTION', null, { x: 1 }, null, null, KEY);
    expect(axios.post).toHaveBeenCalledWith(
      `${AL}/procedures/p/procedure_sections`,
      expect.objectContaining({ elem_type: 'PROCEDURE_SECTION', x: 1 }),
      { params: {}, headers: { Authorization: KEY } }
    );
  });

  it('creates a SECTION (defaults body when none posted)', async () => {
    axios.post.mockResolvedValue({ data: { id: 'sec1' } });
    await node_funcs.createArchiveElement('e', null, 'SECTION', null, null, null, null, KEY);
    expect(axios.post).toHaveBeenCalledWith(
      `${AL}/executions/e/sections`,
      { elem_type: 'SECTION' },
      { params: {}, headers: { Authorization: KEY } }
    );
  });

  it('creates a PARAGRAPH', async () => {
    axios.post.mockResolvedValue({ data: { id: 'par1' } });
    await node_funcs.createArchiveElement('e', null, 'PARAGRAPH', null, { text: 't' }, null, null, KEY);
    expect(axios.post).toHaveBeenCalledWith(
      `${AL}/executions/e/paragraphs`,
      expect.objectContaining({ elem_type: 'PARAGRAPH', text: 't' }),
      { params: {}, headers: { Authorization: KEY } }
    );
  });
});

describe('node_funcs step/element getters', () => {
  it('getStep via execution_id', async () => {
    axios.get.mockResolvedValue({ data: { s: 1 } });
    await expect(node_funcs.getStep('e', null, 'el', KEY)).resolves.toEqual({ s: 1 });
    expect(axios.get).toHaveBeenCalledWith(`${AL}/executions/e/steps/el`, AUTH);
  });
  it('getStep via procedure_id', async () => {
    axios.get.mockResolvedValue({ data: { s: 1 } });
    await node_funcs.getStep(null, 'p', 'el', KEY);
    expect(axios.get).toHaveBeenCalledWith(`${AL}/procedures/p/steps/el`, AUTH);
  });
  it('getStep rejects when neither id is provided', async () => {
    await expect(node_funcs.getStep(null, null, 'el', KEY)).rejects.toBe('execution_id or procedure_id was not provided');
  });
  it('getStep rejects on error', async () => {
    axios.get.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.getStep('e', null, 'el', KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('getExecutionElement', async () => {
    axios.get.mockResolvedValue({ data: { el: 1 } });
    await expect(node_funcs.getExecutionElement('e', 'el', KEY)).resolves.toEqual({ el: 1 });
    expect(axios.get).toHaveBeenCalledWith(`${AL}/executions/e/elements/el`, AUTH);
  });
  it('getExecutionElement rejects on error', async () => {
    axios.get.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.getExecutionElement('e', 'el', KEY)).rejects.toHaveProperty('message', 'boom');
  });
});

describe('node_funcs step input/result + dispatchers', () => {
  it('updateStep dispatches to execution / procedure / rejects', async () => {
    axios.patch.mockResolvedValue({ data: { ok: 1 } });
    await expect(node_funcs.updateStep('e', null, 'el', {}, KEY)).resolves.toEqual({ ok: 1 });
    expect(axios.patch).toHaveBeenLastCalledWith(`${AL}/executions/e/steps/el`, expect.anything(), { headers: { Authorization: KEY } });
    await node_funcs.updateStep(null, 'p', 'el', {}, KEY);
    expect(axios.patch).toHaveBeenLastCalledWith(`${AL}/procedures/p/steps/el`, expect.anything(), { headers: { Authorization: KEY } });
    await expect(node_funcs.updateStep(null, null, 'el', {}, KEY)).rejects.toBe('execution_id or procedure_id was not provided');
  });

  it('updateElement dispatches to execution / procedure / rejects', async () => {
    axios.patch.mockResolvedValue({ data: { ok: 1 } });
    await expect(node_funcs.updateElement('e', null, 'el', {}, KEY)).resolves.toEqual({ ok: 1 });
    expect(axios.patch).toHaveBeenLastCalledWith(`${AL}/executions/e/elements/el`, expect.anything(), { headers: { Authorization: KEY } });
    await node_funcs.updateElement(null, 'p', 'el', {}, KEY);
    expect(axios.patch).toHaveBeenLastCalledWith(`${AL}/procedures/p/elements/el`, expect.anything(), { headers: { Authorization: KEY } });
    await expect(node_funcs.updateElement(null, null, 'el', {}, KEY)).rejects.toBe('execution_id or procedure_id was not provided');
  });

  it('updateElements dispatches to execution / procedure / rejects', async () => {
    axios.patch.mockResolvedValue({ data: { ok: 1 } });
    await expect(node_funcs.updateElements('e', null, [{}], KEY)).resolves.toEqual({ ok: 1 });
    expect(axios.patch).toHaveBeenLastCalledWith(`${AL}/executions/e/elements`, [{}], { headers: { Authorization: KEY } });
    await node_funcs.updateElements(null, 'p', [{}], KEY);
    expect(axios.patch).toHaveBeenLastCalledWith(`${AL}/procedures/p/elements`, [{}], expect.objectContaining({ headers: { Authorization: KEY } }));
    await expect(node_funcs.updateElements(null, null, [{}], KEY)).rejects.toBe('execution_id or procedure_id was not provided');
  });

  it('get_step_input: execution / procedure / rejects / error', async () => {
    axios.get.mockResolvedValue({ data: { in: 1 } });
    await expect(node_funcs.get_step_input('e', null, 'el', KEY)).resolves.toEqual({ in: 1 });
    expect(axios.get).toHaveBeenLastCalledWith(`${AL}/executions/e/steps/el/input`, AUTH);
    await node_funcs.get_step_input(null, 'p', 'el', KEY);
    expect(axios.get).toHaveBeenLastCalledWith(`${AL}/procedures/p/steps/el/input`, AUTH);
    await expect(node_funcs.get_step_input(null, null, 'el', KEY)).rejects.toBe('execution_id or procedure_id was not provided');
    axios.get.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.get_step_input('e', null, 'el', KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('update_step_input: execution / procedure / rejects / error', async () => {
    axios.post.mockResolvedValue({ data: { ok: 1 } });
    await expect(node_funcs.update_step_input('e', null, 'el', { u: 1 }, KEY)).resolves.toEqual({ ok: 1 });
    expect(axios.post).toHaveBeenLastCalledWith(`${AL}/executions/e/steps/el/input`, { u: 1 }, AUTH);
    await node_funcs.update_step_input(null, 'p', 'el', { u: 1 }, KEY);
    expect(axios.post).toHaveBeenLastCalledWith(`${AL}/procedures/p/steps/el/input`, { u: 1 }, AUTH);
    await expect(node_funcs.update_step_input(null, null, 'el', {}, KEY)).rejects.toBe('execution_id or procedure_id was not provided');
    axios.post.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.update_step_input('e', null, 'el', {}, KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('update_step_input_nonexecutable: wraps input for execution / procedure / rejects', async () => {
    axios.patch.mockResolvedValue({ data: { ok: 1 } });
    await expect(node_funcs.update_step_input_nonexecutable('e', null, 'el', { u: 1 }, KEY)).resolves.toEqual({ ok: 1 });
    expect(axios.patch).toHaveBeenLastCalledWith(`${AL}/executions/e/steps/el`, { execution_user_input: { u: 1 } }, AUTH);
    await node_funcs.update_step_input_nonexecutable(null, 'p', 'el', { u: 1 }, KEY);
    expect(axios.patch).toHaveBeenLastCalledWith(`${AL}/procedures/p/steps/el`, { authoring_user_input: { u: 1 } }, AUTH);
    await expect(node_funcs.update_step_input_nonexecutable(null, null, 'el', {}, KEY)).rejects.toBe('execution_id or procedure_id was not provided');
    axios.patch.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.update_step_input_nonexecutable('e', null, 'el', {}, KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('get_step_result + update_step_result', async () => {
    axios.get.mockResolvedValue({ data: { r: 1 } });
    await expect(node_funcs.get_step_result('e', 'el', KEY)).resolves.toEqual({ r: 1 });
    expect(axios.get).toHaveBeenCalledWith(`${AL}/executions/e/steps/el/result`, AUTH);
    axios.get.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.get_step_result('e', 'el', KEY)).rejects.toHaveProperty('message', 'boom');

    axios.post.mockResolvedValue({ data: { ok: 1 } });
    await expect(node_funcs.update_step_result('e', 'el', { r: 1 }, KEY)).resolves.toEqual({ ok: 1 });
    expect(axios.post).toHaveBeenCalledWith(`${AL}/executions/e/steps/el/result`, { r: 1 }, AUTH);
    axios.post.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.update_step_result('e', 'el', {}, KEY)).rejects.toHaveProperty('message', 'boom');
  });
});

describe('node_funcs execution CRUD', () => {
  it('getExecution', async () => {
    axios.get.mockResolvedValue({ data: { id: 'e1' } });
    await expect(node_funcs.getExecution('e1', KEY)).resolves.toEqual({ id: 'e1' });
    expect(axios.get).toHaveBeenCalledWith(`${AL}/executions/e1`, AUTH);
    axios.get.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.getExecution('e1', KEY)).rejects.toHaveProperty('message', 'boom');
  });
  it('getExecutionStatus', async () => {
    axios.get.mockResolvedValue({ data: { status: 'IDLE' } });
    await expect(node_funcs.getExecutionStatus('e1', KEY)).resolves.toEqual({ status: 'IDLE' });
    expect(axios.get).toHaveBeenCalledWith(`${AL}/executions/e1/status`, AUTH);
    axios.get.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.getExecutionStatus('e1', KEY)).rejects.toHaveProperty('message', 'boom');
  });
  it('removeExecution', async () => {
    axios.delete.mockResolvedValue({});
    await node_funcs.removeExecution('e1', KEY);
    expect(axios.delete).toHaveBeenCalledWith(`${AL}/executions/e1`, AUTH);
    axios.delete.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.removeExecution('e1', KEY)).rejects.toHaveProperty('message', 'boom');
  });
  it('updateExecution', async () => {
    axios.patch.mockResolvedValue({ data: { ok: 1 } });
    await expect(node_funcs.updateExecution('e1', { m: 1 }, KEY)).resolves.toEqual({ ok: 1 });
    expect(axios.patch).toHaveBeenCalledWith(`${AL}/executions/e1`, { m: 1 }, AUTH);
    axios.patch.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.updateExecution('e1', {}, KEY)).rejects.toHaveProperty('message', 'boom');
  });
  it('getAllExecutions returns list with total_count', async () => {
    axios.get.mockResolvedValue({ data: [1], headers: { 'x-total-count': 1 } });
    await expect(node_funcs.getAllExecutions({ limit: 5 }, KEY)).resolves.toEqual({ executions: [1], total_count: 1 });
    axios.get.mockResolvedValue({ data: [], headers: {} });
    await expect(node_funcs.getAllExecutions({}, KEY)).resolves.toEqual({ executions: [], total_count: 0 });
    axios.get.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.getAllExecutions({}, KEY)).rejects.toHaveProperty('message', 'boom');
  });
});

describe('node_funcs conversation/comment/label/element wrappers (data-driven)', () => {
  const EC = `${AL}/executions/e/elements/el/conversations`;
  const PC = `${AL}/procedures/p/versions/v/elements/el/conversations`;
  const cases = [
    // execution conversations + comments
    ['addExecutionConversation', 'post', ['e', 'el', { c: 1 }, KEY], EC],
    ['getExecutionConversations', 'get', ['e', 'el', 0, 10, KEY], EC],
    ['getExecutionConversation', 'get', ['e', 'el', 'c', KEY], `${EC}/c`],
    ['updateExecutionConversation', 'patch', ['e', 'el', 'c', { u: 1 }, KEY], `${EC}/c`],
    ['deleteExecutionConversation', 'delete', ['e', 'el', 'c', KEY], `${EC}/c`],
    ['addExecutionComment', 'post', ['e', 'el', 'c', { m: 1 }, KEY], `${EC}/c/comments`],
    ['getExecutionComments', 'get', ['e', 'el', 'c', 0, 10, KEY], `${EC}/c/comments`],
    ['getExecutionComment', 'get', ['e', 'el', 'c', 'cm', KEY], `${EC}/c/comments/cm`],
    ['updateExecutionComment', 'patch', ['e', 'el', 'c', 'cm', { m: 1 }, KEY], `${EC}/c/comments/cm`],
    ['deleteExecutionComment', 'delete', ['e', 'el', 'c', 'cm', KEY], `${EC}/c/comments/cm`],
    // procedure conversations + comments
    ['addProcedureConversation', 'post', ['p', 'v', 'el', { c: 1 }, KEY], PC],
    ['getProcedureConversations', 'get', ['p', 'v', 'el', 0, 10, KEY], PC],
    ['getProcedureConversation', 'get', ['p', 'v', 'el', 'c', KEY], `${PC}/c`],
    ['updateProcedureConversation', 'patch', ['p', 'v', 'el', 'c', { u: 1 }, KEY], `${PC}/c`],
    ['deleteProcedureConversation', 'delete', ['p', 'v', 'el', 'c', KEY], `${PC}/c`],
    ['addProcedureComment', 'post', ['p', 'v', 'el', 'c', { m: 1 }, KEY], `${PC}/c/comments`],
    ['getProcedureComments', 'get', ['p', 'v', 'el', 'c', 0, 10, KEY], `${PC}/c/comments`],
    ['getProcedureComment', 'get', ['p', 'v', 'el', 'c', 'cm', KEY], `${PC}/c/comments/cm`],
    ['updateProcedureComment', 'patch', ['p', 'v', 'el', 'c', 'cm', { m: 1 }, KEY], `${PC}/c/comments/cm`],
    ['deleteProcedureComment', 'delete', ['p', 'v', 'el', 'c', 'cm', KEY], `${PC}/c/comments/cm`],
    // labels + element move/copy + reports
    ['createProcedureLabel', 'post', [{ n: 1 }, KEY], `${AL}/procedures/labels`],
    ['moveElement', 'post', ['e', { m: 1 }, KEY], `${AL}/executions/e/elements/move`],
    ['copyElement', 'post', ['e', { c: 1 }, KEY], `${AL}/executions/e/elements/copy`],
    ['as_run', 'get', ['e', KEY], `${AL}/executions/e/as_run`],
    ['history_execution', 'get', ['e', 0, 10, 'ASC', KEY], `${AL}/executions/e/history`],
    // section/paragraph dispatchers (execution + procedure branches)
    ['get_section', 'get', ['e', null, 'el', KEY], `${AL}/executions/e/sections/el`],
    ['get_section', 'get', [null, 'p', 'el', KEY], `${AL}/procedures/p/sections/el`],
    ['update_section', 'patch', ['e', null, 'el', { s: 1 }, KEY], `${AL}/executions/e/sections/el`],
    ['update_section', 'patch', [null, 'p', 'el', { s: 1 }, KEY], `${AL}/procedures/p/sections/el`],
    ['get_paragraph', 'get', ['e', null, 'el', KEY], `${AL}/executions/e/paragraphs/el`],
    ['get_paragraph', 'get', [null, 'p', 'el', KEY], `${AL}/procedures/p/paragraphs/el`],
    ['update_paragraph', 'patch', ['e', null, 'el', { p: 1 }, KEY], `${AL}/executions/e/paragraphs/el`],
    ['update_paragraph', 'patch', [null, 'p', 'el', { p: 1 }, KEY], `${AL}/procedures/p/paragraphs/el`]
  ];

  cases.forEach(([name, method, args, url]) => {
    it(`${name} -> ${url} (success + error)`, async () => {
      axios[method].mockResolvedValue({ data: { ok: 1 } });
      await expect(node_funcs[name](...args)).resolves.toEqual({ ok: 1 });
      const calls = axios[method].mock.calls;
      expect(calls[calls.length - 1][0]).toBe(url);
      axios[method].mockRejectedValue(new Error('boom'));
      await expect(node_funcs[name](...args)).rejects.toHaveProperty('message', 'boom');
    });
  });

  it('section/paragraph dispatchers reject when neither id is provided', async () => {
    await expect(node_funcs.get_section(null, null, 'el', KEY)).rejects.toMatch(/was not provided/);
    await expect(node_funcs.update_section(null, null, 'el', {}, KEY)).rejects.toMatch(/was not provided/);
    await expect(node_funcs.get_paragraph(null, null, 'el', KEY)).rejects.toMatch(/was not provided/);
    await expect(node_funcs.update_paragraph(null, null, 'el', {}, KEY)).rejects.toMatch(/was not provided/);
  });

  it('getProcedureLabels returns list + total_count', async () => {
    axios.get.mockResolvedValue({ data: [1], headers: { 'x-total-count': 1 } });
    await expect(node_funcs.getProcedureLabels(0, 10, 'ASC', 'n', 'd', KEY)).resolves.toEqual({ procedure_labels: [1], total_count: 1 });
    axios.get.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.getProcedureLabels(0, 10, 'ASC', 'n', 'd', KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('removeProcedureLabel deletes', async () => {
    axios.delete.mockResolvedValue({});
    await node_funcs.removeProcedureLabel('l', KEY);
    expect(axios.delete).toHaveBeenCalledWith(`${AL}/procedures/labels/l`, AUTH);
    axios.delete.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.removeProcedureLabel('l', KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('getAllSections / getAllParagraphs dispatch and reject', async () => {
    axios.get.mockResolvedValue({ data: [1], headers: { 'x-total-count': 1 } });
    await expect(node_funcs.getAllSections('e', null, 0, 10, 'ASC', KEY)).resolves.toEqual({ elems: [1], total_count: 1 });
    expect(axios.get).toHaveBeenLastCalledWith(`${AL}/executions/e/sections`, { params: { offset: 0, limit: 10, sort: 'ASC' }, headers: { Authorization: KEY } });
    await node_funcs.getAllSections(null, 'p', null, null, null, KEY);
    expect(axios.get).toHaveBeenLastCalledWith(`${AL}/procedures/p/sections`, { params: {}, headers: { Authorization: KEY } });
    await expect(node_funcs.getAllSections(null, null, 0, 0, 0, KEY)).rejects.toMatch(/was not provided/);

    await expect(node_funcs.getAllParagraphs('e', null, 0, 10, 'ASC', KEY)).resolves.toEqual({ elems: [1], total_count: 1 });
    expect(axios.get).toHaveBeenLastCalledWith(`${AL}/executions/e/paragraphs`, { params: { offset: 0, limit: 10, sort: 'ASC' }, headers: { Authorization: KEY } });
    await node_funcs.getAllParagraphs(null, 'p', null, null, null, KEY);
    expect(axios.get).toHaveBeenLastCalledWith(`${AL}/procedures/p/paragraphs`, { params: {}, headers: { Authorization: KEY } });
    await expect(node_funcs.getAllParagraphs(null, null, 0, 0, 0, KEY)).rejects.toMatch(/was not provided/);
  });
});

describe('node_funcs file read/list/delete helpers', () => {
  it('readFile', async () => {
    axios.get.mockResolvedValue({ data: { f: 1 } });
    await expect(node_funcs.readFile('e', 'el', 'f', KEY)).resolves.toEqual({ f: 1 });
    expect(axios.get).toHaveBeenCalledWith(`${AL}/executions/e/elements/el/files/f`, AUTH);
  });
  it('readFile rejects', async () => {
    axios.get.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.readFile('e', 'el', 'f', KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('readProcedureElementFile', async () => {
    axios.get.mockResolvedValue({ data: { f: 1 } });
    await expect(node_funcs.readProcedureElementFile('p', 'el', 'f', KEY)).resolves.toEqual({ f: 1 });
    expect(axios.get).toHaveBeenCalledWith(`${AL}/procedures/p/elements/el/files/f`, AUTH);
  });
  it('readProcedureFile', async () => {
    axios.get.mockResolvedValue({ data: { f: 1 } });
    await expect(node_funcs.readProcedureFile('p', 'f', KEY)).resolves.toEqual({ f: 1 });
    expect(axios.get).toHaveBeenCalledWith(`${AL}/procedures/p/files/f`, AUTH);
  });
  it('readFileExec', async () => {
    axios.get.mockResolvedValue({ data: { f: 1 } });
    await expect(node_funcs.readFileExec('f', 'e', KEY)).resolves.toEqual({ f: 1 });
    expect(axios.get).toHaveBeenCalledWith(`${AL}/executions/e/files/f`, AUTH);
  });
  it('readFileComment', async () => {
    axios.get.mockResolvedValue({ data: { f: 1 } });
    await expect(node_funcs.readFileComment('e', 'el', 'c', 'cm', 'f', KEY)).resolves.toEqual({ f: 1 });
    expect(axios.get).toHaveBeenCalledWith(`${AL}/executions/e/elements/el/conversations/c/comments/cm/files/f`, AUTH);
  });
  it('readFileProcedureComment', async () => {
    axios.get.mockResolvedValue({ data: { f: 1 } });
    await expect(node_funcs.readFileProcedureComment('p', 'v', 'el', 'c', 'cm', 'f', KEY)).resolves.toEqual({ f: 1 });
    expect(axios.get).toHaveBeenCalledWith(`${AL}/procedures/p/versions/v/elements/el/conversations/c/comments/cm/files/f`, AUTH);
  });

  it('deleteFile / deleteProcedureElementFile / deleteProcedureFile / deleteFileExec', async () => {
    axios.delete.mockResolvedValue({ data: 'ok' });
    await node_funcs.deleteFile('e', 'el', 'f', KEY);
    expect(axios.delete).toHaveBeenCalledWith(`${AL}/executions/e/elements/el/files/f`, AUTH);
    await node_funcs.deleteProcedureElementFile('p', 'el', 'f', KEY);
    expect(axios.delete).toHaveBeenCalledWith(`${AL}/procedures/p/elements/el/files/f`, AUTH);
    await node_funcs.deleteProcedureFile('p', 'f', KEY);
    expect(axios.delete).toHaveBeenCalledWith(`${AL}/procedures/p/files/f`, AUTH);
    await node_funcs.deleteFileExec('e', 'f', KEY);
    expect(axios.delete).toHaveBeenCalledWith(`${AL}/executions/e/files/f`, AUTH);
  });
  it('deleteFileComment / deleteFileProcedureComment', async () => {
    axios.delete.mockResolvedValue({ data: 'ok' });
    await node_funcs.deleteFileComment('e', 'el', 'c', 'cm', 'f', KEY);
    expect(axios.delete).toHaveBeenCalledWith(`${AL}/executions/e/elements/el/conversations/c/comments/cm/files/f`, AUTH);
    await node_funcs.deleteFileProcedureComment('p', 'v', 'el', 'c', 'cm', 'f', KEY);
    expect(axios.delete).toHaveBeenCalledWith(`${AL}/procedures/p/versions/v/elements/el/conversations/c/comments/cm/files/f`, AUTH);
  });
  it('deleteFile rejects', async () => {
    axios.delete.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.deleteFile('e', 'el', 'f', KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('getFiles with params + without params + error', async () => {
    axios.get.mockResolvedValue({ data: [1], headers: { 'x-total-count': 1 } });
    await expect(node_funcs.getFiles('e', 'el', 5, 10, KEY)).resolves.toEqual({ files: [1], total_count: 1 });
    expect(axios.get).toHaveBeenCalledWith(`${AL}/executions/e/elements/el/files`, { params: { offset: 5, limit: 10 }, headers: { Authorization: KEY } });
    axios.get.mockResolvedValue({ data: [], headers: {} });
    await expect(node_funcs.getFiles('e', 'el', 0, 0, KEY)).resolves.toEqual({ files: [], total_count: 0 });
    expect(axios.get).toHaveBeenLastCalledWith(`${AL}/executions/e/elements/el/files`, { params: {}, headers: { Authorization: KEY } });
    axios.get.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.getFiles('e', 'el', 5, 10, KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('getProcedureElementFiles', async () => {
    axios.get.mockResolvedValue({ data: [1], headers: { 'x-total-count': 1 } });
    await expect(node_funcs.getProcedureElementFiles('p', 'el', 5, 10, KEY)).resolves.toEqual({ files: [1], total_count: 1 });
    expect(axios.get).toHaveBeenCalledWith(`${AL}/procedures/p/elements/el/files`, { params: { offset: 5, limit: 10 }, headers: { Authorization: KEY } });
  });
  it('getProcedureFiles', async () => {
    axios.get.mockResolvedValue({ data: [1], headers: { 'x-total-count': 1 } });
    await expect(node_funcs.getProcedureFiles('p', 5, 10, KEY)).resolves.toEqual({ files: [1], total_count: 1 });
    expect(axios.get).toHaveBeenCalledWith(`${AL}/procedures/p/files`, { params: { offset: 5, limit: 10 }, headers: { Authorization: KEY } });
  });
  it('getAllFilesExec', async () => {
    axios.get.mockResolvedValue({ data: [1], headers: { 'x-total-count': 1 } });
    await expect(node_funcs.getAllFilesExec('e', KEY, 5, 10)).resolves.toEqual({ files: [1], total_count: 1 });
    expect(axios.get).toHaveBeenCalledWith(`${AL}/executions/e/files`, { params: { offset: 5, limit: 10 }, headers: { Authorization: KEY } });
  });
  it('getFilesComment', async () => {
    axios.get.mockResolvedValue({ data: [1], headers: { 'x-total-count': 1 } });
    await expect(node_funcs.getFilesComment('e', 'el', 'c', 'cm', 5, 10, KEY)).resolves.toEqual({ files: [1], total_count: 1 });
    expect(axios.get).toHaveBeenCalledWith(`${AL}/executions/e/elements/el/conversations/c/comments/cm/files`, { params: { offset: 5, limit: 10 }, headers: { Authorization: KEY } });
  });
  it('getFilesProcedureComment', async () => {
    axios.get.mockResolvedValue({ data: [1], headers: { 'x-total-count': 1 } });
    await expect(node_funcs.getFilesProcedureComment('p', 'v', 'el', 'c', 'cm', 5, 10, KEY)).resolves.toEqual({ files: [1], total_count: 1 });
    expect(axios.get).toHaveBeenCalledWith(`${AL}/procedures/p/versions/v/elements/el/conversations/c/comments/cm/files`, { params: { offset: 5, limit: 10 }, headers: { Authorization: KEY } });
  });
});

describe('node_funcs version + element mutation helpers', () => {
  it('createProcedureVersion / updateVersion / updateVersionStatus', async () => {
    axios.post.mockResolvedValue({ data: { v: 1 } });
    await expect(node_funcs.createProcedureVersion('p', { m: 1 }, KEY)).resolves.toEqual({ v: 1 });
    expect(axios.post).toHaveBeenLastCalledWith(`${AL}/procedures/p/versions`, { m: 1 }, AUTH);
    axios.patch.mockResolvedValue({ data: { v: 2 } });
    await expect(node_funcs.updateVersion('p', 1, { m: 1 }, KEY)).resolves.toEqual({ v: 2 });
    expect(axios.patch).toHaveBeenLastCalledWith(`${AL}/procedures/p/versions/1`, { m: 1 }, AUTH);
    axios.post.mockResolvedValue({ data: { s: 1 } });
    await expect(node_funcs.updateVersionStatus('p', 1, { action: 'APPROVE' }, KEY)).resolves.toEqual({ s: 1 });
    expect(axios.post).toHaveBeenLastCalledWith(`${AL}/procedures/p/versions/1/status`, { action: 'APPROVE' }, AUTH);
  });
  it('createProcedureVersion rejects on error', async () => {
    axios.post.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.createProcedureVersion('p', {}, KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('removeVersion deletes with stringified version', async () => {
    axios.delete.mockResolvedValue({});
    await node_funcs.removeVersion('p', 2, KEY);
    expect(axios.delete).toHaveBeenCalledWith(`${AL}/procedures/p/versions/2`, AUTH);
    axios.delete.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.removeVersion('p', 2, KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('getExecutionOutline', async () => {
    axios.get.mockResolvedValue({ data: [1] });
    await expect(node_funcs.getExecutionOutline('e', KEY)).resolves.toEqual([1]);
    expect(axios.get).toHaveBeenCalledWith(`${AL}/executions/e/outline`, AUTH);
    axios.get.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.getExecutionOutline('e', KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('moveProcedureElement / copyProcedureElement', async () => {
    axios.post.mockResolvedValue({ data: { ok: 1 } });
    await expect(node_funcs.moveProcedureElement('p', { m: 1 }, KEY)).resolves.toEqual({ ok: 1 });
    expect(axios.post).toHaveBeenLastCalledWith(`${AL}/procedures/p/elements/move`, { m: 1 }, AUTH);
    await expect(node_funcs.copyProcedureElement('p', { c: 1 }, KEY)).resolves.toEqual({ ok: 1 });
    expect(axios.post).toHaveBeenLastCalledWith(`${AL}/procedures/p/elements/copy`, { c: 1 }, AUTH);
  });

  it('delete_element dispatches execution / procedure / rejects', async () => {
    axios.delete.mockResolvedValue({ data: { ok: 1 } });
    await expect(node_funcs.delete_element('e', null, 'el', KEY)).resolves.toEqual({ ok: 1 });
    expect(axios.delete).toHaveBeenLastCalledWith(`${AL}/executions/e/elements/el`, AUTH);
    await node_funcs.delete_element(null, 'p', 'el', KEY);
    expect(axios.delete).toHaveBeenLastCalledWith(`${AL}/procedures/p/elements/el`, AUTH);
    await expect(node_funcs.delete_element(null, null, 'el', KEY)).rejects.toBe('execution_id or procedure_id was not provided');
    axios.delete.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.delete_element('e', null, 'el', KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('replace_element', async () => {
    axios.post.mockResolvedValue({ data: { ok: 1 } });
    await expect(node_funcs.replace_element('p', 'el', { r: 1 }, KEY)).resolves.toEqual({ ok: 1 });
    expect(axios.post).toHaveBeenCalledWith(`${AL}/procedures/p/elements/el/replace`, { r: 1 }, AUTH);
    axios.post.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.replace_element('p', 'el', {}, KEY)).rejects.toHaveProperty('message', 'boom');
  });
});

describe('node_funcs element listing + structure + versions', () => {
  it('getAllSteps dispatches execution / procedure / rejects / error', async () => {
    axios.get.mockResolvedValue({ data: [1], headers: { 'x-total-count': 1 } });
    await expect(node_funcs.getAllSteps('e', null, { sort: 'ASC' }, KEY)).resolves.toEqual({ elems: [1], total_count: 1 });
    expect(axios.get).toHaveBeenLastCalledWith(`${AL}/executions/e/steps`, { params: { sort: 'ASC' }, headers: { Authorization: KEY } });
    await node_funcs.getAllSteps(null, 'p', {}, KEY);
    expect(axios.get).toHaveBeenLastCalledWith(`${AL}/procedures/p/steps`, { params: {}, headers: { Authorization: KEY } });
    await expect(node_funcs.getAllSteps(null, null, {}, KEY)).rejects.toBe('execution_id or procedure_id was not provided');
    axios.get.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.getAllSteps('e', null, {}, KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('getExecutionSimpleElements', async () => {
    axios.get.mockResolvedValue({ data: [1, 2] });
    await expect(node_funcs.getExecutionSimpleElements('e', KEY)).resolves.toEqual([1, 2]);
    expect(axios.get).toHaveBeenCalledWith(`${AL}/executions/e/simple_elements`, AUTH);
    axios.get.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.getExecutionSimpleElements('e', KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('getExecutionElements builds params + enriches non-script elems + error', async () => {
    axios.get.mockResolvedValue({ data: [{ step_type: 'CMD' }], headers: { 'x-total-count': 1 } });
    await expect(node_funcs.getExecutionElements('e', 'STEP', 'CMD', 0, 10, 'ASC', 'd', 'ON', 'OFF', 'OFF', 'OFF', KEY))
      .resolves.toEqual({ elems: [{ step_type: 'CMD' }], total_count: 1 });
    expect(axios.get).toHaveBeenLastCalledWith(`${AL}/executions/e/elements`, {
      params: { elem_type: 'STEP', step_type: 'CMD', offset: 0, limit: 10, sort: 'ASC', description: 'd', all_elements: 'ON', comment_filter: 'OFF', ar_comment_filter: 'OFF', dr_comment_filter: 'OFF' },
      headers: { Authorization: KEY }
    });
    axios.get.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.getExecutionElements('e', null, null, null, null, null, null, null, null, null, null, KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('getProcedureElements + getVersionElements (non-script)', async () => {
    axios.get.mockResolvedValue({ data: [{ step_type: 'CMD' }], headers: { 'x-total-count': 1 } });
    await expect(node_funcs.getProcedureElements('p', 'STEP', 'CMD', 0, 10, 'ASC', 'd', KEY)).resolves.toEqual({ elems: [{ step_type: 'CMD' }], total_count: 1 });
    expect(axios.get).toHaveBeenLastCalledWith(`${AL}/procedures/p/elements`, { params: { elem_type: 'STEP', step_type: 'CMD', offset: 0, limit: 10, sort: 'ASC', description: 'd' }, headers: { Authorization: KEY } });
    await expect(node_funcs.getVersionElements('p', 1, 'STEP', 'CMD', 0, 10, 'ASC', 'd', 'ON', 'OFF', KEY)).resolves.toEqual({ elems: [{ step_type: 'CMD' }], total_count: 1 });
    expect(axios.get).toHaveBeenLastCalledWith(`${AL}/procedures/p/versions/1/elements`, { params: { elem_type: 'STEP', step_type: 'CMD', offset: 0, limit: 10, sort: 'ASC', description: 'd', all_elements: 'ON', comment_filter: 'OFF' }, headers: { Authorization: KEY } });
  });

  it('getStructure with and without version', async () => {
    axios.get.mockResolvedValue({ data: { tree: 1 } });
    await expect(node_funcs.getStructure('p', 1, 10, 'ASC', 2, KEY)).resolves.toEqual({ tree: 1 });
    expect(axios.get).toHaveBeenLastCalledWith(`${AL}/procedures/p/versions/2/structure`, { params: { offset: 1, limit: 10, sort: 'ASC' }, headers: { Authorization: KEY } });
    await node_funcs.getStructure('p', 0, 0, 0, 0, KEY);
    expect(axios.get).toHaveBeenLastCalledWith(`${AL}/procedures/p/structure`, { params: {}, headers: { Authorization: KEY } });
    axios.get.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.getStructure('p', 0, 10, 'ASC', 1, KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('getVersions derives status for each version', async () => {
    axios.get.mockResolvedValue({ data: [{ version: 1 }], headers: { 'x-total-count': 1 } });
    const res = await node_funcs.getVersions('p', 5, 10, 'vd', 'va', 'RELEASED', 'ASC', 'irid', KEY);
    expect(res.total_count).toBe(1);
    expect(res.versions[0]).toHaveProperty('status', 'WORKING');
    expect(axios.get).toHaveBeenLastCalledWith(`${AL}/procedures/p/versions`, { params: { offset: 5, limit: 10, version_description: 'vd', version_author: 'va', status: 'RELEASED', sort: 'ASC', institutional_release_id: 'irid' }, headers: { Authorization: KEY } });
    axios.get.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.getVersions('p', 0, 0, null, null, undefined, null, null, KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('getProcedureOutline with and without tag_ids', async () => {
    axios.get.mockResolvedValue({ data: [1] });
    await expect(node_funcs.getProcedureOutline('p', 1, 't1,t2', KEY)).resolves.toEqual([1]);
    expect(axios.get).toHaveBeenLastCalledWith(`${AL}/procedures/p/versions/1/outline`, { headers: { Authorization: KEY }, params: { tag_ids: 't1,t2' } });
    await node_funcs.getProcedureOutline('p', 1, null, KEY);
    expect(axios.get).toHaveBeenLastCalledWith(`${AL}/procedures/p/versions/1/outline`, { headers: { Authorization: KEY } });
    axios.get.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.getProcedureOutline('p', 1, null, KEY)).rejects.toHaveProperty('message', 'boom');
  });
});

describe('node_funcs enrichWithDictionaryConsistency (via getExecutionElements)', () => {
  function scriptElem(input) {
    return { step_type: 'CUSTOM_SCRIPT', elem_id: 's', execution_user_input: input };
  }
  async function run(elem, paletteData, dictData) {
    axios.get.mockResolvedValue({ data: [elem], headers: { 'x-total-count': 1 } });
    axios.post
      .mockResolvedValueOnce({ data: paletteData })   // step_palette bulk_query
      .mockResolvedValueOnce({ data: dictData });      // custom_scripts bulk_query
    const res = await node_funcs.getExecutionElements('e', null, null, null, null, null, null, null, null, null, null, KEY);
    return res.elems[0];
  }

  it('flags CONSISTENT when spec hashes match and script is present', async () => {
    const out = await run(scriptElem({ script_id: 's1', spec_hash: 'h1' }), [{ step_id: 's1' }], [{ script_id: 's1', spec_hash: 'h1' }]);
    expect(out.consistency_flag).toBe('CONSISTENT');
    expect(axios.post).toHaveBeenCalledWith(`${DL}/step_palette/custom/bulk_query`, ['s1'], AUTH);
    expect(axios.post).toHaveBeenCalledWith(`${DL}/custom_scripts/bulk_query`, ['s1'], AUTH);
  });
  it('flags LEGACY when the element has no spec_hash', async () => {
    const out = await run(scriptElem({ script_id: 's1' }), [{ step_id: 's1' }], [{ script_id: 's1', spec_hash: 'h1' }]);
    expect(out.consistency_flag).toBe('LEGACY');
  });
  it('flags DELETED when the script is missing from the dictionary', async () => {
    const out = await run(scriptElem({ script_id: 's1', spec_hash: 'h1' }), [], []);
    expect(out.consistency_flag).toBe('DELETED');
  });
  it('flags SPEC_HASH_MISMATCHED when hashes differ', async () => {
    const out = await run(scriptElem({ script_id: 's1', spec_hash: 'h1' }), [{ step_id: 's1' }], [{ script_id: 's1', spec_hash: 'h2' }]);
    expect(out.consistency_flag).toBe('SPEC_HASH_MISMATCHED');
  });
  it('remains CONSISTENT even if absent from palette (step_display_name is not propagated by getScriptInfo)', async () => {
    // NOTE: the MISSING_IN_PALLETTE branch is currently unreachable because
    // getScriptInfo only forwards script_id/spec_hash (not step_display_name).
    const out = await run({ step_type: 'CUSTOM_SCRIPT', elem_id: 's', execution_user_input: { script_id: 's1', spec_hash: 'h1', step_display_name: 'Foo' } }, [], [{ script_id: 's1', spec_hash: 'h1' }]);
    expect(out.consistency_flag).toBe('CONSISTENT');
  });
  it('returns elements unchanged when the dictionary service errors', async () => {
    axios.get.mockResolvedValue({ data: [scriptElem({ script_id: 's1', spec_hash: 'h1' })], headers: {} });
    axios.post.mockRejectedValue(new Error('dict down'));
    const res = await node_funcs.getExecutionElements('e', null, null, null, null, null, null, null, null, null, null, KEY);
    expect(res.elems[0].consistency_flag).toBeUndefined();
  });
  it('skips enrichment when there are no CUSTOM_SCRIPT steps', async () => {
    axios.get.mockResolvedValue({ data: [{ step_type: 'CMD' }], headers: {} });
    const res = await node_funcs.getExecutionElements('e', null, null, null, null, null, null, null, null, null, null, KEY);
    expect(res.elems).toEqual([{ step_type: 'CMD' }]);
    expect(axios.post).not.toHaveBeenCalled();
  });
  it('uses authoring_user_input for script info when execution input lacks it', async () => {
    const elem = { step_type: 'CUSTOM_SCRIPT', elem_id: 's', authoring_user_input: { script_id: 's1', spec_hash: 'h1' } };
    axios.get.mockResolvedValue({ data: [elem], headers: {} });
    axios.post.mockResolvedValueOnce({ data: [{ step_id: 's1' }] }).mockResolvedValueOnce({ data: [{ script_id: 's1', spec_hash: 'h1' }] });
    const res = await node_funcs.getExecutionElements('e', null, null, null, null, null, null, null, null, null, null, KEY);
    expect(res.elems[0].consistency_flag).toBe('CONSISTENT');
  });
  it('ignores CUSTOM_SCRIPT steps without any script info', async () => {
    const elem = { step_type: 'CUSTOM_SCRIPT', elem_id: 's', execution_user_input: {} };
    axios.get.mockResolvedValue({ data: [elem], headers: {} });
    const res = await node_funcs.getExecutionElements('e', null, null, null, null, null, null, null, null, null, null, KEY);
    expect(res.elems[0].consistency_flag).toBeUndefined();
    expect(axios.post).not.toHaveBeenCalled();
  });
});

describe('node_funcs search helpers', () => {
  it('searchExecution rejects when search_for is missing', async () => {
    await expect(node_funcs.searchExecution('e', {}, KEY)).rejects.toBe('search_for was not provided');
  });
  it('searchExecution returns an empty result set for no elements', async () => {
    axios.get.mockResolvedValue({ data: [], headers: {} });
    const res = await node_funcs.searchExecution('e', { search_for: 'Hello' }, KEY);
    expect(res).toEqual(expect.objectContaining({ search_for: 'Hello', match_case: false, match_whole_word: false, matches: [], total_count: 0 }));
  });
  it('searchExecution finds a match in a searchable field', async () => {
    axios.get.mockResolvedValue({ data: [{ elem_id: 'e1', number: '1', title: 'Hello World', elem_type: 'STEP', step_type: 'CMD' }], headers: {} });
    const res = await node_funcs.searchExecution('e', { search_for: 'Hello' }, KEY);
    expect(res.total_count).toBeGreaterThanOrEqual(1);
    expect(res.matches[0]).toEqual(expect.objectContaining({ elem_id: 'e1', field_path: 'title' }));
  });
  it('searchExecution honors step_type + window filters (no match outside window)', async () => {
    axios.get.mockResolvedValue({ data: [{ elem_id: 'e1', number: '1', title: 'Hello', elem_type: 'STEP', step_type: 'CMD' }], headers: {} });
    const res = await node_funcs.searchExecution('e', { search_for: 'Hello', step_type_filters: ['MANUAL'], start_elem_id: 'zzz', end_elem_id: 'yyy' }, KEY);
    expect(res.total_count).toBe(0);
  });

  it('searchProcedureVersion rejects when search_for is missing', async () => {
    await expect(node_funcs.searchProcedureVersion('p', 0, {}, KEY)).rejects.toBe('search_for was not provided');
  });
  it('searchProcedureVersion returns an empty result set for no elements', async () => {
    axios.get.mockResolvedValue({ data: [], headers: {} });
    const res = await node_funcs.searchProcedureVersion('p', 0, { search_for: 'Hello' }, KEY);
    expect(res).toEqual(expect.objectContaining({ search_for: 'Hello', matches: [], total_count: 0 }));
  });
  it('searchProcedureVersion finds a replaceable match on the working version (version 0)', async () => {
    axios.get.mockResolvedValue({ data: [{ elem_id: 'e1', number: '1', title: 'Hello World', elem_type: 'STEP', step_type: 'CMD' }], headers: {} });
    const res = await node_funcs.searchProcedureVersion('p', 0, { search_for: 'Hello' }, KEY);
    expect(res.total_count).toBeGreaterThanOrEqual(1);
    expect(res.matches[0]).toEqual(expect.objectContaining({ elem_id: 'e1', field_path: 'title', replaceable: true }));
  });
});

describe('node_funcs file upload helpers (S3 + archive)', () => {
  const FB = { buffer: 'bytes' };

  it('writeFile uploads to S3 then posts metadata (element + execution + neither)', async () => {
    axios.post.mockResolvedValue({ data: { id: 'f1' } });
    await expect(node_funcs.writeFile('f.txt', FB, 'e', 'el', KEY)).resolves.toEqual({ id: 'f1' });
    expect(s3.putObject).toHaveBeenCalled();
    expect(axios.post).toHaveBeenLastCalledWith(`${AL}/executions/e/elements/el/files`, expect.objectContaining({ file_name: 'f.txt', url: expect.any(String) }), AUTH);

    await node_funcs.writeFile('f.txt', FB, 'e', undefined, KEY);
    expect(axios.post).toHaveBeenLastCalledWith(`${AL}/executions/e/files`, expect.objectContaining({ file_name: 'f.txt' }), AUTH);

    await expect(node_funcs.writeFile('f.txt', FB, undefined, undefined, KEY)).rejects.toHaveProperty('message', 'execution_id or elem_id was not provided');
  });

  it('writeFile rejects when the archive call fails', async () => {
    axios.post.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.writeFile('f.txt', FB, 'e', 'el', KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('writeFile rejects when the S3 upload fails', async () => {
    s3.putObject.mockImplementation((params, cb) => cb(new Error('s3 down')));
    await expect(node_funcs.writeFile('f.txt', FB, 'e', 'el', KEY)).rejects.toHaveProperty('message', expect.stringMatching(/Failed to upload file/));
  });

  it('procedureWriteFile uploads then posts (element + procedure + neither)', async () => {
    axios.post.mockResolvedValue({ data: { id: 'f1' } });
    await expect(node_funcs.procedureWriteFile('f.txt', FB, 'p', '0', 'el', KEY)).resolves.toEqual({ id: 'f1' });
    expect(axios.post).toHaveBeenLastCalledWith(`${AL}/procedures/p/elements/el/files`, expect.objectContaining({ file_name: 'f.txt' }), AUTH);
    await node_funcs.procedureWriteFile('f.txt', FB, 'p', '0', null, KEY);
    expect(axios.post).toHaveBeenLastCalledWith(`${AL}/procedures/p/files`, expect.objectContaining({ file_name: 'f.txt' }), AUTH);
    await expect(node_funcs.procedureWriteFile('f.txt', FB, null, '0', null, KEY)).rejects.toHaveProperty('message', 'procedure_id or elem_id was not provided');
  });

  it('writeFileComment posts to the comment files endpoint', async () => {
    axios.post.mockResolvedValue({ data: { id: 'f1' } });
    await expect(node_funcs.writeFileComment('f.txt', FB, 'e', 'el', 'c', 'cm', KEY)).resolves.toEqual({ id: 'f1' });
    expect(axios.post).toHaveBeenLastCalledWith(`${AL}/executions/e/elements/el/conversations/c/comments/cm/files`, expect.objectContaining({ file_name: 'f.txt' }), AUTH);
    axios.post.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.writeFileComment('f.txt', FB, 'e', 'el', 'c', 'cm', KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('writeFileProcedureComment posts to the procedure comment files endpoint', async () => {
    axios.post.mockResolvedValue({ data: { id: 'f1' } });
    await expect(node_funcs.writeFileProcedureComment('f.txt', FB, 'p', 'v', 'el', 'c', 'cm', KEY)).resolves.toEqual({ id: 'f1' });
    expect(axios.post).toHaveBeenLastCalledWith(`${AL}/procedures/p/versions/v/elements/el/conversations/c/comments/cm/files`, expect.objectContaining({ file_name: 'f.txt' }), AUTH);
    axios.post.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.writeFileProcedureComment('f.txt', FB, 'p', 'v', 'el', 'c', 'cm', KEY)).rejects.toHaveProperty('message', 'boom');
  });
});

describe('node_funcs execution engine helpers', () => {
  it('halt_execution posts halt then sets status IDLE', async () => {
    axios.post.mockResolvedValue({});
    axios.patch.mockResolvedValue({ data: { status: 'IDLE' } });
    await expect(node_funcs.halt_execution('e', KEY)).resolves.toEqual({ status: 'IDLE' });
    expect(axios.post).toHaveBeenCalledWith(`${EL2}/executions/e/halt`, {}, expect.objectContaining({ timeout: 5000 }));
    expect(axios.patch).toHaveBeenCalledWith(`${AL}/executions/e`, { status: 'IDLE' }, AUTH);
  });
  it('halt_execution tolerates a 404 from the execution service', async () => {
    axios.post.mockRejectedValue({ response: { status: 404 } });
    axios.patch.mockResolvedValue({ data: { status: 'IDLE' } });
    await expect(node_funcs.halt_execution('e', KEY)).resolves.toEqual({ status: 'IDLE' });
  });
  it('halt_execution tolerates a non-404 error and a failed status update', async () => {
    axios.post.mockRejectedValue(new Error('down'));
    axios.patch.mockRejectedValue(new Error('patchfail'));
    await expect(node_funcs.halt_execution('e', KEY)).resolves.toEqual({});
  });

  it('pause_execution pauses only when RUNNING', async () => {
    axios.get.mockResolvedValue({ data: { status: 'RUNNING' } });
    axios.patch.mockResolvedValue({ data: { status: 'PAUSED' } });
    await expect(node_funcs.pause_execution('e', KEY)).resolves.toEqual({ status: 'PAUSED' });
    expect(axios.patch).toHaveBeenCalledWith(`${AL}/executions/e`, { status: 'PAUSED' }, AUTH);
  });
  it('pause_execution is a no-op when not RUNNING', async () => {
    axios.get.mockResolvedValue({ data: { status: 'IDLE' } });
    await expect(node_funcs.pause_execution('e', KEY)).resolves.toEqual({ status: 'IDLE' });
    expect(axios.patch).not.toHaveBeenCalled();
  });

  describe('continue_execution', () => {
    it('continues when the caller is the test conductor', async () => {
      jwt.verify.mockReturnValue({ username: 'alice' });
      axios.get
        .mockResolvedValueOnce({ data: { venue_id: 'v' } })   // getExecution
        .mockResolvedValueOnce({ data: { test_conductor: 'alice' } }) // getVenueStatus
        .mockResolvedValueOnce({ data: { venue: 1 } });        // venue info
      axios.put.mockResolvedValue({ data: {} });
      await node_funcs.continue_execution('e', KEY);
      expect(axios.put).toHaveBeenCalledWith(`${EL2}/executions/e`, { venue: 1 }, AUTH);
    });
    it('rejects when the caller is not the test conductor', async () => {
      jwt.verify.mockReturnValue({ username: 'bob' });
      axios.get
        .mockResolvedValueOnce({ data: { venue_id: 'v' } })
        .mockResolvedValueOnce({ data: { test_conductor: 'alice' } });
      await expect(node_funcs.continue_execution('e', KEY)).rejects.toHaveProperty('http_code_at_source', 403);
    });
  });

  describe('runExecution', () => {
    it('rejects when the execution is not IDLE', async () => {
      axios.get.mockResolvedValue({ data: { status: 'RUNNING' } });
      await expect(node_funcs.runExecution('e', '', 'STEP', KEY)).rejects.toMatch(/not idle/);
    });
    it('rejects when the execution is not found', async () => {
      axios.get.mockResolvedValue({ data: null });
      await expect(node_funcs.runExecution('e', '', 'STEP', KEY)).rejects.toMatch(/not found/);
    });
    it('runs the current step when the caller is the test conductor', async () => {
      jwt.verify.mockReturnValue({ username: 'alice' });
      axios.get
        .mockResolvedValueOnce({ data: { status: 'IDLE', current_step_id: 's1', venue_id: 'v' } }) // getExecution
        .mockResolvedValueOnce({ data: { test_conductor: 'alice' } });                              // getVenueStatus
      axios.post.mockResolvedValue({ status: 200, data: { ran: 1 } });                              // runStep (execution service)
      await expect(node_funcs.runExecution('e', '', 'STEP', KEY)).resolves.toEqual({ ran: 1 });
      expect(axios.post).toHaveBeenCalledWith(`${EL2}/executions/e/run`, null, expect.objectContaining({ params: { run_mode: 'STEP', elem_id: 's1' } }));
    });
    it('resets status to IDLE and rejects when the caller is not the test conductor', async () => {
      jwt.verify.mockReturnValue({ username: 'bob' });
      axios.get
        .mockResolvedValueOnce({ data: { status: 'IDLE', current_step_id: 's1', venue_id: 'v' } })
        .mockResolvedValueOnce({ data: { test_conductor: 'alice' } });
      axios.patch.mockResolvedValue({ data: {} }); // update_execution_rest
      await expect(node_funcs.runExecution('e', '', 'STEP', KEY)).rejects.toHaveProperty('message', expect.stringMatching(/not the current test conductor/));
      expect(axios.patch).toHaveBeenCalled();
    });
    it('runStep returns {} on a 202 accepted response', async () => {
      jwt.verify.mockReturnValue({ username: 'alice' });
      axios.get
        .mockResolvedValueOnce({ data: { status: 'IDLE', current_step_id: 's1', venue_id: 'v' } })
        .mockResolvedValueOnce({ data: { test_conductor: 'alice' } });
      axios.post.mockResolvedValue({ status: 202 });
      axios.patch.mockResolvedValue({ data: {} });
      await expect(node_funcs.runExecution('e', '', 'STEP', KEY)).resolves.toEqual({});
    });
  });

  it('update_execution_rest patches the local REST endpoint', async () => {
    axios.patch.mockResolvedValue({ data: { status: 'IDLE' } });
    await expect(node_funcs.update_execution_rest('e', { status: 'IDLE' }, KEY)).resolves.toEqual({ status: 'IDLE' });
    axios.patch.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.update_execution_rest('e', {}, KEY)).rejects.toHaveProperty('message', 'boom');
  });
});

describe('node_funcs getVIs aggregation', () => {
  function viStep(vis) {
    return { elem_id: 'vi', step_type: 'VERIFICATION_ITEM', execution_user_input: { vis } };
  }
  function viStatusStep(id, status, viNames) {
    return {
      elem_id: id,
      step_type: 'VERIFICATION_ITEM_STATUS',
      execution: { meta_data: { status }, results: { vis: viNames.map((n) => ({ vi_name: n })) } }
    };
  }
  function mockElems(elems) {
    axios.get.mockResolvedValue({ data: elems, headers: { 'x-total-count': elems.length } });
  }

  it('marks a VI UNKNOWN when there are no status steps', async () => {
    mockElems([viStep([{ vi_name: 'A', vi_id: 'a1' }])]);
    const vis = await node_funcs.getVIs('e', null, KEY);
    expect(vis).toContainEqual({ vi_name: 'A', vi_id: 'a1', vi_status_step_ids: [], status: 'UNKNOWN' });
  });
  it('marks a VI PASS when all status steps pass', async () => {
    mockElems([viStep([{ vi_name: 'A', vi_id: 'a1' }]), viStatusStep('s1', 'PASS', ['A'])]);
    const vis = await node_funcs.getVIs('e', null, KEY);
    expect(vis).toContainEqual({ vi_name: 'A', vi_id: 'a1', vi_status_step_ids: ['s1'], status: 'PASS' });
  });
  it('marks a VI FAIL when all status steps fail', async () => {
    mockElems([viStep([{ vi_name: 'A', vi_id: 'a1' }]), viStatusStep('s1', 'FAIL', ['A'])]);
    const vis = await node_funcs.getVIs('e', null, KEY);
    expect(vis[0].status).toBe('FAIL');
  });
  it('marks a VI UNKNOWN on mixed pass/fail results', async () => {
    mockElems([viStep([{ vi_name: 'A', vi_id: 'a1' }]), viStatusStep('s1', 'PASS', ['A']), viStatusStep('s2', 'FAIL', ['A'])]);
    const vis = await node_funcs.getVIs('e', null, KEY);
    expect(vis[0].status).toBe('UNKNOWN');
    expect(vis[0].vi_status_step_ids).toEqual(['s1', 's2']);
  });
  it('applies a status filter', async () => {
    mockElems([viStep([{ vi_name: 'A', vi_id: 'a1' }, { vi_name: 'B', vi_id: 'b1' }]), viStatusStep('s1', 'PASS', ['A']), viStatusStep('s2', 'FAIL', ['B'])]);
    const vis = await node_funcs.getVIs('e', 'PASS', KEY);
    expect(vis).toEqual([{ vi_name: 'A', vi_id: 'a1', vi_status_step_ids: ['s1'], status: 'PASS' }]);
  });
});

describe('node_funcs import_procedure_section', () => {
  it('imports and enriches the returned elements', async () => {
    axios.get
      .mockResolvedValueOnce({ data: { execution_user_input: { reference_procedure_id: 'p', reference_procedure_version: 0, elements: [] } } }) // getExecutionElement
      .mockResolvedValueOnce({ data: [], headers: {} }); // getVersionElements
    axios.post.mockResolvedValue({ data: [{ step_type: 'CMD' }] });
    await expect(node_funcs.import_procedure_section('e', 'el', KEY)).resolves.toEqual([{ step_type: 'CMD' }]);
    expect(axios.post).toHaveBeenCalledWith(`${AL}/executions/e/procedure_sections/el/import`, {}, AUTH);
  });
  it('rejects when the reference procedure_id is missing', async () => {
    axios.get.mockResolvedValueOnce({ data: { execution_user_input: {} } });
    await expect(node_funcs.import_procedure_section('e', 'el', KEY)).rejects.toMatch(/procedure_id was not provided/);
  });
  it('rejects when a selected element is absent from the source procedure', async () => {
    axios.get
      .mockResolvedValueOnce({ data: { execution_user_input: { reference_procedure_id: 'p', reference_procedure_version: 0, elements: [{ elem_id: 'x', elem_type: 'STEP', selected: true, number: '1', title: 't', tag_ids: [] }] } } })
      .mockResolvedValueOnce({ data: [], headers: {} });
    await expect(node_funcs.import_procedure_section('e', 'el', KEY)).rejects.toMatch(/does not exist in procedure/);
  });
  it('rejects with a transformed error when the import call fails', async () => {
    axios.get
      .mockResolvedValueOnce({ data: { execution_user_input: { reference_procedure_id: 'p', reference_procedure_version: 0, elements: [] } } })
      .mockResolvedValueOnce({ data: [], headers: {} });
    axios.post.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.import_procedure_section('e', 'el', KEY)).rejects.toHaveProperty('message', 'boom');
  });
});

describe('node_funcs create + compute + refresh', () => {
  it('createExecution orchestrates archive + execution service + venue status', async () => {
    jwt.verify.mockReturnValue({ username: 'alice' });
    axios.get.mockResolvedValue({ data: { venue: 1 } });                       // get venue
    axios.post.mockResolvedValue({ data: { execution_id: 'e1', time_started: 't' } }); // create execution
    axios.put.mockResolvedValue({ data: {} });                                // execution service
    axios.patch.mockResolvedValue({ data: {} });                              // venue status
    await expect(node_funcs.createExecution({ venue_id: 'v' }, KEY)).resolves.toEqual({ execution_id: 'e1', time_started: 't' });
    expect(axios.post).toHaveBeenCalledWith(`${AL}/executions`, expect.objectContaining({ venue_id: 'v', test_conductors: ['alice'] }), AUTH);
    expect(axios.put).toHaveBeenCalledWith(`${EL2}/executions/e1`, { venue: 1 }, AUTH);
    expect(axios.patch).toHaveBeenCalledWith(`${AL}/venues/v/status`, expect.objectContaining({ status: 'IN_USE', test_conductor: 'alice', execution_id: 'e1' }), AUTH);
  });
  it('createExecution rejects when the venue lookup fails', async () => {
    jwt.verify.mockReturnValue({ username: 'alice' });
    axios.get.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.createExecution({ venue_id: 'v' }, KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('createProcedure stamps the author and posts', async () => {
    jwt.verify.mockReturnValue({ username: 'alice' });
    axios.post.mockResolvedValue({ data: { procedure_id: 'p1' } });
    await expect(node_funcs.createProcedure({ title: 't' }, KEY)).resolves.toEqual({ procedure_id: 'p1' });
    expect(axios.post).toHaveBeenCalledWith(`${AL}/procedures`, expect.objectContaining({ title: 't', author: 'alice' }), AUTH);
    axios.post.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.createProcedure({}, KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('refresh_execution recomputes VI status steps then bulk-updates', async () => {
    jwt.verify.mockReturnValue({ username: 'alice' });
    axios.get.mockResolvedValue({ data: [{ elem_id: 'e1', step_type: 'STEP' }], headers: {} });
    axios.patch.mockResolvedValue({ data: { ok: 1 } });
    await expect(node_funcs.refresh_execution('e', KEY)).resolves.toEqual({ ok: 1 });
    expect(axios.patch).toHaveBeenCalledWith(`${AL}/executions/e/elements`, [], AUTH);
  });

  it('compute_execution_element rejects when the element is not found', async () => {
    jwt.verify.mockReturnValue({ username: 'alice' });
    axios.get.mockResolvedValue({ data: [{ elem_id: 'other', step_type: 'STEP' }], headers: {} });
    await expect(node_funcs.compute_execution_element('e', 'el', KEY)).rejects.toMatch(/was not found/);
  });
  it('compute_procedure_element rejects when the element is not found', async () => {
    axios.get.mockResolvedValue({ data: [{ elem_id: 'other', step_type: 'STEP' }], headers: {} });
    await expect(node_funcs.compute_procedure_element('p', 'el', KEY)).rejects.toMatch(/was not found/);
  });

  it('remove_break_points clears all break points and returns the updated set', async () => {
    jwt.verify.mockReturnValue({ username: 'alice' });
    axios.get.mockResolvedValue({ data: [{ elem_id: 'e1', break_point: 'ON' }], headers: {} });
    axios.patch.mockResolvedValue({ data: [{ elem_id: 'e1', break_point: 'NONE' }] });
    await expect(node_funcs.remove_break_points('e', KEY)).resolves.toEqual([{ elem_id: 'e1', break_point: 'NONE' }]);
    expect(axios.patch).toHaveBeenCalledWith(`${AL}/executions/e/elements`, [{ elem_id: 'e1', break_point: 'NONE' }], AUTH);
  });
});

describe('node_funcs step override lifecycle', () => {
  it('override_step flips PASS to OVERRIDE_FAIL for an executed step', async () => {
    jwt.verify.mockReturnValue({ username: 'alice' });
    axios.get.mockResolvedValue({ data: { number: '1', executable: 'EXECUTED', execution: { meta_data: { status: 'PASS' } } } });
    axios.patch.mockResolvedValue({ data: { ok: 1 } });
    await expect(node_funcs.override_step('e', 'el', { override_justification: 'why' }, KEY)).resolves.toEqual({ ok: 1 });
    expect(axios.patch).toHaveBeenCalledWith(`${AL}/executions/e/steps/el`, expect.objectContaining({ execution: expect.any(Object) }), AUTH);
  });
  it('override_step rejects a non PASS/FAIL status', async () => {
    axios.get.mockResolvedValue({ data: { number: '1', execution: { meta_data: { status: 'RUNNING' } } } });
    await expect(node_funcs.override_step('e', 'el', {}, KEY)).rejects.toMatch(/not PASS or FAIL/);
  });
  it('override_step rejects a non-executable step', async () => {
    axios.get.mockResolvedValue({ data: { number: '1', executable: 'PENDING', execution: { meta_data: { status: 'PASS' } } } });
    await expect(node_funcs.override_step('e', 'el', {}, KEY)).rejects.toMatch(/non-executable/);
  });

  it('update_override_step updates an overridden step', async () => {
    axios.get.mockResolvedValue({ data: { number: '1', execution: { meta_data: { status: 'OVERRIDE_PASS' } } } });
    axios.patch.mockResolvedValue({ data: { ok: 1 } });
    await expect(node_funcs.update_override_step('e', 'el', { override_justification: 'x' }, KEY)).resolves.toEqual({ ok: 1 });
  });
  it('update_override_step rejects a step that was not overridden', async () => {
    axios.get.mockResolvedValue({ data: { number: '1', execution: { meta_data: { status: 'PASS' } } } });
    await expect(node_funcs.update_override_step('e', 'el', {}, KEY)).rejects.toMatch(/has not been overriden/);
  });

  it('discard_override_step reverts OVERRIDE_FAIL to PASS and OVERRIDE_PASS to FAIL', async () => {
    axios.patch.mockResolvedValue({ data: { ok: 1 } });
    axios.get.mockResolvedValue({ data: { number: '1', execution: { meta_data: { status: 'OVERRIDE_FAIL' } } } });
    await expect(node_funcs.discard_override_step('e', 'el', KEY)).resolves.toEqual({ ok: 1 });
    axios.get.mockResolvedValue({ data: { number: '1', execution: { meta_data: { status: 'OVERRIDE_PASS' } } } });
    await expect(node_funcs.discard_override_step('e', 'el', KEY)).resolves.toEqual({ ok: 1 });
  });
  it('discard_override_step rejects a step that was not overridden', async () => {
    axios.get.mockResolvedValue({ data: { number: '1', execution: { meta_data: { status: 'PASS' } } } });
    await expect(node_funcs.discard_override_step('e', 'el', KEY)).rejects.toMatch(/was not overriden/);
  });
});

describe('node_funcs input-validation guards', () => {
  it('replaceProcedure rejects when search_for is missing', async () => {
    await expect(node_funcs.replaceProcedure('p', {}, KEY)).rejects.toBe('search_for was not provided');
  });
  it('importExecution rejects when no file is provided', async () => {
    await expect(node_funcs.importExecution(null, KEY)).rejects.toBe('execution_file was not provided');
  });
  it('importProcedureVersions rejects when no file is provided', async () => {
    await expect(node_funcs.importProcedureVersions(null, KEY)).rejects.toBe('procedure_versions_file was not provided');
  });
  it('suspend_resume_execution rejects when target_execution_id is missing', async () => {
    await expect(node_funcs.suspend_resume_execution('e', {}, KEY)).rejects.toMatch(/Target execution id was not provided/);
  });
  it('updateExecutionStatus rejects reopening a closed execution', async () => {
    axios.get.mockResolvedValue({ data: { status: 'CLOSED', venue_id: 'v' } });
    await expect(node_funcs.updateExecutionStatus('e', { status: 'IDLE' }, KEY)).rejects.toMatch(/has been closed/);
  });
});

describe('node_funcs step/element update dispatchers', () => {
  it('updateStep dispatches execution / procedure / rejects', async () => {
    axios.patch.mockResolvedValue({ data: { ok: 1 } });
    await expect(node_funcs.updateStep('e', null, 'el', { s: 1 }, KEY)).resolves.toEqual({ ok: 1 });
    expect(axios.patch).toHaveBeenLastCalledWith(`${AL}/executions/e/steps/el`, expect.any(Object), AUTH);
    await node_funcs.updateStep(null, 'p', 'el', { s: 1 }, KEY);
    expect(axios.patch).toHaveBeenLastCalledWith(`${AL}/procedures/p/steps/el`, expect.any(Object), AUTH);
    await expect(node_funcs.updateStep(null, null, 'el', {}, KEY)).rejects.toMatch(/was not provided/);
    axios.patch.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.updateStep('e', null, 'el', {}, KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('updateElement dispatches execution / procedure / rejects', async () => {
    axios.patch.mockResolvedValue({ data: { ok: 1 } });
    await expect(node_funcs.updateElement('e', null, 'el', { s: 1 }, KEY)).resolves.toEqual({ ok: 1 });
    expect(axios.patch).toHaveBeenLastCalledWith(`${AL}/executions/e/elements/el`, expect.any(Object), AUTH);
    await node_funcs.updateElement(null, 'p', 'el', { s: 1 }, KEY);
    expect(axios.patch).toHaveBeenLastCalledWith(`${AL}/procedures/p/elements/el`, expect.any(Object), AUTH);
    await expect(node_funcs.updateElement(null, null, 'el', {}, KEY)).rejects.toMatch(/was not provided/);
  });

  it('updateElements dispatches execution / procedure / rejects', async () => {
    axios.patch.mockResolvedValue({ data: { ok: 1 } });
    await expect(node_funcs.updateElements('e', null, [{ s: 1 }], KEY)).resolves.toEqual({ ok: 1 });
    expect(axios.patch).toHaveBeenLastCalledWith(`${AL}/executions/e/elements`, [{ s: 1 }], AUTH);
    await node_funcs.updateElements(null, 'p', [{ s: 1 }], KEY);
    expect(axios.patch).toHaveBeenLastCalledWith(`${AL}/procedures/p/elements`, [{ s: 1 }], expect.objectContaining({ maxContentLength: expect.any(Number) }));
    await expect(node_funcs.updateElements(null, null, [], KEY)).rejects.toMatch(/was not provided/);
  });

  it('modifyElement posts and enriches an embedded element', async () => {
    axios.post.mockResolvedValue({ data: { elem: { step_type: 'CMD' } } });
    await expect(node_funcs.modifyElement('e', 'el', KEY)).resolves.toEqual({ elem: { step_type: 'CMD' } });
    expect(axios.post).toHaveBeenCalledWith(`${AL}/executions/e/elements/el/modify`, {}, AUTH);
    axios.post.mockResolvedValue({ data: { no_elem: 1 } });
    await expect(node_funcs.modifyElement('e', 'el', KEY)).resolves.toEqual({ no_elem: 1 });
    axios.post.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.modifyElement('e', 'el', KEY)).rejects.toHaveProperty('message', 'boom');
  });
});

describe('node_funcs redline justify/approve/discard', () => {
  const ACTIVE = { elem_id: 'el', procedure_modification_status: 'MODIFYING' };
  const INACTIVE = { elem_id: 'el', procedure_modification_status: 'NONE' };

  beforeEach(() => {
    jwt.verify.mockReturnValue({ username: 'alice' });
  });

  it('justifyElement patches an active redline and returns the enriched element', async () => {
    axios.get.mockResolvedValue({ data: ACTIVE });        // getExecutionElement
    axios.patch.mockResolvedValue({ data: { step_type: 'CMD', elem_id: 'el' } });
    await expect(node_funcs.justifyElement('e', 'el', { modification_type: 'EDIT', content: 'c' }, KEY)).resolves.toEqual({ step_type: 'CMD', elem_id: 'el' });
    expect(axios.patch).toHaveBeenCalledWith(`${AL}/executions/e/elements/el`, expect.objectContaining({ procedure_modification: expect.any(Object) }), AUTH);
  });
  it('justifyElement rejects an inactive redline', async () => {
    axios.get.mockResolvedValue({ data: INACTIVE });
    await expect(node_funcs.justifyElement('e', 'el', {}, KEY)).rejects.toMatch(/inactive redline/);
  });

  it('justifyElements patches active redlines in bulk', async () => {
    axios.get.mockResolvedValue({ data: [ACTIVE] });      // getExecutionSimpleElements
    axios.patch.mockResolvedValue({ data: [{ step_type: 'CMD' }] });
    await expect(node_funcs.justifyElements('e', ['el'], { content: 'c' }, KEY)).resolves.toEqual([{ step_type: 'CMD' }]);
    expect(axios.patch).toHaveBeenCalledWith(`${AL}/executions/e/elements`, expect.any(Array), AUTH);
  });
  it('justifyElements rejects when a targeted element is inactive', async () => {
    axios.get.mockResolvedValue({ data: [INACTIVE] });
    await expect(node_funcs.justifyElements('e', ['el'], {}, KEY)).rejects.toMatch(/inactive redline/);
  });

  it('approveElement patches an active redline', async () => {
    axios.get.mockResolvedValue({ data: ACTIVE });
    axios.patch.mockResolvedValue({ data: { ok: 1 } });
    await expect(node_funcs.approveElement('e', 'el', { status: 'APPROVED', content: 'c' }, KEY)).resolves.toEqual({ ok: 1 });
  });
  it('approveElement rejects an inactive redline', async () => {
    axios.get.mockResolvedValue({ data: INACTIVE });
    await expect(node_funcs.approveElement('e', 'el', {}, KEY)).rejects.toMatch(/inactive redline/);
  });
  it('approveElements patches active redlines in bulk', async () => {
    axios.get.mockResolvedValue({ data: [ACTIVE] });
    axios.patch.mockResolvedValue({ data: [{ ok: 1 }] });
    await expect(node_funcs.approveElements('e', ['el'], { status: 'APPROVED' }, KEY)).resolves.toEqual([{ ok: 1 }]);
  });

  it('discardElement posts to the discard endpoint for an active redline', async () => {
    axios.get.mockResolvedValue({ data: ACTIVE });
    axios.post.mockResolvedValue({ data: { ok: 1 } });
    await expect(node_funcs.discardElement('e', 'el', KEY)).resolves.toEqual({ ok: 1 });
    expect(axios.post).toHaveBeenCalledWith(`${AL}/executions/e/elements/el/discard`, {}, AUTH);
  });
  it('discardElement rejects an inactive redline', async () => {
    axios.get.mockResolvedValue({ data: INACTIVE });
    await expect(node_funcs.discardElement('e', 'el', KEY)).rejects.toMatch(/inactive redline/);
  });
  it('discardElements posts the discard input for active redlines', async () => {
    axios.get.mockResolvedValue({ data: [ACTIVE] });
    axios.post.mockResolvedValue({ data: { ok: 1 } });
    await expect(node_funcs.discardElements('e', { elem_ids: ['el'] }, KEY)).resolves.toEqual({ ok: 1 });
    expect(axios.post).toHaveBeenCalledWith(`${AL}/executions/e/elements/discard`, { elem_ids: ['el'] }, AUTH);
  });
  it('discardElements rejects when a targeted element is inactive', async () => {
    axios.get.mockResolvedValue({ data: [INACTIVE] });
    await expect(node_funcs.discardElements('e', { elem_ids: ['el'] }, KEY)).rejects.toMatch(/inactive redline/);
  });
});

describe('node_funcs procedure section / tag / file wrappers (data-driven)', () => {
  const PS_E = `${AL}/executions/e/procedure_sections/el`;
  const PS_P = `${AL}/procedures/p/procedure_sections/el`;
  const cases = [
    ['get_procedure_section', 'get', ['e', null, 'el', KEY], PS_E],
    ['get_procedure_section', 'get', [null, 'p', 'el', KEY], PS_P],
    ['get_procedure_section_input', 'get', ['e', null, 'el', KEY], `${PS_E}/input`],
    ['get_procedure_section_input', 'get', [null, 'p', 'el', KEY], `${PS_P}/input`],
    ['update_procedure_section', 'patch', ['e', null, 'el', { s: 1 }, KEY], PS_E],
    ['update_procedure_section', 'patch', [null, 'p', 'el', { s: 1 }, KEY], PS_P],
    ['get_procedure_section_structure', 'get', ['e', null, 'el', KEY], `${PS_E}/structure`],
    ['get_procedure_section_structure', 'get', [null, 'p', 'el', KEY], `${PS_P}/structure`],
    ['get_procedure_section_elements', 'get', ['e', null, 'el', KEY], `${PS_E}/elements`],
    ['get_procedure_section_elements', 'get', [null, 'p', 'el', KEY], `${PS_P}/elements`],
    // tag helpers
    ['procedure_create_tag', 'post', ['p', { t: 1 }, KEY], `${AL}/procedures/p/tags`],
    ['procedure_update_tag', 'patch', ['p', 't1', { t: 1 }, KEY], `${AL}/procedures/p/tags/t1`],
    ['procedure_delete_tag', 'delete', ['p', 't1', KEY], `${AL}/procedures/p/tags/t1`],
    ['procedure_element_apply_tag', 'post', ['p', 'el', 't1', KEY], `${AL}/procedures/p/elements/el/tags`],
    ['procedure_element_remove_tag', 'delete', ['p', 'el', 't1', KEY], `${AL}/procedures/p/elements/el/tags/t1`],
    // procedure file reads
    ['readProcedureElementFile', 'get', ['p', 'el', 'f', KEY], `${AL}/procedures/p/elements/el/files/f`],
    ['readProcedureFile', 'get', ['p', 'f', KEY], `${AL}/procedures/p/files/f`]
  ];

  cases.forEach(([name, method, args, url]) => {
    it(`${name} -> ${url} (success + error)`, async () => {
      axios[method].mockResolvedValue({ data: { ok: 1 } });
      await expect(node_funcs[name](...args)).resolves.toEqual({ ok: 1 });
      const calls = axios[method].mock.calls;
      expect(calls[calls.length - 1][0]).toBe(url);
      axios[method].mockRejectedValue(new Error('boom'));
      await expect(node_funcs[name](...args)).rejects.toHaveProperty('message', 'boom');
    });
  });

  it('procedure section dispatchers reject when neither id is provided', async () => {
    await expect(node_funcs.get_procedure_sections(null, null, 0, 10, null, null, KEY)).rejects.toMatch(/was not provided/);
    await expect(node_funcs.get_procedure_section(null, null, 'el', KEY)).rejects.toMatch(/was not provided/);
    await expect(node_funcs.get_procedure_section_input(null, null, 'el', KEY)).rejects.toMatch(/was not provided/);
    await expect(node_funcs.update_procedure_section(null, null, 'el', {}, KEY)).rejects.toMatch(/was not provided/);
    await expect(node_funcs.update_procedure_section_input(null, null, 'el', {}, KEY)).rejects.toMatch(/was not provided/);
    await expect(node_funcs.get_procedure_section_structure(null, null, 'el', KEY)).rejects.toMatch(/was not provided/);
    await expect(node_funcs.get_procedure_section_elements(null, null, 'el', KEY)).rejects.toMatch(/was not provided/);
  });

  it('get_procedure_sections dispatches execution / procedure and returns total_count', async () => {
    axios.get.mockResolvedValue({ data: [1], headers: { 'x-total-count': 1 } });
    await expect(node_funcs.get_procedure_sections('e', null, 0, 10, 'ASC', 'd', KEY)).resolves.toEqual({ elems: [1], total_count: 1 });
    expect(axios.get).toHaveBeenLastCalledWith(`${AL}/executions/e/procedure_sections`, { params: { offset: 0, limit: 10, sort: 'ASC', description: 'd' }, headers: { Authorization: KEY } });
    await node_funcs.get_procedure_sections(null, 'p', null, null, null, null, KEY);
    expect(axios.get).toHaveBeenLastCalledWith(`${AL}/procedures/p/procedure_sections`, { params: {}, headers: { Authorization: KEY } });
  });

  it('update_procedure_section_input posts and resolves undefined (execution + procedure)', async () => {
    axios.post.mockResolvedValue({ data: {} });
    await expect(node_funcs.update_procedure_section_input('e', null, 'el', { i: 1 }, KEY)).resolves.toBeUndefined();
    expect(axios.post).toHaveBeenLastCalledWith(`${AL}/executions/e/procedure_sections/el/input`, { i: 1 }, AUTH);
    await node_funcs.update_procedure_section_input(null, 'p', 'el', { i: 1 }, KEY);
    expect(axios.post).toHaveBeenLastCalledWith(`${AL}/procedures/p/procedure_sections/el/input`, { i: 1 }, AUTH);
    axios.post.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.update_procedure_section_input('e', null, 'el', {}, KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('deleteProcedureElementFile / deleteProcedureFile resolve undefined', async () => {
    axios.delete.mockResolvedValue({});
    await expect(node_funcs.deleteProcedureElementFile('p', 'el', 'f', KEY)).resolves.toBeUndefined();
    expect(axios.delete).toHaveBeenLastCalledWith(`${AL}/procedures/p/elements/el/files/f`, AUTH);
    await expect(node_funcs.deleteProcedureFile('p', 'f', KEY)).resolves.toBeUndefined();
    expect(axios.delete).toHaveBeenLastCalledWith(`${AL}/procedures/p/files/f`, AUTH);
    axios.delete.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.deleteProcedureFile('p', 'f', KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('getProcedureFiles / getProcedureElementFiles return files + total_count', async () => {
    axios.get.mockResolvedValue({ data: [1], headers: { 'x-total-count': 1 } });
    await expect(node_funcs.getProcedureFiles('p', 5, 10, KEY)).resolves.toEqual({ files: [1], total_count: 1 });
    expect(axios.get).toHaveBeenLastCalledWith(`${AL}/procedures/p/files`, { params: { offset: 5, limit: 10 }, headers: { Authorization: KEY } });
    await expect(node_funcs.getProcedureElementFiles('p', 'el', 5, 10, KEY)).resolves.toEqual({ files: [1], total_count: 1 });
    expect(axios.get).toHaveBeenLastCalledWith(`${AL}/procedures/p/elements/el/files`, { params: { offset: 5, limit: 10 }, headers: { Authorization: KEY } });
  });
});

describe('node_funcs procedure CRUD wrappers', () => {
  it('updateProcedure patches and returns data', async () => {
    axios.patch.mockResolvedValue({ data: { id: 'p' } });
    await expect(node_funcs.updateProcedure('p', { title: 't' }, KEY)).resolves.toEqual({ id: 'p' });
    expect(axios.patch).toHaveBeenCalledWith(`${AL}/procedures/p`, { title: 't' }, AUTH);
    axios.patch.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.updateProcedure('p', {}, KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('getProcedure derives the four status values', async () => {
    axios.get.mockResolvedValue({ data: { deprecated: true } });
    await expect(node_funcs.getProcedure('p', KEY)).resolves.toHaveProperty('status', 'OBSOLETE');
    axios.get.mockResolvedValue({ data: { current_released_version: 2 } });
    await expect(node_funcs.getProcedure('p', KEY)).resolves.toHaveProperty('status', 'RELEASED');
    axios.get.mockResolvedValue({ data: { current_version: 1 } });
    await expect(node_funcs.getProcedure('p', KEY)).resolves.toHaveProperty('status', 'VERSIONED');
    axios.get.mockResolvedValue({ data: {} });
    await expect(node_funcs.getProcedure('p', KEY)).resolves.toHaveProperty('status', 'WORKING');
    axios.get.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.getProcedure('p', KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('getVersion derives version status when absent and preserves it when present', async () => {
    axios.get.mockResolvedValue({ data: { deprecated: true } });
    await expect(node_funcs.getVersion('p', 1, KEY)).resolves.toHaveProperty('status', 'OBSOLETE');
    axios.get.mockResolvedValue({ data: { time_released: '2020' } });
    await expect(node_funcs.getVersion('p', 1, KEY)).resolves.toHaveProperty('status', 'RELEASED');
    axios.get.mockResolvedValue({ data: { time_versioned: '2020' } });
    await expect(node_funcs.getVersion('p', 1, KEY)).resolves.toHaveProperty('status', 'VERSIONED');
    axios.get.mockResolvedValue({ data: {} });
    await expect(node_funcs.getVersion('p', 1, KEY)).resolves.toHaveProperty('status', 'WORKING');
    axios.get.mockResolvedValue({ data: { status: 'CUSTOM' } });
    await expect(node_funcs.getVersion('p', 1, KEY)).resolves.toHaveProperty('status', 'CUSTOM');
  });

  it('loadProcedure posts and resolves undefined', async () => {
    axios.post.mockResolvedValue({});
    await expect(node_funcs.loadProcedure('p', { info: 1 }, KEY)).resolves.toBeUndefined();
    expect(axios.post).toHaveBeenCalledWith(`${AL}/procedures/p/load`, { info: 1 }, AUTH);
    axios.post.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.loadProcedure('p', {}, KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('removeProcedure deletes and resolves undefined', async () => {
    axios.delete.mockResolvedValue({});
    await expect(node_funcs.removeProcedure('p', KEY)).resolves.toBeUndefined();
    expect(axios.delete).toHaveBeenCalledWith(`${AL}/procedures/p`, AUTH);
    axios.delete.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.removeProcedure('p', KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('getProcedures builds params, derives status and returns total_count', async () => {
    axios.get.mockResolvedValue({ data: [{ obsolete: true }, { time_released: '2020' }, { time_versioned: '2020' }, {}], headers: { 'x-total-count': 4 } });
    const res = await node_funcs.getProcedures(5, 10, 'ti', 'de', 'au', true, 'TYPE', false, 'lab', true, false, 'ASC', 'title', 'pid', 'iid', KEY);
    expect(res.total_count).toBe(4);
    expect(res.procedures.map((p) => p.status)).toEqual(['OBSOLETE', 'RELEASED', 'VERSIONED', 'WORKING']);
    expect(axios.get).toHaveBeenCalledWith(`${AL}/procedures`, expect.objectContaining({ params: expect.objectContaining({ offset: 5, limit: 10, title: 'ti', versioned: true, procedure_type: 'TYPE', hazardous: false }) }));
    axios.get.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.getProcedures(0, 0, null, null, null, undefined, undefined, undefined, undefined, undefined, undefined, null, null, null, null, KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('setExecutionBoundary posts the elem_id as a query param', async () => {
    axios.post.mockResolvedValue({ data: { ok: 1 } });
    await expect(node_funcs.setExecutionBoundary('e', 'el', KEY)).resolves.toEqual({ ok: 1 });
    expect(axios.post).toHaveBeenCalledWith(`${AL}/executions/e/boundary_elem`, {}, { params: { elem_id: 'el' }, headers: { Authorization: KEY } });
    axios.post.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.setExecutionBoundary('e', 'el', KEY)).rejects.toHaveProperty('message', 'boom');
  });
});

describe('node_funcs pure helpers', () => {
  it('parse_token extracts the bearer token or empty on bad format', () => {
    expect(node_funcs.parse_token('Bearer abc')).toBe('abc');
    expect(node_funcs.parse_token('abc')).toBe('');
  });
  it('is_string discriminates strings from other types', () => {
    expect(node_funcs.is_string('x')).toBe(true);
    expect(node_funcs.is_string(5)).toBe(false);
    expect(node_funcs.is_string(null)).toBe(false);
    expect(node_funcs.is_string({})).toBe(false);
  });
  it('to_obj_string returns strings as-is and inspects objects', () => {
    expect(node_funcs.to_obj_string('x')).toBe('x');
    expect(node_funcs.to_obj_string({ a: 1 })).toContain('a');
  });
  it('get_auth_key reads the authorization header', () => {
    expect(node_funcs.get_auth_key({ authorization: 'k' })).toBe('k');
    expect(node_funcs.get_auth_key({})).toBe('');
  });
  it('is_break_point_on reflects AUTO mode with on_break_point', () => {
    expect(node_funcs.is_break_point_on({ mode: 'AUTO', pause_conditions: { on_break_point: true } })).toBeTruthy();
    expect(node_funcs.is_break_point_on({ mode: 'MANUAL', pause_conditions: { on_break_point: true } })).toBeFalsy();
    expect(node_funcs.is_break_point_on({ mode: 'AUTO' })).toBeFalsy();
  });
  it('is_closed detects CLOSED status', () => {
    expect(node_funcs.is_closed({ status: 'CLOSED' })).toBe(true);
    expect(node_funcs.is_closed({ status: 'IDLE' })).toBe(false);
  });
  it('get_step_completion_status returns terminal statuses only', () => {
    expect(node_funcs.get_step_completion_status({ execution: { meta_data: { status: 'PASS' } } })).toBe('PASS');
    expect(node_funcs.get_step_completion_status({ execution: { meta_data: { status: 'OVERRIDE_FAIL' } } })).toBe('OVERRIDE_FAIL');
    expect(node_funcs.get_step_completion_status({ execution: { meta_data: { status: 'RUNNING' } } })).toBeNull();
    expect(node_funcs.get_step_completion_status({})).toBeNull();
  });
  it('push_error wraps string and object errors', () => {
    expect(node_funcs.push_error('outer', 'inner')).toEqual({ message: 'outer', details: ['inner'] });
    const wrapped = node_funcs.push_error('outer', { message: 'inner', foo: 1 });
    expect(wrapped.message).toBe('outer');
    expect(wrapped.details).toContain('inner');
    expect(wrapped.foo).toBe(1);
  });
  it('push_error handles non-serializable (circular) errors', () => {
    const circular = {};
    circular.self = circular;
    const wrapped = node_funcs.push_error('outer', circular);
    expect(wrapped.message).toBe('outer');
    expect(Array.isArray(wrapped.details)).toBe(true);
  });
  it('transform_axios_error normalizes response shapes', () => {
    expect(node_funcs.transform_axios_error(new Error('plain'))).toEqual(expect.objectContaining({ message: 'plain' }));
    expect(node_funcs.transform_axios_error({ response: { status: 400, data: 'bad' } })).toEqual(expect.objectContaining({ message: 'bad', http_code_at_source: 400 }));
    const structured = node_funcs.transform_axios_error({ response: { status: 500, data: { message: 'm', details: ['d'], error_type: 't', error_source: 's', http_code_at_source: 418 } } });
    expect(structured).toEqual(expect.objectContaining({ message: 'm', details: ['d'], error_type: 't', error_source: 's', http_code_at_source: 418 }));
  });
});

describe('node_funcs switch-wait redis helpers', () => {
  it('get_switch_wait parses the stored value', async () => {
    redisClient.get.mockResolvedValue('7');
    await expect(node_funcs.get_switch_wait('e')).resolves.toEqual({ switch_wait_secs: 7 });
  });
  it('get_switch_wait falls back to the configured default when unset', async () => {
    redisClient.get.mockResolvedValue(null);
    await expect(node_funcs.get_switch_wait('e')).resolves.toEqual({ switch_wait_secs: config.EXECUTION_SWITCH_WAIT_SEC });
  });
  it('set_switch_wait stores then returns the current value', async () => {
    redisClient.set.mockResolvedValue('OK');
    redisClient.get.mockResolvedValue('5');
    await expect(node_funcs.set_switch_wait('e', { switch_wait_secs: 5 })).resolves.toEqual({ switch_wait_secs: 5 });
    expect(redisClient.set).toHaveBeenCalled();
  });
  it('get_switch_wait_flag returns the stored flag or empty string', async () => {
    redisClient.get.mockResolvedValue('flagval');
    await expect(node_funcs.get_switch_wait_flag('e')).resolves.toEqual({ switch_wait_flag: 'flagval' });
    redisClient.get.mockResolvedValue(null);
    await expect(node_funcs.get_switch_wait_flag('e')).resolves.toEqual({ switch_wait_flag: '' });
  });
  it('delete_switch_wait_flag deletes then reports empty', async () => {
    redisClient.del.mockResolvedValue(1);
    redisClient.get.mockResolvedValue(null);
    await expect(node_funcs.delete_switch_wait_flag('e')).resolves.toEqual({ switch_wait_flag: '' });
    expect(redisClient.del).toHaveBeenCalled();
  });
});
