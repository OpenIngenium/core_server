'use strict';

var url = require('url');

var Procedure_CMD_FILE = require('./Procedure_CMD_FILEService');

module.exports.create_procedure_cmd_file_step = function create_procedure_cmd_file_step (req, res, next) {
  Procedure_CMD_FILE.create_procedure_cmd_file_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_cmd_file_step = function get_procedure_cmd_file_step (req, res, next) {
  Procedure_CMD_FILE.get_procedure_cmd_file_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_cmd_file_step_input = function get_procedure_cmd_file_step_input (req, res, next) {
  Procedure_CMD_FILE.get_procedure_cmd_file_step_input(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_cmd_file_steps = function get_procedure_cmd_file_steps (req, res, next) {
  Procedure_CMD_FILE.get_procedure_cmd_file_steps(req.swagger.params, res, next, req['headers']);
};

module.exports.update_procedure_cmd_file_step = function update_procedure_cmd_file_step (req, res, next) {
  Procedure_CMD_FILE.update_procedure_cmd_file_step(req.swagger.params, res, next, req['headers']);
};

module.exports.update_procedure_cmd_file_step_input = function update_procedure_cmd_file_step_input (req, res, next) {
  Procedure_CMD_FILE.update_procedure_cmd_file_step_input(req.swagger.params, res, next, req['headers']);
};
