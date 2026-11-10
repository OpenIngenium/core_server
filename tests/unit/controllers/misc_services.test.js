'use strict';

// Coverage for the non-step content services (sections, paragraphs, TOC,
// generic step endpoints) and their procedure-side counterparts.

jest.mock('../../../api/node_funcs', () => ({
  get_auth_key: jest.fn(),
  push_error: jest.fn(),
  log: { debug: jest.fn(), info: jest.fn(), warning: jest.fn(), error: jest.fn(), trace: jest.fn(), critical: jest.fn() },
  redis: {},
  createArchiveElement: jest.fn(),
  getAllSections: jest.fn(),
  get_section: jest.fn(),
  update_section: jest.fn(),
  getAllParagraphs: jest.fn(),
  get_paragraph: jest.fn(),
  update_paragraph: jest.fn(),
  getExecutionElements: jest.fn(),
  getProcedureElements: jest.fn(),
  getStep: jest.fn(),
  updateStep: jest.fn(),
  get_step_input: jest.fn(),
  get_step_result: jest.fn(),
  update_step_input: jest.fn(),
  update_step_result: jest.fn(),
  getExecution: jest.fn(),
  get_step_completion_status: jest.fn(),
  is_closed: jest.fn(),
  create_new_run: jest.fn(),
  override_step: jest.fn(),
  update_override_step: jest.fn(),
  discard_override_step: jest.fn(),
  validate_procedure_element: jest.fn()
}));

const node_funcs = require('../../../api/node_funcs');
const { swaggerArg: sv } = require('../mocks/testHelpers');

const Section = require('../../../api/controllers/SectionService');
const Paragraph = require('../../../api/controllers/ParagraphService');
const TOC = require('../../../api/controllers/TOCService');
const Step = require('../../../api/controllers/StepService');
const PSection = require('../../../api/controllers/Procedure_SectionService');
const PParagraph = require('../../../api/controllers/Procedure_ParagraphService');
const PTOC = require('../../../api/controllers/Procedure_TOCService');
const PStep = require('../../../api/controllers/Procedure_StepService');
const PElement = require('../../../api/controllers/Procedure_ElementService');

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

// Helper for the common success + error pair.
async function expectSuccess(fn, args, mockFn, resolved, assertion) {
  mockFn.mockResolvedValue(resolved);
  const res = createRes();
  await fn(args, res, noop, H);
  assertion(res);
}
async function expectError(fn, args, mockFn) {
  mockFn.mockRejectedValue(new Error('x'));
  const res = createRes();
  await fn(args, res, noop, H);
  expect(res.statusCode).toBe(400);
}

