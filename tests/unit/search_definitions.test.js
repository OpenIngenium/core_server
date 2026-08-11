'use strict';

const search = require('../../api/search_definitions');

describe('search_definitions', () => {
  describe('authoring_field_map', () => {
    it('keeps non-prefixed field keys unchanged', () => {
      expect(search.authoring_field_map.TITLE).toEqual({
        title: { replaceable: true, is_html: false }
      });
      expect(search.authoring_field_map.DESCRIPTION).toEqual({
        description: { replaceable: true, is_html: true }
      });
    });

    it('prefixes dot-leading keys with authoring_user_input', () => {
      expect(search.authoring_field_map.START_TIME).toEqual({
        'authoring_user_input.start_time': { replaceable: true, is_html: false }
      });
    });

    it('prefixes every dotted key in a multi-key entry', () => {
      expect(search.authoring_field_map.DURATION).toEqual({
        'authoring_user_input.duration': { replaceable: true, is_html: false },
        'authoring_user_input.time_value': { replaceable: true, is_html: false }
      });
    });
  });

  describe('execution_field_map', () => {
    it('prefixes dot-leading keys with execution_user_input', () => {
      expect(search.execution_field_map.START_TIME).toEqual({
        'execution_user_input.start_time': { replaceable: true, is_html: false }
      });
    });

    it('shares the same non-prefixed keys as authoring', () => {
      expect(search.execution_field_map.ELEM_TYPE).toEqual({
        elem_type: { replaceable: false, is_html: false }
      });
    });
  });

  describe('searchable field maps', () => {
    it('preserves non-prefixed searchable keys', () => {
      expect(search.authoring_searchable_field_map.title).toEqual({
        replaceable: true,
        is_html: false
      });
      expect(search.execution_searchable_field_map['conversations.comments.content']).toEqual({
        replaceable: false,
        is_html: true
      });
    });

    it('prefixes dot-leading searchable keys per map', () => {
      expect(
        search.authoring_searchable_field_map['authoring_user_input.entries.name']
      ).toEqual({ replaceable: true, is_html: false });
      expect(
        search.execution_searchable_field_map['execution_user_input.entries.name']
      ).toEqual({ replaceable: true, is_html: false });
    });

    it('does not leak an unprefixed dotted key into the searchable maps', () => {
      expect(search.authoring_searchable_field_map['.entries.name']).toBeUndefined();
      expect(search.execution_searchable_field_map['.entries.name']).toBeUndefined();
    });
  });

  describe('searchable_result_field_map', () => {
    it('is exported verbatim without prefixing', () => {
      expect(search.searchable_result_field_map['execution.meta_data.status']).toEqual({
        replaceable: false,
        is_html: false
      });
      expect(
        search.searchable_result_field_map['execution.results.evr_data.evr_name']
      ).toEqual({ replaceable: false, is_html: false });
    });
  });
});
