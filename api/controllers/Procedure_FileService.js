'use strict';
var node_funcs = require('../node_funcs');

exports.procedure_element_upload_file = async function(args, res, next, headers) {
  /**
   * Upload a file to a procedure element
   *
   * procedure_id String unique id of procedure
   * elem_id String unique id of a procedure element
   * file_content File content of the file
   * file_name String file name (optional)
   * returns FileInfo
   **/
  const key = node_funcs.get_auth_key(headers);
  let procedure_id = args['procedure_id']['value']
  let elem_id = args['elem_id']['value']
  let file_content = args['file_content']['value']
  let file_name = args['file_name']['value'] == undefined ? args['file_content']['value']['originalname'] : args['file_name']['value']

  try {
    const data = await node_funcs.procedureWriteFile(file_name, file_content, procedure_id, '0', elem_id, key); 
    res.status(200).json(data);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when adding a file', err);
    res.status(400).json(err_data);    
  }  
}

exports.procedure_element_get_files = async function(args, res, next, headers) {
  /**
   * Get a list of attached files for a procedure element. List is ordered by the creation date (ascending order).
   *
   * procedure_id String unique id of procedure
   * elem_id String unique id of a procedure element
   * offset Integer Start index for pagination. zero based. (optional)
   * limit Integer Max number of elements to return. (optional)
   * sort String Sort in natural order * `ASC` - Ascending * `DESC` - Descending  (optional)
   * returns List
   **/
  const key = node_funcs.get_auth_key(headers);
  let procedure_id = args['procedure_id']['value']
  let elem_id = args['elem_id']['value']
  let offset = args["offset"]["value"] || undefined;
  let limit = args["limit"]["value"] || undefined;

  try {
    const {files, total_count} = await node_funcs.getProcedureElementFiles(procedure_id, elem_id, offset, limit, key); 
    res.set('x-total-count', total_count);
    res.status(200).json(files);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when getting files', err);
    res.status(400).json(err_data);    
  }
}

exports.procedure_element_get_file = async function(args, res, next, headers) {
  /**
   * Download a list of attached files for a procedure element
   *
   * procedure_id String unique id of procedure
   * elem_id String unique id of a procedure element
   * file_id String resource id of an attached file
   * returns FileInfo
   **/
  const key = node_funcs.get_auth_key(headers);
  let elem_id = args['elem_id']['value']
  let file_id = args['file_id']['value']
  let procedure_id = args['procedure_id']['value']

  try {
    const data = await node_funcs.readProcedureElementFile(procedure_id, elem_id, file_id, key); 
    res.status(200).json(data);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when getting a file', err);
    res.status(400).json(err_data);    
  }
}

exports.procedure_element_delete_file = async function(args, res, next, headers) {
  /**
   * Delete an attached file
   *
   * procedure_id String unique id of procedure
   * elem_id String unique id of a procedure element
   * file_id String resource id of an attached file
   * no response value expected for this operation
   **/
  const key = node_funcs.get_auth_key(headers);
  let elem_id = args['elem_id']['value']
  let file_id = args['file_id']['value']
  let procedure_id = args['procedure_id']['value']

  try {
    const data = await node_funcs.deleteProcedureElementFile(procedure_id, elem_id, file_id, key); 
    res.status(204).end();
  } catch (err) {
    const err_data = node_funcs.push_error('Error when deleting a file', err);
    res.status(400).json(err_data);    
  }  
}

exports.procedure_upload_file = async function(args, res, next, headers) {
  /**
   * Upload a file to a procedure element
   *
   * procedure_id String unique id of procedure
   * file_content File content of the file
   * file_name String file name (optional)
   * returns FileInfo
   **/
  const key = node_funcs.get_auth_key(headers);
  let procedure_id = args['procedure_id']['value']
  let file_content = args['file_content']['value']
  let file_name = args['file_name']['value'] == undefined ? args['file_content']['value']['originalname'] : args['file_name']['value']

  try {
    const data = await node_funcs.procedureWriteFile(file_name, file_content, procedure_id, '0', null, key); 
    res.status(200).json(data);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when adding a file', err);
    res.status(400).json(err_data);    
  }
}

exports.procedure_get_files = async function(args, res, next, headers) {
  /**
   * Get a list of attached files for a procedure element. List is ordered by the creation date (ascending order).
   *
   * procedure_id String unique id of procedure
   * offset Integer Start index for pagination. zero based. (optional)
   * limit Integer Max number of elements to return. (optional)
   * sort String Sort in natural order * `ASC` - Ascending * `DESC` - Descending  (optional)
   * returns List
   **/
  const key = node_funcs.get_auth_key(headers);
  let procedure_id = args['procedure_id']['value']
  let offset = args["offset"]["value"] || undefined;
  let limit = args["limit"]["value"] || undefined;

  try {
    const {files, total_count} = await node_funcs.getProcedureFiles(procedure_id, offset, limit, key); 
    res.set('x-total-count', total_count);
    res.status(200).json(files);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when getting files', err);
    res.status(400).json(err_data);    
  }
}

