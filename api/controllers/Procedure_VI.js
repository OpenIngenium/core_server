'use strict';

var url = require('url');

var Procedure_VI = require('./Procedure_VIService');

module.exports.create_procedure_vi_step = function create_procedure_vi_step (req, res, next) {
  Procedure_VI.create_procedure_vi_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_vi_ids = function get_procedure_vi_ids (req, res, next) {
  Procedure_VI.get_procedure_vi_ids(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_vi_step = function get_procedure_vi_step (req, res, next) {
  Procedure_VI.get_procedure_vi_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_vi_steps = function get_procedure_vi_steps (req, res, next) {
  Procedure_VI.get_procedure_vi_steps(req.swagger.params, res, next, req['headers']);
};

module.exports.update_procedure_vi_step = function update_procedure_vi_step (req, res, next) {
  Procedure_VI.update_procedure_vi_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_vi_step_input = function get_procedure_vi_step_input (req, res, next) {
  Procedure_VI.get_procedure_vi_step_input(req.swagger.params, res, next, req['headers']);
};

module.exports.update_procedure_vi_step_input = function update_procedure_vi_step_input (req, res, next) {
  Procedure_VI.update_procedure_vi_step_input(req.swagger.params, res, next, req['headers']);
};
