'use strict';
var node_funcs = require('../node_funcs');
var log = node_funcs.log;
var util = require('util');

exports.load_working_copy = async function(args, res, next, headers) {
  /**
   * Reload the working copy
   *
   * procedure_id String unique id of procedure
   * procedure_info Procedure_info load the version of the procedure specified.
   * no response value expected for this operation
   **/
  const key = node_funcs.get_auth_key(headers);
  const procedure_id = args['procedure_id']['value'] == undefined ? null : args['procedure_id']['value'];
  const procedure_info = args['procedure_info']['value'] == undefined ? undefined : args['procedure_info']['value'];
  
  try {
    const data = await node_funcs.loadProcedure(procedure_id, procedure_info, key);
    res.status(204).end();
  } catch(err) {
    const err_data = node_funcs.push_error('Error when reloading working copy', err);
    res.status(400).json(err_data);
  }
}

exports.import_procedure_version = async function(args, res, next, headers) {
  /**
   * Import a procedure version into the working copy. The working copy will be replaced.
   *
   * procedure_id String unique id of procedure
   * procedure_version_file Procedure_info load the version of the procedure specified.
   * no response value expected for this operation
   **/
  const key = node_funcs.get_auth_key(headers);
  let procedure_id = args['procedure_id']['value'] == undefined ? null : args['procedure_id']['value'];
  let procedure_version_file = args['procedure_version_file']['value'] == undefined ? null : args['procedure_version_file']['value'];

  try {
    let data = await node_funcs.importProcedureVersion(procedure_id, procedure_version_file, key);
    res.status(200).json(data);
  } catch(err) {
    const err_data = node_funcs.push_error('Error when importing procedure version', err);
    res.status(400).json(err_data);
  }
}

exports.procedure_create_step = async function(args, res, next, headers) {
  /**
   * Create a step
   *
   * procedure_id String unique id of procedure
   * step Step step definition including its type
   * insert_after_id String unique id of the element after which element(s) will be added/inserted. If not provided, element will be added/inserted to the last. To insert at the front, use \"-1\". (optional)
   * level String Add as a sibling or a child. * `SIBLING` - As a sibling of insert_after_id element (Default) * `CHILD` - As a child of insert_after_element  (optional)
   * returns AddStepResponse
   **/
  const key = node_funcs.get_auth_key(headers);
  let execution_id = null;
  let procedure_id = args['procedure_id']['value'];;
  let level = args['level']['value'];
  let insert_after_id = args['insert_after_id']['value'];

  try {
    const data = await node_funcs.createArchiveElement(execution_id, procedure_id, "STEP", null, insert_after_id, level, key);
    res.status(200).json(data);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when creating a step', err);
    res.status(400).json(err_data);    
  }
}

exports.procedure_get_elements = async function(args, res, next, headers) {
  /**
   * Get elements of the specified type from procedure. List is sorted by the order in the procedure.
   *
   * procedure_id String unique id of procedure
   * elem_type String type of procedure element. If omitted, get all types. (optional)
   * step_type String type of step. If omitted, get all types. (optional)
   * offset Integer Start index for pagination. zero based. (optional)
   * limit Integer Max number of elements to return. (optional)
   * sort String Sort in natural order * `ASC` - Ascending * `DESC` - Descending  (optional)
   * description String Query for words in description (optional)
   * returns List
   **/
  const key = node_funcs.get_auth_key(headers);  
  let procedure_id = args['procedure_id']['value'] == undefined ? null : args['procedure_id']['value'];
  let elem_type = args['elem_type']['value'] == undefined ? null : args['elem_type']['value'];
  let step_type = args['step_type']['value'] == undefined ? null : args['step_type']['value'];
  let offset = args['offset']['value'] == undefined ? null : args['offset']['value'];
  let limit = args['limit']['value'] == undefined ? null : args['limit']['value'];
  let sort = args['sort']['value'] == undefined ? null : args['sort']['value'];
  let description = args['description']['value'] == undefined ? null : args['description']['value'];

  try {
    const {elems, total_count} = await node_funcs.getProcedureElements(procedure_id, elem_type, step_type, offset, limit, sort, description, key);
    res.set('x-total-count', total_count);
    res.status(200).json(elems);
  } catch(err) {
    const err_data = node_funcs.push_error('Error when getting procedure elements', err);
    const status_code = err_data.http_code_at_source ? err_data.http_code_at_source : 400;
    res.status(status_code).json(err_data);
  }
}

