'use strict';

var url = require('url');

var Procedure_WAIT_EHA = require('./Procedure_WAIT_EHAService');

module.exports.create_procedure_wait_eha_step = function create_procedure_wait_eha_step (req, res, next) {
  Procedure_WAIT_EHA.create_procedure_wait_eha_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_wait_eha_step = function get_procedure_wait_eha_step (req, res, next) {
  Procedure_WAIT_EHA.get_procedure_wait_eha_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_wait_eha_step_input = function get_procedure_wait_eha_step_input (req, res, next) {
  Procedure_WAIT_EHA.get_procedure_wait_eha_step_input(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_wait_eha_steps = function get_procedure_wait_eha_steps (req, res, next) {
  Procedure_WAIT_EHA.get_procedure_wait_eha_steps(req.swagger.params, res, next, req['headers']);
};

module.exports.update_procedure_wait_eha_step = function update_procedure_wait_eha_step (req, res, next) {
  Procedure_WAIT_EHA.update_procedure_wait_eha_step(req.swagger.params, res, next, req['headers']);
};

module.exports.update_procedure_wait_eha_step_input = function update_procedure_wait_eha_step_input (req, res, next) {
  Procedure_WAIT_EHA.update_procedure_wait_eha_step_input(req.swagger.params, res, next, req['headers']);
};
