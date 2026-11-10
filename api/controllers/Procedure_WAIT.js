'use strict';

var url = require('url');

var Procedure_WAIT = require('./Procedure_WAITService');

module.exports.create_procedure_wait_step = function create_procedure_wait_step (req, res, next) {
  Procedure_WAIT.create_procedure_wait_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_wait_step = function get_procedure_wait_step (req, res, next) {
  Procedure_WAIT.get_procedure_wait_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_wait_step_input = function get_procedure_wait_step_input (req, res, next) {
  Procedure_WAIT.get_procedure_wait_step_input(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_wait_steps = function get_procedure_wait_steps (req, res, next) {
  Procedure_WAIT.get_procedure_wait_steps(req.swagger.params, res, next, req['headers']);
};

module.exports.update_procedure_wait_step = function update_procedure_wait_step (req, res, next) {
  Procedure_WAIT.update_procedure_wait_step(req.swagger.params, res, next, req['headers']);
};

module.exports.update_procedure_wait_step_input = function update_procedure_wait_step_input (req, res, next) {
  Procedure_WAIT.update_procedure_wait_step_input(req.swagger.params, res, next, req['headers']);
};
