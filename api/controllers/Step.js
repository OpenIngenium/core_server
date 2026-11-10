'use strict';

var url = require('url');

var Step = require('./StepService');

module.exports.get_step = function get_step (req, res, next) {
  Step.get_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_step_input = function get_step_input (req, res, next) {
  Step.get_step_input(req.swagger.params, res, next, req['headers']);
};

module.exports.get_step_result = function get_step_result (req, res, next) {
  Step.get_step_result(req.swagger.params, res, next, req['headers']);
};

module.exports.update_step = function update_step (req, res, next) {
  Step.update_step(req.swagger.params, res, next, req['headers']);
};

module.exports.update_step_input = function update_step_input (req, res, next) {
  Step.update_step_input(req.swagger.params, res, next, req['headers']);
};

module.exports.update_step_result = function update_step_result (req, res, next) {
  Step.update_step_result(req.swagger.params, res, next, req['headers']);
};

module.exports.create_new_run = function create_new_run (req, res, next) {
  Step.create_new_run(req.swagger.params, res, next, req['headers']);
};

module.exports.override_step = function override_step (req, res, next) {
  Step.override_step(req.swagger.params, res, next, req['headers']);
};

module.exports.update_override_step = function update_override_step (req, res, next) {
  Step.update_override_step(req.swagger.params, res, next, req['headers']);
};

module.exports.discard_override_step = function discard_override_step (req, res, next) {
  Step.discard_override_step(req.swagger.params, res, next, req['headers']);
};
