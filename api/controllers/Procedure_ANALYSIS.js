'use strict';

var url = require('url');

var Procedure_ANALYSIS = require('./Procedure_ANALYSISService');

module.exports.create_procedure_analysis_step = function create_procedure_analysis_step (req, res, next) {
  Procedure_ANALYSIS.create_procedure_analysis_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_analysis_step = function get_procedure_analysis_step (req, res, next) {
  Procedure_ANALYSIS.get_procedure_analysis_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_analysis_steps = function get_procedure_analysis_steps (req, res, next) {
  Procedure_ANALYSIS.get_procedure_analysis_steps(req.swagger.params, res, next, req['headers']);
};

module.exports.update_procedure_analysis_step = function update_procedure_analysis_step (req, res, next) {
  Procedure_ANALYSIS.update_procedure_analysis_step(req.swagger.params, res, next, req['headers']);
};
