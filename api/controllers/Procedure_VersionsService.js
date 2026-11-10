'use strict';

var path = require('path');
var fse = require("fs-extra");
var util = require('util');
var node_funcs = require('../node_funcs');
var log = node_funcs.log;

exports.create_version = async function(args, res, next, headers) {
  /**
   * Create a new version from the current working copy
   *
   * procedure_id String unique id of procedure
   * version_meta_data ProcedureVersionInput meta data of version
   * returns ProcedureVersionInfo
   **/
  const key = node_funcs.get_auth_key(headers);
  let procedure_id = args['procedure_id']['value'] == undefined ? null : args['procedure_id']['value'];
  let version_meta_data = args['version_meta_data']['value'] == undefined ? null : args['version_meta_data']['value']

  // update numbers and title of referenced steps
  try {
    // vi_map and script_map are null, which will update only step references in VI Status step
    // without updating references to VI or custom script steps
    const validation_input = {
      update: true,
      vi_map: null,
      script_map: null
    };
    await node_funcs.validate_procedure_version(procedure_id, 0, validation_input, key);
  } catch(ex) {
    log.warning('create_version error for validate_procedure_version', util.inspect(ex));
  }

  try {
    const data = await node_funcs.createProcedureVersion(procedure_id, version_meta_data, key);
    res.status(200).json(data);
  } catch(err) {
    const err_data = node_funcs.push_error('Error when creating a version', err);
    res.status(400).json(err_data);
  }
}

exports.delete_version = async function(args, res, next, headers) {
  /**
   * Delete the version
   *
   * procedure_id String unique id of procedure
   * version Integer version of procedure
   * no response value expected for this operation
   **/
  const key = node_funcs.get_auth_key(headers);
  let procedure_id = args['procedure_id']['value'] == undefined ? null : args['procedure_id']['value'];
  let version = args['version']['value'] == undefined ? null : args['version']['value']
  
  try {
    await node_funcs.removeVersion(procedure_id, version, key);
    res.status(204).end();
  } catch(err) {
    let err_res = node_funcs.push_error('Error when deleting a version', err);
    res.status(400).json(err_res);
  }
}

exports.get_version = async function(args, res, next, headers) {
  /**
   * Get meta data of version of the procedure
   *
   * procedure_id String unique id of procedure
   * version Integer version of procedure
   * returns ProcedureVersionInfo
   **/
  const key = node_funcs.get_auth_key(headers);
  let procedure_id = args['procedure_id']['value'] == undefined ? null : args['procedure_id']['value'];
  let version = args['version']['value'] == undefined ? null : args['version']['value']
  try {
    let data = await node_funcs.getVersion(procedure_id, version, key);
    res.status(200).json(data);
  } catch(err) {
    let err_res = node_funcs.push_error(`Error when getting a version. procedure_id: ${procedure_id} version: ${version}`, err);
    res.status(400).json(err_res);
  }
}

exports.get_version_structure = async function(args, res, next, headers) {
  /**
   * Get hierarchical view of the version of the procedure
   *
   * procedure_id String unique id of procedure
   * version Integer version of procedure
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
  let version = args['version']['value'] == undefined ? null : args['version']['value']

  try {
    let data = await node_funcs.getStructure(procedure_id, offset, limit, sort, version, key);
    res.status(200).json(data);
  } catch(err) {
    let err_res = node_funcs.push_error(`Error when getting a version structure. procedure_id: ${procedure_id} version: ${version}`, err);
    res.status(400).json(err_res);
  }  
}

exports.get_version_elements = async function(args, res, next, headers) {
  /**
   * Get hierarchical view of the version of the procedure
   *
   * procedure_id String unique id of procedure
   * version Integer version of procedure
   * offset Integer Start index for pagination. zero based. (optional)
   * limit Integer Max number of elements to return. (optional)
   * sort String Sort in natural order * `ASC` - Ascending * `DESC` - Descending  (optional)
   * description String Query for words in description (optional)
   * all_elements String include all elements regardless of comments (ON/OFF, ON by default)
   * comment_filter String include elements with general comments (ON/OFF, OFF by default)
   * returns ProcedureStructure
   **/
  const key = node_funcs.get_auth_key(headers);
  let procedure_id = args['procedure_id']['value'] == undefined ? null : args['procedure_id']['value'];
  let version = args['version']['value'] == undefined ? null : args['version']['value']
  let elem_type = args['elem_type']['value'] == undefined ? null : args['elem_type']['value'];
  let step_type = args['step_type']['value'] == undefined ? null : args['step_type']['value'];
  let offset = args['offset']['value'] == undefined ? null : args['offset']['value'];
  let limit = args['limit']['value'] == undefined ? null : args['limit']['value'];
  let sort = args['sort']['value'] == undefined ? null : args['sort']['value'];
  let description = args['description']['value'] == undefined ? null : args['description']['value'];
  let all_elements = args['all_elements']['value'] == undefined ? null : args['all_elements']['value'];
  let comment_filter = args['comment_filter']['value'] == undefined ? null : args['comment_filter']['value'];

  try {
    const {elems, total_count} = await 
      node_funcs.getVersionElements(procedure_id, version, elem_type, step_type, offset, limit, sort, description, 
        all_elements, comment_filter, key);
    res.set('x-total-count', total_count);
    res.status(200).json(elems);
  } catch(err) {
    let err_res = node_funcs.push_error('Error when getting version elements', err);
    res.status(400).json(err_res);
  }
}

