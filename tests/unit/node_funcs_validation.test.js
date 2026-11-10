'use strict';

// Coverage for the procedure-validation engine in api/node_funcs.js:
// validate_procedure_version, validate_procedure_element and the shared
// refresh_procedure_element_ / check_vis logic (VI, VI_STATUS, CUSTOM_SCRIPT,
// PROCEDURE_SECTION drift detection). HTTP is mocked; no real I/O occurs.

jest.mock('aws-sdk', () => require('./mocks/mockAwsSdk'));
jest.mock('async-redis', () => require('./mocks/mockRedis'));
jest.mock('jsonwebtoken', () => ({ verify: jest.fn() }));
jest.mock('axios', () => ({ get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn(), put: jest.fn() }));

const axios = require('axios');
const node_funcs = require('../../api/node_funcs');

const AL = 'http://localhost:8010/api/v5';
const KEY = 'Bearer token';

// Route axios.get responses by URL substring. Order matters: more specific
// patterns must be listed before more general ones.
function routeGet(routes) {
  axios.get.mockImplementation((url) => {
    for (const [pattern, value] of routes) {
      if (url.includes(pattern)) {
        return Promise.resolve(value);
      }
    }
    return Promise.resolve({ data: [], headers: {} });
  });
}

beforeEach(() => {
  axios.get.mockReset();
  axios.post.mockReset();
  axios.patch.mockReset();
  axios.delete.mockReset();
  axios.put.mockReset();
  // enrichWithDictionaryConsistency bulk queries default to empty results.
  axios.post.mockResolvedValue({ data: [] });
  axios.patch.mockResolvedValue({ data: [] });
});

