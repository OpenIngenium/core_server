'use strict';

var url = require('url');

var Procedures = require('./ProceduresService');

module.exports.create_procedure = function create_procedure (req, res, next) {
  Procedures.create_procedure(req.swagger.params, res, next, req['headers']);
};

module.exports.delete_procedure = function delete_procedure (req, res, next) {
  Procedures.delete_procedure(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure = function get_procedure (req, res, next) {
  Procedures.get_procedure(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedures = function get_procedures (req, res, next) {
  Procedures.get_procedures(req.swagger.params, res, next, req['headers']);
};

module.exports.update_procedure = function update_procedure (req, res, next) {
  Procedures.update_procedure(req.swagger.params, res, next, req['headers']);
};

module.exports.replace_procedure = function replace_procedure (req, res, next) {
  Procedures.replace_procedure(req.swagger.params, res, next, req['headers']);
};

module.exports.export_procedure_versions = function export_procedure_versions (req, res, next) {
  Procedures.export_procedure_versions(req.swagger.params, res, next, req['headers']);
};

module.exports.import_procedure_versions = function import_procedure_versions (req, res, next) {
  Procedures.import_procedure_versions(req.swagger.params, res, next, req['headers']);
};

module.exports.create_procedure_label = function create_procedure_label (req, res, next) {
  Procedures.create_procedure_label(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_labels = function get_procedure_labels (req, res, next) {
  Procedures.get_procedure_labels(req.swagger.params, res, next, req['headers']);
};

module.exports.delete_procedure_label = function delete_procedure_label (req, res, next) {
  Procedures.delete_procedure_label(req.swagger.params, res, next, req['headers']);
};
