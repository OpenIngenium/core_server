'use strict';

var Execution = require('./ExecutionService');

module.exports.create_execution = function create_execution (req, res, next) {
  Execution.create_execution(req.swagger.params, res, next, req['headers']);
};

module.exports.create_execution_step = function create_execution_step (req, res, next) {
  Execution.create_execution_step(req.swagger.params, res, next, req['headers']);
};

module.exports.delete_execution = function delete_execution (req, res, next) {
  Execution.delete_execution(req.swagger.params, res, next, req['headers']);
};

module.exports.get_execution = function get_execution (req, res, next) {
  Execution.get_execution(req.swagger.params, res, next, req['headers']);
};

module.exports.get_execution_as_run = function get_execution_as_run (req, res, next) {
  Execution.get_execution_as_run(req.swagger.params, res, next, req['headers']);
};

module.exports.get_execution_elements = function get_execution_elements (req, res, next) {
  Execution.get_execution_elements(req.swagger.params, res, next, req['headers']);
};

module.exports.get_execution_simple_elements = function get_execution_simple_elements (req, res, next) {
  Execution.get_execution_simple_elements(req.swagger.params, res, next, req['headers']);
};

module.exports.get_execution_history = function get_execution_history (req, res, next) {
  Execution.get_execution_history(req.swagger.params, res, next, req['headers']);
};

module.exports.get_execution_time_references = function get_execution_time_references (req, res, next) {
  Execution.get_execution_time_references(req.swagger.params, res, next, req['headers']);
};

module.exports.get_execution_data_paths = function get_execution_data_paths (req, res, next) {
  Execution.get_execution_data_paths(req.swagger.params, res, next, req['headers']);
};

module.exports.get_execution_status = function get_execution_status (req, res, next) {
  Execution.get_execution_status(req.swagger.params, res, next, req['headers']);
};

module.exports.get_execution_steps = function get_execution_steps (req, res, next) {
  Execution.get_execution_steps(req.swagger.params, res, next, req['headers']);
};

module.exports.get_executions = function get_executions (req, res, next) {
  Execution.get_executions(req.swagger.params, res, next, req['headers']);
};

module.exports.halt_execution = function halt_execution (req, res, next) {
  Execution.halt_execution(req.swagger.params, res, next, req['headers']);
};

module.exports.pause_execution = function pause_execution (req, res, next) {
  Execution.pause_execution(req.swagger.params, res, next, req['headers']);
};

module.exports.continue_execution = function continue_execution (req, res, next) {
  Execution.continue_execution(req.swagger.params, res, next, req['headers']);
};

module.exports.set_switch_wait = function set_switch_wait (req, res, next) {
  Execution.set_switch_wait(req.swagger.params, res, next, req['headers']);
};

module.exports.get_switch_wait = function get_switch_wait (req, res, next) {
  Execution.get_switch_wait(req.swagger.params, res, next, req['headers']);
};

module.exports.get_switch_wait_flag = function get_switch_wait_flag (req, res, next) {
  Execution.get_switch_wait_flag(req.swagger.params, res, next, req['headers']);
};

module.exports.delete_switch_wait_flag = function delete_switch_wait_flag (req, res, next) {
  Execution.delete_switch_wait_flag(req.swagger.params, res, next, req['headers']);
};

module.exports.move_execution_element = function move_execution_element (req, res, next) {
  Execution.move_execution_element(req.swagger.params, res, next, req['headers']);
};

module.exports.get_execution_outline = function get_execution_outline (req, res, next) {
  Execution.get_execution_outline(req.swagger.params, res, next, req['headers']);
};

module.exports.copy_execution_element = function copy_execution_element (req, res, next) {
  Execution.copy_execution_element(req.swagger.params, res, next, req['headers']);
};

module.exports.execution_update_element = function execution_update_element (req, res, next) {
  Execution.execution_update_element(req.swagger.params, res, next, req['headers']);
};

module.exports.execution_compute_element = function execution_compute_element (req, res, next) {
  Execution.execution_compute_element(req.swagger.params, res, next, req['headers']);
};

module.exports.execution_modify_element = function execution_modify_element (req, res, next) {
  Execution.execution_modify_element(req.swagger.params, res, next, req['headers']);
};

module.exports.execution_justify_element = function execution_justify_element (req, res, next) {
  Execution.execution_justify_element(req.swagger.params, res, next, req['headers']);
};

module.exports.execution_bulk_justify = function execution_bulk_justify (req, res, next) {
  Execution.execution_bulk_justify(req.swagger.params, res, next, req['headers']);
};

module.exports.execution_approve_element = function execution_approve_element (req, res, next) {
  Execution.execution_approve_element(req.swagger.params, res, next, req['headers']);
};

module.exports.execution_bulk_approve = function execution_bulk_approve (req, res, next) {
  Execution.execution_bulk_approve(req.swagger.params, res, next, req['headers']);
};

module.exports.execution_discard_element = function execution_discard_element (req, res, next) {
  Execution.execution_discard_element(req.swagger.params, res, next, req['headers']);
};

module.exports.execution_discard_elements = function execution_discard_elements (req, res, next) {
  Execution.execution_discard_elements(req.swagger.params, res, next, req['headers']);
};

module.exports.execution_delete_element = function execution_delete_element (req, res, next) {
  Execution.execution_delete_element(req.swagger.params, res, next, req['headers']);
};

module.exports.run_execution = function run_execution (req, res, next) {
  Execution.run_execution(req.swagger.params, res, next, req['headers']);
};

module.exports.update_execution = function update_execution (req, res, next) {
  Execution.update_execution(req.swagger.params, res, next, req['headers']);
};

module.exports.update_execution_status = function update_execution_status (req, res, next) {
  Execution.update_execution_status(req.swagger.params, res, next, req['headers']);
};

module.exports.refresh_execution = function refresh_execution (req, res, next) {
  Execution.refresh_execution(req.swagger.params, res, next, req['headers']);
};

module.exports.set_boundary_element = function set_boundary_element (req, res, next) {
  Execution.set_boundary_element(req.swagger.params, res, next, req['headers']);
};

module.exports.resume_execution = function resume_execution (req, res, next) {
  Execution.resume_execution(req.swagger.params, res, next, req['headers']);
};

module.exports.suspend_resume_execution = function suspend_resume_execution (req, res, next) {
  Execution.suspend_resume_execution(req.swagger.params, res, next, req['headers']);
};

module.exports.remove_break_points = function remove_break_points (req, res, next) {
  Execution.remove_break_points(req.swagger.params, res, next, req['headers']);
};

module.exports.search_execution = function search_execution (req, res, next) {
  Execution.search_execution(req.swagger.params, res, next, req['headers']);
};

module.exports.post_execution_message = function post_execution_message (req, res, next) {
  Execution.post_execution_message(req.swagger.params, res, next, req['headers']);
};

module.exports.export_execution = function export_execution (req, res, next) {
  Execution.export_execution(req.swagger.params, res, next, req['headers']);
};

module.exports.import_execution = function import_execution (req, res, next) {
  Execution.import_execution(req.swagger.params, res, next, req['headers']);
};