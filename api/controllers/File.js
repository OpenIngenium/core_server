'use strict';

var url = require('url');

var File = require('./FileService');

module.exports.element_upload_file = function element_upload_file (req, res, next) {
  File.element_upload_file(req.swagger.params, res, next, req['headers']);
};

module.exports.element_get_files = function element_get_files (req, res, next) {
  File.element_get_files(req.swagger.params, res, next, req['headers']);
};

module.exports.element_get_file = function element_get_file (req, res, next) {
  File.element_get_file(req.swagger.params, res, next, req['headers']);
};

module.exports.element_delete_file = function element_delete_file (req, res, next) {
  File.element_delete_file(req.swagger.params, res, next, req['headers']);
};

module.exports.execution_upload_file = function execution_upload_file (req, res, next) {
  File.execution_upload_file(req.swagger.params, res, next, req['headers']);
};

module.exports.execution_get_files = function execution_get_files (req, res, next) {
  File.execution_get_files(req.swagger.params, res, next, req['headers']);
};

module.exports.execution_get_file = function execution_get_file (req, res, next) {
  File.execution_get_file(req.swagger.params, res, next, req['headers']);
};

module.exports.execution_delete_file = function execution_delete_file (req, res, next) {
  File.execution_delete_file(req.swagger.params, res, next, req['headers']);
};

module.exports.element_post_comment_file = function element_post_comment_file (req, res, next) {
  File.element_post_comment_file(req.swagger.params, res, next, req['headers']);
};

module.exports.element_get_comment_files = function element_get_comment_files (req, res, next) {
  File.element_get_comment_files(req.swagger.params, res, next, req['headers']);
};

module.exports.element_get_comment_file = function element_get_comment_file (req, res, next) {
  File.element_get_comment_file(req.swagger.params, res, next, req['headers']);
};

module.exports.element_delete_comment_file = function element_delete_comment_file (req, res, next) {
  File.element_delete_comment_file(req.swagger.params, res, next, req['headers']);
};
