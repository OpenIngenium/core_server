'use strict';

var url = require('url');

var VI_STATUS = require('./VI_STATUSService');

module.exports.create_vi_status_step = function create_vi_status_step (req, res, next) {
  VI_STATUS.create_vi_status_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_execution_vi_status_steps = function get_execution_vi_status_steps (req, res, next) {
  VI_STATUS.get_execution_vi_status_steps(req.swagger.params, res, next, req['headers']);
};

module.exports.get_vi_status_step = function get_vi_status_step (req, res, next) {
  VI_STATUS.get_vi_status_step(req.swagger.params, res, next, req['headers']);
};

module.exports.update_vi_status_step = function update_vi_status_step (req, res, next) {
  VI_STATUS.update_vi_status_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_vi_status_step_input = function get_vi_status_step_input (req, res, next) {
  VI_STATUS.get_vi_status_step_input(req.swagger.params, res, next, req['headers']);
};

module.exports.update_vi_status_step_input = function update_vi_status_step_input (req, res, next) {
  VI_STATUS.update_vi_status_step_input(req.swagger.params, res, next, req['headers']);
};