'use strict';

var url = require('url');

var Procedure_LIST_DATA_PRODUCTS = require('./Procedure_LIST_DATA_PRODUCTSService');

module.exports.create_procedure_list_data_products_step = function create_procedure_list_data_products_step (req, res, next) {
  Procedure_LIST_DATA_PRODUCTS.create_procedure_list_data_products_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_list_data_products_step = function get_procedure_list_data_products_step (req, res, next) {
  Procedure_LIST_DATA_PRODUCTS.get_procedure_list_data_products_step(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_list_data_products_step_input = function get_procedure_list_data_products_step_input (req, res, next) {
  Procedure_LIST_DATA_PRODUCTS.get_procedure_list_data_products_step_input(req.swagger.params, res, next, req['headers']);
};

module.exports.get_procedure_list_data_products_steps = function get_procedure_list_data_products_steps (req, res, next) {
  Procedure_LIST_DATA_PRODUCTS.get_procedure_list_data_products_steps(req.swagger.params, res, next, req['headers']);
};

module.exports.update_procedure_list_data_products_step = function update_procedure_list_data_products_step (req, res, next) {
  Procedure_LIST_DATA_PRODUCTS.update_procedure_list_data_products_step(req.swagger.params, res, next, req['headers']);
};

module.exports.update_procedure_list_data_products_step_input = function update_procedure_list_data_products_step_input (req, res, next) {
  Procedure_LIST_DATA_PRODUCTS.update_procedure_list_data_products_step_input(req.swagger.params, res, next, req['headers']);
};
