'use strict';

var url = require('url');

var Procedure_CUSTOM_SCRIPT = require('./Procedure_CUSTOM_SCRIPTService');

module.exports.create_procedure_custom_script_step = function create_procedure_custom_script_step (req, res, next) {
  Procedure_CUSTOM_SCRIPT.create_procedure_custom_script_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_custom_script_step = function get_procedure_custom_script_step (req, res, next) {
  Procedure_CUSTOM_SCRIPT.get_procedure_custom_script_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_custom_script_step_input = function get_procedure_custom_script_step_input (req, res, next) {
  Procedure_CUSTOM_SCRIPT.get_procedure_custom_script_step_input(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_custom_script_steps = function get_procedure_custom_script_steps (req, res, next) {
  Procedure_CUSTOM_SCRIPT.get_procedure_custom_script_steps(req.swagger.params, res, next, req['headers']);
};

module.exports.update_procedure_custom_script_step = function update_procedure_custom_script_step (req, res, next) {
  Procedure_CUSTOM_SCRIPT.update_procedure_custom_script_step(req.swagger.params, res, next, req['headers']);
};

module.exports.update_procedure_custom_script_step_input = function update_procedure_custom_script_step_input (req, res, next) {
  Procedure_CUSTOM_SCRIPT.update_procedure_custom_script_step_input(req.swagger.params, res, next, req['headers']);
};
