'use strict';

var url = require('url');

var Logging = require('./LoggingService');

module.exports.get_logging = function get_logging (req, res, next) {
  Logging.get_logging(req.swagger.params, res, next);
};

module.exports.update_logging = function update_logging (req, res, next) {
  Logging.update_logging(req.swagger.params, res, next);
};
