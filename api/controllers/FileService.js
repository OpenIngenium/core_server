'use strict';
var node_funcs = require('../node_funcs');
var log = node_funcs.log;

exports.element_upload_file = async function(args, res, next, headers) {
  /**
   * Upload a file to a procedure element
   *
   * elem_id String unique id of a procedure element
   * file_content File content of the file
   * file_name String file name (optional)
   * returns FileInfo
   **/
  const key = node_funcs.get_auth_key(headers);
  let elem_id = args['elem_id']['value']
  let file_content = args['file_content']['value']
  let file_name = args['file_name']['value'] == undefined ? args['file_content']['value']['originalname'] : args['file_name']['value']
  
  try {
    const data = await node_funcs.writeFile(file_name, file_content, undefined, elem_id, key); 
    res.status(200).json(data);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when uploading a file', err);
    res.status(400).json(err_data);    
  }  
}

exports.element_get_files = async function(args, res, next, headers) {
  /**
   * Get a list of attached files for a procedure element. List is ordered by the creation date (ascending order).
   *
   * elem_id String unique id of a procedure element
   * offset Integer Start index for pagination. zero based. (optional)
   * limit Integer Max number of elements to return. (optional)
   * sort String Sort in natural order * `ASC` - Ascending * `DSC` - Descending  (optional)
   * returns List
   **/
  const key = node_funcs.get_auth_key(headers);
  let execution_id = args['execution_id']['value']
  let elem_id = args['elem_id']['value']
  let offset = args["offset"]["value"] || undefined;
  let limit = args["limit"]["value"] || undefined;

  try {
    const {files, total_count} = await node_funcs.getFiles(execution_id, elem_id, offset, limit, key); 
    res.set('x-total-count', total_count);
    res.status(200).json(files);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when getting files', err);
    res.status(400).json(err_data);    
  }  
}

exports.element_get_file = async function(args, res, next, headers) {
  /**
   * Download a list of attached files for a procedure element
   *
   * elem_id String unique id of a procedure element
   * file_id String resource id of an attached file
   * returns FileInfo
   **/
  const key = node_funcs.get_auth_key(headers);
  let execution_id = args['execution_id']['value']
  let elem_id = args['elem_id']['value']
  let file_id = args['file_id']['value']

  try {
    const data = await node_funcs.readFile(execution_id, elem_id, file_id, key); 
    res.status(200).json(data);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when getting a file', err);
    res.status(400).json(err_data);    
  }
}

exports.element_delete_file = async function(args, res, next, headers) {
  /**
   * Delete an attached file
   *
   * elem_id String unique id of a procedure element
   * file_id String resource id of an attached file
   * no response value expected for this operation
   **/
  const key = node_funcs.get_auth_key(headers);
  let execution_id = args['execution_id']['value']
  let elem_id = args['elem_id']['value']
  let file_id = args['file_id']['value']

  try {
    const data = await node_funcs.deleteFile(execution_id, elem_id, file_id, key); 
    res.status(204).end();
  } catch (err) {
    const err_data = node_funcs.push_error('Error when deleting a file', err);
    res.status(400).json(err_data);    
  }
}

exports.execution_upload_file = async function(args, res, next, headers) {
  /**
   * Upload a file to a procedure execution
   *
   * execution_id String unique id of execution
   * file_content File content of the file
   * file_name String file name (optional)
   * returns FileInfo
   **/
  const key = node_funcs.get_auth_key(headers);
  let execution_id = args['execution_id']['value']
  let file_content = args['file_content']['value']
  let file_name = args['file_name']['value'] == undefined ? args['file_content']['value']['originalname'] : args['file_name']['value']

  try {
    const data = await node_funcs.writeFile(file_name, file_content, execution_id, undefined, key); 
    res.status(200).json(data);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when uploading a file', err);
    res.status(400).json(err_data);    
  }  
}

exports.execution_get_files = async function(args, res, next, headers) {
  /**
   * Get a list of attached files for a procedure execution. List is ordered by the creation date (ascending order).
   *
   * execution_id String unique id of execution
   * offset Integer Start index for pagination. zero based. (optional)
   * limit Integer Max number of elements to return. (optional)
   * sort String Sort in natural order * `ASC` - Ascending * `DESC` - Descending  (optional)
   * returns List
   **/
  const key = node_funcs.get_auth_key(headers);
  let execution_id = args['execution_id']['value']  
  let offset = args["offset"]["value"] || undefined;
  let limit = args["limit"]["value"] || undefined;

  try {
    const {files, total_count} = await node_funcs.getAllFilesExec(execution_id, key, offset, limit); 
    res.set('x-total-count', total_count);
    res.status(200).json(files);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when getting files', err);
    res.status(400).json(err_data);    
  }  
}

