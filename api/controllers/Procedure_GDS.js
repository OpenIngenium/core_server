'use strict';

var url = require('url');

var Procedure_GDS = require('./Procedure_GDSService');

module.exports.create_procedure_gds_step = function create_procedure_gds_step (req, res, next) {
  Procedure_GDS.create_procedure_gds_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_gds_step = function get_procedure_gds_step (req, res, next) {
  Procedure_GDS.get_procedure_gds_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_gds_step_input = function get_procedure_gds_step_input (req, res, next) {
  Procedure_GDS.get_procedure_gds_step_input(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_gds_steps = function get_procedure_gds_steps (req, res, next) {
  Procedure_GDS.get_procedure_gds_steps(req.swagger.params, res, next, req['headers']);
};

module.exports.update_procedure_gds_step = function update_procedure_gds_step (req, res, next) {
  Procedure_GDS.update_procedure_gds_step(req.swagger.params, res, next, req['headers']);
};

module.exports.update_procedure_gds_step_input = function update_procedure_gds_step_input (req, res, next) {
  Procedure_GDS.update_procedure_gds_step_input(req.swagger.params, res, next, req['headers']);
};
