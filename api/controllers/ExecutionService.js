'use strict';
var node_funcs = require('../node_funcs');
var path = require('path');
var fse = require("fs-extra");
var log = node_funcs.log;

exports.create_execution = async function(args, res, next, headers) {
  /**
   * Create an execution
   *
   * execution ExecutionInfoInput Execution meta data
   * returns ExecutionInfo
   **/

  const key = node_funcs.get_auth_key(headers);
  const execution_input = args['execution']['value'];

  try {
    const data = await node_funcs.createExecution(execution_input, key);
    res.status(200).json(data);
  } catch(err) {
    const err_data = node_funcs.push_error('Error when creating an execution', err);
    res.status(400).json(err_data);
  }
}

exports.create_execution_step = async function(args, res, next, headers) {
  /**
   * Create a step
   *
   * execution_id String unique id of execution
   * step Step step definition including its type
   * insert_after_id String unique id of the element after which element(s) will be added/inserted. If not provided, element will be added/inserted to the last. To insert at the front, use \"-1\". (optional)
   * level String Add as a sibling or a child.  * `SIBLING` - As a sibling of insert_after_id element (Default) * `CHILD` - As a child of insert_after_element  (optional)
   * returns Step
   **/
  const key = node_funcs.get_auth_key(headers);
  let execution_id = args['execution_id']['value'];
  let procedure_id = null;
  let level = args['level']['value'];
  let insert_after_id = args['insert_after_id']['value'];
  let step = args['step'] ? args['step']['value'] : null;

  try {
    const data = await node_funcs.createArchiveElement(execution_id, procedure_id, "STEP", null, step, insert_after_id, level, key);
    res.status(200).json(data);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when creating a step', err);
    res.status(400).json(err_data);    
  }
}

exports.delete_execution = async function(args, res, next, headers) {
  /**
   * Delete an execution
   *
   * execution_id String unique id of execution
   * no response value expected for this operation
   **/
  const key = node_funcs.get_auth_key(headers);
  let execution_id = args['execution_id']['value'];

  try {
    await node_funcs.removeExecution(execution_id, key);
    res.status(204).end();
  } catch (err) {
    const err_data = node_funcs.push_error('Error when deleting an execution', err);
    const status_code = err_data.http_code_at_source ? err_data.http_code_at_source : 400;
    res.status(status_code).json(err_data);  
  }
}

exports.get_execution = async function(args, res, next, headers) {
  /**
   * Get meta data of an execution
   *
   * execution_id String unique id of execution
   * returns ExecutionInfo
   **/
  const key = node_funcs.get_auth_key(headers);
  const execution_id = args['execution_id']['value'];

  try {
    const data = await node_funcs.getExecution(execution_id, key);
    res.status(200).json(data);
  } catch(err) {
    const err_data = node_funcs.push_error('Error when getting an execution', err);
    const status_code = err_data.http_code_at_source ? err_data.http_code_at_source : 400;
    res.status(status_code).json(err_data);
  }
}

exports.get_execution_as_run = async function(args, res, next, headers) {
  /**
   * Get as run report for an execution
   *
   * execution_id String unique id of execution
   * returns ExecutionAsRun
   **/

  const key = node_funcs.get_auth_key(headers);
  const execution_id = args['execution_id']['value'];

  try {
    const data = await node_funcs.as_run(execution_id, key);
    res.status(200).json(data);
  } catch(err) {
    const err_data = node_funcs.push_error('Error when getting an as run', err);
    const status_code = err_data.http_code_at_source ? err_data.http_code_at_source : 400;
    res.status(status_code).json(err_data);
  }
}

exports.get_execution_elements = async function(args, res, next, headers) {
  /**
   * Get elements of the specified type from execution. List is sorted by the order in the execution.
   *
   * execution_id String unique id of execution
   * elem_type String type of procedure element. If omitted, get all types. (optional)
   * step_type String type of step. If omitted, get all types. (optional)
   * offset Integer Start index for pagination. zero based. (optional)
   * limit Integer Max number of elements to return. (optional)
   * sort String Sort in natural order * `ASC` - Ascending * `DSC` - Descending  (optional)
   * description String Query for words in description (optional)
   * all_elements String include all elements regardless of comments (ON/OFF, ON by default)
   * comment_filter String include elements with general comments (ON/OFF, OFF by default)
   * ar_comment_filter String include elements with activity report comments (ON/OFF, OFF by default)
   * dr_comment_filter String include elements with data review comments (ON/OFF, OFF by default)
   * returns List
   **/

  const key = node_funcs.get_auth_key(headers);

  let execution_id = args['execution_id']['value'] == undefined ? null : args['execution_id']['value'];
  let elem_type = args['elem_type']['value'] == undefined ? null : args['elem_type']['value'];
  let step_type = args['step_type']['value'] == undefined ? null : args['step_type']['value'];
  let offset = args['offset']['value'] == undefined ? null : args['offset']['value'];
  let limit = args['limit']['value'] == undefined ? null : args['limit']['value'];
  let sort = args['sort']['value'] == undefined ? null : args['sort']['value'];
  let description = args['description']['value'] == undefined ? null : args['description']['value'];
  let all_elements = args['all_elements']['value'] == undefined ? null : args['all_elements']['value'];
  let comment_filter = args['comment_filter']['value'] == undefined ? null : args['comment_filter']['value'];
  let ar_comment_filter = args['ar_comment_filter']['value'] == undefined ? null : args['ar_comment_filter']['value'];
  let dr_comment_filter = args['dr_comment_filter']['value'] == undefined ? null : args['dr_comment_filter']['value'];

  try {
    const {elems, total_count} = await node_funcs.getExecutionElements(execution_id, elem_type, step_type, offset, limit, sort, description,
      all_elements, comment_filter, ar_comment_filter, dr_comment_filter, key);
    res.set('x-total-count', total_count);
    res.status(200).json(elems);
  } catch(err) {
    const err_data = node_funcs.push_error('Error when getting execution elements', err);
    const status_code = err_data.http_code_at_source ? err_data.http_code_at_source : 400;
    res.status(status_code).json(err_data);
  }
}

