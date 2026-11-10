'use strict';
var fs = require('fs');
var path = require('path');
var fse = require("fs-extra");
var node_funcs = require('../node_funcs');
var log = node_funcs.log;

exports.create_procedure = async function(args, res, next, headers) {
  /**
   * Create a procedure
   *
   * procedure ProcedureInput Procedure meta data
   * returns ProcedureInfo
   **/
  const key = node_funcs.get_auth_key(headers);
  let procedure = args['procedure']['value'] == undefined ? null : args['procedure']['value'];

  try {
    const data = await node_funcs.createProcedure(procedure, key); 
    res.status(200).json(data);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when creating a procedure', err);
    res.status(400).json(err_data);    
  }
}

exports.delete_procedure = async function(args, res, next, headers) {
  /**
   * Delete the procedure and its all versions
   *
   * procedure_id String unique id of procedure
   * no response value expected for this operation
   **/
  const key = node_funcs.get_auth_key(headers);
  let procedure_id = args['procedure_id']['value'] == undefined ? null : args['procedure_id']['value'];

  try {
    const data = await node_funcs.removeProcedure(procedure_id, key); 
    res.status(204).end();
  } catch (err) {
    const err_data = node_funcs.push_error('Error when deleting a procedure', err);
    res.status(400).json(err_data);    
  }
}

exports.import_procedure_versions = async function(args, res, next, headers) {
  /**
   * Import procedure with one or more version
   *
   * procedure_versions_file gzip file of procedure and procedure versions
   * return ProcedureImportResponse
   **/
  const key = node_funcs.get_auth_key(headers);
  let procedure_versions_file = args['procedure_versions_file']['value'] == undefined ? null : args['procedure_versions_file']['value'];

  try {
    let data = await node_funcs.importProcedureVersions(procedure_versions_file, key);
    res.status(200).json(data);
  } catch(err) {
    const err_data = node_funcs.push_error('Error when importing procedure versions', err);
    res.status(400).json(err_data);
  }
}


exports.get_procedure = async function(args, res, next, headers) {
  /**
   * Get meta data of the working copy of the procedure
   *
   * procedure_id String unique id of procedure
   * returns ProcedureInfo
   **/
  const key = node_funcs.get_auth_key(headers);
  let procedure_id = args['procedure_id']['value'] == undefined ? null : args['procedure_id']['value'];

  try {
    const data = await node_funcs.getProcedure(procedure_id, key); 
    res.status(200).json(data);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when getting a procedure', err);
    res.status(400).json(err_data);    
  }  
}

exports.get_procedures = async function(args, res, next, headers) {
  /**
   * Get a list of procedures. List is sorted by creation time (latest first). 
   *
   * offset Integer Start index for pagination. zero based. (optional)
   * limit Integer Max number of elements to return. (optional)
   * title String Title of a procedure (optional)
   * author String Author of a procedure (optional)
   * versioned Boolean filter for versioned status. Will return any if not provided. (optional)
   * procedure_type String Procedure Type of a procedure (optional)
   * hazardous Boolean filter for procedure (optional)
   * label String Label for procedure (optional)
   * released Boolean filter for released status. Will return any if not provided. (optional)
   * obsolete Boolean filter for obsolete status. Will return any if not provided. (optional)
   * sort String Sort in natural order * `ASC` - Ascending * `DESC` - Descending  (optional)
   * sort_by String sort by this parameter (optional)
   * returns List
   **/
  const key = node_funcs.get_auth_key(headers);
  let title = args['title']['value'] == undefined ? null : args['title']['value'];
  let description = args['description']['value'] == undefined ? null : args['description']['value'];  
  let author = args['author']['value'] == undefined ? null : args['author']['value'];
  let versioned = args['versioned']['value'] == undefined ? null : args['versioned']['value'];
  let procedure_type = args['procedure_type']['value'] == undefined ? null : args['procedure_type']['value'];
  let hazardous = args['hazardous']['value'] == undefined ? null : args['hazardous']['value'];
  let label = args['label']['value'] == undefined ? null : args['label']['value'];
  let released = args['released']['value'] == undefined ? null : args['released']['value'];
  let offset = args['offset']['value'] == undefined ? null : args['offset']['value'];
  let limit = args['limit']['value'] == undefined ? null : args['limit']['value'];
  let obsolete = args['obsolete']['value'] == undefined ? null : args['obsolete']['value'];
  let sort = args['sort']['value'] == undefined ? null : args['sort']['value'];
  let sort_by = args['sort_by']['value'] == undefined ? null : args['sort_by']['value'];
  let procedure_id = args['procedure_id']['value'] == undefined ? null : args['procedure_id']['value'];
  let institutional_id = args['institutional_id']['value'] == undefined ? null : args['institutional_id']['value'];

  try {
    const {procedures, total_count} = await node_funcs.getProcedures(offset, limit, title, description, 
      author, versioned, procedure_type, hazardous, label, released, obsolete, sort, sort_by, procedure_id, institutional_id, key); 
    res.set('x-total-count', total_count);
    res.status(200).json(procedures);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when getting procedures', err);
    res.status(400).json(err_data);    
  }  
}

