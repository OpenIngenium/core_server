'use strict';
var node_funcs = require('../node_funcs');
exports.create_procedure_section = async function(args, res, next, headers) {
  /**
   * Create a procedure section
   *
   * execution_id String unique id of execution
   * insert_after_id String unique id of the element after which element(s) will be added/inserted. If not provided, element will be added/inserted to the last. To insert at the front, use \"-1\". (optional)
   * level String Add as a sibling or a child. * `SIBLING` - As a sibling of insert_after_id element (Default) * `CHILD` - As a child of insert_after_element  (optional)
   * procedure_section ProcedureSection procedure section definition (optional)
   * returns AddProcedureSectionResponse
   **/
  const key = node_funcs.get_auth_key(headers);
  let execution_id = args['execution_id']['value'];
  let procedure_section = args['procedure_section'] ? args['procedure_section']['value'] : null;
  let insert_after_id = args['insert_after_id'] ? args['insert_after_id']['value'] : '-1';   
  let level = args['level'] ? args['level']['value'] : 'SIBLING';
 
  try {
    const data = await node_funcs.createArchiveElement(execution_id, null, "PROCEDURE_SECTION", null, procedure_section, insert_after_id, level, key); 
    res.status(200).json(data);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when creating a procedure section', err);
    res.status(400).json(err_data);    
  }
}

exports.get_execution_procedure_sections = async function(args, res, next, headers) {
  /**
   * Get procedure sections of the execution. List is sorted by the order in the execution.
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
  let offset = args['offset']['value'] == undefined ? null : args['offset']['value'];
  let limit = args['limit']['value'] == undefined ? null : args['limit']['value'];
  let sort = args['sort']['value'] == undefined ? null : args['sort']['value'];
  let description = args['description']['value'] == undefined ? null : args['description']['value'];

  try {
    const {elems, total_count} = await node_funcs.get_procedure_sections(execution_id, null, offset, limit, sort, description, key);
    res.set('x-total-count', total_count);
    res.status(200).json(elems);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when getting procedure sections', err);
    res.status(400).json(err_data);    
  }
}

exports.get_procedure_section = async function(args, res, next, headers) {
  /**
   * Get procedure section definition
   *
   * elem_id String unique id of a procedure element
   * returns ProcedureSection
   **/
  const key = node_funcs.get_auth_key(headers);
  let execution_id = args['execution_id']['value'] == undefined ? null : args['execution_id']['value'];
  let elem_id = args['elem_id']['value'] == undefined ? null : args['elem_id']['value'];

  try {
    const data = await node_funcs.get_procedure_section(execution_id, null, elem_id, key);
    res.status(200).json(data);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when getting procedure section', err);
    res.status(400).json(err_data);    
  }
}

exports.get_procedure_section_structure = async function(args, res, next, headers) {
  /**
   * Get structure of selected elements of procedure section
   *
   * elem_id String unique id of a procedure element
   * returns ProcedureStructure
   **/
  const key = node_funcs.get_auth_key(headers);
  let execution_id = args['execution_id']['value'] == undefined ? null : args['execution_id']['value'];
  let elem_id = args['elem_id']['value'] == undefined ? null : args['elem_id']['value'];

  try {
    const data = await node_funcs.get_procedure_section_structure(execution_id, null, elem_id, key);
    res.status(200).json(data);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when getting procedure section structure', err);
    res.status(400).json(err_data);    
  }
}

exports.get_procedure_section_elements = async function(args, res, next, headers) {
  /**
   * Get structure of selected elements of procedure section
   *
   * elem_id String unique id of a procedure element
   * returns ProcedureStructure
   **/
  const key = node_funcs.get_auth_key(headers);
  let execution_id = args['execution_id']['value'] == undefined ? null : args['execution_id']['value'];
  let elem_id = args['elem_id']['value'] == undefined ? null : args['elem_id']['value'];

  try {
    const data = await node_funcs.get_procedure_section_elements(execution_id, null, elem_id, key);
    res.status(200).json(data);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when getting procedure section elements', err);
    res.status(400).json(err_data);    
  }
}

exports.import_procedure_section = async function(args, res, next, headers) {
  /**
   * Import elements from the referenced procedure
   *
   * elem_id String unique id of a procedure element
   * returns ProcedureStructure
   **/
  const key = node_funcs.get_auth_key(headers);
  let execution_id = args['execution_id']['value'] == undefined ? null : args['execution_id']['value'];
  let elem_id = args['elem_id']['value'] == undefined ? null : args['elem_id']['value'];

  try {
    const data = await node_funcs.import_procedure_section(execution_id, elem_id, key);
    res.status(200).json(data);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when importing procedure section', err);
    res.status(400).json(err_data);    
  }
}

exports.call_procedure_section = async function(args, res, next, headers) {
  /**
   * Create a new execution to run the referenced procedure
   *
   * elem_id String unique id of a procedure element
   * returns ProcedureStructure
   **/
  const key = node_funcs.get_auth_key(headers);
  let execution_id = args['execution_id']['value'] == undefined ? null : args['execution_id']['value'];
  let elem_id = args['elem_id']['value'] == undefined ? null : args['elem_id']['value'];

  try {
    const data = await node_funcs.call_procedure_section(execution_id, elem_id, key);
    res.status(200).json(data);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when calling procedure section', err);
    res.status(400).json(err_data);    
  }
}

exports.update_procedure_section = async function(args, res, next, headers) {
  /**
   * Update a procedure section
   *
   * elem_id String unique id of a procedure element
   * procedure_section ProcedureSection Definition of procedure section
   * no response value expected for this operation
   **/
  const key = node_funcs.get_auth_key(headers);
  let execution_id = args['execution_id']['value'] == undefined ? null : args['execution_id']['value'];
  let elem_id = args['elem_id']['value'] == undefined ? null : args['elem_id']['value'];
  let procedure_section = args['procedure_section']['value']  == undefined ? null : args['procedure_section']['value'];

  try {
    const data = await node_funcs.update_procedure_section(execution_id, null, elem_id, procedure_section, key);
    res.status(200).json(data);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when updating procedure section', err);
    res.status(400).json(err_data);    
  }
}

exports.get_procedure_section_input = async function(args, res, next, headers) {
  /**
   * Get procedure section input
   *
   * elem_id String unique id of a procedure element
   * returns ProcedureSection
   **/
  const key = node_funcs.get_auth_key(headers);
  let execution_id = args['execution_id']['value'] == undefined ? null : args['execution_id']['value'];
  let elem_id = args['elem_id']['value'] == undefined ? null : args['elem_id']['value'];
  
  try {
    const data = await node_funcs.get_procedure_section_input(execution_id, null, elem_id, key);
    res.status(200).json(data);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when getting procedure section input', err);
    res.status(400).json(err_data);    
  }
}


exports.update_procedure_section_input = async function(args, res, next, headers) {
  /**
   * Update a procedure section user input
   *
   * elem_id String unique id of a procedure element
   * user_input ProcedureSectionInput Definition of procedure section
   * no response value expected for this operation
   **/
  const key = node_funcs.get_auth_key(headers);
  let execution_id = args['execution_id']['value'] == undefined ? null : args['execution_id']['value'];
  let elem_id = args['elem_id']['value'] == undefined ? null : args['elem_id']['value'];
  let user_input = args['user_input']['value']  == undefined ? null : args['user_input']['value'];

  try {
    const data = await node_funcs.update_procedure_section_input(execution_id, null, elem_id, user_input, key);
    res.status(204).end();
  } catch (err) {
    const err_data = node_funcs.push_error('Error when updating procedure section input', err);
    res.status(400).json(err_data);    
  }
}

