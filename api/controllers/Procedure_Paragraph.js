'use strict';

var url = require('url');

var Procedure_Paragraph = require('./Procedure_ParagraphService');

module.exports.procedure_create_paragraph = function procedure_create_paragraph (req, res, next) {
  Procedure_Paragraph.procedure_create_paragraph(req.swagger.params, res, next, req['headers']);
};

module.exports.procedure_get_paragraph = function procedure_get_paragraph (req, res, next) {
  Procedure_Paragraph.procedure_get_paragraph(req.swagger.params, res, next, req['headers']);
};

module.exports.procedure_get_paragraphs = function procedure_get_paragraphs (req, res, next) {
  Procedure_Paragraph.procedure_get_paragraphs(req.swagger.params, res, next, req['headers']);
};

module.exports.procedure_update_paragraph = function procedure_update_paragraph (req, res, next) {
  Procedure_Paragraph.procedure_update_paragraph(req.swagger.params, res, next, req['headers']);
};