describe('SectionService', () => {
  it('create_section: explicit + defaults + error', async () => {
    node_funcs.createArchiveElement.mockResolvedValue({ ok: 1 });
    let res = createRes();
    await Section.create_section({ execution_id: sv('e'), section: sv({ s: 1 }), insert_after_id: sv('a'), level: sv('CHILD') }, res, noop, H);
    expect(node_funcs.createArchiveElement).toHaveBeenCalledWith('e', null, 'SECTION', null, { s: 1 }, 'a', 'CHILD', 'AUTHKEY');
    expect(res.body).toEqual({ ok: 1 });

    node_funcs.createArchiveElement.mockResolvedValue({});
    res = createRes();
    await Section.create_section({ execution_id: sv('e') }, res, noop, H);
    expect(node_funcs.createArchiveElement).toHaveBeenCalledWith('e', null, 'SECTION', null, null, '-1', 'SIBLING', 'AUTHKEY');

    await expectError(Section.create_section, { execution_id: sv('e') }, node_funcs.createArchiveElement);
  });

  it('get_execution_sections: success + undefined coercion + error', async () => {
    node_funcs.getAllSections.mockResolvedValue({ elems: [1], total_count: 1 });
    let res = createRes();
    await Section.get_execution_sections({ execution_id: sv('e'), offset: sv(0), limit: sv(5), sort: sv('ASC') }, res, noop, H);
    expect(node_funcs.getAllSections).toHaveBeenCalledWith('e', null, 0, 5, 'ASC', 'AUTHKEY');
    expect(res.headers['x-total-count']).toBe(1);

    node_funcs.getAllSections.mockResolvedValue({ elems: [], total_count: 0 });
    res = createRes();
    await Section.get_execution_sections({ execution_id: sv(undefined), offset: sv(undefined), limit: sv(undefined), sort: sv(undefined) }, res, noop, H);
    expect(node_funcs.getAllSections).toHaveBeenCalledWith(null, null, null, null, null, 'AUTHKEY');

    await expectError(Section.get_execution_sections, { execution_id: sv('e'), offset: sv(0), limit: sv(5), sort: sv('A') }, node_funcs.getAllSections);
  });

  it('get_section + update_section', async () => {
    await expectSuccess(Section.get_section, { execution_id: sv('e'), elem_id: sv('el') }, node_funcs.get_section, { d: 1 }, (res) => {
      expect(node_funcs.get_section).toHaveBeenCalledWith('e', null, 'el', 'AUTHKEY');
      expect(res.body).toEqual({ d: 1 });
    });
    await expectError(Section.get_section, { execution_id: sv('e'), elem_id: sv('el') }, node_funcs.get_section);

    await expectSuccess(Section.update_section, { execution_id: sv('e'), elem_id: sv('el'), section: sv({ s: 1 }) }, node_funcs.update_section, { ok: 1 }, (res) => {
      expect(node_funcs.update_section).toHaveBeenCalledWith('e', null, 'el', { s: 1 }, 'AUTHKEY');
    });
    await expectError(Section.update_section, { execution_id: sv('e'), elem_id: sv('el'), section: sv({}) }, node_funcs.update_section);
  });
});

describe('ParagraphService', () => {
  it('create_paragraph: explicit + defaults + error', async () => {
    node_funcs.createArchiveElement.mockResolvedValue({ ok: 1 });
    let res = createRes();
    await Paragraph.create_paragraph({ execution_id: sv('e'), paragraph: sv({ p: 1 }), insert_after_id: sv('a'), level: sv('CHILD') }, res, noop, H);
    expect(node_funcs.createArchiveElement).toHaveBeenCalledWith('e', null, 'PARAGRAPH', null, { p: 1 }, 'a', 'CHILD', 'AUTHKEY');

    node_funcs.createArchiveElement.mockResolvedValue({});
    res = createRes();
    await Paragraph.create_paragraph({ execution_id: sv('e') }, res, noop, H);
    expect(node_funcs.createArchiveElement).toHaveBeenCalledWith('e', null, 'PARAGRAPH', null, null, '-1', 'SIBLING', 'AUTHKEY');

    await expectError(Paragraph.create_paragraph, { execution_id: sv('e') }, node_funcs.createArchiveElement);
  });

  it('get_execution_paragraphs + get_paragraph + update_paragraph', async () => {
    node_funcs.getAllParagraphs.mockResolvedValue({ elems: [1], total_count: 1 });
    let res = createRes();
    await Paragraph.get_execution_paragraphs({ execution_id: sv('e'), offset: sv(0), limit: sv(5), sort: sv('ASC') }, res, noop, H);
    expect(node_funcs.getAllParagraphs).toHaveBeenCalledWith('e', null, 0, 5, 'ASC', 'AUTHKEY');
    expect(res.headers['x-total-count']).toBe(1);

    node_funcs.getAllParagraphs.mockResolvedValue({ elems: [], total_count: 0 });
    res = createRes();
    await Paragraph.get_execution_paragraphs({ execution_id: sv(undefined), offset: sv(undefined), limit: sv(undefined), sort: sv(undefined) }, res, noop, H);
    expect(node_funcs.getAllParagraphs).toHaveBeenCalledWith(null, null, null, null, null, 'AUTHKEY');
    await expectError(Paragraph.get_execution_paragraphs, { execution_id: sv('e'), offset: sv(0), limit: sv(5), sort: sv('A') }, node_funcs.getAllParagraphs);

    await expectSuccess(Paragraph.get_paragraph, { execution_id: sv('e'), elem_id: sv('el') }, node_funcs.get_paragraph, { d: 1 }, (r) => {
      expect(node_funcs.get_paragraph).toHaveBeenCalledWith('e', null, 'el', 'AUTHKEY');
    });
    await expectError(Paragraph.get_paragraph, { execution_id: sv('e'), elem_id: sv('el') }, node_funcs.get_paragraph);

    await expectSuccess(Paragraph.update_paragraph, { execution_id: sv('e'), elem_id: sv('el'), paragraph: sv({ p: 1 }) }, node_funcs.update_paragraph, {}, (r) => {
      expect(node_funcs.update_paragraph).toHaveBeenCalledWith('e', null, 'el', { p: 1 }, 'AUTHKEY');
    });
    await expectError(Paragraph.update_paragraph, { execution_id: sv('e'), elem_id: sv('el'), paragraph: sv({}) }, node_funcs.update_paragraph);
  });
});

