'use strict';
var node_funcs = require('../node_funcs');
var util = require('util');

exports.create_venue_group = async function(args, res, next, headers) {
  /**
   * Create a venue group
   *
   * venue_group VenueGroupInput Definition of venue group
   * returns VenueGroup
   **/
  const key = node_funcs.get_auth_key(headers);
  const venue_group_input = args['venue_group']['value'];

  try {
    const data = await node_funcs.createVenueGroup(venue_group_input, key);
    res.status(200).json(data);
  } catch(err) {
    const err_data = node_funcs.push_error('Error when creating a venue', err);
    res.status(400).json(err_data);
  }
}

exports.get_venue_group = async function(args, res, next, headers) {
  /**
   * Get venue group information
   *
   * venue_group_id String resource id of venue group
   * returns VenueGroup
   **/
  const key = node_funcs.get_auth_key(headers);
  const venue_group_id = args['venue_group_id']['value'];

  try {
    const data = await node_funcs.getVenueGroup(venue_group_id, key);
    res.status(200).json(data);
  } catch(err) {
    const err_data = node_funcs.push_error('Error when getting a venue group', err);
    const status_code = err_data.http_code_at_source ? err_data.http_code_at_source : 400;
    res.status(status_code).json(err_data);
  }
}

exports.get_venue_groups = async function(args, res, next, headers) {
  /**
   * Get list of venue groups. List is sorted by name by default.
   *
   * offset Integer Start index for pagination. zero based. (optional)
   * limit Integer Max number of elements to return. (optional)
   * sort String Sort in natural order * `ASC` - Ascending * `DESC` - Descending  (optional)
   * status String Filter on venue status * `ACTIVE` * `INACTIVE` (optional)
   * venue_group_name name of venue group (optional)
   * description String Query for words in description (optional)
   * returns List
   **/
  const key = node_funcs.get_auth_key(headers);

  const params = {};

  if (args['description'] != undefined) {
    params['description'] = args['description']['value'];
  }

  if (args['status'] != undefined) {
    params['status'] = args['status']['value'];
  }

  if (args['offset'] != undefined) {
    params['offset'] = args['offset']['value'];
  }

  if (args['limit'] != undefined) {
    params['limit'] = args['limit']['value'];
  }

  if (args['sort'] != undefined) {
    params['sort'] = args['sort']['value'];
  }

  if (args['venue_group_name'] != undefined) {
    params['venue_group_name'] = args['venue_group_name']['value'];
  } 
  
  try {
    const {venue_groups, total_count} = await node_funcs.getVenueGroups(params, key);
    res.set('x-total-count', total_count);
    res.status(200).json(venue_groups);
  } catch(err) {
    let err_res = node_funcs.push_error('Error when getting venue groups', err);
    let status_code = err_res.http_code_at_source ? err_res.http_code_at_source : 400;
    res.status(status_code).json(err_res);
  }
}

exports.update_venue_group = async function(args, res, next, headers) {
  /**
   * Update a venue group
   *
   * venue_group_id String resource id of venue group
   * venue_group VenueGroupInput Definition of venue group
   * no response value expected for this operation
   **/

  const key = node_funcs.get_auth_key(headers);
  const venue_group_id = args['venue_group_id']['value'];
  const venue_group = args['venue_group']['value'];

  try {
    await node_funcs.updateVenueGroup(venue_group_id, venue_group, key);
    res.status(204).end();
  } catch(err) {
    const err_data = node_funcs.push_error('Error when updating venue group', err);
    const status_code = err_data.http_code_at_source ? err_data.http_code_at_source : 400;
    res.status(status_code).json(err_data);
  }  
}