exports.procedure_get_steps = async function(args, res, next, headers) {
  /**
   * Get steps of the procedure. List is sorted by the order in the procedure.
   *
   * procedure_id String unique id of procedure
   * offset Integer Start index for pagination. zero based. (optional)
   * limit Integer Max number of elements to return. (optional)
   * sort String Sort in natural order * `ASC` - Ascending * `DESC` - Descending  (optional)
   * description String Query for words in description (optional)
   * returns List
   **/
  const key = node_funcs.get_auth_key(headers);
  const procedure_id = args['procedure_id']['value'];

  let params = {};
  if (args['sort']['value'] !== undefined) {
    params['sort'] = args['sort']['value'];
  }  
  if (args['offset']['value'] !== undefined) {
    params['offset'] = args['offset']['value'].toString();
  }   
  if (args['limit']['value'] !== undefined) {
    params['limit'] = args['limit']['value'].toString();
  }     
  
  try {
    const {elems, total_count} = await node_funcs.getAllSteps(null, procedure_id, params, key);
    res.set('x-total-count', total_count);
    res.status(200).json(elems);
  } catch(err) {
    let err_res = node_funcs.push_error('Error when getting procedure steps', err);
    let status_code = err_res.http_code_at_source ? err_res.http_code_at_source : 400;
    res.status(status_code).json(err_res);
  }
}

exports.procedure_get_structure = async function(args, res, next, headers) {
  /**
   * Get hierarchical view of procedure
   *
   * procedure_id String unique id of procedure
   * offset Integer Start index for pagination. zero based. (optional)
   * limit Integer Max number of elements to return. (optional)
   * sort String Sort in natural order * `ASC` - Ascending * `DESC` - Descending  (optional)
   * returns ProcedureStructure
   **/
  const key = node_funcs.get_auth_key(headers);
  let procedure_id = args['procedure_id']['value'] == undefined ? null : args['procedure_id']['value'];
  let offset = args['offset']['value'] == undefined ? null : args['offset']['value'];
  let limit = args['limit']['value'] == undefined ? null : args['limit']['value'];
  let sort = args['sort']['value'] == undefined ? null : args['sort']['value'];

  try {
    const data = await node_funcs.getStructure(procedure_id, offset, limit, sort, false, key);
    res.status(200).json(data);
  } catch(err) {
    const err_data = node_funcs.push_error('Error when getting procedure structure', err);
    const status_code = err_data.http_code_at_source ? err_data.http_code_at_source : 400;
    res.status(status_code).json(err_data);
  }
}

exports.procedure_move_element = async function(args, res, next, headers) {
  /**
   * Move elements in procedure
   *
   * procedure_id String unique id of procedure
   * move_element_input input 
   * returns ElementsNumberResponse
   **/
  const key = node_funcs.get_auth_key(headers);
  let procedure_id = args['procedure_id']['value'] == undefined ? null : args['procedure_id']['value'];
  let move_element_input = args['move_element_input']['value'];

  try {
    const data = await node_funcs.moveProcedureElement(procedure_id, move_element_input, key);
    res.status(200).json(data);
  } catch(err) {
    const err_data = node_funcs.push_error('Error when moving procedure element', err);
    const status_code = err_data.http_code_at_source ? err_data.http_code_at_source : 400;
    res.status(status_code).json(err_data);
  }
}

exports.procedure_copy_element = async function(args, res, next, headers) {
  /**
   * Copy elements in procedure
   *
   * procedure_id String unique id of procedure
   * copy_element_input input
   * returns CopyElementResponse
   **/
  const key = node_funcs.get_auth_key(headers);
  let procedure_id = args['procedure_id']['value'] == undefined ? null : args['procedure_id']['value'];
  let copy_element_input = args['copy_element_input']['value']; 

  try {
    const data = await node_funcs.copyProcedureElement(procedure_id, copy_element_input, key);
    res.status(200).json(data);
  } catch(err) {
    const err_data = node_funcs.push_error('Error when copying procedure element', err);
    const status_code = err_data.http_code_at_source ? err_data.http_code_at_source : 400;
    res.status(status_code).json(err_data);
  }
}

exports.procedure_update_element = async function(args, res, next, headers) {
  /**
   * Update an element
   *
   * procedure_id String unique id of execution
   * elem_id id of element to copy
   * elem_input element data to update
   * response ProcedureElement
   **/
  const key = node_funcs.get_auth_key(headers);
  const procedure_id = args['procedure_id']['value'];
  const elem_id = args['elem_id']['value']; 
  const elem_input = args['elem_input']['value']; 

  try {
    const data = await node_funcs.updateElement(null, procedure_id, elem_id, elem_input, key);
    res.status(200).json(data);
  } catch(err) {
    let err_res = node_funcs.push_error('Error when updating procedure element', err);
    let status_code = err_res.http_code_at_source ? err_res.http_code_at_source : 400;
    res.status(status_code).json(err_res);
  }
}

