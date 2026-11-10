'use strict';

var url = require('url');

var Procedure_QUERY_EVR = require('./Procedure_QUERY_EVRService');

module.exports.create_procedure_query_evr_step = function create_procedure_query_evr_step (req, res, next) {
  Procedure_QUERY_EVR.create_procedure_query_evr_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_query_evr_step = function get_procedure_query_evr_step (req, res, next) {
  Procedure_QUERY_EVR.get_procedure_query_evr_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_query_evr_step_input = function get_procedure_query_evr_step_input (req, res, next) {
  Procedure_QUERY_EVR.get_procedure_query_evr_step_input(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_query_evr_steps = function get_procedure_query_evr_steps (req, res, next) {
  Procedure_QUERY_EVR.get_procedure_query_evr_steps(req.swagger.params, res, next, req['headers']);
};

module.exports.update_procedure_query_evr_step = function update_procedure_query_evr_step (req, res, next) {
  Procedure_QUERY_EVR.update_procedure_query_evr_step(req.swagger.params, res, next, req['headers']);
};

module.exports.update_procedure_query_evr_step_input = function update_procedure_query_evr_step_input (req, res, next) {
  Procedure_QUERY_EVR.update_procedure_query_evr_step_input(req.swagger.params, res, next, req['headers']);
};
