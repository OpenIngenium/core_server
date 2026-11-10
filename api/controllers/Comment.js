'use strict';

var url = require('url');

var Comment = require('./CommentService');

module.exports.element_add_conversation = function element_add_conversation (req, res, next) {
  Comment.element_add_conversation(req.swagger.params, res, next, req['headers']);
};

module.exports.element_get_conversations = function element_get_conversations (req, res, next) {
  Comment.element_get_conversations(req.swagger.params, res, next, req['headers']);
};

module.exports.element_get_conversation = function element_get_conversation (req, res, next) {
  Comment.element_get_conversation(req.swagger.params, res, next, req['headers']);
};

module.exports.element_update_conversation = function element_update_conversation (req, res, next) {
  Comment.element_update_conversation(req.swagger.params, res, next, req['headers']);
};

module.exports.element_delete_conversation = function element_delete_conversation (req, res, next) {
  Comment.element_delete_conversation(req.swagger.params, res, next, req['headers']);
};

module.exports.element_add_comment = function element_add_comment (req, res, next) {
  Comment.element_add_comment(req.swagger.params, res, next, req['headers']);
};

module.exports.element_get_comments = function element_get_comments (req, res, next) {
  Comment.element_get_comments(req.swagger.params, res, next, req['headers']);
};

module.exports.element_get_comment = function element_get_comment (req, res, next) {
  Comment.element_get_comment(req.swagger.params, res, next, req['headers']);
};

module.exports.element_update_comment = function element_update_comment (req, res, next) {
  Comment.element_update_comment(req.swagger.params, res, next, req['headers']);
};

module.exports.element_delete_comment = function element_delete_comment (req, res, next) {
  Comment.element_delete_comment(req.swagger.params, res, next, req['headers']);
};

