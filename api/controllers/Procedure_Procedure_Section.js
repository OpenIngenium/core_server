'use strict';

var url = require('url');

var Procedure_ProcedureSection = require('./Procedure_ProcedureSectionService');

module.exports.procedure_create_procedure_section = function procedure_create_procedure_section (req, res, next) {
  Procedure_ProcedureSection.procedure_create_procedure_section(req.swagger.params, res, next, req['headers']);
};

module.exports.procedure_get_procedure_section = function procedure_get_procedure_section (req, res, next) {
  Procedure_ProcedureSection.procedure_get_procedure_section(req.swagger.params, res, next, req['headers']);
};

module.exports.procedure_get_procedure_sections = function procedure_get_procedure_sections (req, res, next) {
  Procedure_ProcedureSection.procedure_get_procedure_sections(req.swagger.params, res, next, req['headers']);
};

module.exports.procedure_update_procedure_section = function procedure_update_procedure_section (req, res, next) {
  Procedure_ProcedureSection.procedure_update_procedure_section(req.swagger.params, res, next, req['headers']);
};

module.exports.procedure_get_procedure_section_input = function procedure_get_procedure_section_input (req, res, next) {
  Procedure_ProcedureSection.procedure_get_procedure_section_input(req.swagger.params, res, next, req['headers']);
};

module.exports.procedure_update_procedure_section_input = function procedure_update_procedure_section_input (req, res, next) {
  Procedure_ProcedureSection.procedure_update_procedure_section_input(req.swagger.params, res, next, req['headers']);
};

module.exports.procedure_get_procedure_section_structure = function procedure_get_procedure_section_structure (req, res, next) {
  Procedure_ProcedureSection.procedure_get_procedure_section_structure(req.swagger.params, res, next, req['headers']);
};

module.exports.procedure_get_procedure_section_elements = function procedure_get_procedure_section_elements (req, res, next) {
  Procedure_ProcedureSection.procedure_get_procedure_section_elements(req.swagger.params, res, next, req['headers']);
};
