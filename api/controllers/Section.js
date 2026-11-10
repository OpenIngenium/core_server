'use strict';

var url = require('url');

var Section = require('./SectionService');

module.exports.create_section = function create_section (req, res, next) {
  Section.create_section(req.swagger.params, res, next, req['headers']);
};

module.exports.get_execution_sections = function get_execution_sections (req, res, next) {
  Section.get_execution_sections(req.swagger.params, res, next, req['headers']);
};

module.exports.get_section = function get_section (req, res, next) {
  Section.get_section(req.swagger.params, res, next, req['headers']);
};

module.exports.update_section = function update_section (req, res, next) {
  Section.update_section(req.swagger.params, res, next, req['headers']);
};
