'use strict';

var url = require('url');

var CHECK_CONFIG = require('./CHECK_CONFIGService');

module.exports.create_check_config_step = function create_check_config_step (req, res, next) {
  CHECK_CONFIG.create_check_config_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_check_config_step = function get_check_config_step (req, res, next) {
  CHECK_CONFIG.get_check_config_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_check_config_step_input = function get_check_config_step_input (req, res, next) {
  CHECK_CONFIG.get_check_config_step_input(req.swagger.params, res, next, req['headers']);
};

module.exports.get_check_config_step_result = function get_check_config_step_result (req, res, next) {
  CHECK_CONFIG.get_check_config_step_result(req.swagger.params, res, next, req['headers']);
};

module.exports.get_execution_check_config_steps = function get_execution_check_config_steps (req, res, next) {
  CHECK_CONFIG.get_execution_check_config_steps(req.swagger.params, res, next, req['headers']);
};

module.exports.update_check_config_step = function update_check_config_step (req, res, next) {
  CHECK_CONFIG.update_check_config_step(req.swagger.params, res, next, req['headers']);
};

module.exports.update_check_config_step_input = function update_check_config_step_input (req, res, next) {
  CHECK_CONFIG.update_check_config_step_input(req.swagger.params, res, next, req['headers']);
};
