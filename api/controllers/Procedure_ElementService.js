'use strict';
var node_funcs = require('../node_funcs');

exports.validate_procedure_element = async function(args, res, next, headers) {
  /**
   * Refresh a computed element in the working copy of the procedure
   *
   * procedure_id String unique id of procedure
   * elem_id String unique id of a procedure element
   * return element that were updated
   **/
  const key = node_funcs.get_auth_key(headers);
  let procedure_id = args['procedure_id']['value'];
  let elem_id = args['elem_id']['value'];
  let validation_input = args['validation_input']['value'] || null;

  try {
    const data = await node_funcs.validate_procedure_element(procedure_id, elem_id, validation_input, key); 
    res.status(200).json(data);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when validating a procedure element', err);
    res.status(400).json(err_data);    
  }
}
