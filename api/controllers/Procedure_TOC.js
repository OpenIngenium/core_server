'use strict';

var url = require('url');

var Procedure_TOC = require('./Procedure_TOCService');

module.exports.create_procedure_toc_step = function create_procedure_toc_step (req, res, next) {
  Procedure_TOC.create_procedure_toc_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_toc_step = function get_procedure_toc_step (req, res, next) {
  Procedure_TOC.get_procedure_toc_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_toc_steps = function get_procedure_toc_steps (req, res, next) {
  Procedure_TOC.get_procedure_toc_steps(req.swagger.params, res, next, req['headers']);
};

module.exports.update_procedure_toc_step = function update_procedure_toc_step (req, res, next) {
  Procedure_TOC.update_procedure_toc_step(req.swagger.params, res, next, req['headers']);
};
