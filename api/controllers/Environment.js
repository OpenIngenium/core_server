'use strict';

var url = require('url');

var Environment = require('./EnvironmentService');

module.exports.create_environment_step = function create_environment_step (req, res, next) {
  Environment.create_environment_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_environment_step = function get_environment_step (req, res, next) {
  Environment.get_environment_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_environment_step_input = function get_environment_step_input (req, res, next) {
  Environment.get_environment_step_input(req.swagger.params, res, next, req['headers']);
};

module.exports.get_environment_step_result = function get_environment_step_result (req, res, next) {
  Environment.get_environment_step_result(req.swagger.params, res, next, req['headers']);
};

module.exports.get_execution_environment_steps = function get_execution_environment_steps (req, res, next) {
  Environment.get_execution_environment_steps(req.swagger.params, res, next, req['headers']);
};

module.exports.update_environment_step = function update_environment_step (req, res, next) {
  Environment.update_environment_step(req.swagger.params, res, next, req['headers']);
};

module.exports.update_environment_step_input = function update_environment_step_input (req, res, next) {
  Environment.update_environment_step_input(req.swagger.params, res, next, req['headers']);
};
