'use strict';

// Coverage for the execution-computation helpers (compute_execution_element,
// refresh_execution, getVIs), resume_execution and the S3 bootstrap
// (init_file_server) in api/node_funcs.js. HTTP, redis, S3 and JWT are mocked.

jest.mock('aws-sdk', () => require('./mocks/mockAwsSdk'));
jest.mock('async-redis', () => require('./mocks/mockRedis'));
jest.mock('jsonwebtoken', () => ({ verify: jest.fn() }));
jest.mock('axios', () => ({ get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn(), put: jest.fn() }));

const axios = require('axios');
const jwt = require('jsonwebtoken');
const mockAwsSdk = require('./mocks/mockAwsSdk');
const config = require('../../config');
const node_funcs = require('../../api/node_funcs');

const s3 = mockAwsSdk.__s3;
const KEY = 'Bearer token';

function listElements(elems, headers) {
  axios.get.mockImplementation((url) => {
    if (url.includes('/elements')) return Promise.resolve({ data: elems, headers: headers || {} });
    return Promise.resolve({ data: {}, headers: {} });
  });
}

beforeEach(() => {
  axios.get.mockReset();
  axios.post.mockReset();
  axios.patch.mockReset();
  axios.delete.mockReset();
  axios.put.mockReset();
  jwt.verify.mockReset();
  jwt.verify.mockReturnValue({ username: 'bob' });
  mockAwsSdk.__reset();
});

describe('compute_execution_element', () => {
  const viStatus = () => ({
    elem_id: 'vs1', step_type: 'VERIFICATION_ITEM_STATUS',
    execution_user_input: { steps: [{ elem_id: 's1' }, { elem_id: 's2' }] }
  });
  const step = (elem_id, status, extra) => Object.assign({
    elem_id, step_type: 'CMD', number: '1', title: 't',
    execution: { meta_data: { status } }
  }, extra);

  it('computes PASS when all referenced steps pass', async () => {
    listElements([viStatus(), step('s1', 'PASS'), step('s2', 'OVERRIDE_PASS')]);
    axios.patch.mockResolvedValue({ data: { ok: 1 } });
    await node_funcs.compute_execution_element('e1', 'vs1', KEY);
    const patched = axios.patch.mock.calls[0][1];
    expect(patched.execution.meta_data.status).toBe('PASS');
    expect(patched.executed).toBe(true);
  });

  it('computes FAIL when a referenced step is not passing', async () => {
    listElements([viStatus(), step('s1', 'PASS'), step('s2', 'FAIL')]);
    axios.patch.mockResolvedValue({ data: {} });
    await node_funcs.compute_execution_element('e1', 'vs1', KEY);
    expect(axios.patch.mock.calls[0][1].execution.meta_data.status).toBe('FAIL');
  });

  it('marks a missing referenced step as NOT_FOUND (FAIL overall)', async () => {
    listElements([viStatus(), step('s1', 'PASS')]); // s2 missing
    axios.patch.mockResolvedValue({ data: {} });
    await node_funcs.compute_execution_element('e1', 'vs1', KEY);
    expect(axios.patch.mock.calls[0][1].execution.meta_data.status).toBe('FAIL');
  });

  it('treats non-verifiable steps as PASS and missing status as NONE', async () => {
    const s1 = step('s1', undefined, { verifiable: false });
    delete s1.execution.meta_data.status;
    const s2 = step('s2', 'PASS');
    // s2 with no status object -> NONE branch
    const s3 = { elem_id: 's3', step_type: 'CMD', execution: { meta_data: {} } };
    const vi = viStatus();
    vi.execution_user_input.steps = [{ elem_id: 's1' }, { elem_id: 's3' }];
    listElements([vi, s1, s3]);
    axios.patch.mockResolvedValue({ data: {} });
    await node_funcs.compute_execution_element('e1', 'vs1', KEY);
    // s1 -> PASS (non-verifiable), s3 -> NONE => overall FAIL
    expect(axios.patch.mock.calls[0][1].execution.meta_data.status).toBe('FAIL');
  });

  it('returns non VI_STATUS steps unchanged', async () => {
    listElements([step('s1', 'PASS')]);
    axios.patch.mockResolvedValue({ data: {} });
    await node_funcs.compute_execution_element('e1', 's1', KEY);
    // no execution recompute; patched body is the original step object
    expect(axios.patch.mock.calls[0][1].elem_id).toBe('s1');
  });

  it('rejects when the target element is not found', async () => {
    listElements([step('s1', 'PASS')]);
    await expect(node_funcs.compute_execution_element('e1', 'missing', KEY)).rejects.toMatch(/element was not found/);
  });
});

