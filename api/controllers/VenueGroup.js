'use strict';

var VenueGroup = require('./VenueGroupService');

module.exports.create_venue_group = function create_venue_group (req, res, next) {
  VenueGroup.create_venue_group(req.swagger.params, res, next, req['headers']);
};

module.exports.get_venue_group = function get_venue_group (req, res, next) {
  VenueGroup.get_venue_group(req.swagger.params, res, next, req['headers']);
};

module.exports.get_venue_groups = function get_venue_groups (req, res, next) {
  VenueGroup.get_venue_groups(req.swagger.params, res, next, req['headers']);
};

module.exports.update_venue_group = function update_venue_group (req, res, next) {
  VenueGroup.update_venue_group(req.swagger.params, res, next, req['headers']);
};