describe('TOCService', () => {
  it('create_toc_step: explicit + defaults + error', async () => {
    node_funcs.createArchiveElement.mockResolvedValue({});
    let res = createRes();
    await TOC.create_toc_step({ execution_id: sv('e'), step: sv({ t: 1 }), insert_after_id: sv('a'), level: sv('CHILD') }, res, noop, H);
    expect(node_funcs.createArchiveElement).toHaveBeenCalledWith('e', null, 'STEP', 'TOC', { t: 1 }, 'a', 'CHILD', 'AUTHKEY');
    res = createRes();
    await TOC.create_toc_step({ execution_id: sv('e') }, res, noop, H);
    expect(node_funcs.createArchiveElement).toHaveBeenCalledWith('e', null, 'STEP', 'TOC', null, '-1', 'SIBLING', 'AUTHKEY');
    await expectError(TOC.create_toc_step, { execution_id: sv('e') }, node_funcs.createArchiveElement);
  });

  it('get_execution_toc_steps + get_toc_step + update_toc_step', async () => {
    node_funcs.getExecutionElements.mockResolvedValue({ elems: [1], total_count: 1 });
    let res = createRes();
    await TOC.get_execution_toc_steps({ execution_id: sv('e'), offset: sv(0), limit: sv(5), sort: sv('ASC') }, res, noop, H);
    expect(node_funcs.getExecutionElements).toHaveBeenCalledWith('e', 'STEP', 'TOC', 0, 5, 'ASC', null, null, null, null, null, 'AUTHKEY');
    res = createRes();
    node_funcs.getExecutionElements.mockResolvedValue({ elems: [], total_count: 0 });
    await TOC.get_execution_toc_steps({ execution_id: sv(undefined), offset: sv(undefined), limit: sv(undefined), sort: sv(undefined) }, res, noop, H);
    expect(node_funcs.getExecutionElements).toHaveBeenCalledWith(null, 'STEP', 'TOC', null, null, null, null, null, null, null, null, 'AUTHKEY');
    await expectError(TOC.get_execution_toc_steps, { execution_id: sv('e'), offset: sv(0), limit: sv(5), sort: sv('A') }, node_funcs.getExecutionElements);

    await expectSuccess(TOC.get_toc_step, { execution_id: sv('e'), elem_id: sv('el') }, node_funcs.getStep, { d: 1 }, (r) => {
      expect(node_funcs.getStep).toHaveBeenCalledWith('e', null, 'el', 'AUTHKEY');
    });
    await expectError(TOC.get_toc_step, { execution_id: sv('e'), elem_id: sv('el') }, node_funcs.getStep);
    await expectSuccess(TOC.update_toc_step, { execution_id: sv('e'), elem_id: sv('el'), step: sv({ t: 1 }) }, node_funcs.updateStep, {}, (r) => {
      expect(node_funcs.updateStep).toHaveBeenCalledWith('e', null, 'el', { t: 1 }, 'AUTHKEY');
    });
    await expectError(TOC.update_toc_step, { execution_id: sv('e'), elem_id: sv('el'), step: sv({}) }, node_funcs.updateStep);
  });
});