exports.get_execution_simple_elements = async function(args, res, next, headers) {
  /**
   * Get elements of execution (only key fields)
   *
   * execution_id String unique id of execution
   * returns ExecutionHistory
   **/

  const key = node_funcs.get_auth_key(headers);
  const execution_id = args['execution_id']['value'];

  try {
    const data = await node_funcs.getExecutionSimpleElements(execution_id, key);
    let total_count = data.length;
    res.set('x-total-count', total_count);
    res.status(200).json(data);
  } catch(err) {
    const err_data = node_funcs.push_error('Error when getting simple elements', err);
    const status_code = err_data.http_code_at_source ? err_data.http_code_at_source : 400;
    res.status(status_code).json(err_data);
  }
}

exports.get_execution_history = async function(args, res, next, headers) {
  /**
   * Get execution history of steps
   *
   * execution_id String unique id of execution
   * offset Integer Start index for pagination. zero based. (optional)
   * limit Integer Max number of elements to return. (optional)
   * sort String Sort in natural order * `ASC` - Ascending * `DSC` - Descending  (optional)
   * returns ExecutionHistory
   **/

  const key = node_funcs.get_auth_key(headers);
  const execution_id = args['execution_id']['value'];
  let offset = args['offset']['value'] == undefined ? null : args['offset']['value'];
  let limit = args['limit']['value'] == undefined ? null : args['limit']['value'];
  let sort = args['sort']['value'] == undefined ? null : args['sort']['value'];  

  try {
    const data = await node_funcs.history_execution(execution_id, offset, limit, sort, key);
    res.status(200).json(data);
  } catch(err) {
    const err_data = node_funcs.push_error('Error when getting execution history', err);
    const status_code = err_data.http_code_at_source ? err_data.http_code_at_source : 400;
    res.status(status_code).json(err_data);
  }
}

exports.get_execution_time_references = async function(args, res, next, headers) {
  /**
   * Get available time references
   *
   * execution_id String unique id of execution
   * returns names of time references
   **/

  const key = node_funcs.get_auth_key(headers);
  const execution_id = args['execution_id']['value'];

  try {
    let elem_type = 'STEP';
    let step_type = 'TIME_REFERENCE';
    let offset = 0;
    let limit = 10000;
  
    const {elems, total_count} = 
      await node_funcs.getExecutionElements(execution_id, elem_type, step_type, offset, limit, null, null, null, null, null, null, key);

    const time_refs = [...node_funcs.time_references];

    for (const elem of elems) {
      if (elem.run_records) {
        for (const run_record of elem.run_records) {
          if (run_record.execution_user_input && run_record.execution_user_input.name) {
            if (!time_refs.includes(run_record.execution_user_input.name)) {
              time_refs.push(run_record.execution_user_input.name);
            }
          }
        }
      }

      if (elem.execution_user_input && elem.execution_user_input.name) {
        if (!time_refs.includes(elem.execution_user_input.name)) {
          time_refs.push(elem.execution_user_input.name);
        }
      }
    }

    res.status(200).json(time_refs);
  } catch(err) {
    const err_data = node_funcs.push_error('Error when getting execution time references', err);
    const status_code = err_data.http_code_at_source ? err_data.http_code_at_source : 400;
    res.status(status_code).json(err_data);
  }
}

