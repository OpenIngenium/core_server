'use strict';

var url = require('url');

var Venue_Config = require('./Venue_ConfigService');

module.exports.create_venue_config_step = function create_venue_config_step (req, res, next) {
  Venue_Config.create_venue_config_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_execution_venue_config_steps = function get_execution_venue_config_steps (req, res, next) {
  Venue_Config.get_execution_venue_config_steps(req.swagger.params, res, next, req['headers']);
};

module.exports.get_venue_config_step = function get_venue_config_step (req, res, next) {
  Venue_Config.get_venue_config_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_venue_config_step_input = function get_venue_config_step_input (req, res, next) {
  Venue_Config.get_venue_config_step_input(req.swagger.params, res, next, req['headers']);
};

module.exports.get_venue_config_step_result = function get_venue_config_step_result (req, res, next) {
  Venue_Config.get_venue_config_step_result(req.swagger.params, res, next, req['headers']);
};

module.exports.update_venue_config_step = function update_venue_config_step (req, res, next) {
  Venue_Config.update_venue_config_step(req.swagger.params, res, next, req['headers']);
};

module.exports.update_venue_config_step_input = function update_venue_config_step_input (req, res, next) {
  Venue_Config.update_venue_config_step_input(req.swagger.params, res, next, req['headers']);
};
