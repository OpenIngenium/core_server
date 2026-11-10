'use strict';

var url = require('url');

var Procedure_Manual_Input = require('./Procedure_Manual_InputService');

module.exports.create_procedure_manual_input_step = function create_procedure_manual_input_step (req, res, next) {
  Procedure_Manual_Input.create_procedure_manual_input_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_manual_input_step = function get_procedure_manual_input_step (req, res, next) {
  Procedure_Manual_Input.get_procedure_manual_input_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_manual_input_step_input = function get_procedure_manual_input_step_input (req, res, next) {
  Procedure_Manual_Input.get_procedure_manual_input_step_input(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_manual_input_steps = function get_procedure_manual_input_steps (req, res, next) {
  Procedure_Manual_Input.get_procedure_manual_input_steps(req.swagger.params, res, next, req['headers']);
};

module.exports.update_procedure_manual_input_step = function update_procedure_manual_input_step (req, res, next) {
  Procedure_Manual_Input.update_procedure_manual_input_step(req.swagger.params, res, next, req['headers']);
};

module.exports.update_procedure_manual_input_step_input = function update_procedure_manual_input_step_input (req, res, next) {
  Procedure_Manual_Input.update_procedure_manual_input_step_input(req.swagger.params, res, next, req['headers']);
};
