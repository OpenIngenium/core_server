'use strict';

var url = require('url');

var QUERY_EVR = require('./QUERY_EVRService');

module.exports.create_query_evr_step = function create_query_evr_step (req, res, next) {
  QUERY_EVR.create_query_evr_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_execution_query_evr_steps = function get_execution_query_evr_steps (req, res, next) {
  QUERY_EVR.get_execution_query_evr_steps(req.swagger.params, res, next, req['headers']);
};

module.exports.get_query_evr_step = function get_query_evr_step (req, res, next) {
  QUERY_EVR.get_query_evr_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_query_evr_step_input = function get_query_evr_step_input (req, res, next) {
  QUERY_EVR.get_query_evr_step_input(req.swagger.params, res, next, req['headers']);
};

module.exports.get_query_evr_step_result = function get_query_evr_step_result (req, res, next) {
  QUERY_EVR.get_query_evr_step_result(req.swagger.params, res, next, req['headers']);
};

module.exports.update_query_evr_step = function update_query_evr_step (req, res, next) {
  QUERY_EVR.update_query_evr_step(req.swagger.params, res, next, req['headers']);
};

module.exports.update_query_evr_step_input = function update_query_evr_step_input (req, res, next) {
  QUERY_EVR.update_query_evr_step_input(req.swagger.params, res, next, req['headers']);
};
