'use strict';

const { step_dict } = require('../../api/step_definitions');

describe('step_definitions', () => {
  it('exports a non-empty step dictionary', () => {
    expect(step_dict).toBeDefined();
    expect(Object.keys(step_dict).length).toBeGreaterThan(0);
  });

  it('keys each entry by its own step_type where step_type is defined', () => {
    Object.keys(step_dict).forEach((key) => {
      const entry = step_dict[key];
      if (entry.step_type !== undefined) {
        expect(entry.step_type).toBe(key);
      }
    });
  });

  it('gives every entry an elem_type and a specification', () => {
    Object.values(step_dict).forEach((entry) => {
      expect(typeof entry.elem_type).toBe('string');
      expect(entry.elem_type.length).toBeGreaterThan(0);
      expect(entry.specification).toBeDefined();
    });
  });

  it('provides matching authoring and execution user input for MANUAL_INPUT', () => {
    const manual = step_dict.MANUAL_INPUT;
    expect(manual.elem_type).toBe('STEP');
    expect(manual.verifiable).toBe(true);
    expect(manual.specification.authoring_user_input.entries).toHaveLength(1);
    expect(manual.specification.execution_user_input.entries[0]).toHaveProperty(
      'actual_value'
    );
    expect(manual.specification.results.entries[0].verification_status).toBe('FAIL');
  });

  it('defines the PROCEDURE_SECTION container element', () => {
    const section = step_dict.PROCEDURE_SECTION;
    expect(section.elem_type).toBe('PROCEDURE_SECTION');
    expect(section.specification.authoring_user_input.elements).toEqual([]);
    expect(section.specification.execution_user_input.run_for_score).toBe(false);
  });
});