exports.get_execution_data_paths = async function(args, res, next, headers) {
  /**
   * Get available data paths
   *
   * execution_id String unique id of execution
   * returns names of data paths
   **/

  const key = node_funcs.get_auth_key(headers);
  const execution_id = args['execution_id']['value'];

  try {
    let elem_type = 'STEP';
    let step_type = 'GDS_MANUAL';
    let offset = 0;
    let limit = 10000;
  
    const {elems, total_count} = 
      await node_funcs.getExecutionElements(execution_id, elem_type, step_type, offset, limit, null, null, null, null, null, null, key);

    const data_paths = [];

    for (const elem of elems) {
      if (elem.execution_user_input && elem.execution_user_input.entries) {
        for (const entry of elem.execution_user_input.entries) {
          if (entry.data_path) {
            if(!data_paths.includes(entry.data_path)) {
              data_paths.push(entry.data_path);
            }
          }
        }
      }
    }

    res.status(200).json(data_paths);
  } catch(err) {
    const err_data = node_funcs.push_error('Error when getting execution data paths', err);
    const status_code = err_data.http_code_at_source ? err_data.http_code_at_source : 400;
    res.status(status_code).json(err_data);
  }
}

exports.get_execution_status = async function(args, res, next, headers) {
  /**
   * Get the current status of the execution
   *
   * execution_id String unique id of execution
   * returns ExecutionStatus
   **/

  const key = node_funcs.get_auth_key(headers);
  const execution_id = args['execution_id']['value'];

  try {
    const data = await node_funcs.getExecutionStatus(execution_id, key);
    res.status(200).json(data);
  } catch(err) {
    const err_data = node_funcs.push_error('Error when getting execution status', err);
    const status_code = err_data.http_code_at_source ? err_data.http_code_at_source : 400;
    res.status(status_code).json(err_data);
  }
}

exports.get_execution_steps = async function(args, res, next, headers) {
  /**
   * Get steps of the execution. List is sorted by the order in the execution.
   *
   * execution_id String unique id of execution
   * offset Integer Start index for pagination. zero based. (optional)
   * limit Integer Max number of elements to return. (optional)
   * sort String Sort in natural order * `ASC` - Ascending * `DSC` - Descending  (optional)
   * description String Query for words in description (optional)
   * returns List
   **/
  const key = node_funcs.get_auth_key(headers);
  const execution_id = args['execution_id']['value'];

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
    const {elems, total_count} = await node_funcs.getAllSteps(execution_id, null, params, key);
    res.set('x-total-count', total_count);
    res.status(200).json(elems);
  } catch(err) {
    let err_res = node_funcs.push_error('Error when getting execution steps', err);
    let status_code = err_res.http_code_at_source ? err_res.http_code_at_source : 400;
    res.status(status_code).json(err_res);
  }
}

exports.get_executions = async function(args, res, next, headers) {
  /**
   * Get a list of executions. List is sorted by start date by default (latest first).
   *
   * offset Integer Start index for pagination. zero based. (optional)
   * limit Integer Max number of elements to return. (optional)
   * sort String Sort in natural order * `ASC` - Ascending * `DSC` - Descending  (optional)
   * completed Boolean Get only completed or not completed executions (optional)
   * description String Query for words in description (optional)
   * returns List
   **/
  const key = node_funcs.get_auth_key(headers);

  let params = {};
  if (args['offset']['value'] == undefined) {
    params['offset'] = '0';
  } else {
    params['offset'] = args['offset']['value'].toString();
  }  

  if (args['limit']['value'] == undefined) {
    params['limit'] = '50';
  } else {
    params['limit'] = args['limit']['value'].toString();
  }   

  if (args['sort']['value'] == undefined) {
    params['sort'] = 'DESC';
  } else {
    params['sort'] = args['sort']['value'];
  }

  if (args['sort_by']['value'] == undefined) {
    params['sort_by'] = 'TIME_STARTED';
  } else {
    params['sort_by'] = args['sort_by']['value'];
  }  

  if (args['execution_id']['value'] == undefined) {
    // do nothing
  } else {
    params['execution_id'] = args['execution_id']['value'];
  }  
  
  if (args['description']['value'] == undefined) {
    // do nothing
  } else {
    params['description'] = args['description']['value'];
  }  
  
  if (args['status']['value'] == undefined) {
    // do nothing
  } else {
    params['status'] = args['status']['value'];
  }  
  
  if (args['statuses']['value'] == undefined) {
    // do nothing
  } else {
    params['statuses'] = args['statuses']['value'];
  }  

  if (args['from_time']['value'] == undefined) {
    // do nothing
  } else {
    params['from_time'] = args['from_time']['value'];
  }    
  
  if (args['to_time']['value'] == undefined) {
    // do nothing
  } else {
    params['to_time'] = args['to_time']['value'];
  }  
  
  if (args['completed']['value'] == undefined) {
    // do nothing
  } else {
    params['completed'] = args['completed']['value'].toString();
  }     

  if (args['venue_id']['value'] == undefined) {
    // do nothing
  } else {
    params['venue_id'] = args['venue_id']['value'];
  }    

  if (args['venue_name']['value'] == undefined) {
    // do nothing
  } else {
    params['venue_name'] = args['venue_name']['value'];
  }   

  if (args['venue_type']['value'] == undefined) {
    // do nothing
  } else {
    params['venue_type'] = args['venue_type']['value'];
  }   

  if (args['run_for_score']['value'] == undefined) {
    // do nothing
  } else {
    params['run_for_score'] = args['run_for_score']['value'].toString();
  }

  if (args['test_conductor']['value'] == undefined) {
    // do nothing
  } else {
    params['test_conductor'] = args['test_conductor']['value'];
  }    

  if (args['procedure_id']['value'] == undefined) {
    // do nothing
  } else {
    params['procedure_id'] = args['procedure_id']['value'];
  }   

  if (args['version']['value'] == undefined) {
    // do nothing
  } else {
    params['version'] = args['version']['value'].toString();
  }  
  
  if (args['institutional_id']['value'] == undefined) {
    // do nothing
  } else {
    params['institutional_id'] = args['institutional_id']['value'];
  }  

  if (args['institutional_release_id']['value'] == undefined) {
    // do nothing
  } else {
    params['institutional_release_id'] = args['institutional_release_id']['value'];
  }      

  try {
    const {executions, total_count} = await node_funcs.getAllExecutions(params, key);
    res.set('x-total-count', total_count);
    res.status(200).json(executions);
  } catch(err) {
    let err_res = node_funcs.push_error('Error when getting executions', err);
    let status_code = err_res.http_code_at_source ? err_res.http_code_at_source : 400;
    res.status(status_code).json(err_res);
  }
}

