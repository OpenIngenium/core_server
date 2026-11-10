'use strict';

var url = require('url');

var GDS = require('./GDSService');

module.exports.create_gds_step = function create_gds_step (req, res, next) {
  GDS.create_gds_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_execution_gds_steps = function get_execution_gds_steps (req, res, next) {
  GDS.get_execution_gds_steps(req.swagger.params, res, next, req['headers']);
};

module.exports.get_gds_step = function get_gds_step (req, res, next) {
  GDS.get_gds_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_gds_step_input = function get_gds_step_input (req, res, next) {
  GDS.get_gds_step_input(req.swagger.params, res, next, req['headers']);
};

module.exports.get_gds_step_result = function get_gds_step_result (req, res, next) {
  GDS.get_gds_step_result(req.swagger.params, res, next, req['headers']);
};

module.exports.update_GDS_step_input = function update_GDS_step_input (req, res, next) {
  GDS.update_GDS_step_input(req.swagger.params, res, next, req['headers']);
};

module.exports.update_gds_step = function update_gds_step (req, res, next) {
  GDS.update_gds_step(req.swagger.params, res, next, req['headers']);
};
