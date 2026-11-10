'use strict';

var url = require('url');

var Procedure_WAIT_EVR = require('./Procedure_WAIT_EVRService');

module.exports.create_procedure_wait_evr_step = function create_procedure_wait_evr_step (req, res, next) {
  Procedure_WAIT_EVR.create_procedure_wait_evr_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_wait_evr_step = function get_procedure_wait_evr_step (req, res, next) {
  Procedure_WAIT_EVR.get_procedure_wait_evr_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_wait_evr_step_input = function get_procedure_wait_evr_step_input (req, res, next) {
  Procedure_WAIT_EVR.get_procedure_wait_evr_step_input(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_wait_evr_steps = function get_procedure_wait_evr_steps (req, res, next) {
  Procedure_WAIT_EVR.get_procedure_wait_evr_steps(req.swagger.params, res, next, req['headers']);
};

module.exports.update_procedure_wait_evr_step = function update_procedure_wait_evr_step (req, res, next) {
  Procedure_WAIT_EVR.update_procedure_wait_evr_step(req.swagger.params, res, next, req['headers']);
};

module.exports.update_procedure_wait_evr_step_input = function update_procedure_wait_evr_step_input (req, res, next) {
  Procedure_WAIT_EVR.update_procedure_wait_evr_step_input(req.swagger.params, res, next, req['headers']);
};
