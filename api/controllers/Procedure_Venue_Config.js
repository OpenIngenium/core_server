'use strict';

var url = require('url');

var Procedure_Venue_Config = require('./Procedure_Venue_ConfigService');

module.exports.create_procedure_venue_config_step = function create_procedure_venue_config_step (req, res, next) {
  Procedure_Venue_Config.create_procedure_venue_config_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_venue_config_step = function get_procedure_venue_config_step (req, res, next) {
  Procedure_Venue_Config.get_procedure_venue_config_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_venue_config_step_input = function get_procedure_venue_config_step_input (req, res, next) {
  Procedure_Venue_Config.get_procedure_venue_config_step_input(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_venue_config_steps = function get_procedure_venue_config_steps (req, res, next) {
  Procedure_Venue_Config.get_procedure_venue_config_steps(req.swagger.params, res, next, req['headers']);
};

module.exports.update_procedure_venue_config_step = function update_procedure_venue_config_step (req, res, next) {
  Procedure_Venue_Config.update_procedure_venue_config_step(req.swagger.params, res, next, req['headers']);
};

module.exports.update_procedure_venue_config_step_input = function update_procedure_venue_config_step_input (req, res, next) {
  Procedure_Venue_Config.update_procedure_venue_config_step_input(req.swagger.params, res, next, req['headers']);
};
