'use strict';

var url = require('url');

var Procedure_CMD = require('./Procedure_CMDService');

module.exports.create_procedure_cmd_step = function create_procedure_cmd_step (req, res, next) {
  Procedure_CMD.create_procedure_cmd_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_cmd_step = function get_procedure_cmd_step (req, res, next) {
  Procedure_CMD.get_procedure_cmd_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_cmd_step_input = function get_procedure_cmd_step_input (req, res, next) {
  Procedure_CMD.get_procedure_cmd_step_input(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_cmd_steps = function get_procedure_cmd_steps (req, res, next) {
  Procedure_CMD.get_procedure_cmd_steps(req.swagger.params, res, next, req['headers']);
};

module.exports.update_procedure_cmd_step = function update_procedure_cmd_step (req, res, next) {
  Procedure_CMD.update_procedure_cmd_step(req.swagger.params, res, next, req['headers']);
};

module.exports.update_procedure_cmd_step_input = function update_procedure_cmd_step_input (req, res, next) {
  Procedure_CMD.update_procedure_cmd_step_input(req.swagger.params, res, next, req['headers']);
};
