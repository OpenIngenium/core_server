'use strict';

var url = require('url');

var WAIT_DATA_PRODUCTS = require('./WAIT_DATA_PRODUCTSService');

module.exports.create_wait_data_products_step = function create_wait_data_products_step (req, res, next) {
  WAIT_DATA_PRODUCTS.create_wait_data_products_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_execution_wait_data_products_steps = function get_execution_wait_data_products_steps (req, res, next) {
  WAIT_DATA_PRODUCTS.get_execution_wait_data_products_steps(req.swagger.params, res, next, req['headers']);
};

module.exports.get_wait_data_products_step = function get_wait_data_products_step (req, res, next) {
  WAIT_DATA_PRODUCTS.get_wait_data_products_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_wait_data_products_step_input = function get_wait_data_products_step_input (req, res, next) {
  WAIT_DATA_PRODUCTS.get_wait_data_products_step_input(req.swagger.params, res, next, req['headers']);
};

module.exports.get_wait_data_products_step_result = function get_wait_data_products_step_result (req, res, next) {
  WAIT_DATA_PRODUCTS.get_wait_data_products_step_result(req.swagger.params, res, next, req['headers']);
};

module.exports.update_wait_data_products_step = function update_wait_data_products_step (req, res, next) {
  WAIT_DATA_PRODUCTS.update_wait_data_products_step(req.swagger.params, res, next, req['headers']);
};

module.exports.update_wait_data_products_step_input = function update_wait_data_products_step_input (req, res, next) {
  WAIT_DATA_PRODUCTS.update_wait_data_products_step_input(req.swagger.params, res, next, req['headers']);
};