describe('validate_procedure_element', () => {
  it('rejects when the element is not found', async () => {
    routeGet([['/elements', { data: [{ elem_id: 'other', step_type: 'WAIT' }], headers: {} }]]);
    await expect(node_funcs.validate_procedure_element('PROC', 'missing', null, KEY)).rejects.toMatch(/was not found/);
  });

  it('detects modified VI fields on a VERIFICATION_ITEM element', async () => {
    const elem = {
      elem_id: 'a', elem_type: 'STEP', step_type: 'VERIFICATION_ITEM', number: '1', title: 't',
      authoring_user_input: { vis: [{ vi_id: 'v1', vi_name: 'old', vi_owner: 'o', vi_type: 'T', vi_text: 'x', vas: [] }] }
    };
    routeGet([['/elements', { data: [elem], headers: {} }]]);
    const input = { vis: [{ vi_id: 'v1', vi_name: 'new', vi_owner: 'o2', vi_type: 'T2', vi_text: 'y', vas: [] }] };
    const res = await node_funcs.validate_procedure_element('PROC', 'a', input, KEY);
    expect(res.validation_items).toHaveLength(1);
    const fields = res.validation_items[0].changed_items[0].changed_fields.map((f) => f.field_name);
    expect(fields).toEqual(expect.arrayContaining(['vi_name', 'vi_owner', 'vi_type', 'vi_text']));
    // the element's vi should now carry the reference values
    expect(elem.authoring_user_input.vis[0].vi_name).toBe('new');
  });

  it('flags a VI as DELETED when it is absent from the reference map', async () => {
    const elem = {
      elem_id: 'a', elem_type: 'STEP', step_type: 'VERIFICATION_ITEM', number: '1', title: 't',
      authoring_user_input: { vis: [{ vi_id: 'gone', vi_name: 'g', vas: [] }] }
    };
    routeGet([['/elements', { data: [elem], headers: {} }]]);
    const res = await node_funcs.validate_procedure_element('PROC', 'a', { vis: [{ vi_id: 'other' }] }, KEY);
    expect(res.validation_items[0].changed_items[0].change_type).toBe('DELETED');
  });

  it('detects VA modifications, deletions and additions within a VI', async () => {
    const elem = {
      elem_id: 'a', elem_type: 'STEP', step_type: 'VERIFICATION_ITEM', number: '1', title: 't',
      authoring_user_input: {
        vis: [{
          vi_id: 'v1', vi_name: 'n', vas: [
            { va_id: 'a1', va_name: 'A', va_poc: 'p', vac_id: 'c', vac_name: 'cn' }, // modified
            { va_id: 'a2', va_name: 'B' } // deleted (not in ref)
          ]
        }]
      }
    };
    routeGet([['/elements', { data: [elem], headers: {} }]]);
    const input = {
      vis: [{
        vi_id: 'v1', vi_name: 'n', vas: [
          { va_id: 'a1', va_name: 'A2', va_poc: 'p2', vac_id: 'c2', vac_name: 'cn2' }, // modified
          { va_id: 'a3', va_name: 'C' } // added (not in step)
        ]
      }]
    };
    const res = await node_funcs.validate_procedure_element('PROC', 'a', input, KEY);
    const changeTypes = res.validation_items[0].changed_items[0].changed_fields.map((f) => f.change_type);
    expect(changeTypes).toEqual(expect.arrayContaining(['MODIFIED', 'DELETED', 'ADDED']));
  });

  it('refreshes VERIFICATION_ITEM_STATUS input steps (modified and deleted)', async () => {
    const elem = {
      elem_id: 'a', elem_type: 'STEP', step_type: 'VERIFICATION_ITEM_STATUS', number: '1', title: 't',
      authoring_user_input: {
        vis: [{ vi_id: 'v1', vi_name: 'n', vas: [] }],
        steps: [
          { elem_id: 's1', number: '1.1', title: 'old' }, // present in map -> modified
          { elem_id: 'sGone', number: '9', title: 'gone' } // absent -> deleted
        ]
      }
    };
    const refStep = { elem_id: 's1', number: '2.2', title: 'new', step_type: 'CMD' };
    routeGet([['/elements', { data: [elem, refStep], headers: {} }]]);
    const res = await node_funcs.validate_procedure_element('PROC', 'a', { vis: [{ vi_id: 'v1', vi_name: 'n', vas: [] }] }, KEY);
    const items = res.validation_items[0].changed_items;
    expect(items.some((i) => i.item_type === 'STEP' && i.change_type === 'MODIFIED')).toBe(true);
    expect(items.some((i) => i.item_type === 'STEP' && i.change_type === 'DELETED')).toBe(true);
    // the deleted input step should be removed from the element
    expect(elem.authoring_user_input.steps.map((s) => s.elem_id)).toEqual(['s1']);
  });

  it('detects CUSTOM_SCRIPT metadata and specification drift', async () => {
    const elem = {
      elem_id: 'a', elem_type: 'STEP', step_type: 'CUSTOM_SCRIPT', number: '1', title: 't',
      authoring_user_input: {
        script_id: 's1', script_path: '/p', script_name: 'a', hash: 'h', spec_hash: 'sh',
        description: 'd', status: 'ACTIVE',
        inputs: [{ name: 'x', type: 'string', value: '1' }],
        entries: [{ entry_inputs: [{ name: 'e', type: 'string', value: '2' }] }]
      }
    };
    routeGet([['/elements', { data: [elem], headers: {} }]]);
    const scripts = [{
      script_id: 's1', script_path: '/p', script_name: 'a2', hash: 'h', spec_hash: 'sh',
      description: 'd', status: 'ACTIVE',
      inputs: [{ name: 'x', type: 'string', default_value: '0' }, { name: 'y', type: 'string' }],
      entries: [{ entry_inputs: [{ name: 'e', type: 'string', default_value: '0' }] }],
      layout: {}, outputs: [], output_array: []
    }];
    const res = await node_funcs.validate_procedure_element('PROC', 'a', { scripts }, KEY);
    const item = res.validation_items[0].changed_items[0];
    expect(item.item_type).toBe('SCRIPT');
    const fields = item.changed_fields.map((f) => f.field_name);
    expect(fields).toEqual(expect.arrayContaining(['script_name', 'specification']));
    expect(elem.authoring_user_input.script_name).toBe('a2');
  });

  it('reports a legacy custom script that cannot be validated', async () => {
    const elem = {
      elem_id: 'a', elem_type: 'STEP', step_type: 'CUSTOM_SCRIPT', number: '1', title: 't',
      authoring_user_input: { script_id: 's1', script_path: '/p', script_name: 'a', hash: 'h', spec_hash: '' }
    };
    routeGet([['/elements', { data: [elem], headers: {} }]]);
    const scripts = [{ script_id: 's1', script_path: '/p', script_name: 'a', hash: 'h', spec_hash: 'sh' }];
    const res = await node_funcs.validate_procedure_element('PROC', 'a', { scripts }, KEY);
    expect(res.validation_items[0].user_action_msg).toMatch(/legacy CS step/);
  });

  it('reports when the custom script is not found in the catalog', async () => {
    const elem = {
      elem_id: 'a', elem_type: 'STEP', step_type: 'CUSTOM_SCRIPT', number: '1', title: 't',
      authoring_user_input: { script_id: 'unknown', script_path: '/p', spec_hash: 'sh' }
    };
    routeGet([['/elements', { data: [elem], headers: {} }]]);
    const res = await node_funcs.validate_procedure_element('PROC', 'a', { scripts: [{ script_id: 's1' }] }, KEY);
    expect(res.validation_items[0].user_action_msg).toMatch(/Custom script was not found/);
  });

  it('reports when a referenced procedure section has a newer version', async () => {
    const elem = {
      elem_id: 'a', elem_type: 'PROCEDURE_SECTION', number: '1', title: 't',
      authoring_user_input: { reference_procedure_id: 'rp', reference_procedure_version: 2 }
    };
    routeGet([
      ['/procedures/rp/versions/2', { data: { version: 2 } }],
      ['/procedures/rp', { data: { current_version: 5 } }],
      ['/elements', { data: [elem], headers: {} }]
    ]);
    const res = await node_funcs.validate_procedure_element('PROC', 'a', null, KEY);
    expect(res.validation_items[0].user_action_msg).toMatch(/A new procedure version is available/);
  });

  it('reports when a referenced procedure version is missing', async () => {
    const elem = {
      elem_id: 'a', elem_type: 'PROCEDURE_SECTION', number: '1', title: 't',
      authoring_user_input: { reference_procedure_id: 'rp', reference_procedure_version: 2 }
    };
    axios.get.mockImplementation((url) => {
      if (url.includes('/procedures/rp/versions/2')) return Promise.reject(new Error('no version'));
      if (url.endsWith('/procedures/rp')) return Promise.resolve({ data: { current_version: 5 } });
      return Promise.resolve({ data: [elem], headers: {} });
    });
    const res = await node_funcs.validate_procedure_element('PROC', 'a', null, KEY);
    expect(res.validation_items[0].user_action_msg).toMatch(/Procedure version was not found/);
  });

  it('reports when the referenced procedure is missing', async () => {
    const elem = {
      elem_id: 'a', elem_type: 'PROCEDURE_SECTION', number: '1', title: 't',
      authoring_user_input: { reference_procedure_id: 'rp', reference_procedure_version: 2 }
    };
    axios.get.mockImplementation((url) => {
      if (url.endsWith('/procedures/rp')) return Promise.reject(new Error('no proc'));
      return Promise.resolve({ data: [elem], headers: {} });
    });
    const res = await node_funcs.validate_procedure_element('PROC', 'a', null, KEY);
    expect(res.validation_items[0].user_action_msg).toMatch(/Procedure was not found/);
  });

  it('persists the element when update is requested and there are auto-applied changes', async () => {
    const elem = {
      elem_id: 'a', elem_type: 'STEP', step_type: 'VERIFICATION_ITEM', number: '1', title: 't',
      authoring_user_input: { vis: [{ vi_id: 'v1', vi_name: 'old', vas: [] }] }
    };
    routeGet([['/elements', { data: [elem], headers: {} }]]);
    const input = { update: true, vis: [{ vi_id: 'v1', vi_name: 'new', vas: [] }] };
    const res = await node_funcs.validate_procedure_element('PROC', 'a', input, KEY);
    expect(res.elements).toHaveLength(1);
    expect(axios.patch).toHaveBeenCalledWith(`${AL}/procedures/PROC/elements`, [elem], expect.any(Object));
  });
});

