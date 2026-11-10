'use strict';

var url = require('url');

var LIST_DATA_PRODUCTS = require('./LIST_DATA_PRODUCTSService');

module.exports.create_list_data_products_step = function create_list_data_products_step (req, res, next) {
  LIST_DATA_PRODUCTS.create_list_data_products_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_execution_list_data_products_steps = function get_execution_list_data_products_steps (req, res, next) {
  LIST_DATA_PRODUCTS.get_execution_list_data_products_steps(req.swagger.params, res, next, req['headers']);
};

module.exports.get_list_data_products_step = function get_list_data_products_step (req, res, next) {
  LIST_DATA_PRODUCTS.get_list_data_products_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_list_data_products_step_input = function get_list_data_products_step_input (req, res, next) {
  LIST_DATA_PRODUCTS.get_list_data_products_step_input(req.swagger.params, res, next, req['headers']);
};

module.exports.get_list_data_products_step_result = function get_list_data_products_step_result (req, res, next) {
  LIST_DATA_PRODUCTS.get_list_data_products_step_result(req.swagger.params, res, next, req['headers']);
};

module.exports.update_list_data_products_step = function update_list_data_products_step (req, res, next) {
  LIST_DATA_PRODUCTS.update_list_data_products_step(req.swagger.params, res, next, req['headers']);
};

module.exports.update_list_data_products_step_input = function update_list_data_products_step_input (req, res, next) {
  LIST_DATA_PRODUCTS.update_list_data_products_step_input(req.swagger.params, res, next, req['headers']);
};