exports.halt_execution = async function(args, res, next, headers) {
  /**
   * Halt the execution if a step is running
   *
   * execution_id String unique id of execution
   * no response value expected for this operation
   **/
  const key = node_funcs.get_auth_key(headers);
  const execution_id = args['execution_id']['value'];

  try {
    const data = await node_funcs.halt_execution(execution_id, key)
    res.status(200).json(data);
  } catch(err) {
    let err_res = node_funcs.push_error('Error when halting an execution', err);
    let status_code = err_res.http_code_at_source ? err_res.http_code_at_source : 400;
    res.status(status_code).json(err_res);
  }  
}

exports.pause_execution = async function(args, res, next, headers) {
  /**
   * Pause the execution. This will have an impact only when AUTO mode is on and execution will pause after the current step execution is done.
   *
   * execution_id String unique id of execution
   * no response value expected for this operation
   **/
  const key = node_funcs.get_auth_key(headers);
  const execution_id = args['execution_id']['value'];

  try {
    const data = await node_funcs.pause_execution(execution_id, key)
    res.status(200).json(data);
  } catch(err) {
    let err_res = node_funcs.push_error('Error when pausing an execution', err);
    let status_code = err_res.http_code_at_source ? err_res.http_code_at_source : 400;
    res.status(status_code).json(err_res);
  }
}

exports.continue_execution = async function(args, res, next, headers) {
  /**
   * Continue the execution. This will create a new execution kernel if it has been closed.
   *
   * execution_id String unique id of execution
   * no response value expected for this operation
   **/
  const key = node_funcs.get_auth_key(headers);
  const execution_id = args['execution_id']['value'];

  try {
    const data = await node_funcs.continue_execution(execution_id, key)
    res.status(204).end();
  } catch(err) {
    let err_res = node_funcs.push_error('Error when to continue an execution', err);
    let status_code = err_res.http_code_at_source ? err_res.http_code_at_source : 400;
    res.status(status_code).json(err_res);
  }  
}

exports.set_switch_wait = async function(args, res, next, headers) {
  /**
   * Set wait seconds used when execution is switched
   *
   * execution_id String unique id of execution
   * switch_wait_input switch wait input
   * return SwitchWait
   **/
  
  const execution_id = args['execution_id']['value'];
  const switch_wait_input = args['switch_wait_input']['value'];

  try {
    const data = await node_funcs.set_switch_wait(execution_id, switch_wait_input)
    res.status(200).json(data);
  } catch(err) {
    let err_res = node_funcs.push_error('Error when setting switch wait of an execution', err);
    let status_code = err_res.http_code_at_source ? err_res.http_code_at_source : 400;
    res.status(status_code).json(err_res);
  }
}

exports.get_switch_wait = async function(args, res, next, headers) {
  /**
   * get wait seconds used when execution is switched
   *
   * execution_id String unique id of execution
   * return SwitchWait
   **/

  const execution_id = args['execution_id']['value'];

  try {
    const data = await node_funcs.get_switch_wait(execution_id)
    res.status(200).json(data);
  } catch(err) {
    let err_res = node_funcs.push_error('Error when getting switch wait info of an execution', err);
    let status_code = err_res.http_code_at_source ? err_res.http_code_at_source : 400;
    res.status(status_code).json(err_res);
  }
}

