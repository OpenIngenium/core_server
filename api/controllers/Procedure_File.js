'use strict';

var url = require('url');

var Procedure_File = require('./Procedure_FileService');

module.exports.procedure_element_upload_file = function procedure_element_upload_file (req, res, next) {
  Procedure_File.procedure_element_upload_file(req.swagger.params, res, next, req['headers']);
};

module.exports.procedure_element_get_files = function procedure_element_get_files (req, res, next) {
  Procedure_File.procedure_element_get_files(req.swagger.params, res, next, req['headers']);
};

module.exports.procedure_element_get_file = function procedure_element_get_file (req, res, next) {
  Procedure_File.procedure_element_get_file(req.swagger.params, res, next, req['headers']);
};

module.exports.procedure_element_delete_file = function procedure_element_delete_file (req, res, next) {
  Procedure_File.procedure_element_delete_file(req.swagger.params, res, next, req['headers']);
};

module.exports.procedure_upload_file = function procedure_upload_file (req, res, next) {
  Procedure_File.procedure_upload_file(req.swagger.params, res, next, req['headers']);
};

module.exports.procedure_get_files = function procedure_get_files (req, res, next) {
  Procedure_File.procedure_get_files(req.swagger.params, res, next, req['headers']);
};

module.exports.procedure_get_file = function procedure_get_file (req, res, next) {
  Procedure_File.procedure_get_file(req.swagger.params, res, next, req['headers']);
};

module.exports.procedure_delete_file = function procedure_delete_file (req, res, next) {
  Procedure_File.procedure_delete_file(req.swagger.params, res, next, req['headers']);
};

module.exports.procedure_element_post_comment_file = function procedure_element_post_comment_file (req, res, next) {
  Procedure_File.procedure_element_post_comment_file(req.swagger.params, res, next, req['headers']);
};

module.exports.procedure_element_get_comment_files = function procedure_element_get_comment_files (req, res, next) {
  Procedure_File.procedure_element_get_comment_files(req.swagger.params, res, next, req['headers']);
};

module.exports.procedure_element_get_comment_file = function procedure_element_get_comment_file (req, res, next) {
  Procedure_File.procedure_element_get_comment_file(req.swagger.params, res, next, req['headers']);
};

module.exports.procedure_element_delete_comment_file = function procedure_element_delete_comment_file (req, res, next) {
  Procedure_File.procedure_element_delete_comment_file(req.swagger.params, res, next, req['headers']);
};