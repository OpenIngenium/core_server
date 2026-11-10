'use strict';
var node_funcs = require('../node_funcs');
var log = node_funcs.log;

exports.create_procedure_vi_step = async function(args, res, next, headers) {
  /**
   * Create a verification item step
   *
   * procedure_id String unique id of procedure
   * insert_after_id String unique id of the element after which element(s) will be added/inserted. If not provided, element will be added/inserted to the last. To insert at the front, use \"-1\". (optional)
   * level String Add as a sibling or a child. * `SIBLING` - As a sibling of insert_after_id element (Default) * `CHILD` - As a child of insert_after_element  (optional)
   * returns AddVIStepResponse
   **/
  const key = node_funcs.get_auth_key(headers);
  let procedure_id = args['procedure_id']['value'];
  let step = args['step'] ? args['step']['value'] : null;
  let insert_after_id = args['insert_after_id'] ? args['insert_after_id']['value'] : '-1';   
  let level = args['level'] ? args['level']['value'] : 'SIBLING';
 
  try {
    const data = await node_funcs.createArchiveElement(null, procedure_id, "STEP", "VERIFICATION_ITEM", step, insert_after_id, level, key); 
    res.status(200).json(data);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when creating a step', err);
    res.status(400).json(err_data);    
  }
}

exports.get_procedure_vi_ids = async function(args, res, next, headers) {
  /**
   * Get list ids of VI's defined in VI steps in the execution
   *
   * procedure_id String unique id of procedure
   * status String filter based on the status of the VI (optional)
   * returns List
   **/
  const key = node_funcs.get_auth_key(headers);
  let procedure_id = args['procedure_id']['value'] == undefined ? null : args['procedure_id']['value'];
  let filter = args['status'] == undefined ? undefined : args['status']['value'];

  try {
    const data = await node_funcs.getProcedureVIs(procedure_id, filter, key); 
    res.status(200).json(data);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when getting VI ids', err);
    res.status(400).json(err_data);    
  }
}

exports.get_procedure_vi_step = async function(args, res, next, headers) {
  /**
   * Get a VI step
   *
   * procedure_id String unique id of procedure
   * elem_id String unique id of a procedure element
   * returns VIStep
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

exports.get_procedure_vi_steps = async function(args, res, next, headers) {
  /**
   * Get VI steps of the execution. List is sorted by the order in the execution.
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
  let step_type = 'VERIFICATION_ITEM'
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

exports.update_procedure_vi_step = async function(args, res, next, headers) {
  /**
   * Update a VI step
   *
   * procedure_id String unique id of procedure
   * elem_id String unique id of a procedure element
   * step VIStep Definition of VI step
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

exports.get_procedure_vi_step_input = async function(args, res, next, headers) {
  /**
   * Get a VI step input
   *
   * procedure_id String unique id of procedure
   * elem_id String unique id of a procedure element
   * returns VIStepInput
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

exports.update_procedure_vi_step_input = async function(args, res, next, headers) {
  /**
   * Update a VI step input
   *
   * procedure_id String unique id of procedure
   * elem_id String unique id of a procedure element
   * user_input VIStepInput Definition of VI step input
   * no response value expected for this operation
   **/
  const key = node_funcs.get_auth_key(headers);
  let procedure_id = args['procedure_id']['value'];
  let elem_id = args['elem_id']['value'];
  let user_input = args['user_input']['value'];

  try {
    const data = await node_funcs.update_step_input_nonexecutable(null, procedure_id, elem_id, user_input, key); 
    res.status(204).end();
  } catch (err) {
    const err_data = node_funcs.push_error('Error when updating step input', err);
    res.status(400).json(err_data);    
  }
}