exports.get_switch_wait_flag = async function(args, res, next, headers) {
  /**
   * Get switch waig flag info
   *
   * execution_id String unique id of execution
   * return SwitchWaitFlag
   **/

  const execution_id = args['execution_id']['value'];

  try {
    const data = await node_funcs.get_switch_wait_flag(execution_id)
    res.status(200).json(data);
  } catch(err) {
    let err_res = node_funcs.push_error('Error when getting switch wait flag info of an execution', err);
    let status_code = err_res.http_code_at_source ? err_res.http_code_at_source : 400;
    res.status(status_code).json(err_res);
  }
}

exports.delete_switch_wait_flag = async function(args, res, next, headers) {
  /**
   * Delete switch wait flag so that the execution can start running in automatic mode
   *
   * execution_id String unique id of execution
   * return SwitchWaitFlag
   **/

  const execution_id = args['execution_id']['value'];

  try {
    const data = await node_funcs.delete_switch_wait_flag(execution_id)
    res.status(200).json(data);
  } catch(err) {
    let err_res = node_funcs.push_error('Error when deleting switch wait flag of an execution', err);
    let status_code = err_res.http_code_at_source ? err_res.http_code_at_source : 400;
    res.status(status_code).json(err_res);
  }
}

exports.get_execution_outline = async function(args, res, next, headers) {
  /**
   * Get outline view of execution
   *
   * execution_id String unique id of execution
   * response array of outline elements
   **/
  const key = node_funcs.get_auth_key(headers);
  const execution_id = args['execution_id']['value'];

  try {
    const data = await node_funcs.getExecutionOutline(execution_id, key);
    res.status(200).json(data);
  } catch(err) {
    let err_res = node_funcs.push_error('Error when getting execution outline', err);
    let status_code = err_res.http_code_at_source ? err_res.http_code_at_source : 400;
    res.status(status_code).json(err_res);
  }    
}


exports.move_execution_element = async function(args, res, next, headers) {
  /**
   * Move elements in execution
   *
   * execution_id String unique id of execution
   * move_element_input input 
   * returns ElementsNumberResponse
   **/
  const key = node_funcs.get_auth_key(headers);
  const execution_id = args['execution_id']['value'];

  let move_element_input = args['move_element_input']['value'];

  try {
    const data = await node_funcs.moveElement(execution_id, move_element_input, key);
    res.status(200).json(data);
  } catch(err) {
    let err_res = node_funcs.push_error('Error when moving element', err);
    let status_code = err_res.http_code_at_source ? err_res.http_code_at_source : 400;
    res.status(status_code).json(err_res);
  }    
}

exports.copy_execution_element = async function(args, res, next, headers) {
  /**
   * Copy element in execution
   *
   * execution_id String unique id of execution
   * copy_element_input input 
   * return CopyElementResponse
   **/
  const key = node_funcs.get_auth_key(headers);
  const execution_id = args['execution_id']['value'];
  let copy_element_input = args['copy_element_input']['value'];

  try {
    const data = await node_funcs.copyElement(execution_id, copy_element_input, key);
    res.status(200).json(data);
  } catch(err) {
    let err_res = node_funcs.push_error('Error when copying element', err);
    let status_code = err_res.http_code_at_source ? err_res.http_code_at_source : 400;
    res.status(status_code).json(err_res);
  }      
}

exports.execution_update_element = async function(args, res, next, headers) {
  /**
   * Update an element
   *
   * execution_id String unique id of execution
   * elem_id id of element to copy
   * elem_input element data to update
   * response ProcedureElement
   **/

  const key = node_funcs.get_auth_key(headers);
  const execution_id = args['execution_id']['value'];
  const elem_id = args['elem_id']['value']; 
  const elem_input = args['elem_input']['value']; 

  try {
    const data = await node_funcs.updateElement(execution_id, null, elem_id, elem_input, key);
    res.status(200).json(data);
  } catch(err) {
    let err_res = node_funcs.push_error('Error when updating element', err);
    let status_code = err_res.http_code_at_source ? err_res.http_code_at_source : 400;
    res.status(status_code).json(err_res);
  }      
}

exports.execution_compute_element = async function(args, res, next, headers) {
  /**
   * compute a step whose status is derived from other steps 
   *
   * execution_id String unique id of execution
   * elem_id id of element to compute
   * response ProcedureElement
   **/
  const key = node_funcs.get_auth_key(headers);
  const execution_id = args['execution_id']['value'];
  const elem_id = args['elem_id']['value'];
  
  try {
    const data = await node_funcs.compute_execution_element(execution_id, elem_id, key);
    res.status(200).json(data);
  } catch(err) {
    let err_res = node_funcs.push_error('Error when computing an element', err);
    let status_code = err_res.http_code_at_source ? err_res.http_code_at_source : 400;
    res.status(status_code).json(err_res);
  }
}

