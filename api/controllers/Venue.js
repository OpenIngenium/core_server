'use strict';

var Venue = require('./VenueService');

module.exports.create_venue = function create_venue (req, res, next) {
  Venue.create_venue(req.swagger.params, res, next, req['headers']);
};

module.exports.delete_venue = function delete_venue (req, res, next) {
  Venue.delete_venue(req.swagger.params, res, next, req['headers']);
};

module.exports.get_venue = function get_venue (req, res, next) {
  Venue.get_venue(req.swagger.params, res, next, req['headers']);
};

module.exports.get_venue_status = function get_venue_status (req, res, next) {
  Venue.get_venue_status(req.swagger.params, res, next, req['headers']);
};

module.exports.get_venues = function get_venues (req, res, next) {
  Venue.get_venues(req.swagger.params, res, next, req['headers']);
};

module.exports.set_venue_status = function set_venue_status (req, res, next) {
  Venue.set_venue_status(req.swagger.params, res, next, req['headers']);
};

module.exports.update_venue = function update_venue (req, res, next) {
  Venue.update_venue(req.swagger.params, res, next, req['headers']);
};
