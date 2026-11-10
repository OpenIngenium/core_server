'use strict';

var url = require('url');

var Procedure_WAIT = require('./Procedure_TIME_REFERENCEService');

module.exports.create_procedure_time_reference_step = function create_procedure_time_reference_step (req, res, next) {
  Procedure_WAIT.create_procedure_time_reference_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_time_reference_step = function get_procedure_time_reference_step (req, res, next) {
  Procedure_WAIT.get_procedure_time_reference_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_time_reference_step_input = function get_procedure_time_reference_step_input (req, res, next) {
  Procedure_WAIT.get_procedure_time_reference_step_input(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_time_reference_steps = function get_procedure_time_reference_steps (req, res, next) {
  Procedure_WAIT.get_procedure_time_reference_steps(req.swagger.params, res, next, req['headers']);
};

module.exports.update_procedure_time_reference_step = function update_procedure_time_reference_step (req, res, next) {
  Procedure_WAIT.update_procedure_time_reference_step(req.swagger.params, res, next, req['headers']);
};

module.exports.update_procedure_time_reference_step_input = function update_procedure_time_reference_step_input (req, res, next) {
  Procedure_WAIT.update_procedure_time_reference_step_input(req.swagger.params, res, next, req['headers']);
};
