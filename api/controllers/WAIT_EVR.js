'use strict';

var url = require('url');

var WAIT_EVR = require('./WAIT_EVRService');

module.exports.create_wait_evr_step = function create_wait_evr_step (req, res, next) {
  WAIT_EVR.create_wait_evr_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_execution_wait_evr_steps = function get_execution_wait_evr_steps (req, res, next) {
  WAIT_EVR.get_execution_wait_evr_steps(req.swagger.params, res, next, req['headers']);
};

module.exports.get_wait_evr_step = function get_wait_evr_step (req, res, next) {
  WAIT_EVR.get_wait_evr_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_wait_evr_step_input = function get_wait_evr_step_input (req, res, next) {
  WAIT_EVR.get_wait_evr_step_input(req.swagger.params, res, next, req['headers']);
};

module.exports.get_wait_evr_step_result = function get_wait_evr_step_result (req, res, next) {
  WAIT_EVR.get_wait_evr_step_result(req.swagger.params, res, next, req['headers']);
};

module.exports.update_wait_evr_step = function update_wait_evr_step (req, res, next) {
  WAIT_EVR.update_wait_evr_step(req.swagger.params, res, next, req['headers']);
};

module.exports.update_wait_evr_step_input = function update_wait_evr_step_input (req, res, next) {
  WAIT_EVR.update_wait_evr_step_input(req.swagger.params, res, next, req['headers']);
};
