'use strict';
var node_funcs = require('../node_funcs');

exports.procedure_element_add_conversation = async function(args, res, next, headers) {
  /**
   * Add a conversation to an element
   *
   * procedure_id unique id of procedure
   * version procedure version
   * elem_id String unique id of an element
   * conversation ConversationInput conversation to add
   * returns Conversation
   **/
  const key = node_funcs.get_auth_key(headers);
  let procedure_id = args['procedure_id']['value'];
  let version = args['version']['value'];
  let elem_id = args['elem_id']['value'];
  let conversation = args['conversation'] ? args['conversation']['value'] : null;  

  try {
    const data = await node_funcs.addProcedureConversation(procedure_id, version, elem_id, conversation, key); 
    res.status(200).json(data);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when adding a conversation', err);
    res.status(400).json(err_data);    
  }
}

exports.procedure_element_get_conversations = async function(args, res, next, headers) {
  /**
   * Get a list of conversations for an element. List is ordered by the creation date (ascending order).
   *
   * procedure_id unique id of procedure
   * version procedure version
   * elem_id String unique id of an element
   * offset Integer Start index for pagination. zero based. (optional)
   * limit Integer Max number of conversations to return. (optional)
   * sort String Sort in natural order * `ASC` - Ascending * `DSC` - Descending  (optional)
   * returns List
   **/
  const key = node_funcs.get_auth_key(headers);
  let procedure_id = args['procedure_id']['value'];
  let version = args['version']['value'];
  let elem_id = args['elem_id']['value'];
  let offset = args['offset']['value'] == undefined ? null : args['offset']['value'];
  let limit = args['limit']['value'] == undefined ? null : args['limit']['value'];

  try {
    const data = await node_funcs.getProcedureConversations(procedure_id, version, elem_id, offset, limit, key); 
    res.status(200).json(data);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when getting comments', err);
    res.status(400).json(err_data);    
  }
}

exports.procedure_element_get_conversation = async function(args, res, next, headers) {
  /**
   * Get a list of comments for a procedure element\"
   *
   * procedure_id unique id of procedure
   * version procedure version
   * elem_id String unique id of a procedure element
   * conversation_id String resource id of a conversation
   * returns Comment
   **/
  const key = node_funcs.get_auth_key(headers);
  let procedure_id = args['procedure_id']['value'];
  let version = args['version']['value'];
  let elem_id = args['elem_id']['value'];
  let conversation_id = args['conversation_id']['value'];

  try {
    const data = await node_funcs.getProcedureConversation(procedure_id, version, elem_id, conversation_id, key); 
    res.status(200).json(data);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when getting a conversation', err);
    res.status(400).json(err_data);    
  }
}

exports.procedure_element_update_conversation = async function(args, res, next, headers) {
  /**
   * Update a comment of a procedure element
   *
   * procedure_id unique id of procedure
   * version procedure version
   * elem_id String unique id of a procedure element
   * conversation_id String unique id of the conversation
   * conversation ConversationInput conversation to update
   * returns Conversation
   **/
  const key = node_funcs.get_auth_key(headers);
  let procedure_id = args['procedure_id']['value'];
  let version = args['version']['value'];
  let elem_id = args['elem_id']['value'];
  let conversation_id = args['conversation_id']['value'];
  let conversation = args['conversation'] ? args['conversation']['value'] : null;

  try {
    const data = await node_funcs.updateProcedureConversation(procedure_id, version, elem_id, conversation_id, conversation, key); 
    res.status(200).json(data);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when updating a conversation', err);
    res.status(400).json(err_data);    
  }
}

exports.procedure_element_delete_conversation = async function(args, res, next, headers) {
  /**
   * Delete a comment
   *
   * procedure_id unique id of procedure
   * version procedure version
   * elem_id String unique id of a procedure element
   * conversation_id String unique id of the conversation
   * no response value expected for this operation
   **/
  const key = node_funcs.get_auth_key(headers);
  let procedure_id = args['procedure_id']['value'];
  let version = args['version']['value'];
  let elem_id = args['elem_id']['value'];
  let conversation_id = args['conversation_id']['value'];

  try {
    const data = await node_funcs.deleteProcedureConversation(procedure_id, version, elem_id, conversation_id, key); 
    res.status(204).end();
  } catch (err) {
    const err_data = node_funcs.push_error('Error when deleting a comment', err);
    res.status(400).json(err_data);    
  }
}


