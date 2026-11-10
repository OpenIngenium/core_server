'use strict';

var url = require('url');

var CMD_SCMF = require('./CMD_SCMFService');

module.exports.create_cmd_scmf_step = function create_cmd_scmf_step (req, res, next) {
  CMD_SCMF.create_cmd_scmf_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_cmd_scmf_step = function get_cmd_scmf_step (req, res, next) {
  CMD_SCMF.get_cmd_scmf_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_cmd_scmf_step_input = function get_cmd_scmf_step_input (req, res, next) {
  CMD_SCMF.get_cmd_scmf_step_input(req.swagger.params, res, next, req['headers']);
};

module.exports.get_cmd_scmf_step_result = function get_cmd_scmf_step_result (req, res, next) {
  CMD_SCMF.get_cmd_scmf_step_result(req.swagger.params, res, next, req['headers']);
};

module.exports.get_execution_cmd_scmf_steps = function get_execution_cmd_scmf_steps (req, res, next) {
  CMD_SCMF.get_execution_cmd_scmf_steps(req.swagger.params, res, next, req['headers']);
};

module.exports.update_cmd_scmf_step = function update_cmd_scmf_step (req, res, next) {
  CMD_SCMF.update_cmd_scmf_step(req.swagger.params, res, next, req['headers']);
};

module.exports.update_cmd_scmf_step_input = function update_cmd_scmf_step_input (req, res, next) {
  CMD_SCMF.update_cmd_scmf_step_input(req.swagger.params, res, next, req['headers']);
};
