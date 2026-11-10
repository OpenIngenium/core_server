'use strict';

var url = require('url');

var Manual_EIP = require('./Manual_EIPService');

module.exports.create_manual_eip_step = function create_manual_eip_step (req, res, next) {
  Manual_EIP.create_manual_eip_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_execution_manual_eip_steps = function get_execution_manual_eip_steps (req, res, next) {
  Manual_EIP.get_execution_manual_eip_steps(req.swagger.params, res, next, req['headers']);
};

module.exports.get_manual_eip_step = function get_manual_eip_step (req, res, next) {
  Manual_EIP.get_manual_eip_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_manual_eip_step_input = function get_manual_eip_step_input (req, res, next) {
  Manual_EIP.get_manual_eip_step_input(req.swagger.params, res, next, req['headers']);
};

module.exports.get_manual_eip_step_result = function get_manual_eip_step_result (req, res, next) {
  Manual_EIP.get_manual_eip_step_result(req.swagger.params, res, next, req['headers']);
};

module.exports.update_manual_eip_step = function update_manual_eip_step (req, res, next) {
  Manual_EIP.update_manual_eip_step(req.swagger.params, res, next, req['headers']);
};

module.exports.update_manual_eip_step_input = function update_manual_eip_step_input (req, res, next) {
  Manual_EIP.update_manual_eip_step_input(req.swagger.params, res, next, req['headers']);
};
