'use strict';
var node_funcs = require('../node_funcs');

exports.procedure_create_paragraph = async function(args, res, next, headers) {
  /**
   * Create a paragraph
   *
   * procedure_id String unique id of procedure
   * paragraph Paragraph paragraph definition
   * insert_after_id String unique id of the element after which element(s) will be added/inserted. If not provided, element will be added/inserted to the last. To insert at the front, use \"-1\". (optional)
   * level String Add as a sibling or a child. * `SIBLING` - As a sibling of insert_after_id element (Default) * `CHILD` - As a child of insert_after_element  (optional)
   * returns AddParagraphResponse
   **/
  const key = node_funcs.get_auth_key(headers);
  let procedure_id = args['procedure_id']['value'];
  let paragraph = args['paragraph'] ? args['paragraph']['value'] : null;
  let insert_after_id = args['insert_after_id'] ? args['insert_after_id']['value'] : '-1';   
  let level = args['level'] ? args['level']['value'] : 'SIBLING';
 
  try {
    const data = await node_funcs.createArchiveElement(null, procedure_id, "PARAGRAPH", null, paragraph, insert_after_id, level, key); 
    res.status(200).json(data);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when creating a paragraph', err);
    res.status(400).json(err_data);    
  }
}

exports.procedure_get_paragraph = async function(args, res, next, headers) {
  /**
   * Get paragraph definition
   *
   * procedure_id String unique id of procedure
   * elem_id String unique id of a procedure element
   * returns Paragraph
   **/
  const key = node_funcs.get_auth_key(headers);
  let procedure_id = args['procedure_id']['value'];
  let elem_id = args['elem_id']['value'];

  try {
    const data = await node_funcs.get_paragraph(null, procedure_id, elem_id, key); 
    res.status(200).json(data);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when getting a paragraph', err);
    res.status(400).json(err_data);    
  }
}

exports.procedure_get_paragraphs = async function(args, res, next, headers) {
  /**
   * Get paragraphs of the execution. List is sorted by the order in the execution.
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
  let offset = args['offset']['value'] == undefined ? null : args['offset']['value'];
  let limit = args['limit']['value'] == undefined ? null : args['limit']['value'];
  let sort = args['sort']['value'] == undefined ? null : args['sort']['value'];

  try {
    const {elems, total_count} = 
      await node_funcs.getAllParagraphs(null, procedure_id, offset, limit, sort, key); 
    res.set('x-total-count', total_count);
    res.status(200).json(elems);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when getting paragraphs', err);
    res.status(400).json(err_data);    
  }
}

exports.procedure_update_paragraph = async function(args, res, next, headers) {
  /**
   * Update a paragraph
   *
   * procedure_id String unique id of procedure
   * elem_id String unique id of a procedure element
   * paragraph Paragraph Definition of paragraph
   * no response value expected for this operation
   **/
  const key = node_funcs.get_auth_key(headers);
  let procedure_id = args['procedure_id']['value'];
  let elem_id = args['elem_id']['value'];
  let paragraph = args['paragraph']['value'];

  try {
    const data = await node_funcs.update_paragraph(null, procedure_id, elem_id, paragraph, key); 
    res.status(200).json(data);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when updating paragraph', err);
    res.status(400).json(err_data);    
  }
}

