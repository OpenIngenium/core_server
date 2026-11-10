'use strict';

var url = require('url');

var Procedure_VI_STATUS = require('./Procedure_VI_STATUSService');

module.exports.create_procedure_vi_status_step = function create_procedure_vi_status_step (req, res, next) {
  Procedure_VI_STATUS.create_procedure_vi_status_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_vi_status_step = function get_procedure_vi_status_step (req, res, next) {
  Procedure_VI_STATUS.get_procedure_vi_status_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_vi_status_steps = function get_procedure_vi_status_steps (req, res, next) {
  Procedure_VI_STATUS.get_procedure_vi_status_steps(req.swagger.params, res, next, req['headers']);
};

module.exports.update_procedure_vi_status_step = function update_procedure_vi_status_step (req, res, next) {
  Procedure_VI_STATUS.update_procedure_vi_status_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_vi_status_step_input = function get_procedure_vi_status_step_input (req, res, next) {
  Procedure_VI_STATUS.get_procedure_vi_status_step_input(req.swagger.params, res, next, req['headers']);
};

module.exports.update_procedure_vi_status_step_input = function update_procedure_vi_status_step_input (req, res, next) {
  Procedure_VI_STATUS.update_procedure_vi_status_step_input(req.swagger.params, res, next, req['headers']);
};

