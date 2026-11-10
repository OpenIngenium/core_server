'use strict';

var url = require('url');

var Procedure_VERIFY_EHA = require('./Procedure_VERIFY_EHAService');

module.exports.create_procedure_verify_eha_step = function create_procedure_verify_eha_step (req, res, next) {
  Procedure_VERIFY_EHA.create_procedure_verify_eha_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_verify_eha_step = function get_procedure_verify_eha_step (req, res, next) {
  Procedure_VERIFY_EHA.get_procedure_verify_eha_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_verify_eha_step_input = function get_procedure_verify_eha_step_input (req, res, next) {
  Procedure_VERIFY_EHA.get_procedure_verify_eha_step_input(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_verify_eha_steps = function get_procedure_verify_eha_steps (req, res, next) {
  Procedure_VERIFY_EHA.get_procedure_verify_eha_steps(req.swagger.params, res, next, req['headers']);
};

module.exports.update_procedure_verify_eha_step = function update_procedure_verify_eha_step (req, res, next) {
  Procedure_VERIFY_EHA.update_procedure_verify_eha_step(req.swagger.params, res, next, req['headers']);
};

module.exports.update_procedure_verify_eha_step_input = function update_procedure_verify_eha_step_input (req, res, next) {
  Procedure_VERIFY_EHA.update_procedure_verify_eha_step_input(req.swagger.params, res, next, req['headers']);
};