exports.execution_modify_element = async function(args, res, next, headers) {
  /**
   * modify an element to create a redline/blueline
   *
   * execution_id String unique id of execution
   * elem_id id of element to copy
   * response ModifyElementResponse
   **/
  const key = node_funcs.get_auth_key(headers);
  const execution_id = args['execution_id']['value'];
  const elem_id = args['elem_id']['value'];
  
  try {
    const data = await node_funcs.modifyElement(execution_id, elem_id, key);
    res.status(200).json(data);
  } catch(err) {
    let err_res = node_funcs.push_error('Error when modifying an element', err);
    let status_code = err_res.http_code_at_source ? err_res.http_code_at_source : 400;
    res.status(status_code).json(err_res);
  }
}

exports.execution_justify_element = async function(args, res, next, headers) {
  /**
   * update justification of a redline/blueline
   *
   * execution_id String unique id of execution
   * elem_id id of element to set justification
   * justification_input input data for redline/blueline justification
   * response ProcedureElement
   **/
  const key = node_funcs.get_auth_key(headers);
  const execution_id = args['execution_id']['value'];
  const elem_id = args['elem_id']['value'];
  const justification_input = args['justification_input']['value'];
  
  try {
    const data = await node_funcs.justifyElement(execution_id, elem_id, justification_input, key);
    res.status(200).json(data);
  } catch(err) {
    let err_res = node_funcs.push_error('Error when justifying a redline/blueline', err);
    let status_code = err_res.http_code_at_source ? err_res.http_code_at_source : 400;
    res.status(status_code).json(err_res);
  }  
}

exports.execution_bulk_justify = async function(args, res, next, headers) {
  /**
   * update justification of redline/blueline elements
   *
   * execution_id String unique id of execution
   * bulk_justification_input input data for redline/blueline justification
   * response ProcedureElements
   **/
  const key = node_funcs.get_auth_key(headers);
  const execution_id = args['execution_id']['value'];
  const bulk_justification_input = args['bulk_justification_input']['value'];
  
  try {
    const elem_ids = bulk_justification_input.elem_ids;
    const justification_input = bulk_justification_input.justification_input;
    const data = await node_funcs.justifyElements(execution_id, elem_ids, justification_input, key);
    res.status(200).json(data);
  } catch(err) {
    let err_res = node_funcs.push_error('Error when justifying redline/blueline elements', err);
    let status_code = err_res.http_code_at_source ? err_res.http_code_at_source : 400;
    res.status(status_code).json(err_res);
  }  
}

exports.execution_approve_element = async function(args, res, next, headers) {
  /**
   * approve a redline/blueline for an element 
   *
   * execution_id String unique id of execution
   * elem_id id of element to copy
   * approval_input input data for approval
   * response ProcedureElement
   **/
  const key = node_funcs.get_auth_key(headers);
  const execution_id = args['execution_id']['value'];
  const elem_id = args['elem_id']['value'];
  const approval_input = args['approval_input']['value'];
  
  try {
    const data = await node_funcs.approveElement(execution_id, elem_id, approval_input, key);
    res.status(200).json(data);
  } catch(err) {
    let err_res = node_funcs.push_error('Error when approving a redline/blueline', err);
    let status_code = err_res.http_code_at_source ? err_res.http_code_at_source : 400;
    res.status(status_code).json(err_res);
  }
}

exports.execution_bulk_approve = async function(args, res, next, headers) {
  /**
   * approve redline/blueline elements
   *
   * execution_id String unique id of execution
   * bulk_approval_input input data for redline/blueline approval
   * response ProcedureElements
   **/
  const key = node_funcs.get_auth_key(headers);
  const execution_id = args['execution_id']['value'];
  const bulk_approval_input = args['bulk_approval_input']['value'];
  
  try {
    const elem_ids = bulk_approval_input.elem_ids;
    const approval_input = bulk_approval_input.approval_input;
    const data = await node_funcs.approveElements(execution_id, elem_ids, approval_input, key);
    res.status(200).json(data);
  } catch(err) {
    let err_res = node_funcs.push_error('Error when justifying redline/blueline elements', err);
    let status_code = err_res.http_code_at_source ? err_res.http_code_at_source : 400;
    res.status(status_code).json(err_res);
  }  
}

exports.execution_discard_element = async function(args, res, next, headers) {
  /**
   * discard a redline/blueline element
   *
   * execution_id String unique id of execution
   * elem_id id of element to copy
   * response DiscardElementResponse
   **/
  const key = node_funcs.get_auth_key(headers);
  const execution_id = args['execution_id']['value'];
  const elem_id = args['elem_id']['value'];
  
  try {
    const data = await node_funcs.discardElement(execution_id, elem_id, key);
    res.status(200).json(data);
  } catch(err) {
    let err_res = node_funcs.push_error('Error when discarding a redline/blueline', err);
    let status_code = err_res.http_code_at_source ? err_res.http_code_at_source : 400;
    res.status(status_code).json(err_res);
  }
}

