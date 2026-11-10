'use strict';
var node_funcs = require('../node_funcs');
var config = require('../../config');
var log = node_funcs.log;
var redis = node_funcs.redis;

exports.get_step = async function(args, res, next, headers) {
  /**
   * Get step definition and result
   *
   * step_id String unique id of step
   * returns List
   **/
  const key = node_funcs.get_auth_key(headers);
  let execution_id = args['execution_id']['value'];
  let elem_id = args['elem_id']['value'];

  try {
    const data = await node_funcs.getStep(execution_id, null, elem_id, key); 
    res.status(200).json(data);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when getting a step', err);
    res.status(400).json(err_data);    
  }
}

exports.get_step_input = async function(args, res, next, headers) {
  /**
   * Get user input of a step
   *
   * step_id String unique id of step
   * returns Object
   **/
  const key = node_funcs.get_auth_key(headers);
  let execution_id = args['execution_id']['value'];
  let elem_id = args['elem_id']['value'];

  try {
    const data = await node_funcs.get_step_input(execution_id, null, elem_id, key); 
    res.status(200).json(data);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when getting step input', err);
    res.status(400).json(err_data);    
  }
}

exports.get_step_result = async function(args, res, next, headers) {
  /**
   * Get result of a step
   *
   * step_id String unique id of step
   * returns Object
   **/
  const key = node_funcs.get_auth_key(headers);
  let execution_id = args['execution_id']['value'];
  let elem_id = args['elem_id']['value'];

  try {
    const data = await node_funcs.get_step_result(execution_id, elem_id, key); 
    res.status(200).json(data);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when getting step result', err);
    res.status(400).json(err_data);    
  }
}

exports.update_step = async function(args, res, next, headers) {
  /**
   * Update a step
   *
   * step_id String unique id of step
   * step Step Definition of step
   * no response value expected for this operation
   **/
  const key = node_funcs.get_auth_key(headers);
  let execution_id = args['execution_id']['value'];
  let elem_id = args['elem_id']['value'];
  let step = args['step']['value'];

  try {
    const data = await node_funcs.updateStep(execution_id, null, elem_id, step, key); 
    res.status(200).json(data);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when updating step', err);
    res.status(400).json(err_data);    
  }
}

exports.update_step_input = async function(args, res, next, headers) {
  /**
   * Update user input of a step
   *
   * step_id String unique id of step
   * user_input Object User input values
   * no response value expected for this operation
   **/
  const key = node_funcs.get_auth_key(headers);
  let execution_id = args['execution_id']['value'];
  let elem_id = args['elem_id']['value'];
  let user_input = args['user_input']['value'];

  try {
    const data = await node_funcs.update_step_input(execution_id, null, elem_id, user_input, key); 
    res.status(204).end();
  } catch (err) {
    const err_data = node_funcs.push_error('Error when updating step input', err);
    res.status(400).json(err_data);    
  }
}

exports.update_step_result = async function(args, res, next, headers) {
  /**
   * Update result of a step
   *
   * step_id String unique id of step
   * result Object Result of step
   * no response value expected for this operation
   **/
  const key = node_funcs.get_auth_key(headers);

  let execution_id = args["execution_id"]["value"];
  let elem_id = args["elem_id"]["value"];
  let result = args["result"]["value"];

  let execution = null;
  let step = null;
  let error = null;
  
  try {
    step = await node_funcs.getStep(execution_id, null, elem_id, key);
  }
  catch (err) {
    res.status(400).json(err);
    return;    
  }

  let step_completion_status = node_funcs.get_step_completion_status(step);
  log.debug(`update_step_result elem_id: ${elem_id} step_completion_status: ${step_completion_status}`, {execution_id: execution_id});
  
  try {
    execution = await node_funcs.getExecution(execution_id, key);
  }
  catch (err) {
    res.status(400).json(err);
    return;    
  }
    
  if (node_funcs.is_closed(execution)) {
    const err_data = {
      'message': `Execution has been closed. Cannot update step results. execution_id: ${execution_id} number: ${step.number} elem_id: ${step.elem_id}`,
      'details': [],
      'error_type': 'STEP_ERROR',
      'error_source': 'OTHER',
      'http_code_at_source': 0
    };
    res.status(400).json(err_data);  
    return;    
  }

  if (step.executable === 'EXECUTED' && step_completion_status !== null) {
    const err_data = {
      'message': `Cannot update step result. Step is already completed. execution_id: ${execution_id} number: ${step.number} elem_id: ${step.elem_id} status: ${step_completion_status}`,
      'details': [],
      'error_type': 'STEP_ERROR',
      'error_source': 'OTHER',
      'http_code_at_source': 0
    };
    res.status(400).json(err_data);
    return;
  } else {
    try {
      step = await node_funcs.update_step_result(execution_id, elem_id, result, key);
      res.status(200).json(step);
    } catch (err) {
      error = err;
      const err_data = node_funcs.push_error('Error when updating step result', err);
      res.status(400).json(err_data);  
    }
  }
}

exports.create_new_run = async function(args, res, next, headers) {
  /**
   * Create a copy of the step to run it again
   *
   * elem_id String unique id of step
   * returns Object
   **/
  const key = node_funcs.get_auth_key(headers);
  let execution_id = args['execution_id']['value'];
  let elem_id = args['elem_id']['value'];

  try {
    const data = await node_funcs.create_new_run(execution_id, elem_id, key); 
    res.status(200).json(data);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when creating a new run', err);
    res.status(400).json(err_data);    
  }
}

exports.override_step = async function(args, res, next, headers) {
  /**
   * Override pass/fail status
   *
   * elem_id String unique id of step
   * override_input Object Input to override step status
   * returns Object
   **/
  const key = node_funcs.get_auth_key(headers);
  let execution_id = args['execution_id']['value'];
  let elem_id = args['elem_id']['value'];
  let override_input = args['override_input']['value'];

  try {
    const data = await node_funcs.override_step(execution_id, elem_id, override_input, key);
    res.status(200).json(data);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when overriding status of step', err);
    res.status(400).json(err_data);    
  }
}

exports.update_override_step = async function(args, res, next, headers) {
  /**
   * Update override info
   *
   * elem_id String unique id of step
   * override_input Object Input to override step status
   * returns Object
   **/
  const key = node_funcs.get_auth_key(headers);
  let execution_id = args['execution_id']['value'];
  let elem_id = args['elem_id']['value'];
  let override_input = args['override_input']['value'];

  try {
    const data = await node_funcs.update_override_step(execution_id, elem_id, override_input, key);
    res.status(200).json(data);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when updating override status of step', err);
    res.status(400).json(err_data);    
  }
}

exports.discard_override_step = async function(args, res, next, headers) {
  /**
   * Discard overridden pass/fail status
   *
   * elem_id String unique id of step
   * returns Object
   **/
  const key = node_funcs.get_auth_key(headers);
  let execution_id = args['execution_id']['value'];
  let elem_id = args['elem_id']['value'];

  try {
    const data = await node_funcs.discard_override_step(execution_id, elem_id, key);
    res.status(200).json(data);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when discarding overriden status of step', err);
    res.status(400).json(err_data);    
  }
}