describe('StepService', () => {
  it('get_step / get_step_input / get_step_result', async () => {
    await expectSuccess(Step.get_step, { execution_id: sv('e'), elem_id: sv('el') }, node_funcs.getStep, { d: 1 }, (r) => {
      expect(node_funcs.getStep).toHaveBeenCalledWith('e', null, 'el', 'AUTHKEY');
    });
    await expectError(Step.get_step, { execution_id: sv('e'), elem_id: sv('el') }, node_funcs.getStep);
    await expectSuccess(Step.get_step_input, { execution_id: sv('e'), elem_id: sv('el') }, node_funcs.get_step_input, {}, (r) => {
      expect(node_funcs.get_step_input).toHaveBeenCalledWith('e', null, 'el', 'AUTHKEY');
    });
    await expectError(Step.get_step_input, { execution_id: sv('e'), elem_id: sv('el') }, node_funcs.get_step_input);
    await expectSuccess(Step.get_step_result, { execution_id: sv('e'), elem_id: sv('el') }, node_funcs.get_step_result, {}, (r) => {
      expect(node_funcs.get_step_result).toHaveBeenCalledWith('e', 'el', 'AUTHKEY');
    });
    await expectError(Step.get_step_result, { execution_id: sv('e'), elem_id: sv('el') }, node_funcs.get_step_result);
  });

  it('update_step + update_step_input', async () => {
    await expectSuccess(Step.update_step, { execution_id: sv('e'), elem_id: sv('el'), step: sv({ s: 1 }) }, node_funcs.updateStep, {}, (r) => {
      expect(node_funcs.updateStep).toHaveBeenCalledWith('e', null, 'el', { s: 1 }, 'AUTHKEY');
    });
    await expectError(Step.update_step, { execution_id: sv('e'), elem_id: sv('el'), step: sv({}) }, node_funcs.updateStep);

    node_funcs.update_step_input.mockResolvedValue({});
    let res = createRes();
    await Step.update_step_input({ execution_id: sv('e'), elem_id: sv('el'), user_input: sv({}) }, res, noop, H);
    expect(node_funcs.update_step_input).toHaveBeenCalledWith('e', null, 'el', {}, 'AUTHKEY');
    expect(res.statusCode).toBe(204);
    await expectError(Step.update_step_input, { execution_id: sv('e'), elem_id: sv('el'), user_input: sv({}) }, node_funcs.update_step_input);
  });

  describe('update_step_result', () => {
    const baseArgs = { execution_id: sv('e'), elem_id: sv('el'), result: sv({ r: 1 }) };

    it('returns 400 when getStep fails', async () => {
      node_funcs.getStep.mockRejectedValue(new Error('boom'));
      const res = createRes();
      await Step.update_step_result(baseArgs, res, noop, H);
      expect(res.statusCode).toBe(400);
      expect(node_funcs.getExecution).not.toHaveBeenCalled();
    });

    it('returns 400 when getExecution fails', async () => {
      node_funcs.getStep.mockResolvedValue({ executable: 'EXECUTED', number: 1, elem_id: 'el' });
      node_funcs.get_step_completion_status.mockReturnValue(null);
      node_funcs.getExecution.mockRejectedValue(new Error('boom'));
      const res = createRes();
      await Step.update_step_result(baseArgs, res, noop, H);
      expect(res.statusCode).toBe(400);
    });

    it('returns 400 when execution is closed', async () => {
      node_funcs.getStep.mockResolvedValue({ executable: 'EXECUTED', number: 1, elem_id: 'el' });
      node_funcs.get_step_completion_status.mockReturnValue(null);
      node_funcs.getExecution.mockResolvedValue({});
      node_funcs.is_closed.mockReturnValue(true);
      const res = createRes();
      await Step.update_step_result(baseArgs, res, noop, H);
      expect(res.statusCode).toBe(400);
      expect(res.body.error_type).toBe('STEP_ERROR');
    });

    it('returns 400 when step already completed', async () => {
      node_funcs.getStep.mockResolvedValue({ executable: 'EXECUTED', number: 1, elem_id: 'el' });
      node_funcs.get_step_completion_status.mockReturnValue('PASS');
      node_funcs.getExecution.mockResolvedValue({});
      node_funcs.is_closed.mockReturnValue(false);
      const res = createRes();
      await Step.update_step_result(baseArgs, res, noop, H);
      expect(res.statusCode).toBe(400);
      expect(res.body.error_type).toBe('STEP_ERROR');
    });

    it('updates and returns 200 when allowed', async () => {
      node_funcs.getStep.mockResolvedValue({ executable: 'NONEXECUTED', number: 1, elem_id: 'el' });
      node_funcs.get_step_completion_status.mockReturnValue(null);
      node_funcs.getExecution.mockResolvedValue({});
      node_funcs.is_closed.mockReturnValue(false);
      node_funcs.update_step_result.mockResolvedValue({ updated: true });
      const res = createRes();
      await Step.update_step_result(baseArgs, res, noop, H);
      expect(node_funcs.update_step_result).toHaveBeenCalledWith('e', 'el', { r: 1 }, 'AUTHKEY');
      expect(res.statusCode).toBe(200);
      expect(res.body).toEqual({ updated: true });
    });

    it('returns 400 when update_step_result rejects', async () => {
      node_funcs.getStep.mockResolvedValue({ executable: 'NONEXECUTED', number: 1, elem_id: 'el' });
      node_funcs.get_step_completion_status.mockReturnValue(null);
      node_funcs.getExecution.mockResolvedValue({});
      node_funcs.is_closed.mockReturnValue(false);
      node_funcs.update_step_result.mockRejectedValue(new Error('boom'));
      const res = createRes();
      await Step.update_step_result(baseArgs, res, noop, H);
      expect(res.statusCode).toBe(400);
    });
  });

  it('create_new_run / override_step / update_override_step / discard_override_step', async () => {
    await expectSuccess(Step.create_new_run, { execution_id: sv('e'), elem_id: sv('el') }, node_funcs.create_new_run, {}, (r) => {
      expect(node_funcs.create_new_run).toHaveBeenCalledWith('e', 'el', 'AUTHKEY');
    });
    await expectError(Step.create_new_run, { execution_id: sv('e'), elem_id: sv('el') }, node_funcs.create_new_run);

    await expectSuccess(Step.override_step, { execution_id: sv('e'), elem_id: sv('el'), override_input: sv({ o: 1 }) }, node_funcs.override_step, {}, (r) => {
      expect(node_funcs.override_step).toHaveBeenCalledWith('e', 'el', { o: 1 }, 'AUTHKEY');
    });
    await expectError(Step.override_step, { execution_id: sv('e'), elem_id: sv('el'), override_input: sv({}) }, node_funcs.override_step);

    await expectSuccess(Step.update_override_step, { execution_id: sv('e'), elem_id: sv('el'), override_input: sv({ o: 1 }) }, node_funcs.update_override_step, {}, (r) => {
      expect(node_funcs.update_override_step).toHaveBeenCalledWith('e', 'el', { o: 1 }, 'AUTHKEY');
    });
    await expectError(Step.update_override_step, { execution_id: sv('e'), elem_id: sv('el'), override_input: sv({}) }, node_funcs.update_override_step);

    await expectSuccess(Step.discard_override_step, { execution_id: sv('e'), elem_id: sv('el') }, node_funcs.discard_override_step, {}, (r) => {
      expect(node_funcs.discard_override_step).toHaveBeenCalledWith('e', 'el', 'AUTHKEY');
    });
    await expectError(Step.discard_override_step, { execution_id: sv('e'), elem_id: sv('el') }, node_funcs.discard_override_step);
  });
});

