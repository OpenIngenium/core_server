'use strict';

var url = require('url');

var Procedure_MANUAL_VERFICATION = require('./Procedure_MANUAL_VERFICATIONService');

module.exports.create_procedure_manual_verification_step = function create_procedure_manual_verification_step (req, res, next) {
  Procedure_MANUAL_VERFICATION.create_procedure_manual_verification_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_manual_verification_step = function get_procedure_manual_verification_step (req, res, next) {
  Procedure_MANUAL_VERFICATION.get_procedure_manual_verification_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_manual_verification_step_input = function get_procedure_manual_verification_step_input (req, res, next) {
  Procedure_MANUAL_VERFICATION.get_procedure_manual_verification_step_input(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_manual_verification_steps = function get_procedure_manual_verification_steps (req, res, next) {
  Procedure_MANUAL_VERFICATION.get_procedure_manual_verification_steps(req.swagger.params, res, next, req['headers']);
};

module.exports.update_procedure_manual_verification_step = function update_procedure_manual_verification_step (req, res, next) {
  Procedure_MANUAL_VERFICATION.update_procedure_manual_verification_step(req.swagger.params, res, next, req['headers']);
};

module.exports.update_procedure_manual_verification_step_input = function update_procedure_manual_verification_step_input (req, res, next) {
  Procedure_MANUAL_VERFICATION.update_procedure_manual_verification_step_input(req.swagger.params, res, next, req['headers']);
};
