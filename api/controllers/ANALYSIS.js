'use strict';

var url = require('url');

var ANALYSIS = require('./ANALYSISService');

module.exports.create_analysis_step = function create_analysis_step (req, res, next) {
  ANALYSIS.create_analysis_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_analysis_step = function get_analysis_step (req, res, next) {
  ANALYSIS.get_analysis_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_execution_analysis_steps = function get_execution_analysis_steps (req, res, next) {
  ANALYSIS.get_execution_analysis_steps(req.swagger.params, res, next, req['headers']);
};

module.exports.update_analysis_step = function update_analysis_step (req, res, next) {
  ANALYSIS.update_analysis_step(req.swagger.params, res, next, req['headers']);
};
