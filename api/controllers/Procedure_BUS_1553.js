'use strict';

var url = require('url');

var Procedure_BUS_1553 = require('./Procedure_BUS_1553Service');

module.exports.create_procedure_bus_1553_step = function create_procedure_bus_1553_step (req, res, next) {
  Procedure_BUS_1553.create_procedure_bus_1553_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_bus_1553_step = function get_procedure_bus_1553_step (req, res, next) {
  Procedure_BUS_1553.get_procedure_bus_1553_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_bus_1553_step_input = function get_procedure_bus_1553_step_input (req, res, next) {
  Procedure_BUS_1553.get_procedure_bus_1553_step_input(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_bus_1553_steps = function get_procedure_bus_1553_steps (req, res, next) {
  Procedure_BUS_1553.get_procedure_bus_1553_steps(req.swagger.params, res, next, req['headers']);
};

module.exports.update_procedure_bus_1553_step = function update_procedure_bus_1553_step (req, res, next) {
  Procedure_BUS_1553.update_procedure_bus_1553_step(req.swagger.params, res, next, req['headers']);
};

module.exports.update_procedure_bus_1553_step_input = function update_procedure_bus_1553_step_input (req, res, next) {
  Procedure_BUS_1553.update_procedure_bus_1553_step_input(req.swagger.params, res, next, req['headers']);
};
