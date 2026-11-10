'use strict';

var url = require('url');

var Procedure_Versions = require('./Procedure_VersionsService');

module.exports.create_version = function create_version (req, res, next) {
  Procedure_Versions.create_version(req.swagger.params, res, next, req['headers']);
};

module.exports.delete_version = function delete_version (req, res, next) {
  Procedure_Versions.delete_version(req.swagger.params, res, next, req['headers']);
};

module.exports.get_version = function get_version (req, res, next) {
  Procedure_Versions.get_version(req.swagger.params, res, next, req['headers']);
};

module.exports.get_version_structure = function get_version_structure (req, res, next) {
  Procedure_Versions.get_version_structure(req.swagger.params, res, next, req['headers']);
};

module.exports.get_versions = function get_versions (req, res, next) {
  Procedure_Versions.get_versions(req.swagger.params, res, next, req['headers']);
};

module.exports.update_version = function update_version (req, res, next) {
  Procedure_Versions.update_version(req.swagger.params, res, next, req['headers']);
};

module.exports.update_version_status = function update_version_status (req, res, next) {
  Procedure_Versions.update_version_status(req.swagger.params, res, next, req['headers'], req.jwt);
};

module.exports.validate_procedure_version = function validate_procedure_version (req, res, next) {
  Procedure_Versions.validate_procedure_version(req.swagger.params, res, next, req['headers']);
};

module.exports.get_version_outline = function get_version_outline (req, res, next) {
  Procedure_Versions.get_version_outline(req.swagger.params, res, next, req['headers']);
};

module.exports.get_version_time_references = function get_version_time_references (req, res, next) {
  Procedure_Versions.get_version_time_references(req.swagger.params, res, next, req['headers']);
};

module.exports.get_version_data_paths = function get_version_data_paths (req, res, next) {
  Procedure_Versions.get_version_data_paths(req.swagger.params, res, next, req['headers']);
};

module.exports.get_version_elements = function get_version_elements (req, res, next) {
  Procedure_Versions.get_version_elements(req.swagger.params, res, next, req['headers']);
};

module.exports.export_procedure_version = function export_procedure_version (req, res, next) {
  Procedure_Versions.export_procedure_version(req.swagger.params, res, next, req['headers']);
};

module.exports.search_procedure_version = function search_procedure_version (req, res, next) {
  Procedure_Versions.search_procedure_version(req.swagger.params, res, next, req['headers']);
};