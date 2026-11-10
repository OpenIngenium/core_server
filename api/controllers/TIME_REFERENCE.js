'use strict';

var url = require('url');

var TIME_REFERENCE = require('./TIME_REFERENCEService');

module.exports.create_time_reference_step = function create_time_reference_step (req, res, next) {
  TIME_REFERENCE.create_time_reference_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_execution_time_reference_steps = function get_execution_time_reference_steps (req, res, next) {
  TIME_REFERENCE.get_execution_time_reference_steps(req.swagger.params, res, next, req['headers']);
};

module.exports.get_time_reference_step = function get_time_reference_step (req, res, next) {
  TIME_REFERENCE.get_time_reference_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_time_reference_step_input = function get_time_reference_step_input (req, res, next) {
  TIME_REFERENCE.get_time_reference_step_input(req.swagger.params, res, next, req['headers']);
};

module.exports.get_time_reference_step_result = function get_time_reference_step_result (req, res, next) {
  TIME_REFERENCE.get_time_reference_step_result(req.swagger.params, res, next, req['headers']);
};

module.exports.update_time_reference_step = function update_time_reference_step (req, res, next) {
  TIME_REFERENCE.update_time_reference_step(req.swagger.params, res, next, req['headers']);
};

module.exports.update_time_reference_step_input = function update_time_reference_step_input (req, res, next) {
  TIME_REFERENCE.update_time_reference_step_input(req.swagger.params, res, next, req['headers']);
};