describe('Procedure_SectionService', () => {
  it('create/get/get_sections/update', async () => {
    node_funcs.createArchiveElement.mockResolvedValue({});
    let res = createRes();
    await PSection.procedure_create_section({ procedure_id: sv('p'), section: sv({ s: 1 }), insert_after_id: sv('a'), level: sv('CHILD') }, res, noop, H);
    expect(node_funcs.createArchiveElement).toHaveBeenCalledWith(null, 'p', 'SECTION', null, { s: 1 }, 'a', 'CHILD', 'AUTHKEY');
    res = createRes();
    await PSection.procedure_create_section({ procedure_id: sv('p') }, res, noop, H);
    expect(node_funcs.createArchiveElement).toHaveBeenCalledWith(null, 'p', 'SECTION', null, null, '-1', 'SIBLING', 'AUTHKEY');
    await expectError(PSection.procedure_create_section, { procedure_id: sv('p') }, node_funcs.createArchiveElement);

    node_funcs.getAllSections.mockResolvedValue({ elems: [1], total_count: 1 });
    res = createRes();
    await PSection.procedure_get_sections({ procedure_id: sv('p'), offset: sv(0), limit: sv(5), sort: sv('ASC') }, res, noop, H);
    expect(node_funcs.getAllSections).toHaveBeenCalledWith(null, 'p', 0, 5, 'ASC', 'AUTHKEY');
    node_funcs.getAllSections.mockResolvedValue({ elems: [], total_count: 0 });
    res = createRes();
    await PSection.procedure_get_sections({ procedure_id: sv(undefined), offset: sv(undefined), limit: sv(undefined), sort: sv(undefined) }, res, noop, H);
    expect(node_funcs.getAllSections).toHaveBeenCalledWith(null, null, null, null, null, 'AUTHKEY');
    await expectError(PSection.procedure_get_sections, { procedure_id: sv('p'), offset: sv(0), limit: sv(5), sort: sv('A') }, node_funcs.getAllSections);

    await expectSuccess(PSection.procedure_get_section, { procedure_id: sv('p'), elem_id: sv('el') }, node_funcs.get_section, {}, (r) => {
      expect(node_funcs.get_section).toHaveBeenCalledWith(null, 'p', 'el', 'AUTHKEY');
    });
    await expectError(PSection.procedure_get_section, { procedure_id: sv('p'), elem_id: sv('el') }, node_funcs.get_section);
    await expectSuccess(PSection.procedure_update_section, { procedure_id: sv('p'), elem_id: sv('el'), section: sv({ s: 1 }) }, node_funcs.update_section, {}, (r) => {
      expect(node_funcs.update_section).toHaveBeenCalledWith(null, 'p', 'el', { s: 1 }, 'AUTHKEY');
    });
    await expectError(PSection.procedure_update_section, { procedure_id: sv('p'), elem_id: sv('el'), section: sv({}) }, node_funcs.update_section);
  });
});

