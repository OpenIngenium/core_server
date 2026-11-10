'use strict';

var url = require('url');

var VERIFY_EHA = require('./VERIFY_EHAService');

module.exports.create_verify_eha_step = function create_verify_eha_step (req, res, next) {
  VERIFY_EHA.create_verify_eha_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_execution_verify_eha_steps = function get_execution_verify_eha_steps (req, res, next) {
  VERIFY_EHA.get_execution_verify_eha_steps(req.swagger.params, res, next, req['headers']);
};

module.exports.get_verify_eha_step = function get_verify_eha_step (req, res, next) {
  VERIFY_EHA.get_verify_eha_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_verify_eha_step_input = function get_verify_eha_step_input (req, res, next) {
  VERIFY_EHA.get_verify_eha_step_input(req.swagger.params, res, next, req['headers']);
};

module.exports.get_verify_eha_step_result = function get_verify_eha_step_result (req, res, next) {
  VERIFY_EHA.get_verify_eha_step_result(req.swagger.params, res, next, req['headers']);
};

module.exports.update_verify_eha_step = function update_verify_eha_step (req, res, next) {
  VERIFY_EHA.update_verify_eha_step(req.swagger.params, res, next, req['headers']);
};

module.exports.update_verify_eha_step_input = function update_verify_eha_step_input (req, res, next) {
  VERIFY_EHA.update_verify_eha_step_input(req.swagger.params, res, next, req['headers']);
};
