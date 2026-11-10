'use strict';

var url = require('url');

var UPDATE_CONFIG = require('./UPDATE_CONFIGService');

module.exports.create_update_config_step = function create_update_config_step (req, res, next) {
  UPDATE_CONFIG.create_update_config_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_execution_update_config_steps = function get_execution_update_config_steps (req, res, next) {
  UPDATE_CONFIG.get_execution_update_config_steps(req.swagger.params, res, next, req['headers']);
};

module.exports.get_update_config_step = function get_update_config_step (req, res, next) {
  UPDATE_CONFIG.get_update_config_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_update_config_step_input = function get_update_config_step_input (req, res, next) {
  UPDATE_CONFIG.get_update_config_step_input(req.swagger.params, res, next, req['headers']);
};

module.exports.get_update_config_step_result = function get_update_config_step_result (req, res, next) {
  UPDATE_CONFIG.get_update_config_step_result(req.swagger.params, res, next, req['headers']);
};

module.exports.update_update_config_step = function update_update_config_step (req, res, next) {
  UPDATE_CONFIG.update_update_config_step(req.swagger.params, res, next, req['headers']);
};

module.exports.update_update_config_step_input = function update_update_config_step_input (req, res, next) {
  UPDATE_CONFIG.update_update_config_step_input(req.swagger.params, res, next, req['headers']);
};