exports.procedure_get_file = async function(args, res, next, headers) {
  /**
   * Download a list of attached files for a procedure element
   *
   * procedure_id String unique id of procedure
   * file_id String resource id of an attached file
   * returns FileInfo
   **/
  const key = node_funcs.get_auth_key(headers);
  let file_id = args['file_id']['value']
  let procedure_id = args['procedure_id']['value']

  try {
    const data = await node_funcs.readProcedureFile(procedure_id, file_id, key); 
    res.status(200).json(data);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when getting a file', err);
    res.status(400).json(err_data);    
  }
}

exports.procedure_delete_file = async function(args, res, next, headers) {
  /**
   * Delete an attached file
   *
   * procedure_id String unique id of procedure
   * file_id String resource id of an attached file
   * no response value expected for this operation
   **/
  const key = node_funcs.get_auth_key(headers);
  let file_id = args['file_id']['value']
  let procedure_id = args['procedure_id']['value']

  try {
    const data = await node_funcs.deleteProcedureFile(procedure_id, file_id, key); 
    res.status(204).end();
  } catch (err) {
    const err_data = node_funcs.push_error('Error when deleting a file', err);
    res.status(400).json(err_data);    
  }  
}


exports.procedure_element_post_comment_file = async function(args, res, next, headers) {
  /**
   * Upload a file to a procedure element
   *
   * procedure_id String unique id of procedure
   * version procedure version
   * elem_id element id
   * conversation_id conversation id
   * comment_id comment id
   * file_content File content of the file
   * file_name String file name (optional)
   * returns FileInfo
   **/
  const key = node_funcs.get_auth_key(headers);
  let procedure_id = args['procedure_id']['value']
  let version = args['version']['value']
  let elem_id = args['elem_id']['value']
  let conversation_id = args['conversation_id']['value']
  let comment_id = args['comment_id']['value']
  let file_content = args['file_content']['value']
  let file_name = args['file_name']['value'] == undefined ? args['file_content']['value']['originalname'] : args['file_name']['value']

  try {
    const data = await node_funcs.writeFileProcedureComment(file_name, file_content, procedure_id, version, elem_id, conversation_id, comment_id, key); 
    res.status(200).json(data);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when adding a file', err);
    res.status(400).json(err_data);    
  }
}

exports.procedure_element_get_comment_files = async function(args, res, next, headers) {
  /**
   * Get a list of files attached to comments
   *
   * elem_id String unique id of a procedure element
   * conversation_id String resource id of a conversation
   * comment_id String resource id of a comment
   * offset Integer Start index for pagination. zero based. (optional)
   * limit Integer Max number of elements to return. (optional)
   * sort String Sort in natural order * `ASC` - Ascending * `DESC` - Descending  (optional)
   * returns List
   **/
  const key = node_funcs.get_auth_key(headers);
  let procedure_id = args['procedure_id']['value']
  let version = args['version']['value']
  let elem_id = args['elem_id']['value']
  let conversation_id = args['conversation_id']['value']
  let comment_id = args['comment_id']['value']
  let offset = args["offset"]["value"] || undefined;
  let limit = args["limit"]["value"] || undefined;

  try {
    const {files, total_count} = await node_funcs.getFilesProcedureComment(procedure_id, version, elem_id, conversation_id, comment_id, offset, limit, key); 
    res.set('x-total-count', total_count);
    res.status(200).json(files);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when getting files', err);
    res.status(400).json(err_data);    
  }
}

exports.procedure_element_get_comment_file = async function(args, res, next, headers) {
  /**
   * Download a list of attached files for a procedure element
   *
   * procedure_id String unique id of procedure
   * version procedure version
   * elem_id element id
   * conversation_id conversation id
   * comment_id comment id
   * file_id String resource id of an attached file
   * returns FileInfo
   **/
  const key = node_funcs.get_auth_key(headers);  
  let procedure_id = args['procedure_id']['value']
  let version = args['version']['value']
  let elem_id = args['elem_id']['value']
  let conversation_id = args['conversation_id']['value']
  let comment_id = args['comment_id']['value']
  let file_id = args['file_id']['value']  

  try {
    const data = await node_funcs.readFileProcedureComment(procedure_id, version, elem_id, conversation_id, comment_id, file_id, key); 
    res.status(200).json(data);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when getting a comment', err);
    res.status(400).json(err_data);    
  }  
}

exports.procedure_element_delete_comment_file = async function(args, res, next, headers) {
  /**
   * Delete an attached file
   *
   * procedure_id String unique id of procedure
   * version procedure version
   * elem_id element id
   * conversation_id conversation id
   * comment_id comment id
   * file_id String resource id of an attached file
   * no response value expected for this operation
   **/
  const key = node_funcs.get_auth_key(headers);
  let procedure_id = args['procedure_id']['value']
  let version = args['version']['value']
  let elem_id = args['elem_id']['value']
  let conversation_id = args['conversation_id']['value']
  let comment_id = args['comment_id']['value']  
  let file_id = args['file_id']['value']

  try {
    const data = await node_funcs.deleteFileProcedureComment(procedure_id, version, elem_id, conversation_id, comment_id, file_id, key); 
    res.status(204).end();
  } catch (err) {
    const err_data = node_funcs.push_error('Error when getting a comment', err);
    res.status(400).json(err_data);    
  }  
}