exports.execution_get_file = async function(args, res, next, headers) {
  /**
   * Get a specific files meta-data
   *
   * execution_id String unique id of execution
   * file_id String resource id of an attached file
   * returns FileInfo
   **/
  const key = node_funcs.get_auth_key(headers);
  let execution_id = args['execution_id']['value']
  let file_id = args['file_id']['value']

  try {
    const data = await node_funcs.readFileExec(file_id, execution_id, key); 
    res.status(200).json(data);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when getting a file', err);
    res.status(400).json(err_data);    
  }  
}

exports.execution_delete_file = async function(args, res, next, headers) {
  /**
   * Delete an attached file
   *
   * execution_id String unique id of execution
   * file_id String resource id of an attached file
   * no response value expected for this operation
   **/
  const key = node_funcs.get_auth_key(headers);
  let execution_id = args['execution_id']['value']
  let file_id = args['file_id']['value']

  try {
    const data = await node_funcs.deleteFileExec(execution_id, file_id, key); 
    res.status(204).end();
  } catch (err) {
    const err_data = node_funcs.push_error('Error when deleting a file', err);
    res.status(400).json(err_data);    
  }
}

exports.element_post_comment_file = async function(args, res, next, headers) {
  /**
   * Upload a file to an element comment
   *
   * execution_id String unique id of execution
   * elem_id String unique id of a procedure element
   * conversation_id String resource id of a conversation
   * comment_id String resource id of a comment
   * file_content File content of the file
   * file_name String file name (optional)
   * returns FileInfo
   **/
  const key = node_funcs.get_auth_key(headers);
  let execution_id = args['execution_id']['value']
  let elem_id = args['elem_id']['value']
  let file_content = args['file_content']['value']
  let conversation_id = args['conversation_id']['value']
  let comment_id = args['comment_id']['value']
  let file_name = args['file_name']['value'] == undefined ? args['file_content']['value']['originalname'] : args['file_name']['value']

  try {
    const data = await node_funcs.writeFileComment(file_name, file_content, execution_id, elem_id, conversation_id, comment_id, key); 
    res.status(200).json(data);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when posting a comment', err);
    res.status(400).json(err_data);    
  }  
}

exports.element_get_comment_files = async function(args, res, next, headers) {
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
  let execution_id = args['execution_id']['value']
  let elem_id = args['elem_id']['value']
  let conversation_id = args['conversation_id']['value']
  let comment_id = args['comment_id']['value']
  let offset = args["offset"]["value"] || undefined;
  let limit = args["limit"]["value"] || undefined;

  try {
    const {files, total_count} = await node_funcs.getFilesComment(execution_id, elem_id, conversation_id, comment_id, offset, limit, key); 
    res.set('x-total-count', total_count);
    res.status(200).json(files);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when getting files', err);
    res.status(400).json(err_data);    
  }  
}

exports.element_get_comment_file = async function(args, res, next, headers) {
  /**
   * get a files meta data
   *
   * elem_id String unique id of a procedure element
   * conversation_id String resource id of a conversation
   * comment_id String resource id of a comment
   * file_id String resource id of an attached file
   * returns FileInfo
   **/
  const key = node_funcs.get_auth_key(headers);  
  let execution_id = args['execution_id']['value']
  let elem_id = args['elem_id']['value']
  let conversation_id = args['conversation_id']['value']
  let comment_id = args['comment_id']['value']
  let file_id = args['file_id']['value']  

  try {
    const data = await node_funcs.readFileComment(execution_id, elem_id, conversation_id, comment_id, file_id, key); 
    res.status(200).json(data);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when getting a comment', err);
    res.status(400).json(err_data);    
  }  
}

exports.element_delete_comment_file = async function(args, res, next, headers) {
  /**
   * Delete a file
   *
   * elem_id String unique id of a procedure element
   * conversation_id String resource id of a conversation
   * comment_id String resource id of a comment
   * file_id String resource id of an attached file
   * no response value expected for this operation
   **/
  const key = node_funcs.get_auth_key(headers);  
  let execution_id = args['execution_id']['value']
  let elem_id = args['elem_id']['value']
  let conversation_id = args['conversation_id']['value']
  let comment_id = args['comment_id']['value']  
  let file_id = args['file_id']['value']

  try {
    const data = await node_funcs.deleteFileComment(execution_id, elem_id, conversation_id, comment_id, file_id, key); 
    res.status(204).end();
  } catch (err) {
    const err_data = node_funcs.push_error('Error when getting a comment', err);
    res.status(400).json(err_data);    
  }  
}
