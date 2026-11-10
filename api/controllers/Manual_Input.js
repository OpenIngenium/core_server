'use strict';

var url = require('url');

var Manual_Input = require('./Manual_InputService');

module.exports.create_manual_input_step = function create_manual_input_step (req, res, next) {
  Manual_Input.create_manual_input_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_execution_manual_input_steps = function get_execution_manual_input_steps (req, res, next) {
  Manual_Input.get_execution_manual_input_steps(req.swagger.params, res, next, req['headers']);
};

module.exports.get_manual_input_step = function get_manual_input_step (req, res, next) {
  Manual_Input.get_manual_input_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_manual_input_step_input = function get_manual_input_step_input (req, res, next) {
  Manual_Input.get_manual_input_step_input(req.swagger.params, res, next, req['headers']);
};

module.exports.get_manual_input_step_result = function get_manual_input_step_result (req, res, next) {
  Manual_Input.get_manual_input_step_result(req.swagger.params, res, next, req['headers']);
};

module.exports.update_manual_input_step = function update_manual_input_step (req, res, next) {
  Manual_Input.update_manual_input_step(req.swagger.params, res, next, req['headers']);
};

module.exports.update_manual_input_step_input = function update_manual_input_step_input (req, res, next) {
  Manual_Input.update_manual_input_step_input(req.swagger.params, res, next, req['headers']);
};
