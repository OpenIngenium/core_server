'use strict';

var url = require('url');

var Procedure_CMD_SCMF = require('./Procedure_CMD_SCMFService');

module.exports.create_procedure_cmd_scmf_step = function create_procedure_cmd_scmf_step (req, res, next) {
  Procedure_CMD_SCMF.create_procedure_cmd_scmf_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_cmd_scmf_step = function get_procedure_cmd_scmf_step (req, res, next) {
  Procedure_CMD_SCMF.get_procedure_cmd_scmf_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_cmd_scmf_step_input = function get_procedure_cmd_scmf_step_input (req, res, next) {
  Procedure_CMD_SCMF.get_procedure_cmd_scmf_step_input(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_cmd_scmf_steps = function get_procedure_cmd_scmf_steps (req, res, next) {
  Procedure_CMD_SCMF.get_procedure_cmd_scmf_steps(req.swagger.params, res, next, req['headers']);
};

module.exports.update_procedure_cmd_scmf_step = function update_procedure_cmd_scmf_step (req, res, next) {
  Procedure_CMD_SCMF.update_procedure_cmd_scmf_step(req.swagger.params, res, next, req['headers']);
};

module.exports.update_procedure_cmd_scmf_step_input = function update_procedure_cmd_scmf_step_input (req, res, next) {
  Procedure_CMD_SCMF.update_procedure_cmd_scmf_step_input(req.swagger.params, res, next, req['headers']);
};