exports.execution_discard_elements = async function(args, res, next, headers) {
  /**
   * discard redline/blueline elements
   *
   * execution_id String unique id of execution
   * discard_input selection of elements to discard
   * response DiscardElementResponse
   **/
  const key = node_funcs.get_auth_key(headers);
  const execution_id = args['execution_id']['value'];
  const discard_input = args['discard_input']['value'];
  
  try {
    const data = await node_funcs.discardElements(execution_id, discard_input, key);
    res.status(200).json(data);
  } catch(err) {
    let err_res = node_funcs.push_error('Error when discarding redline/blueline elements', err);
    let status_code = err_res.http_code_at_source ? err_res.http_code_at_source : 400;
    res.status(status_code).json(err_res);
  }
}

exports.execution_delete_element = async function(args, res, next, headers) {
  /**
   * Delete an element
   * 
   * execution_id String unique id of execution
   * elem_id String unique id of element
   * no response value expected for this operation
   **/
  const key = node_funcs.get_auth_key(headers);
  const execution_id = args['execution_id']['value'];
  const elem_id = args['elem_id']['value'];

  try {
    const data = await node_funcs.delete_element(execution_id, null, elem_id, key);
    res.status(200).json(data);
  } catch(err) {
    let err_res = node_funcs.push_error('Error when deleting an execution element', err);
    let status_code = err_res.http_code_at_source ? err_res.http_code_at_source : 400;
    res.status(status_code).json(err_res);
  }
}

exports.run_execution = async function(args, res, next, headers) {
  /**
   * Start the execution from the current step
   *
   * execution_id String unique id of execution
   * current_step_id String step id from which to start the execution. Provide this to change the current step before starting execution. (optional)
   * run_mode SYNC or ASYNC   
   * returns RunResponse
   **/
  const key = node_funcs.get_auth_key(headers);
  const execution_id = args['execution_id']['value'];
  const current_step_id = args['current_step_id']['value'] ? args['current_step_id']['value'] : '';
  const run_mode = args['run_mode']['value'] ? args['run_mode']['value'] : 'SYNC';

  try {
    const data = await node_funcs.runExecution(execution_id, current_step_id, run_mode, key);
    if (run_mode == 'SYNC') {
      res.status(200).json(data);
    } else {
      res.status(202).json(data);
    }
  } catch(err) {
    log.error(err);
    let err_res = node_funcs.push_error('Error when running execution', err);
    let status_code = err_res.http_code_at_source ? err_res.http_code_at_source : 400;
    res.status(status_code).json(err_res);
  }
}

exports.update_execution = async function(args, res, next, headers) {
  /**
   * Update meta data of an execution
   *
   * execution_id String unique id of execution
   * execution_meta_data ExecutionInfo meta data of execution
   * 
   * returns updated execution info
   **/
  const key = node_funcs.get_auth_key(headers);
  let execution_id = args['execution_id']['value'];
  let execution_meta_data = args['execution_meta_data']['value'];

  try {
    const data = await node_funcs.updateExecution(execution_id, execution_meta_data, key);
    res.status(200).json(data);
  } catch(err) {
    let err_res = node_funcs.push_error('Error when updating an execution', err);
    let status_code = err_res.http_code_at_source ? err_res.http_code_at_source : 400;
    res.status(status_code).json(err_res);
  }
}

exports.update_execution_status = async function(args, res, next, headers) {
  /**
   * Update the current status of the execution
   *
   * execution_id String unique id of execution
   * execution_status ExecutionStatus status of the execution
   * no response value expected for this operation
   **/
  const key = node_funcs.get_auth_key(headers);
  let execution_id = args['execution_id']['value'];
  let execution_status = args['execution_status']['value'];
  try {
    const data = await node_funcs.updateExecutionStatus(execution_id, execution_status, key);
    res.status(200).json(data);
  } catch(err) {
    let err_res = node_funcs.push_error('Error when updating an execution status', err);
    let status_code = err_res.http_code_at_source ? err_res.http_code_at_source : 400;
    res.status(status_code).json(err_res);
  }
}

exports.refresh_execution = async function(args, res, next, headers) {
  /**
   * Refresh computed elements in the execution
   *
   * execution_id String unique id of execution

   *  returns elements updated
   **/
  const key = node_funcs.get_auth_key(headers);
  let execution_id = args['execution_id']['value'];

  try {
    let data = await node_funcs.refresh_execution(execution_id, key);
    res.status(200).json(data);
  } catch(err) {
    let err_res = node_funcs.push_error('Error when refreshing an execution', err);
    let status_code = err_res.http_code_at_source ? err_res.http_code_at_source : 400;
    res.status(status_code).json(err_res);
  }
}

