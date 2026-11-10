'use strict';

var url = require('url');

var VI = require('./VIService');

module.exports.create_vi_step = function create_vi_step (req, res, next) {
  VI.create_vi_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_execution_vi_steps = function get_execution_vi_steps (req, res, next) {
  VI.get_execution_vi_steps(req.swagger.params, res, next, req['headers']);
};

module.exports.get_execution_vi_ids = function get_execution_vi_ids (req, res, next) {
  VI.get_execution_vi_ids(req.swagger.params, res, next, req['headers']);
};

module.exports.get_vi_step = function get_vi_step (req, res, next) {
  VI.get_vi_step(req.swagger.params, res, next, req['headers']);
};

module.exports.update_vi_step = function update_vi_step (req, res, next) {
  VI.update_vi_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_vi_step_input = function get_vi_step_input (req, res, next) {
  VI.get_vi_step_input(req.swagger.params, res, next, req['headers']);
};

module.exports.update_vi_step_input = function update_vi_step_input (req, res, next) {
  VI.update_vi_step_input(req.swagger.params, res, next, req['headers']);
};