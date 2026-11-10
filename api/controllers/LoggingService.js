'use strict';


let nodeFunctions = require('../node_funcs');
let log = nodeFunctions.log;

exports.get_logging = function(args, res, next) {
  /**
   *
   * returns LoggingInfo
   **/

  let logging_info = nodeFunctions.getLogging();
  res.status(200).json(logging_info);
}

exports.update_logging = function(args, res, next) {
  /**
   * Update logging status
   *
   * logging_info LoggingInfo Logging info
   * no response value expected for this operation
   **/

  let logging_info = args['logging_info'].value;

  try {
    nodeFunctions.updateLogging(logging_info);
    res.status(204).end();
  } catch(e) {
    res.status(400).json({'message': e.toString()});
  }
}
