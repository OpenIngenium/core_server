'use strict';

var url = require('url');

var Paragraph = require('./ParagraphService');

module.exports.create_paragraph = function create_paragraph (req, res, next) {
  Paragraph.create_paragraph(req.swagger.params, res, next, req['headers']);
};

module.exports.get_execution_paragraphs = function get_execution_paragraphs (req, res, next) {
  Paragraph.get_execution_paragraphs(req.swagger.params, res, next, req['headers']);
};

module.exports.get_paragraph = function get_paragraph (req, res, next) {
  Paragraph.get_paragraph(req.swagger.params, res, next, req['headers']);
};

module.exports.update_paragraph = function update_paragraph (req, res, next) {
  Paragraph.update_paragraph(req.swagger.params, res, next, req['headers']);
};
