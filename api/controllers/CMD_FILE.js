'use strict';

var url = require('url');

var CMD_FILE = require('./CMD_FILEService');

module.exports.create_cmd_file_step = function create_cmd_file_step (req, res, next) {
  CMD_FILE.create_cmd_file_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_cmd_file_step = function get_cmd_file_step (req, res, next) {
  CMD_FILE.get_cmd_file_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_cmd_file_step_input = function get_cmd_file_step_input (req, res, next) {
  CMD_FILE.get_cmd_file_step_input(req.swagger.params, res, next, req['headers']);
};

module.exports.get_cmd_file_step_result = function get_cmd_file_step_result (req, res, next) {
  CMD_FILE.get_cmd_file_step_result(req.swagger.params, res, next, req['headers']);
};

module.exports.get_execution_cmd_file_steps = function get_execution_cmd_file_steps (req, res, next) {
  CMD_FILE.get_execution_cmd_file_steps(req.swagger.params, res, next, req['headers']);
};

module.exports.update_cmd_file_step = function update_cmd_file_step (req, res, next) {
  CMD_FILE.update_cmd_file_step(req.swagger.params, res, next, req['headers']);
};

module.exports.update_cmd_file_step_input = function update_cmd_file_step_input (req, res, next) {
  CMD_FILE.update_cmd_file_step_input(req.swagger.params, res, next, req['headers']);
};
