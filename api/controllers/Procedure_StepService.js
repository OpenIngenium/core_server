'use strict';
var node_funcs = require('../node_funcs');

exports.procedure_get_step = async function(args, res, next, headers) {
  /**
   * Get step definition
   *
   * procedure_id String unique id of procedure
   * elem_id String unique id of a procedure element
   * returns List
   **/
  const key = node_funcs.get_auth_key(headers);
  let procedure_id = args['procedure_id']['value'];
  let elem_id = args['elem_id']['value'];

  try {
    const data = await node_funcs.getStep(null, procedure_id, elem_id, key); 
    res.status(200).json(data);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when getting a step', err);
    res.status(400).json(err_data);    
  }
}

exports.procedure_get_step_input = async function(args, res, next, headers) {
  /**
   * Get user input of a step (authoring time)
   *
   * procedure_id String unique id of procedure
   * elem_id String unique id of a procedure element
   * returns Object
   **/
  const key = node_funcs.get_auth_key(headers);
  let procedure_id = args['procedure_id']['value'];
  let elem_id = args['elem_id']['value'];

  try {
    const data = await node_funcs.get_step_input(null, procedure_id, elem_id, key); 
    res.status(200).json(data);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when getting step input', err);
    res.status(400).json(err_data);    
  }
}

exports.procedure_update_step = async function(args, res, next, headers) {
  /**
   * Update a step
   *
   * procedure_id String unique id of procedure
   * elem_id String unique id of a procedure element
   * step Step Definition of step
   * no response value expected for this operation
   **/
  const key = node_funcs.get_auth_key(headers);
  let procedure_id = args['procedure_id']['value'];
  let elem_id = args['elem_id']['value'];
  let step = args['step']['value'];

  try {
    const data = await node_funcs.updateStep(null, procedure_id, elem_id, step, key); 
    res.status(200).json(data);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when updating step', err);
    res.status(400).json(err_data);    
  }
}

exports.procedure_update_step_input = async function(args, res, next, headers) {
  /**
   * Update user input of a step (authoring time)
   *
   * procedure_id String unique id of procedure
   * elem_id String unique id of a procedure element
   * user_input Object User input values
   * no response value expected for this operation
   **/
  const key = node_funcs.get_auth_key(headers);
  let procedure_id = args['procedure_id']['value'];
  let elem_id = args['elem_id']['value'];
  let user_input = args['user_input']['value'];

  try {
    const data = await node_funcs.update_step_input(null, procedure_id, elem_id, user_input, key); 
    res.status(204).end();
  } catch (err) {
    const err_data = node_funcs.push_error('Error when updating step input', err);
    res.status(400).json(err_data);    
  }
}

