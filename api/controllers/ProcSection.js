'use strict';

var url = require('url');

var ProcedureSection = require('./ProcedureSectionService');

module.exports.create_procedure_section = function create_procedure_section (req, res, next) {
  ProcedureSection.create_procedure_section(req.swagger.params, res, next, req['headers']);
};

module.exports.get_execution_procedure_sections = function get_execution_procedure_sections (req, res, next) {
  ProcedureSection.get_execution_procedure_sections(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_section = function get_procedure_section (req, res, next) {
  ProcedureSection.get_procedure_section(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_section_structure = function get_procedure_section_structure (req, res, next) {
  ProcedureSection.get_procedure_section_structure(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_section_elements = function get_procedure_section_elements (req, res, next) {
  ProcedureSection.get_procedure_section_elements(req.swagger.params, res, next, req['headers']);
};

module.exports.import_procedure_section = function import_procedure_section (req, res, next) {
  ProcedureSection.import_procedure_section(req.swagger.params, res, next, req['headers']);
};

module.exports.call_procedure_section = function call_procedure_section (req, res, next) {
  ProcedureSection.call_procedure_section(req.swagger.params, res, next, req['headers']);
};

module.exports.update_procedure_section = function update_procedure_section (req, res, next) {
  ProcedureSection.update_procedure_section(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_section_input = function get_procedure_section_input (req, res, next) {
  ProcedureSection.get_procedure_section_input(req.swagger.params, res, next, req['headers']);
};

module.exports.update_procedure_section_input = function update_procedure_section_input (req, res, next) {
  ProcedureSection.update_procedure_section_input(req.swagger.params, res, next, req['headers']);
};
