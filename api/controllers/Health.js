'use strict';

var url = require('url');

var Health = require('./HealthService');

module.exports.health_get = function health_get (req, res, next) {
  Health.health_get(req.swagger.params, res, next);
};
