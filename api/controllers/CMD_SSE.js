'use strict';

var url = require('url');

var CMD_SSE = require('./CMD_SSEService');

module.exports.create_cmd_sse_step = function create_cmd_sse_step (req, res, next) {
  CMD_SSE.create_cmd_sse_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_cmd_sse_step = function get_cmd_sse_step (req, res, next) {
  CMD_SSE.get_cmd_sse_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_cmd_sse_step_input = function get_cmd_sse_step_input (req, res, next) {
  CMD_SSE.get_cmd_sse_step_input(req.swagger.params, res, next, req['headers']);
};

module.exports.get_cmd_sse_step_result = function get_cmd_sse_step_result (req, res, next) {
  CMD_SSE.get_cmd_sse_step_result(req.swagger.params, res, next, req['headers']);
};

module.exports.get_execution_cmd_sse_steps = function get_execution_cmd_sse_steps (req, res, next) {
  CMD_SSE.get_execution_cmd_sse_steps(req.swagger.params, res, next, req['headers']);
};

module.exports.update_cmd_sse_step = function update_cmd_sse_step (req, res, next) {
  CMD_SSE.update_cmd_sse_step(req.swagger.params, res, next, req['headers']);
};

module.exports.update_cmd_sse_step_input = function update_cmd_sse_step_input (req, res, next) {
  CMD_SSE.update_cmd_sse_step_input(req.swagger.params, res, next, req['headers']);
};
