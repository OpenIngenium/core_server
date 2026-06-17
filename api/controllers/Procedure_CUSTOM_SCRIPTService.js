'use strict';
var node_funcs = require('../node_funcs');
var extend = require('extend');

exports.create_procedure_custom_script_step = async function(args, res, next, headers) {
  /**
   * Create a custom script step
   *
   * procedure_id String unique id of procedure
   * insert_after_id String unique id of the element after which element(s) will be added/inserted. If not provided, element will be added/inserted to the last. To insert at the front, use \"-1\". (optional)
   * level String Add as a sibling or a child. * `SIBLING` - As a sibling of insert_after_id element (Default) * `CHILD` - As a child of insert_after_element  (optional)
   * returns AddCustomScriptStepResponse
   **/
  const key = node_funcs.get_auth_key(headers);
  let procedure_id = args['procedure_id']['value'];
  let step = args['step'] ? args['step']['value'] : null;
  let insert_after_id = args['insert_after_id'] ? args['insert_after_id']['value'] : '-1';   
  let level = args['level'] ? args['level']['value'] : 'SIBLING';

  let script_id = args['script_id'] ? args['script_id']['value'] : null;
  let script_name = args['script_name'] ? args['script_name']['value'] : null;
  let script_path = args['script_path'] ? args['script_path']['value'] : null;
  let script_display_name = args['script_display_name'] ? args['script_display_name']['value'] : null;
  let script_hash = args['script_hash'] ? args['script_hash']['value'] : null;
  let script_spec_hash = args['script_spec_hash'] ? args['script_spec_hash']['value'] : null;

  if (script_id || script_name || script_path || script_display_name || script_hash || script_spec_hash) {
    const script_fields = {};
    if (script_id) script_fields.script_id = script_id;
    if (script_name) script_fields.script_name = script_name;
    if (script_path) script_fields.script_path = script_path;
    if (script_display_name) script_fields.script_display_name = script_display_name;
    if (script_hash) script_fields.hash = script_hash;
    if (script_spec_hash) script_fields.spec_hash = script_spec_hash;

    if (step === null) {
      step = {};
    }
    step.authoring_user_input = extend(true, {}, step.authoring_user_input || {}, script_fields);
  }

  try {
    const data = await node_funcs.createArchiveElement(null, procedure_id, "STEP", "CUSTOM_SCRIPT", step, insert_after_id, level, key); 
    res.status(200).json(data);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when creating a step', err);
    res.status(400).json(err_data);    
  }
}

exports.get_procedure_custom_script_step = async function(args, res, next, headers) {
  /**
   * Get a custom script step
   *
   * procedure_id String unique id of procedure
   * elem_id String unique id of a procedure element
   * returns CustomScriptStep
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

exports.get_procedure_custom_script_step_input = async function(args, res, next, headers) {
  /**
   * Get user input of a custom script step
   *
   * procedure_id String unique id of procedure
   * elem_id String unique id of a procedure element
   * returns CustomScriptStepInput
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

exports.get_procedure_custom_script_steps = async function(args, res, next, headers) {
  /**
   * Get custom script steps of the execution. List is sorted by the order in the execution.
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
  let step_type = 'CUSTOM_SCRIPT'
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

exports.update_procedure_custom_script_step = async function(args, res, next, headers) {
  /**
   * Update a custom script step
   *
   * procedure_id String unique id of procedure
   * elem_id String unique id of a procedure element
   * step CustomScriptStep Definition of custom script step
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

exports.update_procedure_custom_script_step_input = async function(args, res, next, headers) {
  /**
   * Update user input of a custom script step
   *
   * procedure_id String unique id of procedure
   * elem_id String unique id of a procedure element
   * user_input CustomScriptStepInput User input values
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

