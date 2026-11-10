'use strict';

var url = require('url');

var Procedure_Manual_EIP = require('./Procedure_Manual_EIPService');

module.exports.create_procedure_manual_eip_step = function create_procedure_manual_eip_step (req, res, next) {
  Procedure_Manual_EIP.create_procedure_manual_eip_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_manual_eip_step = function get_procedure_manual_eip_step (req, res, next) {
  Procedure_Manual_EIP.get_procedure_manual_eip_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_manual_eip_step_input = function get_procedure_manual_eip_step_input (req, res, next) {
  Procedure_Manual_EIP.get_procedure_manual_eip_step_input(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_manual_eip_steps = function get_procedure_manual_eip_steps (req, res, next) {
  Procedure_Manual_EIP.get_procedure_manual_eip_steps(req.swagger.params, res, next, req['headers']);
};

module.exports.update_procedure_manual_eip_step = function update_procedure_manual_eip_step (req, res, next) {
  Procedure_Manual_EIP.update_procedure_manual_eip_step(req.swagger.params, res, next, req['headers']);
};

module.exports.update_procedure_manual_eip_step_input = function update_procedure_manual_eip_step_input (req, res, next) {
  Procedure_Manual_EIP.update_procedure_manual_eip_step_input(req.swagger.params, res, next, req['headers']);
};