exports.get_versions = async function(args, res, next, headers) {
  /**
   * Get a list of versions. List is sorted by time versioned (latest first). 
   *
   * procedure_id String unique id of procedure
   * offset Integer Start index for pagination. zero based. (optional)
   * limit Integer Max number of elements to return. (optional)
   * sort String Sort in natural order * `ASC` - Ascending * `DESC` - Descending  (optional)
   * description String Query for words in description (optional)
   * released Boolean filter for released status. Will return any if not provided. (optional)
   * deprecated Boolean filter for deprecated status. Will return any if not provided. (optional)
   * returns List
   **/
  const key = node_funcs.get_auth_key(headers);
  let procedure_id = args['procedure_id']['value'] == undefined ? null : args['procedure_id']['value'];
  let version_description = args['version_description']['value'] == undefined ? null : args['version_description']['value'];
  let version_author = args['version_author']['value'] == undefined ? null : args['version_author']['value'];
  let status = args['status']['value'] == undefined ? null : args['status']['value'];
  let offset = args['offset']['value'] == undefined ? null : args['offset']['value'];
  let limit = args['limit']['value'] == undefined ? null : args['limit']['value'];
  let sort = args['sort']['value'] == undefined ? null : args['sort']['value'];
  let institutional_release_id = args['institutional_release_id']['value'] == undefined ? null : args['institutional_release_id']['value'];

  try {
    const {versions, total_count} = await 
      node_funcs.getVersions(procedure_id, offset, limit, version_description, version_author, status, sort, institutional_release_id, key)
    res.set('x-total-count', total_count);
    res.status(200).json(versions);
  } catch(err) {
    let err_res = node_funcs.push_error('Error when getting versions', err);
    res.status(400).json(err_res);
  }
}

exports.update_version = async function(args, res, next, headers) {
  /**
   * Update meta data of the version
   *
   * procedure_id String unique id of procedure
   * version Integer version of procedure
   * version_meta_data ProcedureVersionUpdateInput meta data of version
   * returns updated version info
   **/
  const key = node_funcs.get_auth_key(headers);
  let procedure_id = args['procedure_id']['value'] == undefined ? null : args['procedure_id']['value'];
  let version = args['version']['value'] == undefined ? null : args['version']['value']
  let version_meta_data = args['version_meta_data']['value'] == undefined ? null : args['version_meta_data']['value']
  
  try {
    const data = await node_funcs.updateVersion(procedure_id, version, version_meta_data, key);
    res.status(200).json(data);
  } catch(err) {
    let err_res = node_funcs.push_error('Error when updating a version', err);
    res.status(400).json(err_res);
  }  
}

exports.update_version_status = async function(args, res, next, headers, jwt) {
  /**
   * Update status of the version
   *
   * procedure_id String unique id of procedure
   * version Integer version of procedure
   * version_status_input version status input
   * returns updated version info
   **/
  const key = node_funcs.get_auth_key(headers);
  let procedure_id = args['procedure_id']['value'] == undefined ? null : args['procedure_id']['value'];
  let version = args['version']['value'] == undefined ? null : args['version']['value']
  let version_status_input = args['version_status_input']['value'] == undefined ? null : args['version_status_input']['value']
  
  const scope_names = jwt.scopes.map(scope => scope.hasOwnProperty('scope') ? scope.scope : scope);

  if (version_status_input.action === 'APPROVE' || version_status_input.action === 'UNAPPROVE') {
    if (!scope_names.includes('test_lead')) {
      res.status(403).json({message: 'User does not have test_lead permission'});
      return;
    }
  } else if (version_status_input.action === 'RELEASE' || version_status_input.action === 'UNRELEASE') {
    if (!scope_names.includes('imcm')) {
      res.status(403).json({message: 'User does not have imcm permission'});
      return;
    }
  }
  
  try {
    const data = await node_funcs.updateVersionStatus(procedure_id, version, version_status_input, key);
    res.status(200).json(data);
  } catch(err) {
    let err_res = node_funcs.push_error('Error when updating a version', err);
    res.status(400).json(err_res);
  }  
}

exports.validate_procedure_version = async function(args, res, next, headers) {
  /**
   * Validate steps that use dictionary contents and step references.
   *
   * procedure_id String unique id of procedure
   * version Integer procedure version
   * validation_input Object dictionary contents to check against
   * return elements that were updated
   **/
  const key = node_funcs.get_auth_key(headers);
  let procedure_id = args['procedure_id']['value'] == undefined ? null : args['procedure_id']['value'];
  let version = args['version']['value'] == undefined ? null : args['version']['value'];
  let validation_input = args['validation_input']['value'] || null;

  try {
    const data = await node_funcs.validate_procedure_version(procedure_id, version, validation_input, key); 
    res.status(200).json(data);
  } catch (err) {
    log.error(`validate_procedure_version error: ${util.inspect(err)}`);
    const err_data = node_funcs.push_error('Error when validating a procedure', err);
    res.status(400).json(err_data);    
  }
}