describe('Procedure_ParagraphService', () => {
  it('create/get/get_paragraphs/update', async () => {
    node_funcs.createArchiveElement.mockResolvedValue({});
    let res = createRes();
    await PParagraph.procedure_create_paragraph({ procedure_id: sv('p'), paragraph: sv({ p: 1 }), insert_after_id: sv('a'), level: sv('CHILD') }, res, noop, H);
    expect(node_funcs.createArchiveElement).toHaveBeenCalledWith(null, 'p', 'PARAGRAPH', null, { p: 1 }, 'a', 'CHILD', 'AUTHKEY');
    res = createRes();
    await PParagraph.procedure_create_paragraph({ procedure_id: sv('p') }, res, noop, H);
    expect(node_funcs.createArchiveElement).toHaveBeenCalledWith(null, 'p', 'PARAGRAPH', null, null, '-1', 'SIBLING', 'AUTHKEY');
    await expectError(PParagraph.procedure_create_paragraph, { procedure_id: sv('p') }, node_funcs.createArchiveElement);

    node_funcs.getAllParagraphs.mockResolvedValue({ elems: [1], total_count: 1 });
    res = createRes();
    await PParagraph.procedure_get_paragraphs({ procedure_id: sv('p'), offset: sv(0), limit: sv(5), sort: sv('ASC') }, res, noop, H);
    expect(node_funcs.getAllParagraphs).toHaveBeenCalledWith(null, 'p', 0, 5, 'ASC', 'AUTHKEY');
    node_funcs.getAllParagraphs.mockResolvedValue({ elems: [], total_count: 0 });
    res = createRes();
    await PParagraph.procedure_get_paragraphs({ procedure_id: sv(undefined), offset: sv(undefined), limit: sv(undefined), sort: sv(undefined) }, res, noop, H);
    expect(node_funcs.getAllParagraphs).toHaveBeenCalledWith(null, null, null, null, null, 'AUTHKEY');
    await expectError(PParagraph.procedure_get_paragraphs, { procedure_id: sv('p'), offset: sv(0), limit: sv(5), sort: sv('A') }, node_funcs.getAllParagraphs);

    await expectSuccess(PParagraph.procedure_get_paragraph, { procedure_id: sv('p'), elem_id: sv('el') }, node_funcs.get_paragraph, {}, (r) => {
      expect(node_funcs.get_paragraph).toHaveBeenCalledWith(null, 'p', 'el', 'AUTHKEY');
    });
    await expectError(PParagraph.procedure_get_paragraph, { procedure_id: sv('p'), elem_id: sv('el') }, node_funcs.get_paragraph);
    await expectSuccess(PParagraph.procedure_update_paragraph, { procedure_id: sv('p'), elem_id: sv('el'), paragraph: sv({ p: 1 }) }, node_funcs.update_paragraph, {}, (r) => {
      expect(node_funcs.update_paragraph).toHaveBeenCalledWith(null, 'p', 'el', { p: 1 }, 'AUTHKEY');
    });
    await expectError(PParagraph.procedure_update_paragraph, { procedure_id: sv('p'), elem_id: sv('el'), paragraph: sv({}) }, node_funcs.update_paragraph);
  });
});

