'use strict';
var node_funcs = require('../node_funcs');
exports.create_bus_1553_step = async function(args, res, next, headers) {
  /**
   * Create a bus 1553 step
   *
   * execution_id String unique id of execution
   * insert_after_id String unique id of the element after which element(s) will be added/inserted. If not provided, element will be added/inserted to the last. To insert at the front, use \"-1\". (optional)
   * level String Add as a sibling or a child. * `SIBLING` - As a sibling of insert_after_id element (Default) * `CHILD` - As a child of insert_after_element  (optional)
   * returns AddBus1553StepResponse
   **/
  const key = node_funcs.get_auth_key(headers);
  let execution_id = args['execution_id']['value'];
  let step = args['step'] ? args['step']['value'] : null;
  let insert_after_id = args['insert_after_id'] ? args['insert_after_id']['value'] : '-1';   
  let level = args['level'] ? args['level']['value'] : 'SIBLING';
 
  try {
    const data = await node_funcs.createArchiveElement(execution_id, null, "STEP", "BUS_1553", step, insert_after_id, level, key); 
    res.status(200).json(data);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when creating a step', err);
    res.status(400).json(err_data);    
  }
}

exports.get_execution_bus_1553_steps = async function(args, res, next, headers) {
  /**
   * Get bus 1553 steps of the execution. List is sorted by the order in the execution.
   *
   * execution_id String unique id of execution
   * offset Integer Start index for pagination. zero based. (optional)
   * limit Integer Max number of elements to return. (optional)
   * sort String Sort in natural order * `ASC` - Ascending * `DESC` - Descending  (optional)
   * description String Query for words in description (optional)
   * returns List
   **/
  const key = node_funcs.get_auth_key(headers);
  let execution_id = args['execution_id']['value'] == undefined ? null : args['execution_id']['value'];
  let elem_type = 'STEP';
  let step_type = 'BUS_1553'
  let offset = args['offset']['value'] == undefined ? null : args['offset']['value'];
  let limit = args['limit']['value'] == undefined ? null : args['limit']['value'];
  let sort = args['sort']['value'] == undefined ? null : args['sort']['value'];

  try {
    const {elems, total_count} = 
      await node_funcs.getExecutionElements(execution_id, elem_type, step_type, offset, limit, sort, null, null, null, null, null, key); 
    res.set('x-total-count', total_count);
    res.status(200).json(elems);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when getting steps', err);
    res.status(400).json(err_data);    
  }
}

exports.get_bus_1553_step = async function(args, res, next, headers) {
  /**
   * Get a bus 1553 step
   *
   * elem_id String unique id of a procedure element
   * returns Bus1553Step
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

exports.get_bus_1553_step_input = async function(args, res, next, headers) {
  /**
   * Get user input of a bus 1553 step
   *
   * elem_id String unique id of a procedure element
   * returns Bus1553InputSpec
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

exports.get_bus_1553_step_result = async function(args, res, next, headers) {
  /**
   * Get result of a bus 1553 step
   *
   * elem_id String unique id of a procedure element
   * returns Bus1553ResultSpec
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

exports.update_bus_1553_step = async function(args, res, next, headers) {
  /**
   * Update a bus 1553 step
   *
   * elem_id String unique id of a procedure element
   * step Bus1553Step Definition of bus 1553 step
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

exports.update_bus_1553_step_input = async function(args, res, next, headers) {
  /**
   * Update user input of a bus 1553 step
   *
   * elem_id String unique id of a procedure element
   * user_input Bus1553InputSpec User input values
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