exports.procedure_element_add_comment = async function(args, res, next, headers) {
  /**
   * Add a comment to a procedure element
   *
   * procedure_id unique id of procedure
   * version procedure version
   * elem_id String unique id of a procedure element
   * conversation_id String unique id of the conversation
   * comment CommentInput comment to add
   * returns Comment
   **/
  const key = node_funcs.get_auth_key(headers);
  let procedure_id = args['procedure_id']['value'];
  let version = args['version']['value'];
  let elem_id = args['elem_id']['value'];
  let conversation_id = args['conversation_id']['value'];
  let comment = args['comment'] ? args['comment']['value'] : null;  

  try {
    const data = await node_funcs.addProcedureComment(procedure_id, version, elem_id, conversation_id, comment, key); 
    res.status(200).json(data);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when adding a comment', err);
    res.status(400).json(err_data);    
  }
}

exports.procedure_element_get_comments = async function(args, res, next, headers) {
  /**
   * Get a list of comments for a procedure element. List is ordered by the creation date (ascending order).
   *
   * procedure_id unique id of procedure
   * version procedure version
   * elem_id String unique id of a procedure element
   * conversation_id String unique id of the conversation
   * offset Integer Start index for pagination. zero based. (optional)
   * limit Integer Max number of elements to return. (optional)
   * sort String Sort in natural order * `ASC` - Ascending * `DSC` - Descending  (optional)
   * returns List
   **/
  const key = node_funcs.get_auth_key(headers);
  let procedure_id = args['procedure_id']['value'];
  let version = args['version']['value'];
  let elem_id = args['elem_id']['value'];
  let conversation_id = args['conversation_id']['value'];
  let offset = args['offset']['value'] == undefined ? null : args['offset']['value'];
  let limit = args['limit']['value'] == undefined ? null : args['limit']['value'];

  try {
    const data = await node_funcs.getProcedureComments(procedure_id, version, elem_id, conversation_id, offset, limit, key); 
    res.status(200).json(data);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when getting comments', err);
    res.status(400).json(err_data);    
  }
}

exports.procedure_element_get_comment = async function(args, res, next, headers) {
  /**
   * Get a list of comments for a procedure element\"
   *
   * procedure_id unique id of procedure
   * version procedure version
   * elem_id String unique id of a procedure element
   * conversation_id String unique id of the conversation
   * comment_id String resource id of a comment
   * returns Comment
   **/
  const key = node_funcs.get_auth_key(headers);
  let procedure_id = args['procedure_id']['value'];
  let version = args['version']['value'];
  let elem_id = args['elem_id']['value'];
  let conversation_id = args['conversation_id']['value'];
  let comment_id = args['comment_id']['value'];

  try {
    const data = await node_funcs.getProcedureComment(procedure_id, version, elem_id, conversation_id, comment_id, key); 
    res.status(200).json(data);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when getting a comment', err);
    res.status(400).json(err_data);    
  }
}

exports.procedure_element_update_comment = async function(args, res, next, headers) {
  /**
   * Update a comment of a procedure element
   *
   * procedure_id unique id of procedure
   * version procedure version
   * elem_id String unique id of a procedure element
   * conversation_id String unique id of the conversation
   * comment_id String unique id of the comment
   * comment CommentInput comment to add
   * returns Comment
   **/
  const key = node_funcs.get_auth_key(headers);
  let procedure_id = args['procedure_id']['value'];
  let version = args['version']['value'];
  let elem_id = args['elem_id']['value'];
  let conversation_id = args['conversation_id']['value'];
  let comment_id = args['comment_id']['value'];
  let comment = args['comment'] ? args['comment']['value'] : null;

  try {
    const data = await node_funcs.updateProcedureComment(procedure_id, version, elem_id, conversation_id, comment_id, comment, key); 
    res.status(200).json(data);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when updating a comment', err);
    res.status(400).json(err_data);    
  }
}

exports.procedure_element_delete_comment = async function(args, res, next, headers) {
  /**
   * Delete a comment
   *
   * procedure_id unique id of procedure
   * version procedure version
   * elem_id String unique id of a procedure element
   * conversation_id String unique id of the conversation
   * comment_id String resource id of a comment
   * no response value expected for this operation
   **/
  const key = node_funcs.get_auth_key(headers);
  let procedure_id = args['procedure_id']['value'];
  let version = args['version']['value'];
  let elem_id = args['elem_id']['value'];
  let conversation_id = args['conversation_id']['value'];
  let comment_id = args['comment_id']['value'];

  try {
    const data = await node_funcs.deleteProcedureComment(procedure_id, version, elem_id, conversation_id, comment_id, key); 
    res.status(204).end();
  } catch (err) {
    const err_data = node_funcs.push_error('Error when deleting a comment', err);
    res.status(400).json(err_data);    
  }
}