describe('Procedure_TOCService', () => {
  it('create/get/get_steps/update', async () => {
    node_funcs.createArchiveElement.mockResolvedValue({});
    let res = createRes();
    await PTOC.create_procedure_toc_step({ procedure_id: sv('p'), step: sv({ t: 1 }), insert_after_id: sv('a'), level: sv('CHILD') }, res, noop, H);
    expect(node_funcs.createArchiveElement).toHaveBeenCalledWith(null, 'p', 'STEP', 'TOC', { t: 1 }, 'a', 'CHILD', 'AUTHKEY');
    res = createRes();
    await PTOC.create_procedure_toc_step({ procedure_id: sv('p') }, res, noop, H);
    expect(node_funcs.createArchiveElement).toHaveBeenCalledWith(null, 'p', 'STEP', 'TOC', null, '-1', 'SIBLING', 'AUTHKEY');
    await expectError(PTOC.create_procedure_toc_step, { procedure_id: sv('p') }, node_funcs.createArchiveElement);

    node_funcs.getProcedureElements.mockResolvedValue({ elems: [1], total_count: 1 });
    res = createRes();
    await PTOC.get_procedure_toc_steps({ procedure_id: sv('p'), offset: sv(0), limit: sv(5), sort: sv('ASC') }, res, noop, H);
    expect(node_funcs.getProcedureElements).toHaveBeenCalledWith('p', 'STEP', 'TOC', 0, 5, 'ASC', null, 'AUTHKEY');
    node_funcs.getProcedureElements.mockResolvedValue({ elems: [], total_count: 0 });
    res = createRes();
    await PTOC.get_procedure_toc_steps({ procedure_id: sv(undefined), offset: sv(undefined), limit: sv(undefined), sort: sv(undefined) }, res, noop, H);
    expect(node_funcs.getProcedureElements).toHaveBeenCalledWith(null, 'STEP', 'TOC', null, null, null, null, 'AUTHKEY');
    await expectError(PTOC.get_procedure_toc_steps, { procedure_id: sv('p'), offset: sv(0), limit: sv(5), sort: sv('A') }, node_funcs.getProcedureElements);

    await expectSuccess(PTOC.get_procedure_toc_step, { procedure_id: sv('p'), elem_id: sv('el') }, node_funcs.getStep, {}, (r) => {
      expect(node_funcs.getStep).toHaveBeenCalledWith(null, 'p', 'el', 'AUTHKEY');
    });
    await expectError(PTOC.get_procedure_toc_step, { procedure_id: sv('p'), elem_id: sv('el') }, node_funcs.getStep);
    await expectSuccess(PTOC.update_procedure_toc_step, { procedure_id: sv('p'), elem_id: sv('el'), step: sv({ t: 1 }) }, node_funcs.updateStep, {}, (r) => {
      expect(node_funcs.updateStep).toHaveBeenCalledWith(null, 'p', 'el', { t: 1 }, 'AUTHKEY');
    });
    await expectError(PTOC.update_procedure_toc_step, { procedure_id: sv('p'), elem_id: sv('el'), step: sv({}) }, node_funcs.updateStep);
  });
});