exports.procedure_delete_element = async function(args, res, next, headers) {
  /**
   * Delete an element from procedure
   *
   * procedure_id String unique id of procedure
   * elem_id String unique id of a procedure element
   * returns ElementsNumberResponse
   **/

  const key = node_funcs.get_auth_key(headers);
  const procedure_id = args['procedure_id']['value'];
  const elem_id = args['elem_id']['value'];

  try {
    const data = await node_funcs.delete_element(null, procedure_id, elem_id, key);
    res.status(200).json(data);
  } catch(err) {
    let err_res = node_funcs.push_error('Error when deleting a procedure element', err);
    let status_code = err_res.http_code_at_source ? err_res.http_code_at_source : 400;
    res.status(status_code).json(err_res);
  }
}

exports.procedure_replace_element = async function(args, res, next, headers) {
  /**
   * Replace an element of proedure
   *
   * procedure_id String unique id of procedure
   * elem_id String unique id of a procedure element
   * replace_element_input Object element info to replace the current element
   * returns ProcedureElement
   **/

  const key = node_funcs.get_auth_key(headers);
  const procedure_id = args['procedure_id']['value'];
  const elem_id = args['elem_id']['value'];
  let replace_element_input = args['replace_element_input']['value'];

  try {
    const data = await node_funcs.replace_element(procedure_id, elem_id, replace_element_input, key);
    res.status(200).json(data);
  } catch(err) {
    let err_res = node_funcs.push_error('Error when replacing a procedure element', err);
    let status_code = err_res.http_code_at_source ? err_res.http_code_at_source : 400;
    res.status(status_code).json(err_res);
  }
}

exports.procedure_create_tag = async function(args, res, next, headers) {
  /**
   * Create a tag for procedure
   *
   * procedure_id String unique id of procedure
   * tag_input Object tag input
   * return Updated tags of the working version of the procedure
   **/
  const key = node_funcs.get_auth_key(headers);
  let procedure_id = args['procedure_id']['value'];
  let tag_input = args['tag_input']['value'];

  try {
    const data = await node_funcs.procedure_create_tag(procedure_id, tag_input, key); 
    res.status(200).json(data);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when creating a procedure tag', err);
    res.status(400).json(err_data);    
  }
}

exports.procedure_update_tag = async function(args, res, next, headers) {
  /**
   * Update a tag
   *
   * procedure_id String unique id of procedure
   * tag_id String tag id
   * tag_input Object tag input
   * return Updated tags of the working version of the procedure
   **/
  const key = node_funcs.get_auth_key(headers);
  let procedure_id = args['procedure_id']['value'];
  let tag_id = args['tag_id']['value'];
  let tag_input = args['tag_input']['value'];

  try {
    const data = await node_funcs.procedure_update_tag(procedure_id, tag_id, tag_input, key); 
    res.status(200).json(data);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when updating a procedure tag', err);
    res.status(400).json(err_data);    
  }
}

exports.procedure_delete_tag = async function(args, res, next, headers) {
  /**
   * Delete a tag from procedure
   *
   * procedure_id String unique id of procedure
   * tag_id String tag id
   * return Updated tags of the working version of the procedure
   **/
  const key = node_funcs.get_auth_key(headers);
  let procedure_id = args['procedure_id']['value'];
  let tag_id = args['tag_id']['value'];

  try {
    const data = await node_funcs.procedure_delete_tag(procedure_id, tag_id, key); 
    res.status(200).json(data);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when updating a procedure tag', err);
    res.status(400).json(err_data);    
  }
}

exports.procedure_element_apply_tag = async function(args, res, next, headers) {
  /**
   * Apply a tag to an element
   *
   * procedure_id String unique id of procedure
   * elem_id String unique id of element
   * tag_id String tag id
   * return Updated tags of the working version of the procedure
   **/
  const key = node_funcs.get_auth_key(headers);
  let procedure_id = args['procedure_id']['value'];
  let elem_id = args['elem_id']['value'];
  let tag_id = args['tag_id']['value'];

  try {
    const data = await node_funcs.procedure_element_apply_tag(procedure_id, elem_id, tag_id, key); 
    res.status(200).json(data);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when applying a tag to element', err);
    res.status(400).json(err_data);    
  }
}

exports.procedure_element_remove_tag = async function(args, res, next, headers) {
  /**
   * Remove a tag from an element
   *
   * procedure_id String unique id of procedure
   * elem_id String unique id of element
   * tag_id String tag id
   * return Updated tags of the working version of the procedure
   **/
  const key = node_funcs.get_auth_key(headers);
  let procedure_id = args['procedure_id']['value'];
  let elem_id = args['elem_id']['value'];
  let tag_id = args['tag_id']['value'];

  try {
    const data = await node_funcs.procedure_element_remove_tag(procedure_id, elem_id, tag_id, key); 
    res.status(200).json(data);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when removing a tag from element', err);
    res.status(400).json(err_data);    
  }
}
