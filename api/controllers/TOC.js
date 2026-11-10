'use strict';

var url = require('url');

var TOC = require('./TOCService');

module.exports.create_toc_step = function create_toc_step (req, res, next) {
  TOC.create_toc_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_execution_toc_steps = function get_execution_toc_steps (req, res, next) {
  TOC.get_execution_toc_steps(req.swagger.params, res, next, req['headers']);
};

module.exports.get_toc_step = function get_toc_step (req, res, next) {
  TOC.get_toc_step(req.swagger.params, res, next, req['headers']);
};

module.exports.update_toc_step = function update_toc_step (req, res, next) {
  TOC.update_toc_step(req.swagger.params, res, next, req['headers']);
};
