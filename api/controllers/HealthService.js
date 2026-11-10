'use strict';
exports.health_get = function(args, res, next) {
  /**
   *
   * returns HealthStatus
   **/
  /**
   *
   * returns HealthStatus
   **/
  let response =
  {
    'status' : 'OK',
    'message': ''
  };

  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(response));
}
