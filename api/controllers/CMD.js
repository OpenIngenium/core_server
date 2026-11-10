'use strict';

var url = require('url');

var CMD = require('./CMDService');

module.exports.create_cmd_step = function create_cmd_step (req, res, next) {
  CMD.create_cmd_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_cmd_step = function get_cmd_step (req, res, next) {
  CMD.get_cmd_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_cmd_step_input = function get_cmd_step_input (req, res, next) {
  CMD.get_cmd_step_input(req.swagger.params, res, next, req['headers']);
};

module.exports.get_cmd_step_result = function get_cmd_step_result (req, res, next) {
  CMD.get_cmd_step_result(req.swagger.params, res, next, req['headers']);
};

module.exports.get_execution_cmd_steps = function get_execution_cmd_steps (req, res, next) {
  CMD.get_execution_cmd_steps(req.swagger.params, res, next, req['headers']);
};

module.exports.update_cmd_step = function update_cmd_step (req, res, next) {
  CMD.update_cmd_step(req.swagger.params, res, next, req['headers']);
};

module.exports.update_cmd_step_input = function update_cmd_step_input (req, res, next) {
  CMD.update_cmd_step_input(req.swagger.params, res, next, req['headers']);
};
