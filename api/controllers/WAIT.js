'use strict';

var url = require('url');

var WAIT = require('./WAITService');

module.exports.create_wait_step = function create_wait_step (req, res, next) {
  WAIT.create_wait_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_execution_wait_steps = function get_execution_wait_steps (req, res, next) {
  WAIT.get_execution_wait_steps(req.swagger.params, res, next, req['headers']);
};

module.exports.get_wait_step = function get_wait_step (req, res, next) {
  WAIT.get_wait_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_wait_step_input = function get_wait_step_input (req, res, next) {
  WAIT.get_wait_step_input(req.swagger.params, res, next, req['headers']);
};

module.exports.get_wait_step_result = function get_wait_step_result (req, res, next) {
  WAIT.get_wait_step_result(req.swagger.params, res, next, req['headers']);
};

module.exports.update_wait_step = function update_wait_step (req, res, next) {
  WAIT.update_wait_step(req.swagger.params, res, next, req['headers']);
};

module.exports.update_wait_step_input = function update_wait_step_input (req, res, next) {
  WAIT.update_wait_step_input(req.swagger.params, res, next, req['headers']);
};