describe('compute_procedure_element (documents latent defect)', () => {
  it('rejects when the target element is not found', async () => {
    listElements([{ elem_id: 's1', step_type: 'CMD' }]);
    await expect(node_funcs.compute_procedure_element('p1', 'missing', KEY)).rejects.toMatch(/element was not found/);
  });

  it('throws for a found element because compute_procedure_element_ is undefined', async () => {
    // NOTE: compute_procedure_element references an undefined helper
    // (compute_procedure_element_) and returns an undefined variable
    // (computed_step). Preserved as-is; documented via this test.
    listElements([{ elem_id: 's1', step_type: 'CMD' }]);
    await expect(node_funcs.compute_procedure_element('p1', 's1', KEY)).rejects.toBeInstanceOf(ReferenceError);
  });
});

describe('refresh_execution', () => {
  it('recomputes VI_STATUS steps and bulk-updates elements', async () => {
    const vi = {
      elem_id: 'vs1', step_type: 'VERIFICATION_ITEM_STATUS',
      execution_user_input: { steps: [{ elem_id: 's1' }] }
    };
    const s1 = { elem_id: 's1', step_type: 'CMD', number: '1', title: 't', execution: { meta_data: { status: 'PASS' } } };
    listElements([vi, s1]);
    axios.patch.mockResolvedValue({ data: [{ elem_id: 'vs1' }] });
    const res = await node_funcs.refresh_execution('e1', KEY);
    expect(res).toEqual([{ elem_id: 'vs1' }]);
    // one VI_STATUS step was computed and pushed to the bulk update
    expect(axios.patch.mock.calls[0][1]).toHaveLength(1);
  });
});

describe('getVIs', () => {
  const viStep = (vis) => ({ elem_id: 'vi', step_type: 'VERIFICATION_ITEM', execution_user_input: { vis } });
  const statusStep = (elem_id, status, vis) => ({
    elem_id, step_type: 'VERIFICATION_ITEM_STATUS',
    execution: { meta_data: { status }, results: { vis } }
  });

  it('reports UNKNOWN for a VI with no status items', async () => {
    listElements([viStep([{ vi_id: 'v1', vi_name: 'N1' }])]);
    await expect(node_funcs.getVIs('e1', null, KEY)).resolves.toEqual([
      { vi_name: 'N1', vi_id: 'v1', vi_status_step_ids: [], status: 'UNKNOWN' }
    ]);
  });

  it('reports PASS when every status item passes', async () => {
    listElements([
      viStep([{ vi_id: 'v1', vi_name: 'N1' }]),
      statusStep('vs1', 'PASS', [{ vi_name: 'N1' }])
    ]);
    const res = await node_funcs.getVIs('e1', null, KEY);
    expect(res[0].status).toBe('PASS');
    expect(res[0].vi_status_step_ids).toEqual(['vs1']);
  });

  it('reports FAIL when every status item fails', async () => {
    listElements([
      viStep([{ vi_id: 'v1', vi_name: 'N1' }]),
      statusStep('vs1', 'FAIL', [{ vi_name: 'N1' }])
    ]);
    const res = await node_funcs.getVIs('e1', null, KEY);
    expect(res[0].status).toBe('FAIL');
  });

  it('reports UNKNOWN for a mix of pass and fail', async () => {
    listElements([
      viStep([{ vi_id: 'v1', vi_name: 'N1' }]),
      statusStep('vs1', 'PASS', [{ vi_name: 'N1' }]),
      statusStep('vs2', 'FAIL', [{ vi_name: 'N1' }])
    ]);
    const res = await node_funcs.getVIs('e1', null, KEY);
    expect(res[0].status).toBe('UNKNOWN');
    expect(res[0].vi_status_step_ids).toEqual(['vs1', 'vs2']);
  });

  it('applies a status filter', async () => {
    listElements([
      viStep([{ vi_id: 'v1', vi_name: 'N1' }, { vi_id: 'v2', vi_name: 'N2' }]),
      statusStep('vs1', 'PASS', [{ vi_name: 'N1' }]),
      statusStep('vs2', 'FAIL', [{ vi_name: 'N2' }])
    ]);
    const res = await node_funcs.getVIs('e1', 'PASS', KEY);
    expect(res).toEqual([
      { vi_name: 'N1', vi_id: 'v1', vi_status_step_ids: ['vs1'], status: 'PASS' }
    ]);
  });
});