exports.get_version_outline = async function(args, res, next, headers) {
  /**
   * Get outline view of the version of the procedure
   *
   * procedure_id String unique id of procedure
   * version Integer version of procedure
   * tag_ids String ids of tags selected (comma separated)
   * returns ProcedureStructureReference
   **/
  const key = node_funcs.get_auth_key(headers);
  let procedure_id = args['procedure_id']['value'] == undefined ? null : args['procedure_id']['value'];
  let version = args['version']['value'] == undefined ? null : args['version']['value'];
  let tag_ids = args['tag_ids']['value'] == undefined ? null : args['tag_ids']['value'];

  try {
    let data = await node_funcs.getProcedureOutline(procedure_id, version, tag_ids, key);
    res.status(200).json(data);
  } catch(err) {
    let err_res = node_funcs.push_error('Error when getting version outline', err);
    res.status(400).json(err_res);
  }
}

exports.get_version_time_references = async function(args, res, next, headers) {
  /**
   * Get available time references
   *
   * procedure_id String unique id of procedure
   * version Integer version of procedure
   * returns names of time references
   **/
  
  let elem_type = 'STEP';
  let step_type = 'TIME_REFERENCE';
  let offset = 0;
  let limit = 10000;
  
  const key = node_funcs.get_auth_key(headers);
  let procedure_id = args['procedure_id']['value'] == undefined ? null : args['procedure_id']['value'];
  let version = args['version']['value'] == undefined ? null : args['version']['value'];

  try {
    const {elems, total_count} = await 
      node_funcs.getVersionElements(procedure_id, version, elem_type, step_type, offset, limit, null, null, 
        null, null, key);

    const time_refs = [...node_funcs.time_references];

    for (const elem of elems) {
      if (elem.authoring_user_input && elem.authoring_user_input.name) {
        if (!time_refs.includes(elem.authoring_user_input.name)) {
          time_refs.push(elem.authoring_user_input.name);
        }
      }
    }

    res.status(200).json(time_refs);
  } catch(err) {
    let err_res = node_funcs.push_error('Error when getting version time references', err);
    res.status(400).json(err_res);
  }
}

exports.get_version_data_paths = async function(args, res, next, headers) {
  /**
   * Get available data paths
   *
   * procedure_id String unique id of procedure
   * version Integer version of procedure
   * returns names of data paths
   **/
  
  let elem_type = 'STEP';
  let step_type = 'GDS_MANUAL';
  let offset = 0;
  let limit = 10000;
  
  const key = node_funcs.get_auth_key(headers);
  let procedure_id = args['procedure_id']['value'] == undefined ? null : args['procedure_id']['value'];
  let version = args['version']['value'] == undefined ? null : args['version']['value'];

  try {
    const {elems, total_count} = await 
      node_funcs.getVersionElements(procedure_id, version, elem_type, step_type, offset, limit, null, null, 
        null, null, key);

    const data_paths = [];

    for (const elem of elems) {
      if (elem.authoring_user_input && elem.authoring_user_input.entries) {
        for (const entry of elem.authoring_user_input.entries) {
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
    let err_res = node_funcs.push_error('Error when getting version data paths', err);
    res.status(400).json(err_res);
  }
}

exports.export_procedure_version = async function(args, res, next, headers) {
  /**
   * Export the version of the procedure as a gzip file
   *
   * procedure_id String unique id of procedure
   * version Integer version of procedure
   * returns file (tar.gzip)
   **/

  const key = node_funcs.get_auth_key(headers);

  let procedure_id = args['procedure_id']['value'] == undefined ? null : args['procedure_id']['value'];
  let version = args['version']['value'] == undefined ? null : args['version']['value']

  try {
    let file_path = await node_funcs.exportProcedureVersion(procedure_id, version, key);

    res.status(200).download(file_path, '', function(err) {
      if (err) {
        log.error(err);
      }
      // remove the temporary directory and its contents
      fse.removeSync(path.dirname(file_path));
    });
  } catch(err) {
    let err_res = node_funcs.push_error('Error when exporting a procedure version', err);
    res.status(400).json(err_res);
  }
}

exports.search_procedure_version = async function(args, res, next, headers) {
  /**
   * Search text in procedure version
   *
   * procedure_id String unique id of procedure
   * version Integer version of procedure
   * search_input ProcedureSearchInput 
   * returns SearchResult
   **/

  const key = node_funcs.get_auth_key(headers);

  let procedure_id = args['procedure_id']['value'] == undefined ? null : args['procedure_id']['value'];
  let version = args['version']['value'] == undefined ? null : args['version']['value'];
  let search_input = args['search_input']['value'] == undefined ? null : args['search_input']['value']
  
  try {
    let data = await node_funcs.searchProcedureVersion(procedure_id, version, search_input, key);
    res.status(200).json(data);
  } catch(err) {
    let err_res = node_funcs.push_error('Error when searching a procedure version', err);
    res.status(400).json(err_res);
  }
}