exports.create_procedure_label = async function(args, res, next, headers) {
  /**
   * Create a procedure label
   *
   * create_procedure_label ProcedureLabelInput Procedure label data
   * returns ProcedureLabelInfo
   **/
  const key = node_funcs.get_auth_key(headers);
  let procedure_label = args['procedure_label']['value'] == undefined ? null : args['procedure_label']['value'];

  try {
    const data = await node_funcs.createProcedureLabel(procedure_label, key); 
    res.status(200).json(data);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when creating a procedure', err);
    res.status(400).json(err_data);    
  }
}

exports.get_procedure_labels = async function(args, res, next, headers) {
  /**
   * Get a list of procedure labels. 
   *
   * offset Integer Start index for pagination. zero based. (optional)
   * limit Integer Max number of elements to return. (optional)
   * sort String Sort in natural order * `ASC` - Ascending * `DESC` - Descending  (optional)
   * name String Name of the label (optional)
   * description String description of the label (optional)
   * returns List
   **/
  const key = node_funcs.get_auth_key(headers);
  let name = args['procedure_label_name']['value'] == undefined ? null : args['procedure_label_name']['value'];
  let description = args['description']['value'] == undefined ? null : args['description']['value'];  
  let offset = args['offset']['value'] == undefined ? null : args['offset']['value'];
  let limit = args['limit']['value'] == undefined ? null : args['limit']['value'];
  let sort = args['sort']['value'] == undefined ? null : args['sort']['value'];

  try {
    const {procedure_labels, total_count} = await node_funcs.getProcedureLabels(offset, limit, sort, name, description, key); 
    res.set('x-total-count', total_count);
    res.status(200).json(procedure_labels);
  } catch (err) {
    const err_data = node_funcs.push_error('Error when getting procedures', err);
    res.status(400).json(err_data);    
  }  
}

exports.delete_procedure_label = async function(args, res, next, headers) {
  /**
   * Delete the procedure label 
   *
   * label_id String unique id of procedure label
   * no response value expected for this operation
   **/
  const key = node_funcs.get_auth_key(headers);
  let label_id = args['label_id']['value'] == undefined ? null : args['label_id']['value'];

  try {
    const data = await node_funcs.removeProcedureLabel(label_id, key); 
    res.status(204).end();
  } catch (err) {
    const err_data = node_funcs.push_error('Error when deleting a procedure label', err);
    res.status(400).json(err_data);    
  }
}

exports.update_procedure = async function(args, res, next, headers) {
  /**
   * Update meta data of the working copy of the procedure
   *
   * procedure_id String unique id of procedure
   * procedure_meta_data ProcedureUpdateInput meta data of procedure
   * no response value expected for this operation
   **/
  const key = node_funcs.get_auth_key(headers);
  let procedure_id = args['procedure_id']['value'] == undefined ? null : args['procedure_id']['value'];
  let procedure_meta_data = args['procedure_meta_data']['value'] == undefined ? null : args['procedure_meta_data']['value'];

  try {
    const data = await node_funcs.updateProcedure(procedure_id, procedure_meta_data, key); 
    res.status(204).end();
  } catch (err) {
    const err_data = node_funcs.push_error('Error when updating a procedure', err);
    res.status(400).json(err_data);    
  }    
}

exports.replace_procedure = async function(args, res, next, headers) {
  /**
   * Replace text in procedure
   *
   * procedure_id String unique id of procedure
   * replace_input ReplaceInput Definition of replacement operation
   * return array of ReplacementOutput
   **/
  const key = node_funcs.get_auth_key(headers);
  let procedure_id = args['procedure_id']['value'] == undefined ? null : args['procedure_id']['value'];
  let replace_input = args['replace_input']['value'] == undefined ? null : args['replace_input']['value'];

  try {
    const data = await node_funcs.replaceProcedure(procedure_id, replace_input, key); 
    res.status(200).json(data);
  } catch (err) {
    console.log(err);
    const err_data = node_funcs.push_error('Error when replacing text in procedure', err);
    res.status(400).json(err_data);    
  }
}

exports.export_procedure_versions = async function(args, res, next, headers) {
  /**
   * Export procedure and selected versions as a gzip file
   *
   * procedure_id String unique id of procedure
   * export_input Definition of export input
   * returns file (tar.gzip)
   **/
  const key = node_funcs.get_auth_key(headers);
  let procedure_id = args['procedure_id']['value'] == undefined ? null : args['procedure_id']['value'];
  let version = args['version']['value'] == undefined ? null : args['version']['value'];
  let released_only = args['released_only']['value'] == undefined ? null : args['released_only']['value'];

  try {
    let file_path = await node_funcs.exportProcedureVersions(procedure_id, version, released_only, key);
    res.status(200).download(file_path, '', function(err) {
      if (err) {
        log.error(err);
      }
      // remove the temporary directory and its contents
      fse.removeSync(path.dirname(file_path));
    });
  } catch (err) {
    const err_data = node_funcs.push_error('Error when exporting procedure versions', err);
    res.status(400).json(err_data);    
  }
}