describe('resume_execution', () => {
  const AL = 'http://localhost:8010/api/v5';
  function route(execution, venue) {
    axios.get.mockImplementation((url) => {
      if (url.includes('/venues/')) return Promise.resolve({ data: venue });
      if (url.includes('/executions/')) return Promise.resolve({ data: execution });
      return Promise.resolve({ data: {} });
    });
  }

  it('rejects when no venue_id is provided', async () => {
    await expect(node_funcs.resume_execution('e1', {}, KEY)).rejects.toMatch(/Venue info was not provided/);
  });

  it('rejects when the execution is not suspended', async () => {
    route({ status: 'RUNNING' }, {});
    await expect(node_funcs.resume_execution('e1', { venue_id: 'v1' }, KEY)).rejects.toMatch(/not suspended/);
  });

  it('rejects when venue status is missing', async () => {
    route({ status: 'SUSPENDED' }, { name: 'V', venue_id: 'v1' });
    await expect(node_funcs.resume_execution('e1', { venue_id: 'v1' }, KEY)).rejects.toMatch(/Venue status was not found/);
  });

  it('rejects when the venue is not available', async () => {
    route({ status: 'SUSPENDED' }, { name: 'V', venue_status: { status: 'IN_USE' } });
    await expect(node_funcs.resume_execution('e1', { venue_id: 'v1' }, KEY)).rejects.toMatch(/not available/);
  });

  it('resumes a suspended execution on an available venue', async () => {
    route(
      { status: 'SUSPENDED', test_conductors: ['alice'] },
      { name: 'V', venue_status: { status: 'AVAILABLE', execution_id: '' } }
    );
    axios.patch.mockResolvedValue({ data: {} });
    axios.post.mockResolvedValue({ data: { status: 'IDLE' } }); // _updateExecutionStatus
    axios.put.mockResolvedValue({ data: {} });
    const res = await node_funcs.resume_execution('e1', { venue_id: 'v1' }, KEY);
    expect(res).toEqual({ status: 'IDLE' });
    // execution info patch + venue status patch
    expect(axios.patch).toHaveBeenCalledWith(`${AL}/executions/e1`, expect.objectContaining({ venue_id: 'v1' }), expect.any(Object));
    expect(axios.put).toHaveBeenCalled();
  });

  it('rejects when registering with the execution server fails', async () => {
    route(
      { status: 'SUSPENDED' },
      { name: 'V', venue_status: { status: 'AVAILABLE', execution_id: '' } }
    );
    axios.patch.mockResolvedValue({ data: {} });
    axios.post.mockResolvedValue({ data: { status: 'IDLE' } });
    axios.put.mockRejectedValue(new Error('exec server down'));
    await expect(node_funcs.resume_execution('e1', { venue_id: 'v1' }, KEY)).rejects.toHaveProperty('message', 'exec server down');
  });
});

describe('init_file_server', () => {
  it('creates and configures the media bucket when it does not exist', async () => {
    s3.listBuckets.mockImplementation((params, cb) => cb(null, { Buckets: [{ Name: 'other' }] }));
    s3.createBucket.mockImplementation((params, cb) => cb(null, { created: true }));
    s3.putBucketPolicy.mockImplementation((params, cb) => cb(null, { ok: true }));
    await node_funcs.init_file_server();
    expect(s3.createBucket).toHaveBeenCalled();
    expect(s3.putBucketPolicy).toHaveBeenCalled();
  });

  it('skips creation when the media bucket already exists', async () => {
    s3.listBuckets.mockImplementation((params, cb) => cb(null, { Buckets: [{ Name: config.MEDIA_BUCKET }] }));
    await node_funcs.init_file_server();
    expect(s3.createBucket).not.toHaveBeenCalled();
    expect(s3.putBucketPolicy).not.toHaveBeenCalled();
  });
});
