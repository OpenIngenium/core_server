'use strict';

var url = require('url');

var Procedure_Section = require('./Procedure_SectionService');

module.exports.procedure_create_section = function procedure_create_section (req, res, next) {
  Procedure_Section.procedure_create_section(req.swagger.params, res, next, req['headers']);
};

module.exports.procedure_get_section = function procedure_get_section (req, res, next) {
  Procedure_Section.procedure_get_section(req.swagger.params, res, next, req['headers']);
};

module.exports.procedure_get_sections = function procedure_get_sections (req, res, next) {
  Procedure_Section.procedure_get_sections(req.swagger.params, res, next, req['headers']);
};

module.exports.procedure_update_section = function procedure_update_section (req, res, next) {
  Procedure_Section.procedure_update_section(req.swagger.params, res, next, req['headers']);
};
