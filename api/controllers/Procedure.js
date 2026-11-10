'use strict';

var url = require('url');

var Procedure = require('./ProcedureService');

module.exports.load_working_copy = function load_working_copy (req, res, next) {
  Procedure.load_working_copy(req.swagger.params, res, next, req['headers']);
};

module.exports.import_procedure_version = function import_procedure_version (req, res, next) {
  Procedure.import_procedure_version(req.swagger.params, res, next, req['headers']);
};

module.exports.procedure_create_step = function procedure_create_step (req, res, next) {
  Procedure.procedure_create_step(req.swagger.params, res, next, req['headers']);
};

module.exports.procedure_get_elements = function procedure_get_elements (req, res, next) {
  Procedure.procedure_get_elements(req.swagger.params, res, next, req['headers']);
};

module.exports.procedure_get_steps = function procedure_get_steps (req, res, next) {
  Procedure.procedure_get_steps(req.swagger.params, res, next, req['headers']);
};

module.exports.procedure_get_structure = function procedure_get_structure (req, res, next) {
  Procedure.procedure_get_structure(req.swagger.params, res, next, req['headers']);
};

module.exports.procedure_move_element = function procedure_move_element (req, res, next) {
  Procedure.procedure_move_element(req.swagger.params, res, next, req['headers']);
};

module.exports.procedure_copy_element = function procedure_copy_element (req, res, next) {
  Procedure.procedure_copy_element(req.swagger.params, res, next, req['headers']);
};

module.exports.procedure_update_element = function procedure_update_element (req, res, next) {
  Procedure.procedure_update_element(req.swagger.params, res, next, req['headers']);
};

module.exports.procedure_delete_element = function procedure_delete_element (req, res, next) {
  Procedure.procedure_delete_element(req.swagger.params, res, next, req['headers']);
};

module.exports.procedure_replace_element = function procedure_replace_element (req, res, next) {
  Procedure.procedure_replace_element(req.swagger.params, res, next, req['headers']);
};

module.exports.procedure_create_tag = function procedure_create_tag (req, res, next) {
  Procedure.procedure_create_tag(req.swagger.params, res, next, req['headers']);
};

module.exports.procedure_update_tag = function procedure_update_tag (req, res, next) {
  Procedure.procedure_update_tag(req.swagger.params, res, next, req['headers']);
};

module.exports.procedure_delete_tag = function procedure_delete_tag (req, res, next) {
  Procedure.procedure_delete_tag(req.swagger.params, res, next, req['headers']);
};

module.exports.procedure_element_apply_tag = function procedure_element_apply_tag (req, res, next) {
  Procedure.procedure_element_apply_tag(req.swagger.params, res, next, req['headers']);
};

module.exports.procedure_element_remove_tag = function procedure_element_remove_tag (req, res, next) {
  Procedure.procedure_element_remove_tag(req.swagger.params, res, next, req['headers']);
};