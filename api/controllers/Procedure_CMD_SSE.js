'use strict';

var url = require('url');

var Procedure_CMD_SSE = require('./Procedure_CMD_SSEService');

module.exports.create_procedure_cmd_sse_step = function create_procedure_cmd_sse_step (req, res, next) {
  Procedure_CMD_SSE.create_procedure_cmd_sse_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_cmd_sse_step = function get_procedure_cmd_sse_step (req, res, next) {
  Procedure_CMD_SSE.get_procedure_cmd_sse_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_cmd_sse_step_input = function get_procedure_cmd_sse_step_input (req, res, next) {
  Procedure_CMD_SSE.get_procedure_cmd_sse_step_input(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_cmd_sse_steps = function get_procedure_cmd_sse_steps (req, res, next) {
  Procedure_CMD_SSE.get_procedure_cmd_sse_steps(req.swagger.params, res, next, req['headers']);
};

module.exports.update_procedure_cmd_sse_step = function update_procedure_cmd_sse_step (req, res, next) {
  Procedure_CMD_SSE.update_procedure_cmd_sse_step(req.swagger.params, res, next, req['headers']);
};

module.exports.update_procedure_cmd_sse_step_input = function update_procedure_cmd_sse_step_input (req, res, next) {
  Procedure_CMD_SSE.update_procedure_cmd_sse_step_input(req.swagger.params, res, next, req['headers']);
};