exports.set_boundary_element = async function(args, res, next, headers) {
  /**
   * Set boundary_elem_id to determine the scope of AUTO execution
   *
   * execution_id String unique id of execution
   * elem_id String id of the element for which execution starts
   *
   * returns updated execution info
   **/
  const key = node_funcs.get_auth_key(headers);
  let execution_id = args['execution_id']['value'];
  let elem_id = args['elem_id']['value'];

  try {
    let data = await node_funcs.setExecutionBoundary(execution_id, elem_id, key);
    res.status(200).json(data);
  } catch(err) {
    let err_res = node_funcs.push_error('Error when setting execution boundary', err);
    let status_code = err_res.http_code_at_source ? err_res.http_code_at_source : 400;
    res.status(status_code).json(err_res);
  }
}

exports.resume_execution = async function(args, res, next, headers) {
  /**
   * Resume a suspended execution
   *
   * execution_id String unique id of execution
   *
   * returns updated execution info
   **/
  const key = node_funcs.get_auth_key(headers);
  let execution_id = args['execution_id']['value'];
  let resume_input = args['resume_input']['value'];

  try {
    let data = await node_funcs.resume_execution(execution_id, resume_input, key);
    res.status(200).json(data);
  } catch(err) {
    let err_res = node_funcs.push_error('Error when resuming an execution', err);
    let status_code = err_res.http_code_at_source ? err_res.http_code_at_source : 400;
    res.status(status_code).json(err_res);
  }
}

exports.suspend_resume_execution = async function(args, res, next, headers) {
  /**
   * Suspend this execution and resume another execution on the same venue. 
   *
   * execution_id String unique id of execution
   *
   * Returns the meta data of the resumed execution
   **/
  const key = node_funcs.get_auth_key(headers);
  let execution_id = args['execution_id']['value'];
  let suspend_resume_input = args['suspend_resume_input']['value'];

  try {
    let data = await node_funcs.suspend_resume_execution(execution_id, suspend_resume_input, key);
    res.status(200).json(data);
  } catch(err) {
    let err_res = node_funcs.push_error('Error when suspend/resume executions', err);
    let status_code = err_res.http_code_at_source ? err_res.http_code_at_source : 400;
    res.status(status_code).json(err_res);
  }
}

exports.remove_break_points = async function(args, res, next, headers) {
  /**
   * Remove all breakpoints of the execution
   *
   * execution_id String unique id of execution

   *  returns Updated break point status
   **/
  const key = node_funcs.get_auth_key(headers);
  let execution_id = args['execution_id']['value'];

  try {
    let data = await node_funcs.remove_break_points(execution_id, key);
    res.status(200).json(data);
  } catch(err) {
    let err_res = node_funcs.push_error('Error when removing break points', err);
    let status_code = err_res.http_code_at_source ? err_res.http_code_at_source : 400;
    res.status(status_code).json(err_res);
  }
}

exports.search_execution = async function(args, res, next, headers) {
  /**
   * Search text in execution
   *
   * execution_id String unique id of execution

   *  returns Updated break point status
   **/
  const key = node_funcs.get_auth_key(headers);
  let execution_id = args['execution_id']['value'];
  let search_input = args['search_input']['value'] == undefined ? null : args['search_input']['value'];
  
  try {
    let data = await node_funcs.searchExecution(execution_id, search_input, key);
    res.status(200).json(data);
  } catch(err) {
    let err_res = node_funcs.push_error('Error when searching an execution', err);
    res.status(400).json(err_res);
  }  
}

exports.post_execution_message = async function(args, res, next, headers) {
  /**
   * Post message to an execution. Use to generate info/warning/error message via Web Socket
   *
   * execution_id String unique id of execution
   * execution_message Definition of message
   * 
   * returns null
   **/
  try {
    // This is no op since this is used to generate web socket message
    res.status(204).end();
  } catch(err) {
    let err_res = node_funcs.push_error('Error when posting a message to execution', err);
    res.status(400).json(err_res);
  }  
}

exports.export_execution = async function(args, res, next, headers) {
  /**
   * Export execution as a gzip file
   *
   * execution_id String unique id of execution
   * returns file (tar.gzip)
   **/

  const key = node_funcs.get_auth_key(headers);
  const execution_id = args['execution_id']['value'];

  try {
    const file_path = await node_funcs.exportExecution(execution_id, key);
    res.status(200).download(file_path, '', function(err) {
      if (err) {
        log.error(err);
      }
      // remove the temp directory and its contents
      fse.removeSync(path.dirname(file_path));
    });
  } catch(err) {
    const err_res = node_funcs.push_error('Error when exporting execution', err);
    res.status(400).json(err_res);
  }
}

exports.import_execution = async function(args, res, next, headers) {
  /**
   * Import execution
   *
   * execution_file gzip file of execution
   * return ExecutionImportResponse
   **/
  const key = node_funcs.get_auth_key(headers);
  let execution_file = args['execution_file']['value'] == undefined ? null : args['execution_file']['value'];

  try {
    let data = await node_funcs.importExecution(execution_file, key);
    res.status(200).json(data);
  } catch(err) {
    const err_res = node_funcs.push_error('Error when importing execution', err);
    res.status(400).json(err_res);
  }
}