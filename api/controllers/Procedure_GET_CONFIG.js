'use strict';

var url = require('url');

var Procedure_GET_CONFIG = require('./Procedure_GET_CONFIGService');

module.exports.create_procedure_get_config_step = function create_procedure_get_config_step (req, res, next) {
  Procedure_GET_CONFIG.create_procedure_get_config_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_get_config_step = function get_procedure_get_config_step (req, res, next) {
  Procedure_GET_CONFIG.get_procedure_get_config_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_get_config_step_input = function get_procedure_get_config_step_input (req, res, next) {
  Procedure_GET_CONFIG.get_procedure_get_config_step_input(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_get_config_steps = function get_procedure_get_config_steps (req, res, next) {
  Procedure_GET_CONFIG.get_procedure_get_config_steps(req.swagger.params, res, next, req['headers']);
};

module.exports.update_procedure_get_config_step = function update_procedure_get_config_step (req, res, next) {
  Procedure_GET_CONFIG.update_procedure_get_config_step(req.swagger.params, res, next, req['headers']);
};

module.exports.update_procedure_get_config_step_input = function update_procedure_get_config_step_input (req, res, next) {
  Procedure_GET_CONFIG.update_procedure_get_config_step_input(req.swagger.params, res, next, req['headers']);
};
