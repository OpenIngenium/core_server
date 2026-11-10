'use strict';

var url = require('url');

var CUSTOM_SCRIPT = require('./CUSTOM_SCRIPTService');

module.exports.create_custom_script_step = function create_custom_script_step (req, res, next) {
  CUSTOM_SCRIPT.create_custom_script_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_execution_custom_script_steps = function get_execution_custom_script_steps (req, res, next) {
  CUSTOM_SCRIPT.get_execution_custom_script_steps(req.swagger.params, res, next, req['headers']);
};

module.exports.get_custom_script_step = function get_custom_script_step (req, res, next) {
  CUSTOM_SCRIPT.get_custom_script_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_custom_script_step_input = function get_custom_script_step_input (req, res, next) {
  CUSTOM_SCRIPT.get_custom_script_step_input(req.swagger.params, res, next, req['headers']);
};

module.exports.get_custom_script_step_result = function get_custom_script_step_result (req, res, next) {
  CUSTOM_SCRIPT.get_custom_script_step_result(req.swagger.params, res, next, req['headers']);
};

module.exports.update_custom_script_step = function update_custom_script_step (req, res, next) {
  CUSTOM_SCRIPT.update_custom_script_step(req.swagger.params, res, next, req['headers']);
};

module.exports.update_custom_script_step_input = function update_custom_script_step_input (req, res, next) {
  CUSTOM_SCRIPT.update_custom_script_step_input(req.swagger.params, res, next, req['headers']);
};
