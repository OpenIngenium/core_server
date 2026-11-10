'use strict';
var node_funcs = require('../node_funcs');
exports.create_procedure_cmd_file_step = async function(args, res, next, headers) {
  /**
   * Create a cmd file step
   *
   * procedure_id String unique id of procedure
   * insert_after_id String unique id of the element after which element(s) will be added/inserted. If not provided, element will be added/inserted to the last. To insert at the front, use \"-1\". (optional)
   * level String Add as a sibling or a child. * `SIBLING` - As a sibling of insert_after_id element (Default) * `CHILD` - As a child of insert_after_element  (optional)
   * returns AddCmdFileStepResponse
   **/
  const key = node_funcs.get_auth_key(headers);
  let procedure_id = args['procedure_id']['value'];
  let step = args['step'] ? args['step']['value'] : null;
  let insert_after_id = args['insert_after_id'] ? args['insert_after_id']['value'] : '-1';   
  let level = args['level'] ? args['level']['value'] : 'SIBLING';
 
  try {
    const data = await node_funcs.createArchiveElement(null, procedure_id, "STEP", "CMD_FILE", step, insert_after_id, level, key); 
    res.status(200).json(data);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when creating a step', err);
    res.status(400).json(err_data);    
  }
}

exports.get_procedure_cmd_file_step = async function(args, res, next, headers) {
  /**
   * Get a cmd file step
   *
   * procedure_id String unique id of procedure
   * elem_id String unique id of a procedure element
   * returns CmdFileStep
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

exports.get_procedure_cmd_file_step_input = async function(args, res, next, headers) {
  /**
   * Get user input of a cmd file step
   *
   * procedure_id String unique id of procedure
   * elem_id String unique id of a procedure element
   * returns CmdFileStepInput
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

exports.get_procedure_cmd_file_steps = async function(args, res, next, headers) {
  /**
   * Get cmd file steps of the execution. List is sorted by the order in the execution.
   *
   * procedure_id String unique id of procedure
   * offset Integer Start index for pagination. zero based. (optional)
   * limit Integer Max number of elements to return. (optional)
   * sort String Sort in natural order * `ASC` - Ascending * `DESC` - Descending  (optional)
   * description String Query for words in description (optional)
   * returns List
   **/
  const key = node_funcs.get_auth_key(headers);
  let procedure_id = args['procedure_id']['value'] == undefined ? null : args['procedure_id']['value'];
  let elem_type = 'STEP';
  let step_type = 'CMD_FILE'
  let offset = args['offset']['value'] == undefined ? null : args['offset']['value'];
  let limit = args['limit']['value'] == undefined ? null : args['limit']['value'];
  let sort = args['sort']['value'] == undefined ? null : args['sort']['value'];

  try {
    const {elems, total_count} = 
      await node_funcs.getProcedureElements(procedure_id, elem_type, step_type, offset, limit, sort, null, key); 
    res.set('x-total-count', total_count);
    res.status(200).json(elems);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when getting steps', err);
    res.status(400).json(err_data);    
  }
}

exports.update_procedure_cmd_file_step = async function(args, res, next, headers) {
  /**
   * Update a cmd file step
   *
   * procedure_id String unique id of procedure
   * elem_id String unique id of a procedure element
   * step CmdFileStep Definition of cmd file step
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

exports.update_procedure_cmd_file_step_input = async function(args, res, next, headers) {
  /**
   * Update user input of a cmd file step
   *
   * procedure_id String unique id of procedure
   * elem_id String unique id of a procedure element
   * user_input CmdFileStepInput User input values
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

