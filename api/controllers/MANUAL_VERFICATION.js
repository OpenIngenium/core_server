'use strict';

var url = require('url');

var MANUAL_VERFICATION = require('./MANUAL_VERFICATIONService');

module.exports.create_manual_verification_step = function create_manual_verification_step (req, res, next) {
  MANUAL_VERFICATION.create_manual_verification_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_execution_manual_verification_steps = function get_execution_manual_verification_steps (req, res, next) {
  MANUAL_VERFICATION.get_execution_manual_verification_steps(req.swagger.params, res, next, req['headers']);
};

module.exports.get_manual_verification_step = function get_manual_verification_step (req, res, next) {
  MANUAL_VERFICATION.get_manual_verification_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_manual_verification_step_input = function get_manual_verification_step_input (req, res, next) {
  MANUAL_VERFICATION.get_manual_verification_step_input(req.swagger.params, res, next, req['headers']);
};

module.exports.get_manual_verification_step_result = function get_manual_verification_step_result (req, res, next) {
  MANUAL_VERFICATION.get_manual_verification_step_result(req.swagger.params, res, next, req['headers']);
};

module.exports.update_manual_verification_step = function update_manual_verification_step (req, res, next) {
  MANUAL_VERFICATION.update_manual_verification_step(req.swagger.params, res, next, req['headers']);
};

module.exports.update_manual_verification_step_input = function update_manual_verification_step_input (req, res, next) {
  MANUAL_VERFICATION.update_manual_verification_step_input(req.swagger.params, res, next, req['headers']);
};
