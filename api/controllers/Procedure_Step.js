'use strict';

var url = require('url');

var Procedure_Step = require('./Procedure_StepService');

module.exports.procedure_get_step = function procedure_get_step (req, res, next) {
  Procedure_Step.procedure_get_step(req.swagger.params, res, next, req['headers']);
};

module.exports.procedure_get_step_input = function procedure_get_step_input (req, res, next) {
  Procedure_Step.procedure_get_step_input(req.swagger.params, res, next, req['headers']);
};

module.exports.procedure_update_step = function procedure_update_step (req, res, next) {
  Procedure_Step.procedure_update_step(req.swagger.params, res, next, req['headers']);
};

module.exports.procedure_update_step_input = function procedure_update_step_input (req, res, next) {
  Procedure_Step.procedure_update_step_input(req.swagger.params, res, next, req['headers']);
};
