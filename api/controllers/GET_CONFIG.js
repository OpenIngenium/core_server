'use strict';

var url = require('url');

var GET_CONFIG = require('./GET_CONFIGService');

module.exports.create_get_config_step = function create_get_config_step (req, res, next) {
  GET_CONFIG.create_get_config_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_execution_get_config_steps = function get_execution_get_config_steps (req, res, next) {
  GET_CONFIG.get_execution_get_config_steps(req.swagger.params, res, next, req['headers']);
};

module.exports.get_get_config_step = function get_get_config_step (req, res, next) {
  GET_CONFIG.get_get_config_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_get_config_step_input = function get_get_config_step_input (req, res, next) {
  GET_CONFIG.get_get_config_step_input(req.swagger.params, res, next, req['headers']);
};

module.exports.get_get_config_step_result = function get_get_config_step_result (req, res, next) {
  GET_CONFIG.get_get_config_step_result(req.swagger.params, res, next, req['headers']);
};

module.exports.update_get_config_step = function update_get_config_step (req, res, next) {
  GET_CONFIG.update_get_config_step(req.swagger.params, res, next, req['headers']);
};

module.exports.update_get_config_step_input = function update_get_config_step_input (req, res, next) {
  GET_CONFIG.update_get_config_step_input(req.swagger.params, res, next, req['headers']);
};
