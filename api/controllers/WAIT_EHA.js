'use strict';

var url = require('url');

var WAIT_EHA = require('./WAIT_EHAService');

module.exports.create_wait_eha_step = function create_wait_eha_step (req, res, next) {
  WAIT_EHA.create_wait_eha_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_execution_wait_eha_steps = function get_execution_wait_eha_steps (req, res, next) {
  WAIT_EHA.get_execution_wait_eha_steps(req.swagger.params, res, next, req['headers']);
};

module.exports.get_wait_eha_step = function get_wait_eha_step (req, res, next) {
  WAIT_EHA.get_wait_eha_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_wait_eha_step_input = function get_wait_eha_step_input (req, res, next) {
  WAIT_EHA.get_wait_eha_step_input(req.swagger.params, res, next, req['headers']);
};

module.exports.get_wait_eha_step_result = function get_wait_eha_step_result (req, res, next) {
  WAIT_EHA.get_wait_eha_step_result(req.swagger.params, res, next, req['headers']);
};

module.exports.update_wait_eha_step = function update_wait_eha_step (req, res, next) {
  WAIT_EHA.update_wait_eha_step(req.swagger.params, res, next, req['headers']);
};

module.exports.update_wait_eha_step_input = function update_wait_eha_step_input (req, res, next) {
  WAIT_EHA.update_wait_eha_step_input(req.swagger.params, res, next, req['headers']);
};