describe('Procedure_StepService', () => {
  it('get/get_input/update/update_input', async () => {
    await expectSuccess(PStep.procedure_get_step, { procedure_id: sv('p'), elem_id: sv('el') }, node_funcs.getStep, {}, (r) => {
      expect(node_funcs.getStep).toHaveBeenCalledWith(null, 'p', 'el', 'AUTHKEY');
    });
    await expectError(PStep.procedure_get_step, { procedure_id: sv('p'), elem_id: sv('el') }, node_funcs.getStep);
    await expectSuccess(PStep.procedure_get_step_input, { procedure_id: sv('p'), elem_id: sv('el') }, node_funcs.get_step_input, {}, (r) => {
      expect(node_funcs.get_step_input).toHaveBeenCalledWith(null, 'p', 'el', 'AUTHKEY');
    });
    await expectError(PStep.procedure_get_step_input, { procedure_id: sv('p'), elem_id: sv('el') }, node_funcs.get_step_input);
    await expectSuccess(PStep.procedure_update_step, { procedure_id: sv('p'), elem_id: sv('el'), step: sv({ s: 1 }) }, node_funcs.updateStep, {}, (r) => {
      expect(node_funcs.updateStep).toHaveBeenCalledWith(null, 'p', 'el', { s: 1 }, 'AUTHKEY');
    });
    await expectError(PStep.procedure_update_step, { procedure_id: sv('p'), elem_id: sv('el'), step: sv({}) }, node_funcs.updateStep);

    node_funcs.update_step_input.mockResolvedValue({});
    const res = createRes();
    await PStep.procedure_update_step_input({ procedure_id: sv('p'), elem_id: sv('el'), user_input: sv({}) }, res, noop, H);
    expect(node_funcs.update_step_input).toHaveBeenCalledWith(null, 'p', 'el', {}, 'AUTHKEY');
    expect(res.statusCode).toBe(204);
    await expectError(PStep.procedure_update_step_input, { procedure_id: sv('p'), elem_id: sv('el'), user_input: sv({}) }, node_funcs.update_step_input);
  });
});

describe('Procedure_ElementService.validate_procedure_element', () => {
  it('validates with provided input', async () => {
    node_funcs.validate_procedure_element.mockResolvedValue({ ok: 1 });
    const res = createRes();
    await PElement.validate_procedure_element({ procedure_id: sv('p'), elem_id: sv('el'), validation_input: sv({ v: 1 }) }, res, noop, H);
    expect(node_funcs.validate_procedure_element).toHaveBeenCalledWith('p', 'el', { v: 1 }, 'AUTHKEY');
    expect(res.body).toEqual({ ok: 1 });
  });
  it('defaults validation_input to null when falsy', async () => {
    node_funcs.validate_procedure_element.mockResolvedValue({});
    const res = createRes();
    await PElement.validate_procedure_element({ procedure_id: sv('p'), elem_id: sv('el'), validation_input: sv(null) }, res, noop, H);
    expect(node_funcs.validate_procedure_element).toHaveBeenCalledWith('p', 'el', null, 'AUTHKEY');
  });
  it('returns 400 on error', async () => {
    await expectError(PElement.validate_procedure_element, { procedure_id: sv('p'), elem_id: sv('el'), validation_input: sv({ v: 1 }) }, node_funcs.validate_procedure_element);
  });
});