describe('validate_procedure_version', () => {
  it('rejects validating-and-updating a versioned (non-working) procedure', async () => {
    await expect(node_funcs.validate_procedure_version('PROC', 3, { update: true }, KEY)).rejects.toMatch(/Cannot validate and update/);
  });

  it('collects validation items across all elements without updating by default', async () => {
    const elems = [
      {
        elem_id: 'a', elem_type: 'STEP', step_type: 'VERIFICATION_ITEM', number: '1', title: 't',
        authoring_user_input: { vis: [{ vi_id: 'v1', vi_name: 'old', vas: [] }] }
      },
      { elem_id: 'b', elem_type: 'STEP', step_type: 'WAIT', number: '2', title: 'w' } // no changes
    ];
    routeGet([['/versions/0/elements', { data: elems, headers: {} }]]);
    const res = await node_funcs.validate_procedure_version('PROC', 0, { vis: [{ vi_id: 'v1', vi_name: 'new', vas: [] }] }, KEY);
    expect(res.validation_items).toHaveLength(1);
    expect(res.elements).toHaveLength(0);
    expect(axios.patch).not.toHaveBeenCalled();
  });

  it('updates changed elements when update is requested on the working version', async () => {
    const elems = [{
      elem_id: 'a', elem_type: 'STEP', step_type: 'VERIFICATION_ITEM', number: '1', title: 't',
      authoring_user_input: { vis: [{ vi_id: 'v1', vi_name: 'old', vas: [] }] }
    }];
    routeGet([['/versions/0/elements', { data: elems, headers: {} }]]);
    const res = await node_funcs.validate_procedure_version('PROC', 0, { update: true, vis: [{ vi_id: 'v1', vi_name: 'new', vas: [] }] }, KEY);
    expect(res.elements).toHaveLength(1);
    expect(axios.patch).toHaveBeenCalledWith(`${AL}/procedures/PROC/elements`, res.elements, expect.any(Object));
  });
});
