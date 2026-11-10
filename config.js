'use strict';

module.exports.EXECUTION_MONITOR_URL = process.env.EXECUTION_MONITOR_URL || 
  'http://localhost:3000/api/v2/execution_event_publish';

module.exports.api_base_path = 'api/v5';
module.exports.server_port = 8080;

module.exports.FILE_SERVER_API_HOST = process.env.FILE_SERVER_API_HOST || 'http://localhost:9000';  
module.exports.FILE_SERVER_ACCESS_KEY = process.env.FILE_SERVER_ACCESS_KEY || '';
module.exports.FILE_SERVER_SECRET_KEY = process.env.FILE_SERVER_SECRET_KEY || '';
module.exports.MEDIA_BUCKET = process.env.MEDIA_BUCKET || 'ingenium-media-test';

module.exports.REDIS_HOST = process.env.REDIS_HOST || 'exec_redis';
module.exports.REDIS_PORT = process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : 6379;

// By default give a timeout that is slightl shorter than the proxy timeout of 300 sec
module.exports.server_timeout_sec = process.env.SERVER_TIMEOUT_SEC || '290';   
module.exports.public_pem = process.env.PUBLIC_PEM || '';
module.exports.ems_secret = process.env.EMS_SECRET || '';

// ex
module.exports.EXECUTION_SWITCH_WAIT_SEC = 10;
