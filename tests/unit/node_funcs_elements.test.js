'use strict';

// Coverage for element/step/section/paragraph business logic in
// api/node_funcs.js: dispatch branches (execution vs procedure vs neither),
// redline guards, override transitions and dictionary-consistency enrichment.
// HTTP, redis, S3 and JWT are all mocked; no real I/O occurs.

jest.mock('aws-sdk', () => require('./mocks/mockAwsSdk'));
jest.mock('async-redis', () => require('./mocks/mockRedis'));
jest.mock('jsonwebtoken', () => ({ verify: jest.fn() }));
jest.mock('axios', () => ({ get: jest.fn(), post: jest.fn(), patch: jest.fn(), delete: jest.fn(), put: jest.fn() }));

const axios = require('axios');
const jwt = require('jsonwebtoken');
const node_funcs = require('../../api/node_funcs');

const AL = 'http://localhost:8010/api/v5';
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
  jwt.verify.mockReturnValue({ username: 'bob' });
});

describe('delete_element / replace_element', () => {
  it('delete_element deletes an execution element', async () => {
    axios.delete.mockResolvedValue({ data: { deleted: true } });
    await expect(node_funcs.delete_element('e1', null, 'el1', KEY)).resolves.toEqual({ deleted: true });
    expect(axios.delete).toHaveBeenCalledWith(`${AL}/executions/e1/elements/el1`, AUTH);
  });
  it('delete_element deletes a procedure element', async () => {
    axios.delete.mockResolvedValue({ data: {} });
    await node_funcs.delete_element(null, 'p1', 'el1', KEY);
    expect(axios.delete).toHaveBeenCalledWith(`${AL}/procedures/p1/elements/el1`, AUTH);
  });
  it('delete_element rejects when neither id is provided', async () => {
    await expect(node_funcs.delete_element(null, null, 'el1', KEY)).rejects.toMatch(/was not provided/);
  });
  it('delete_element rejects on http error', async () => {
    axios.delete.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.delete_element('e1', null, 'el1', KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('replace_element posts to the replace endpoint', async () => {
    axios.post.mockResolvedValue({ data: { ok: 1 } });
    await expect(node_funcs.replace_element('p1', 'el1', { x: 1 }, KEY)).resolves.toEqual({ ok: 1 });
    expect(axios.post).toHaveBeenCalledWith(`${AL}/procedures/p1/elements/el1/replace`, { x: 1 }, AUTH);
  });
  it('replace_element rejects on error', async () => {
    axios.post.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.replace_element('p1', 'el1', {}, KEY)).rejects.toHaveProperty('message', 'boom');
  });
});

describe('get_step_input / update_step_input / nonexecutable', () => {
  it('get_step_input uses execution url', async () => {
    axios.get.mockResolvedValue({ data: { in: 1 } });
    await expect(node_funcs.get_step_input('e1', null, 'el1', KEY)).resolves.toEqual({ in: 1 });
    expect(axios.get).toHaveBeenCalledWith(`${AL}/executions/e1/steps/el1/input`, AUTH);
  });
  it('get_step_input uses procedure url', async () => {
    axios.get.mockResolvedValue({ data: {} });
    await node_funcs.get_step_input(null, 'p1', 'el1', KEY);
    expect(axios.get).toHaveBeenCalledWith(`${AL}/procedures/p1/steps/el1/input`, AUTH);
  });
  it('get_step_input rejects when neither id provided', async () => {
    await expect(node_funcs.get_step_input(null, null, 'el1', KEY)).rejects.toMatch(/was not provided/);
  });
  it('get_step_input rejects on error', async () => {
    axios.get.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.get_step_input('e1', null, 'el1', KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('update_step_input posts to execution url', async () => {
    axios.post.mockResolvedValue({ data: { ok: 1 } });
    await expect(node_funcs.update_step_input('e1', null, 'el1', { v: 1 }, KEY)).resolves.toEqual({ ok: 1 });
    expect(axios.post).toHaveBeenCalledWith(`${AL}/executions/e1/steps/el1/input`, { v: 1 }, AUTH);
  });
  it('update_step_input posts to procedure url', async () => {
    axios.post.mockResolvedValue({ data: {} });
    await node_funcs.update_step_input(null, 'p1', 'el1', { v: 1 }, KEY);
    expect(axios.post).toHaveBeenCalledWith(`${AL}/procedures/p1/steps/el1/input`, { v: 1 }, AUTH);
  });
  it('update_step_input rejects when neither id provided', async () => {
    await expect(node_funcs.update_step_input(null, null, 'el1', {}, KEY)).rejects.toMatch(/was not provided/);
  });
  it('update_step_input rejects on error', async () => {
    axios.post.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.update_step_input('e1', null, 'el1', {}, KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('update_step_input_nonexecutable patches execution step with execution_user_input', async () => {
    axios.patch.mockResolvedValue({ data: { ok: 1 } });
    await node_funcs.update_step_input_nonexecutable('e1', null, 'el1', { a: 1 }, KEY);
    expect(axios.patch).toHaveBeenCalledWith(`${AL}/executions/e1/steps/el1`, { execution_user_input: { a: 1 } }, AUTH);
  });
  it('update_step_input_nonexecutable patches procedure step with authoring_user_input', async () => {
    axios.patch.mockResolvedValue({ data: {} });
    await node_funcs.update_step_input_nonexecutable(null, 'p1', 'el1', { a: 1 }, KEY);
    expect(axios.patch).toHaveBeenCalledWith(`${AL}/procedures/p1/steps/el1`, { authoring_user_input: { a: 1 } }, AUTH);
  });
  it('update_step_input_nonexecutable rejects when neither id provided', async () => {
    await expect(node_funcs.update_step_input_nonexecutable(null, null, 'el1', {}, KEY)).rejects.toMatch(/was not provided/);
  });
  it('update_step_input_nonexecutable rejects on error', async () => {
    axios.patch.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.update_step_input_nonexecutable('e1', null, 'el1', {}, KEY)).rejects.toHaveProperty('message', 'boom');
  });
});

describe('get_step_result / update_step_result / create_new_run', () => {
  it('get_step_result gets result', async () => {
    axios.get.mockResolvedValue({ data: { r: 1 } });
    await expect(node_funcs.get_step_result('e1', 'el1', KEY)).resolves.toEqual({ r: 1 });
    expect(axios.get).toHaveBeenCalledWith(`${AL}/executions/e1/steps/el1/result`, AUTH);
  });
  it('get_step_result rejects on error', async () => {
    axios.get.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.get_step_result('e1', 'el1', KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('update_step_result posts result', async () => {
    axios.post.mockResolvedValue({ data: { r: 1 } });
    await expect(node_funcs.update_step_result('e1', 'el1', { r: 1 }, KEY)).resolves.toEqual({ r: 1 });
    expect(axios.post).toHaveBeenCalledWith(`${AL}/executions/e1/steps/el1/result`, { r: 1 }, AUTH);
  });
  it('update_step_result rejects on error', async () => {
    axios.post.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.update_step_result('e1', 'el1', {}, KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('create_new_run posts and updates current_step_id', async () => {
    axios.post.mockResolvedValue({ data: { run: 1 } });
    axios.patch.mockResolvedValue({ data: {} }); // update_execution_rest
    await expect(node_funcs.create_new_run('e1', 'el1', KEY)).resolves.toEqual({ run: 1 });
    expect(axios.post).toHaveBeenCalledWith(`${AL}/executions/e1/steps/el1/new_run`, {}, AUTH);
  });
  it('create_new_run still resolves when updating current_step_id fails', async () => {
    axios.post.mockResolvedValue({ data: { run: 2 } });
    axios.patch.mockRejectedValue(new Error('patch failed'));
    await expect(node_funcs.create_new_run('e1', 'el1', KEY)).resolves.toEqual({ run: 2 });
  });
  it('create_new_run rejects when the new_run post fails', async () => {
    axios.post.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.create_new_run('e1', 'el1', KEY)).rejects.toHaveProperty('message', 'boom');
  });
});

describe('override_step / update_override_step / discard_override_step', () => {
  const stepWith = (status) => ({ number: '1.1', execution: { meta_data: { status } } });

  it('override_step turns PASS into OVERRIDE_FAIL', async () => {
    axios.get.mockResolvedValue({ data: stepWith('PASS') });
    axios.patch.mockResolvedValue({ data: { ok: 1 } });
    await node_funcs.override_step('e1', 'el1', { override_justification: 'x' }, KEY);
    const patched = axios.patch.mock.calls[0][1];
    expect(patched.execution.meta_data.status).toBe('OVERRIDE_FAIL');
    expect(patched.execution.meta_data.overridden_by).toBe('bob');
  });
  it('override_step turns FAIL into OVERRIDE_PASS and defaults justification', async () => {
    axios.get.mockResolvedValue({ data: stepWith('FAIL') });
    axios.patch.mockResolvedValue({ data: {} });
    await node_funcs.override_step('e1', 'el1', {}, KEY);
    expect(axios.patch.mock.calls[0][1].execution.meta_data.status).toBe('OVERRIDE_PASS');
    expect(axios.patch.mock.calls[0][1].execution.meta_data.override_justification).toBe('');
  });
  it('override_step rejects when status is not PASS/FAIL', async () => {
    axios.get.mockResolvedValue({ data: stepWith('RUNNING') });
    await expect(node_funcs.override_step('e1', 'el1', {}, KEY)).rejects.toMatch(/Cannot override/);
  });
  it('override_step rejects a non-executable step', async () => {
    const step = stepWith('PASS');
    step.executable = 'NOT_EXECUTED';
    axios.get.mockResolvedValue({ data: step });
    await expect(node_funcs.override_step('e1', 'el1', {}, KEY)).rejects.toMatch(/non-executable/);
  });

  it('update_override_step updates an overridden step', async () => {
    axios.get.mockResolvedValue({ data: stepWith('OVERRIDE_PASS') });
    axios.patch.mockResolvedValue({ data: { ok: 1 } });
    await node_funcs.update_override_step('e1', 'el1', { override_justification: 'y' }, KEY);
    expect(axios.patch.mock.calls[0][1].execution.meta_data.override_justification).toBe('y');
  });
  it('update_override_step rejects a non-overridden step', async () => {
    axios.get.mockResolvedValue({ data: stepWith('PASS') });
    await expect(node_funcs.update_override_step('e1', 'el1', {}, KEY)).rejects.toMatch(/has not been overriden/);
  });

  it('discard_override_step reverts OVERRIDE_FAIL to PASS', async () => {
    axios.get.mockResolvedValue({ data: stepWith('OVERRIDE_FAIL') });
    axios.patch.mockResolvedValue({ data: {} });
    await node_funcs.discard_override_step('e1', 'el1', KEY);
    expect(axios.patch.mock.calls[0][1].execution.meta_data.status).toBe('PASS');
  });
  it('discard_override_step reverts OVERRIDE_PASS to FAIL', async () => {
    axios.get.mockResolvedValue({ data: stepWith('OVERRIDE_PASS') });
    axios.patch.mockResolvedValue({ data: {} });
    await node_funcs.discard_override_step('e1', 'el1', KEY);
    expect(axios.patch.mock.calls[0][1].execution.meta_data.status).toBe('FAIL');
  });
  it('discard_override_step rejects a non-overridden step', async () => {
    axios.get.mockResolvedValue({ data: stepWith('PASS') });
    await expect(node_funcs.discard_override_step('e1', 'el1', KEY)).rejects.toMatch(/was not overriden/);
  });
});

describe('sections and paragraphs', () => {
  it('update_section patches an execution section and strips managed fields', async () => {
    axios.patch.mockResolvedValue({ data: { ok: 1 } });
    await node_funcs.update_section('e1', null, 'el1', { title: 't', number: 'x' }, KEY);
    const body = axios.patch.mock.calls[0][0];
    expect(body).toBe(`${AL}/executions/e1/sections/el1`);
    expect(axios.patch.mock.calls[0][1]).not.toHaveProperty('number');
  });
  it('update_section patches a procedure section', async () => {
    axios.patch.mockResolvedValue({ data: {} });
    await node_funcs.update_section(null, 'p1', 'el1', { title: 't' }, KEY);
    expect(axios.patch.mock.calls[0][0]).toBe(`${AL}/procedures/p1/sections/el1`);
  });
  it('update_section rejects when neither id provided', async () => {
    await expect(node_funcs.update_section(null, null, 'el1', {}, KEY)).rejects.toMatch(/was not provided/);
  });
  it('update_section rejects on error', async () => {
    axios.patch.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.update_section('e1', null, 'el1', {}, KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('get_section gets execution/procedure section and rejects when neither id', async () => {
    axios.get.mockResolvedValue({ data: { s: 1 } });
    await expect(node_funcs.get_section('e1', null, 'el1', KEY)).resolves.toEqual({ s: 1 });
    expect(axios.get).toHaveBeenLastCalledWith(`${AL}/executions/e1/sections/el1`, AUTH);
    await node_funcs.get_section(null, 'p1', 'el1', KEY);
    expect(axios.get).toHaveBeenLastCalledWith(`${AL}/procedures/p1/sections/el1`, AUTH);
    await expect(node_funcs.get_section(null, null, 'el1', KEY)).rejects.toMatch(/was not provided/);
  });
  it('get_section rejects on error', async () => {
    axios.get.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.get_section('e1', null, 'el1', KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('update_paragraph patches execution/procedure and rejects when neither id', async () => {
    axios.patch.mockResolvedValue({ data: {} });
    await node_funcs.update_paragraph('e1', null, 'el1', { text: 'a' }, KEY);
    expect(axios.patch.mock.calls[0][0]).toBe(`${AL}/executions/e1/paragraphs/el1`);
    await node_funcs.update_paragraph(null, 'p1', 'el1', { text: 'a' }, KEY);
    expect(axios.patch.mock.calls[1][0]).toBe(`${AL}/procedures/p1/paragraphs/el1`);
    await expect(node_funcs.update_paragraph(null, null, 'el1', {}, KEY)).rejects.toMatch(/was not provided/);
  });
  it('update_paragraph rejects on error', async () => {
    axios.patch.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.update_paragraph('e1', null, 'el1', {}, KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('get_paragraph gets execution/procedure and rejects when neither id', async () => {
    axios.get.mockResolvedValue({ data: { p: 1 } });
    await expect(node_funcs.get_paragraph('e1', null, 'el1', KEY)).resolves.toEqual({ p: 1 });
    expect(axios.get).toHaveBeenLastCalledWith(`${AL}/executions/e1/paragraphs/el1`, AUTH);
    await node_funcs.get_paragraph(null, 'p1', 'el1', KEY);
    expect(axios.get).toHaveBeenLastCalledWith(`${AL}/procedures/p1/paragraphs/el1`, AUTH);
    await expect(node_funcs.get_paragraph(null, null, 'el1', KEY)).rejects.toMatch(/was not provided/);
  });
  it('get_paragraph rejects on error', async () => {
    axios.get.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.get_paragraph('e1', null, 'el1', KEY)).rejects.toHaveProperty('message', 'boom');
  });
});

describe('step/element update dispatchers', () => {
  it('updateStep routes to execution and procedure and rejects when neither', async () => {
    axios.patch.mockResolvedValue({ data: {} });
    await node_funcs.updateStep('e1', null, 'el1', { number: 'x' }, KEY);
    expect(axios.patch.mock.calls[0][0]).toBe(`${AL}/executions/e1/steps/el1`);
    await node_funcs.updateStep(null, 'p1', 'el1', {}, KEY);
    expect(axios.patch.mock.calls[1][0]).toBe(`${AL}/procedures/p1/steps/el1`);
    await expect(node_funcs.updateStep(null, null, 'el1', {}, KEY)).rejects.toMatch(/was not provided/);
  });
  it('updateExecutionStep rejects on error', async () => {
    axios.patch.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.updateStep('e1', null, 'el1', {}, KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('update_step_input dispatch already covered; updateNonexecutableStepInput routes correctly', async () => {
    axios.patch.mockResolvedValue({ data: {} });
    // via exported update_step_input_nonexecutable already tested; here exercise updateStep procedure error branch
    axios.patch.mockRejectedValueOnce(new Error('boom'));
    await expect(node_funcs.updateStep(null, 'p1', 'el1', {}, KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('updateElement routes to execution and procedure and rejects when neither', async () => {
    axios.patch.mockResolvedValue({ data: {} });
    await node_funcs.updateElement('e1', null, 'el1', { number: 'x' }, KEY);
    expect(axios.patch.mock.calls[0][0]).toBe(`${AL}/executions/e1/elements/el1`);
    await node_funcs.updateElement(null, 'p1', 'el1', {}, KEY);
    expect(axios.patch.mock.calls[1][0]).toBe(`${AL}/procedures/p1/elements/el1`);
    await expect(node_funcs.updateElement(null, null, 'el1', {}, KEY)).rejects.toMatch(/was not provided/);
  });
  it('updateProcedureElement rejects on error', async () => {
    axios.patch.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.updateElement(null, 'p1', 'el1', {}, KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('updateElements routes to execution and procedure and rejects when neither', async () => {
    axios.patch.mockResolvedValue({ data: {} });
    await node_funcs.updateElements('e1', null, [{ elem_id: 'a' }], KEY);
    expect(axios.patch.mock.calls[0][0]).toBe(`${AL}/executions/e1/elements`);
    await node_funcs.updateElements(null, 'p1', [{ elem_id: 'a' }], KEY);
    expect(axios.patch.mock.calls[1][0]).toBe(`${AL}/procedures/p1/elements`);
    await expect(node_funcs.updateElements(null, null, [], KEY)).rejects.toMatch(/was not provided/);
  });
  it('updateExecutionElements rejects on error', async () => {
    axios.patch.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.updateElements('e1', null, [], KEY)).rejects.toHaveProperty('message', 'boom');
  });
  it('updateProcedureElements rejects on error', async () => {
    axios.patch.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.updateElements(null, 'p1', [], KEY)).rejects.toHaveProperty('message', 'boom');
  });
});

describe('redline element operations', () => {
  const activeRedline = (elem_id) => ({ elem_id, number: '1', procedure_modification_status: 'MODIFYING' });
  const inactive = (elem_id) => ({ elem_id, number: '1', procedure_modification_status: 'NONE' });

  it('modifyElement enriches the returned element when present', async () => {
    axios.post.mockResolvedValue({ data: { elem: { elem_id: 'a', step_type: 'WAIT' } } });
    const res = await node_funcs.modifyElement('e1', 'a', KEY);
    expect(axios.post).toHaveBeenCalledWith(`${AL}/executions/e1/elements/a/modify`, {}, AUTH);
    expect(res.elem.elem_id).toBe('a');
  });
  it('modifyElement returns data unchanged when no elem field', async () => {
    axios.post.mockResolvedValue({ data: { other: 1 } });
    await expect(node_funcs.modifyElement('e1', 'a', KEY)).resolves.toEqual({ other: 1 });
  });
  it('modifyElement rejects on error', async () => {
    axios.post.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.modifyElement('e1', 'a', KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('justifyElement patches an active redline with justification fields', async () => {
    axios.get.mockResolvedValue({ data: activeRedline('a') });
    axios.patch.mockResolvedValue({ data: { elem_id: 'a', step_type: 'WAIT' } });
    const res = await node_funcs.justifyElement('e1', 'a', { modification_type: 'EDIT', content: 'why' }, KEY);
    const body = axios.patch.mock.calls[0][1];
    expect(body.procedure_modification.justification.modification_type).toBe('EDIT');
    expect(body.procedure_modification.justification.content).toBe('why');
    expect(res.elem_id).toBe('a');
  });
  it('justifyElement works without justification_input', async () => {
    axios.get.mockResolvedValue({ data: activeRedline('a') });
    axios.patch.mockResolvedValue({ data: { elem_id: 'a' } });
    await node_funcs.justifyElement('e1', 'a', null, KEY);
    expect(axios.patch.mock.calls[0][1]).toEqual({});
  });
  it('justifyElement rejects an inactive redline', async () => {
    axios.get.mockResolvedValue({ data: inactive('a') });
    await expect(node_funcs.justifyElement('e1', 'a', {}, KEY)).rejects.toMatch(/inactive redline/);
  });
  it('justifyElement rejects on patch error', async () => {
    axios.get.mockResolvedValue({ data: activeRedline('a') });
    axios.patch.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.justifyElement('e1', 'a', {}, KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('justifyElements patches multiple active redlines', async () => {
    axios.get.mockResolvedValue({ data: [activeRedline('a'), activeRedline('b')] }); // simple_elements
    axios.patch.mockResolvedValue({ data: [{ elem_id: 'a' }, { elem_id: 'b' }] });
    const res = await node_funcs.justifyElements('e1', ['a', 'b'], { content: 'c' }, KEY);
    expect(res).toHaveLength(2);
    expect(axios.patch.mock.calls[0][1]).toHaveLength(2);
  });
  it('justifyElements rejects when one target is inactive', async () => {
    axios.get.mockResolvedValue({ data: [activeRedline('a'), inactive('b')] });
    await expect(node_funcs.justifyElements('e1', ['a', 'b'], {}, KEY)).rejects.toMatch(/inactive redline/);
  });
  it('justifyElements rejects on patch error', async () => {
    axios.get.mockResolvedValue({ data: [activeRedline('a')] });
    axios.patch.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.justifyElements('e1', ['a'], null, KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('approveElement patches an active redline with approval fields', async () => {
    axios.get.mockResolvedValue({ data: activeRedline('a') });
    axios.patch.mockResolvedValue({ data: { ok: 1 } });
    await node_funcs.approveElement('e1', 'a', { status: 'APPROVED', content: 'ok' }, KEY);
    const body = axios.patch.mock.calls[0][1];
    expect(body.procedure_modification.approval.status).toBe('APPROVED');
    expect(body.procedure_modification.approval.content).toBe('ok');
  });
  it('approveElement works without approval_input', async () => {
    axios.get.mockResolvedValue({ data: activeRedline('a') });
    axios.patch.mockResolvedValue({ data: {} });
    await node_funcs.approveElement('e1', 'a', null, KEY);
    expect(axios.patch.mock.calls[0][1]).toEqual({});
  });
  it('approveElement rejects an inactive redline', async () => {
    axios.get.mockResolvedValue({ data: inactive('a') });
    await expect(node_funcs.approveElement('e1', 'a', {}, KEY)).rejects.toMatch(/inactive redline/);
  });
  it('approveElement rejects on patch error', async () => {
    axios.get.mockResolvedValue({ data: activeRedline('a') });
    axios.patch.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.approveElement('e1', 'a', {}, KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('approveElements patches multiple active redlines', async () => {
    axios.get.mockResolvedValue({ data: [activeRedline('a')] });
    axios.patch.mockResolvedValue({ data: [{ elem_id: 'a' }] });
    const res = await node_funcs.approveElements('e1', ['a'], { status: 'APPROVED' }, KEY);
    expect(res).toHaveLength(1);
  });
  it('approveElements rejects when one target is inactive', async () => {
    axios.get.mockResolvedValue({ data: [inactive('a')] });
    await expect(node_funcs.approveElements('e1', ['a'], {}, KEY)).rejects.toMatch(/inactive redline/);
  });
  it('approveElements rejects on patch error', async () => {
    axios.get.mockResolvedValue({ data: [activeRedline('a')] });
    axios.patch.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.approveElements('e1', ['a'], null, KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('discardElement posts to discard endpoint for an active redline', async () => {
    axios.get.mockResolvedValue({ data: activeRedline('a') });
    axios.post.mockResolvedValue({ data: { discarded: true } });
    await expect(node_funcs.discardElement('e1', 'a', KEY)).resolves.toEqual({ discarded: true });
    expect(axios.post).toHaveBeenCalledWith(`${AL}/executions/e1/elements/a/discard`, {}, AUTH);
  });
  it('discardElement rejects an inactive redline', async () => {
    axios.get.mockResolvedValue({ data: inactive('a') });
    await expect(node_funcs.discardElement('e1', 'a', KEY)).rejects.toMatch(/discard inactive/);
  });
  it('discardElement rejects when fetching the element fails', async () => {
    axios.get.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.discardElement('e1', 'a', KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('discardElements posts discard_input for active redlines', async () => {
    axios.get.mockResolvedValue({ data: [activeRedline('a')] });
    axios.post.mockResolvedValue({ data: { discarded: 1 } });
    await expect(node_funcs.discardElements('e1', { elem_ids: ['a'] }, KEY)).resolves.toEqual({ discarded: 1 });
    expect(axios.post).toHaveBeenCalledWith(`${AL}/executions/e1/elements/discard`, { elem_ids: ['a'] }, AUTH);
  });
  it('discardElements skips the guard when no elem_ids provided', async () => {
    axios.get.mockResolvedValue({ data: [inactive('a')] });
    axios.post.mockResolvedValue({ data: {} });
    await node_funcs.discardElements('e1', {}, KEY);
    expect(axios.post).toHaveBeenCalled();
  });
  it('discardElements rejects when one target is inactive', async () => {
    axios.get.mockResolvedValue({ data: [inactive('a')] });
    await expect(node_funcs.discardElements('e1', { elem_ids: ['a'] }, KEY)).rejects.toMatch(/discard inactive/);
  });
  it('discardElements rejects on post error', async () => {
    axios.get.mockResolvedValue({ data: [activeRedline('a')] });
    axios.post.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.discardElements('e1', { elem_ids: ['a'] }, KEY)).rejects.toHaveProperty('message', 'boom');
  });
});

describe('getAllSteps / getExecutionSimpleElements', () => {
  it('getAllSteps returns execution steps with total_count header', async () => {
    axios.get.mockResolvedValue({ data: [1, 2], headers: { 'x-total-count': 2 } });
    await expect(node_funcs.getAllSteps('e1', null, {}, KEY)).resolves.toEqual({ elems: [1, 2], total_count: 2 });
  });
  it('getAllSteps returns procedure steps and defaults total_count to 0', async () => {
    axios.get.mockResolvedValue({ data: [], headers: {} });
    await expect(node_funcs.getAllSteps(null, 'p1', {}, KEY)).resolves.toEqual({ elems: [], total_count: 0 });
    expect(axios.get.mock.calls[0][0]).toBe(`${AL}/procedures/p1/steps`);
  });
  it('getAllSteps rejects when neither id provided', async () => {
    await expect(node_funcs.getAllSteps(null, null, {}, KEY)).rejects.toMatch(/was not provided/);
  });
  it('getAllSteps rejects on error', async () => {
    axios.get.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.getAllSteps('e1', null, {}, KEY)).rejects.toHaveProperty('message', 'boom');
  });

  it('getExecutionSimpleElements returns data', async () => {
    axios.get.mockResolvedValue({ data: [{ elem_id: 'a' }] });
    await expect(node_funcs.getExecutionSimpleElements('e1', KEY)).resolves.toEqual([{ elem_id: 'a' }]);
  });
  it('getExecutionSimpleElements rejects on error', async () => {
    axios.get.mockRejectedValue(new Error('boom'));
    await expect(node_funcs.getExecutionSimpleElements('e1', KEY)).rejects.toHaveProperty('message', 'boom');
  });
});

describe('getExecutionElements + enrichWithDictionaryConsistency', () => {
  const scriptElem = (script_id, spec_hash, extra) => Object.assign({
    elem_id: 'a', step_type: 'CUSTOM_SCRIPT',
    execution_user_input: Object.assign({ script_id, spec_hash }, extra)
  });

  it('passes elements through unchanged when there are no custom scripts', async () => {
    axios.get.mockResolvedValue({ data: [{ elem_id: 'a', step_type: 'WAIT' }], headers: { 'x-total-count': 1 } });
    const res = await node_funcs.getExecutionElements('e1', null, null, null, null, null, null, null, null, null, null, KEY);
    expect(res).toEqual({ elems: [{ elem_id: 'a', step_type: 'WAIT' }], total_count: 1 });
    expect(axios.post).not.toHaveBeenCalled();
  });

  it('flags LEGACY when a custom script has no spec_hash', async () => {
    axios.get.mockResolvedValue({ data: [scriptElem('s1', undefined)], headers: {} });
    axios.post.mockResolvedValue({ data: [] });
    const res = await node_funcs.getExecutionElements('e1', null, null, null, null, null, null, null, null, null, null, KEY);
    expect(res.elems[0].consistency_flag).toBe('LEGACY');
  });

  it('flags DELETED when the script is missing from the dictionary', async () => {
    axios.get.mockResolvedValue({ data: [scriptElem('s1', 'h1')], headers: {} });
    axios.post
      .mockResolvedValueOnce({ data: [] })                        // palette
      .mockResolvedValueOnce({ data: [] });                       // custom_scripts (no s1)
    const res = await node_funcs.getExecutionElements('e1', null, null, null, null, null, null, null, null, null, null, KEY);
    expect(res.elems[0].consistency_flag).toBe('DELETED');
  });

  // NOTE: the MISSING_IN_PALLETTE branch checks `info.step_display_name`, but
  // getScriptInfo() only returns { script_id, spec_hash }, so step_display_name
  // is always undefined and that branch is unreachable. Documented, not tested.

  it('flags SPEC_HASH_MISMATCHED when hashes differ', async () => {
    axios.get.mockResolvedValue({ data: [scriptElem('s1', 'h1')], headers: {} });
    axios.post
      .mockResolvedValueOnce({ data: [{ step_id: 's1' }] })
      .mockResolvedValueOnce({ data: [{ script_id: 's1', spec_hash: 'h2' }] });
    const res = await node_funcs.getExecutionElements('e1', null, null, null, null, null, null, null, null, null, null, KEY);
    expect(res.elems[0].consistency_flag).toBe('SPEC_HASH_MISMATCHED');
  });

  it('flags CONSISTENT when everything matches', async () => {
    axios.get.mockResolvedValue({ data: [scriptElem('s1', 'h1')], headers: {} });
    axios.post
      .mockResolvedValueOnce({ data: [{ step_id: 's1' }] })
      .mockResolvedValueOnce({ data: [{ script_id: 's1', spec_hash: 'h1' }] });
    const res = await node_funcs.getExecutionElements('e1', null, null, null, null, null, null, null, null, null, null, KEY);
    expect(res.elems[0].consistency_flag).toBe('CONSISTENT');
  });

  it('returns elements unchanged when the dictionary lookup throws', async () => {
    axios.get.mockResolvedValue({ data: [scriptElem('s1', 'h1')], headers: {} });
    axios.post.mockRejectedValue(new Error('dict down'));
    const res = await node_funcs.getExecutionElements('e1', null, null, null, null, null, null, null, null, null, null, KEY);
    expect(res.elems[0]).not.toHaveProperty('consistency_flag');
  });

  it('uses authoring_user_input when execution_user_input has no script_id', async () => {
    axios.get.mockResolvedValue({
      data: [{ elem_id: 'a', step_type: 'CUSTOM_SCRIPT', authoring_user_input: { script_id: 's1', spec_hash: 'h1' } }],
      headers: {}
    });
    axios.post
      .mockResolvedValueOnce({ data: [{ step_id: 's1' }] })
      .mockResolvedValueOnce({ data: [{ script_id: 's1', spec_hash: 'h1' }] });
    const res = await node_funcs.getExecutionElements('e1', null, null, null, null, null, null, null, null, null, null, KEY);
    expect(res.elems[0].consistency_flag).toBe('CONSISTENT');
    expect(axios.post.mock.calls[0][0]).toBe(`${DL}/step_palette/custom/bulk_query`);
  });

  it('rejects when the elements request fails', async () => {
    axios.get.mockRejectedValue(new Error('boom'));
    await expect(
      node_funcs.getExecutionElements('e1', null, null, null, null, null, null, null, null, null, null, KEY)
    ).rejects.toHaveProperty('message', 'boom');
  });
});
