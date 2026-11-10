'use strict';

var url = require('url');

var BUS_1553 = require('./BUS_1553Service');

module.exports.create_bus_1553_step = function create_bus_1553_step (req, res, next) {
  BUS_1553.create_bus_1553_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_execution_bus_1553_steps = function get_execution_bus_1553_steps (req, res, next) {
  BUS_1553.get_execution_bus_1553_steps(req.swagger.params, res, next, req['headers']);
};

module.exports.get_bus_1553_step = function get_bus_1553_step (req, res, next) {
  BUS_1553.get_bus_1553_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_bus_1553_step_input = function get_bus_1553_step_input (req, res, next) {
  BUS_1553.get_bus_1553_step_input(req.swagger.params, res, next, req['headers']);
};

module.exports.get_bus_1553_step_result = function get_bus_1553_step_result (req, res, next) {
  BUS_1553.get_bus_1553_step_result(req.swagger.params, res, next, req['headers']);
};

module.exports.update_bus_1553_step = function update_bus_1553_step (req, res, next) {
  BUS_1553.update_bus_1553_step(req.swagger.params, res, next, req['headers']);
};

module.exports.update_bus_1553_step_input = function update_bus_1553_step_input (req, res, next) {
  BUS_1553.update_bus_1553_step_input(req.swagger.params, res, next, req['headers']);
};
