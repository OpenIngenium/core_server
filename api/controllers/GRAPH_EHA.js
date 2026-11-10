'use strict';

var url = require('url');

var GRAPH_EHA = require('./GRAPH_EHAService');

module.exports.create_graph_eha_step = function create_graph_eha_step (req, res, next) {
  GRAPH_EHA.create_graph_eha_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_execution_graph_eha_steps = function get_execution_graph_eha_steps (req, res, next) {
  GRAPH_EHA.get_execution_graph_eha_steps(req.swagger.params, res, next, req['headers']);
};

module.exports.get_graph_eha_step = function get_graph_eha_step (req, res, next) {
  GRAPH_EHA.get_graph_eha_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_graph_eha_step_input = function get_graph_eha_step_input (req, res, next) {
  GRAPH_EHA.get_graph_eha_step_input(req.swagger.params, res, next, req['headers']);
};

module.exports.get_graph_eha_step_result = function get_graph_eha_step_result (req, res, next) {
  GRAPH_EHA.get_graph_eha_step_result(req.swagger.params, res, next, req['headers']);
};

module.exports.update_graph_eha_step = function update_graph_eha_step (req, res, next) {
  GRAPH_EHA.update_graph_eha_step(req.swagger.params, res, next, req['headers']);
};

module.exports.update_graph_eha_step_input = function update_graph_eha_step_input (req, res, next) {
  GRAPH_EHA.update_graph_eha_step_input(req.swagger.params, res, next, req['headers']);
};
