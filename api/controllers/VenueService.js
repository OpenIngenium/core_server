'use strict';
var node_funcs = require('../node_funcs');
var util = require('util');

exports.create_venue = async function(args, res, next, headers) {
  /**
   * Register a venue
   *
   * venue VenueInput Definition of venue
   * returns Venue
   **/
  const key = node_funcs.get_auth_key(headers);
  const venue_input = args['venue']['value'];

  try {
    const data = await node_funcs.createVenue(venue_input, key);
    res.status(200).json(data);
  } catch(err) {
    const err_data = node_funcs.push_error('Error when creating a venue', err);
    res.status(400).json(err_data);
  }
}

exports.delete_venue = async function(args, res, next, headers) {
  /**
   * Delete a venue (admin only)
   *
   * venue_id String resource id of venue
   * no response value expected for this operation
   **/
  const key = node_funcs.get_auth_key(headers);
  const venue_id = args['venue_id']['value'];

  try {
    await node_funcs.deleteVenue(venue_id, key);
    res.status(204).end();
  } catch(err) {
    let err_res = node_funcs.push_error('Error when deleting a venue', err);
    res.status(400).json(err_res);
  }
}

exports.get_venue = async function(args, res, next, headers) {
  /**
   * Get venue information
   *
   * venue_id String resource id of venue
   * returns Venue
   **/
  const key = node_funcs.get_auth_key(headers);
  const venue_id = args['venue_id']['value'];

  try {
    const data = await node_funcs.getVenue(venue_id, key);
    res.status(200).json(data);
  } catch(err) {
    const err_data = node_funcs.push_error('Error when getting a venue', err);
    const status_code = err_data.http_code_at_source ? err_data.http_code_at_source : 400;
    res.status(status_code).json(err_data);
  }
}

exports.get_venue_status = async function(args, res, next, headers) {
  /**
   * Get venue status information
   *
   * venue_id String resource id of venue
   * returns VenueStatus
   **/
  const key = node_funcs.get_auth_key(headers);
  const venue_id = args['venue_id']['value'];

  try {
    const data = await node_funcs.getVenueStatus(venue_id, key);
    res.status(200).json(data);
  } catch(err) {
    const err_data = node_funcs.push_error('Error when getting venue status', err);
    const status_code = err_data.http_code_at_source ? err_data.http_code_at_source : 400;
    res.status(status_code).json(err_data);
  }  
}

exports.get_venues = async function(args, res, next, headers) {
  /**
   * Get list of venues. List is sorted by name by default.
   *
   * offset Integer Start index for pagination. zero based. (optional)
   * limit Integer Max number of elements to return. (optional)
   * sort String Sort in natural order * `ASC` - Ascending * `DSC` - Descending  (optional)
   * status String Filter on venue status * `AVAILABLE` * `IN_USE` * `DOWN` * `UNKNOWN` * `RETIRED` (optional)
   * exclude_status String Exclude filter on venue status * `AVAILABLE` * `IN_USE` * `DOWN` * `UNKNOWN` * `RETIRED` (optional)
   * description String Query for words in description (optional)
   * venue_type String filter based on venue type (optional)
   * venue_name String filter based on venue name (optional)
   * venue_group_name String filter based on venue group name (optional)
   * venue_group_status String filter based on venue group status (optional)
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
  
  if (args['exclude_status'] != undefined) {
    params['exclude_status'] = args['exclude_status']['value'];
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

  if (args['venue_type'] != undefined) {
    params['venue_type'] = args['venue_type']['value'];
  } 

  if (args['venue_name'] != undefined) {
    params['venue_name'] = args['venue_name']['value'];
  }

  if (args['venue_group_name'] != undefined) {
    params['venue_group_name'] = args['venue_group_name']['value'];
  }

  if (args['venue_group_status'] != undefined) {
    params['venue_group_status'] = args['venue_group_status']['value'];
  }

  try {
    const {venues, total_count} = await node_funcs.getVenues(params, key);
    res.set('x-total-count', total_count);
    res.status(200).json(venues);
  } catch(err) {
    let err_res = node_funcs.push_error('Error when getting venues', err);
    let status_code = err_res.http_code_at_source ? err_res.http_code_at_source : 400;
    res.status(status_code).json(err_res);
  }
}

exports.update_venue = async function(args, res, next, headers) {
  /**
   * Update a venue
   *
   * venue_id String resource id of venue
   * venue Venue Definition of venue
   * no response value expected for this operation
   **/

  const key = node_funcs.get_auth_key(headers);
  const venue_id = args['venue_id']['value'];
  const venue = args['venue']['value'];

  try {
    await node_funcs.updateVenue(venue_id, venue, key);
    res.status(204).end();
  } catch(err) {
    const err_data = node_funcs.push_error('Error when updating venue', err);
    const status_code = err_data.http_code_at_source ? err_data.http_code_at_source : 400;
    res.status(status_code).json(err_data);
  }  
}

exports.set_venue_status = async function(args, res, next, headers) {
  /**
   * Update the status of venue
   *
   * venue_id String resource id of venue
   * venue_status VenueStatus Status of venue
   * no response value expected for this operation
   **/
  const key = node_funcs.get_auth_key(headers);
  const venue_id = args['venue_id']['value'];
  const venue_status = args['venue_status']['value'];

  // need to check current venue status here instead of node_funcs.updateVenueStatus,
  // which is used by core server internally (for example, when closing an execution).
  try {
    const venue_status = await node_funcs.getVenueStatus(venue_id, key);
    if (venue_status.status === 'IN_USE') {
      res.status(400).json({
        'message': 'Cannot change status of venue that is in use',
        'details': []
      });
      return;
    }
  } catch (err) {
    const err_data = node_funcs.push_error('Failed to get venue status', err);
    const status_code = err_data.http_code_at_source ? err_data.http_code_at_source : 400;
    res.status(status_code).json(err_data);
    return;
  }

  try {
    await node_funcs.updateVenueStatus(venue_id, venue_status, key);
    res.status(204).end();
  } catch (err) {
    const err_data = node_funcs.push_error('Error when updating venue status', err);
    const status_code = err_data.http_code_at_source ? err_data.http_code_at_source : 400;
    res.status(status_code).json(err_data);
  }
}

