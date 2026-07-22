'use strict';

/**
 * format function for string.
 * Example:  'element id is {0}'.format(elem_id)
 */
String.prototype.format = function () {
  var args = arguments;
  return this.replace(/\{(\d+)\}/g, function (m, n) { return args[n]; });
};

var AWS = require('aws-sdk');
var fs = require('fs');
var tmp = require('tmp');
var fse = require("fs-extra");
var targz = require("targz");
var recursive_readdir = require("recursive-readdir");
var archiveLocation = process.env.ARCHIVE ? process.env.ARCHIVE : 'http://localhost:8010/api/v5';
var executionLocation = process.env.EXECUTION ? process.env.EXECUTION : 'http://localhost:9999/api/v4';
var dictionaryLocation = process.env.DICTIONARY ? process.env.DICTIONARY : 'http://localhost:5000/api/v4';
var uuid = require('node-uuid');
const axios = require('axios');
var jwt = require('jsonwebtoken');
var util = require('util');
var path = require('path');
var deepcopy = require('deepcopy');
var config = require('../config');
var async_redis = require('async-redis');
const tokenize = require('html-tokenize');
const through = require('through2');
const { Readable } = require("stream");
const _ = require('lodash');
const {step_dict} = require('./step_definitions');
const {authoring_field_map, execution_field_map, authoring_searchable_field_map, execution_searchable_field_map,
  searchable_result_field_map} 
  = require('./search_definitions');

var public_pem = config.public_pem;
var Q = require("q");
var extend = require('extend');
var util = require('util');
var winston = require('winston');
const MESSAGE = Symbol.for('message');

var file_path_search_pattern = new RegExp(`src="([\\s\\S]*?)/file_server/${config.MEDIA_BUCKET}/([\\s\\S]+?)"`, 'g');
var file_path_replace_pattern = `src="/file_server/${config.MEDIA_BUCKET}/$2"`;
var file_path_match_pattern = new RegExp(`src="/file_server/${config.MEDIA_BUCKET}/([\\s\\S]+?)"`, 'g');
var file_path_capture_pattern = new RegExp('src="/file_server/([\\s\\S]+?)/([\\s\\S]+?)"', 'g');

var regexpFieldPath = new RegExp(`\\[\\d*\\]`, 'g');
const procedure_version_export_json = 'procedure_version_export.json';
const procedure_export_json = 'procedure_export.json';
const execution_export_json = 'execution_export.json';

const custom_log_levels = {
  levels: {
    critical: 0, error: 1, warning: 2, info: 3, debug: 4, trace: 5
  }
};

const EXEC_STATUSES = ['IDLE', 'RUNNING', 'PAUSED', 'HALTED', 'SUSPENDED', 'CLOSED', 'IN_REVIEW', 'FINALIZED'];

const NEXT_ELEM_EVENT = {
  hit_break_point: 'hit_break_point',
  hit_manual_step: 'hit_manual_step'
}

const EXECUTION_SWITCH_WAIT = 'execution-switch-wait';
const EXECUTION_SWITCH_WAIT_FLAG = 'execution-switch-wait-flag';

const json_formatter = (log_entry) => {
  const json_data = {timestamp: new Date()};
  json_data['level'] = log_entry['level'].toUpperCase();
  json_data['message'] = log_entry['message'];

  // meta is the object passed as the 2nd argument to the logging function.
  // If multiple objects are passed, meta will be an array.
  let log_entry_meta = log_entry['meta'];

  if (log_entry_meta) {
    // If the passed object is string, array, or object with no properties, 
    // add it as details.
    if (typeof log_entry_meta === 'string' || log_entry_meta instanceof String) {
      json_data['details'] = [log_entry_meta];
    } else if (Array.isArray(log_entry_meta)) {
      json_data['details'] = log_entry_meta.map(function(item) {
        let item_inspected = util.inspect(item);
        return item_inspected
      });
    } else if (Object.keys(log_entry_meta).length == 0) {
      json_data['details'] = util.inspect(log_entry_meta);
    } else {
      // merge the passed object into json_data
      Object.assign(json_data, log_entry_meta);
    }
  }
  // log_entry[MESSAGE] is not in JSON format. Overwrite in JSON format.
  log_entry[MESSAGE] = JSON.stringify(json_data);  
  
  return log_entry;
}

let transports = [new winston.transports.Console()];

if (process.env.LOG_FILE_PATH != undefined) {
  transports.push(new winston.transports.File({
    filename: process.env.LOG_FILE_PATH, 
    handleExceptions: true,
    maxsize: 5242880,
    maxFiles: 2,
    colorize: false
  }))
}

const log = winston.createLogger({
  levels: custom_log_levels.levels,
  level: process.env.LOG_LEVEL != undefined ? process.env.LOG_LEVEL.toLowerCase() : 'debug',
  format: winston.format.combine(winston.format.splat(), winston.format.simple(), winston.format(json_formatter)()),
  transports: transports,
});



var s3_client = new AWS.S3({
  endpoint: config.FILE_SERVER_API_HOST,
  accessKeyId: config.FILE_SERVER_ACCESS_KEY,
  secretAccessKey: config.FILE_SERVER_SECRET_KEY,
  s3ForcePathStyle: true, // needed with minio?
  signatureVersion: 'v4'
});

const redis = async_redis.createClient({host: config.REDIS_HOST, port: config.REDIS_PORT});
// Note that try/catch does not work for redis error handling
// https://github.com/NodeRedis/node-redis/issues/138
redis.on('error', (error) => {
  log.error(`Failed to connect to execution redis: ${error}`);
});
redis.on('connect', () => {
  log.info('Connected to execution redis');
});



/**
 * A utility function to sleep
 * @param {Number} milisecs - time to sleep in milisec
 * @return {Promise}
*/
var wait_milisecs = function(milisecs) {
  return new Promise(function(resolve, reject) {
    setTimeout(function() {
      resolve(milisecs);
    }, milisecs)
  })
}

/**
 * Check existence of ingenium media bucket. It will try to connect to file_server a few times
 * if connection fails so as to give some time for the file server to restart.
 *
 * @param {Number} count - how many times to try to connect to file_server
 * @param {Number} milisecs - time to sleep in milisec for each trial
 * @return {Promise} A promise that will be fulfilled with true (success) or false (failure)
*/
function check_bucket(count, milisecs) {
  log.info(`Trying to get ingenium bucket. Remaining count: ${count} wait_milisecs: ${milisecs}`);

  if (count < 0) {
    return Promise.reject('Failed to connect file_server: ' + config.FILE_SERVER_API_HOST);
  }

  return new Promise(function(resolve, reject) {
    let params = {};
    s3_client.listBuckets(params, function(err, data) {
      if (err) {
        log.error(err);
        reject(err);
      }
      else {
        let media_bucket = null;
        let buckets = data.Buckets;
        for (let i=0; i < buckets.length; i++) {
          let bucket = buckets[i];
          log.info(`bucket.Name: ${bucket.Name} MEDIA_BUCKET: ${config.MEDIA_BUCKET}`);
          if (bucket.Name == config.MEDIA_BUCKET) {
            media_bucket = bucket;
            break;
          }
        }
        resolve(media_bucket);
      }       
    }) 
  })
  .then((media_bucket) => {
    log.info(`media_bucket: ${JSON.stringify(media_bucket)}`);
    return Promise.resolve(media_bucket);
    }, (err) => {
      log.error(`err: ${util.inspect(err)}`);
      return wait_milisecs(milisecs)
      .then(() => {
          return check_bucket(count-1, milisecs);
        }, (err) => {
          log.error(`err: ${err}`);
          return Promise.reject(err);
      })
  })
}

/**
 * Initialize file_server based on Minio.
 *
 * @return {Promise}
*/

var init_file_server = function() {
  return check_bucket(10, 4000)
  .then((media_bucket) => {
    return new Promise(function(resolve, reject) {
      if (media_bucket == null) {
        log.info('Create media_bucket');
        let params = {
          Bucket: config.MEDIA_BUCKET       
        };
        s3_client.createBucket(params, function(err, data) {
          if (err) {
            log.error(err);
            reject(err);
          }
          else {
            log.debug(`bucket created: ${data}`);
            resolve(data);
          }       
        })    
      } else {
        log.info('bucket already exists.');
        resolve(null);
      }
    })
  })
  .then((bucket_data) => {
    let bucket_policy = {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Sid": "Public",
          "Effect": "Allow",
          "Principal": {"AWS": "*"},
          "Action": [
            "s3:GetObject",
            "s3:GetBucketLocation"
          ],
          "Resource": [
            `arn:aws:s3:::${config.MEDIA_BUCKET}/*`, `arn:aws:s3:::${config.MEDIA_BUCKET}`
          ]
        }
      ]
    };

    return new Promise(function(resolve, reject) {
      if (bucket_data != null) {
        log.debug('Configure media_bucket');
        let params = {
          Bucket: config.MEDIA_BUCKET,
          Policy: JSON.stringify(bucket_policy)            
        };

        s3_client.putBucketPolicy(params, function(err, data) {
          if (err) {
            log.error(err);
            reject(err);
          }
          else {
            log.info(`Bucket policy was updated: ${data}`);
            resolve(data);
          }       
        })    
      } else {
        resolve();
      }
    })
  })
}

var createArchiveElement = async function(execution_id, procedure_id, elem_type, step_type, data, insert_after_id, level, key) {
  let url = '';
  if (execution_id) {
    url = `${archiveLocation}/executions/${execution_id}`;
  } else if (procedure_id) {
    url = `${archiveLocation}/procedures/${procedure_id}`;
  } else {
    return Promise.reject('execution_id or procedure_id was not specified');
  }

  const params = {};
  if (insert_after_id) {
    params['insert_after_id'] = insert_after_id;
  }

  if (level) {
    params['level'] = level;
  }

  let elem_posted = data ? data : null;  
  let elem_def = null;

  switch (elem_type) {
    case "STEP":
      if (!step_type && elem_posted && elem_posted.hasOwnProperty('step_type')) {
         step_type = elem_posted['step_type'];
      }

      if(!step_dict.hasOwnProperty(step_type)){
        return Promise.reject(`Step type was not recognized. step_type: ${step_type}`);
      } else {
        // Get the step template
        elem_def = deepcopy(step_dict[step_type]);

        elem_def['authoring_user_input'] = deepcopy(elem_def['specification']['authoring_user_input']);
        elem_def['execution_user_input'] = deepcopy(elem_def['specification']['execution_user_input']);
        elem_def['execution']['results'] = deepcopy(elem_def['specification']['results']);        
      }

      if (elem_posted != null) {
        elem_def = extend(true, {}, elem_def, elem_posted);
      }
      
      url = `${url}/steps`;
      try {
        elem_def['elem_type'] = elem_type;
        let response = await axios.post(url, elem_def, {params: params, headers: {'Authorization': key}});
        return response.data;
      } catch (err) {
        return Promise.reject(transform_axios_error(err));
      }
      break;

    case "PROCEDURE_SECTION":
      elem_def = deepcopy(step_dict[elem_type]);

      elem_def['authoring_user_input'] = deepcopy(elem_def['specification']['authoring_user_input']);
      elem_def['execution_user_input'] = deepcopy(elem_def['specification']['execution_user_input']);    

      if (elem_posted != null) {
        elem_def = extend(true, {}, elem_def, elem_posted);
      }

      url = `${url}/procedure_sections`;
      try {
        elem_def['elem_type'] = elem_type;        
        let response = await axios.post(url, elem_def, {params: params, headers: {'Authorization': key}});
        return response.data;
      } catch (err) {
        return Promise.reject(transform_axios_error(err));
      }     
	  	break;      
	case "SECTION":
    elem_def = elem_posted ? elem_posted : {};
    url = `${url}/sections`;
    try {
      elem_def['elem_type'] = elem_type;      
      let response = await axios.post(url, elem_def, {params: params, headers: {'Authorization': key}});
      return response.data;
    } catch (err) {
      return Promise.reject(transform_axios_error(err));
    }  
    break;
	case "PARAGRAPH":
    elem_def = elem_posted ? elem_posted : {};
    url = `${url}/paragraphs`;
    try {
      elem_def['elem_type'] = elem_type;      
      let response = await axios.post(url, elem_def, {params: params, headers: {'Authorization': key}});
      return response.data;
    } catch (err) {
      return Promise.reject(transform_axios_error(err));
    }
    break;
	}
}


var procedureWriteFile = async function(filename, fileBuffer, procedure_id, version, elem_id, key){
  log.trace(`procedureWriteFile filename: ${filename} procedure_id: ${procedure_id} version: ${version} elem_id: ${elem_id}`);

  let fileUrl = await upload_file(config.MEDIA_BUCKET, filename, fileBuffer['buffer']);

  let url = '';
  if (elem_id) {
    url = `${archiveLocation}/procedures/${procedure_id}/elements/${elem_id}/files`;
  } else if (procedure_id) {
    url = `${archiveLocation}/procedures/${procedure_id}/files`;
  } else {
    return Promise.reject({'message': 'procedure_id or elem_id was not provided'});
  }
  
  try {
    var fileMetadata = {'file_name' : filename, 'url': fileUrl};
    let response = await axios.post(url, fileMetadata, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}



var writeFile = async function(filename, fileBuffer, execution_id, elem_id, key) {
  log.trace(`writeFile filename: ${filename} execution_id: ${execution_id} elem_id: ${elem_id}`);

  let fileUrl = await upload_file(config.MEDIA_BUCKET, filename, fileBuffer['buffer']);

  let url = '';
  if(elem_id) {
    url = `${archiveLocation}/executions/${execution_id}/elements/${elem_id}/files`;
  } else if (execution_id) {
    url = `${archiveLocation}/executions/${execution_id}/files`;
  } else {
    return Promise.reject({'message': 'execution_id or elem_id was not provided'});
  }
    
  try {
    var fileMetadata = {'file_name' : filename, 'url': fileUrl};
    let response = await axios.post(url, fileMetadata, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }    
}

var readFile = async function(execution_id, elem_id, file_id, key) {
  try {
    const url = `${archiveLocation}/executions/${execution_id}/elements/${elem_id}/files/${file_id}`;
    let response = await axios.get(url, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var readProcedureElementFile = async function(procedure_id, elem_id, file_id, key) {
  try {
    const url = `${archiveLocation}/procedures/${procedure_id}/elements/${elem_id}/files/${file_id}`;
    let response = await axios.get(url, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var getFiles = async function(execution_id, elem_id, offset, limit, key) {
  const params = {};
  if(offset)
    params['offset'] = offset;
  if(limit)
    params['limit'] = limit; 

  try {
    const url = `${archiveLocation}/executions/${execution_id}/elements/${elem_id}/files`;
   
    let response = await axios.get(url, {params: params, headers: {'Authorization': key}});
    let total_count = response['headers']['x-total-count'] ? response['headers']['x-total-count'] : 0;
    return {'files': response.data, 'total_count': total_count};
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}


var getProcedureElementFiles = async function(procedure_id, elem_id, offset, limit, key) {
  const params = {};
  if(offset)
    params['offset'] = offset;
  if(limit)
    params['limit'] = limit;

  try {
    const url = `${archiveLocation}/procedures/${procedure_id}/elements/${elem_id}/files`;
    
    let response = await axios.get(url, {params: params, headers: {'Authorization': key}});
    let total_count = response['headers']['x-total-count'] ? response['headers']['x-total-count'] : 0;
    return {'files': response.data, 'total_count': total_count};
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var deleteFile = async function(execution_id, elem_id, file_id, key) {
  try {
    const url = `${archiveLocation}/executions/${execution_id}/elements/${elem_id}/files/${file_id}`;
    let response = await axios.delete(url, {headers: {'Authorization': key}});
    return;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var deleteProcedureElementFile = async function(procedure_id, elem_id, file_id, key) {
  try {
    const url = `${archiveLocation}/procedures/${procedure_id}/elements/${elem_id}/files/${file_id}`;
    let response = await axios.delete(url, {headers: {'Authorization': key}});
    return;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var readProcedureFile = async function(procedure_id, file_id, key) {
  try {
    const url = `${archiveLocation}/procedures/${procedure_id}/files/${file_id}`;
    let response = await axios.get(url, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var getProcedureFiles = async function(procedure_id, offset, limit, key) {
  const params = {};
  if(offset)
    params['offset'] = offset;
  if(limit)
    params['limit'] = limit;

  try {
    const url = `${archiveLocation}/procedures/${procedure_id}/files`;
    
    let response = await axios.get(url, {params: params, headers: {'Authorization': key}});
    let total_count = response['headers']['x-total-count'] ? response['headers']['x-total-count'] : 0;
    return {'files': response.data, 'total_count': total_count};
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var deleteProcedureFile = async function(procedure_id, file_id, key) {
  try {
    const url = `${archiveLocation}/procedures/${procedure_id}/files/${file_id}`;
    let response = await axios.delete(url, {headers: {'Authorization': key}});
    return;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var readFileExec = async function(file_id, execution_id, key) {
  try {
    const url = `${archiveLocation}/executions/${execution_id}/files/${file_id}`;
    let response = await axios.get(url, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var getAllFilesExec = async function(execution_id, key, offset, limit) {
  const params = {};
  if(offset)
    params['offset'] = offset;
  if(limit)
    params['limit'] = limit;

  try {
    const url = `${archiveLocation}/executions/${execution_id}/files`;
    
    let response = await axios.get(url, {params: params, headers: {'Authorization': key}});
    let total_count = response['headers']['x-total-count'] ? response['headers']['x-total-count'] : 0;
    return {'files': response.data, 'total_count': total_count};
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var deleteFileExec = async function(execution_id, file_id, key) {
  try {
    const url = `${archiveLocation}/executions/${execution_id}/files/${file_id}`;
    let response = await axios.delete(url, {headers: {'Authorization': key}});
    return;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var writeFileComment = async function(filename, fileBuffer, execution_id, elem_id, conversation_id, comment_id, key) {
  log.trace(`writeFile filename: ${filename} execution_id: ${execution_id} elem_id: ${elem_id} conversation_id: ${conversation_id} comment_id: ${comment_id}`);

  let fileUrl = await upload_file(config.MEDIA_BUCKET, filename, fileBuffer['buffer']);

  let url = `${archiveLocation}/executions/${execution_id}/elements/${elem_id}/conversations/${conversation_id}/comments/${comment_id}/files`;
    
  try {
    var fileMetadata = {'file_name' : filename, 'url': fileUrl};
    let response = await axios.post(url, fileMetadata, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }    
}

var getFilesComment = async function(execution_id, elem_id, conversation_id, comment_id, offset, limit, key) {
  const params = {};
  if(offset)
    params['offset'] = offset;
  if(limit)
    params['limit'] = limit;

  try {
    const url = `${archiveLocation}/executions/${execution_id}/elements/${elem_id}/conversations/${conversation_id}/comments/${comment_id}/files`;
    
    let response = await axios.get(url, {params: params, headers: {'Authorization': key}});
    let total_count = response['headers']['x-total-count'] ? response['headers']['x-total-count'] : 0;
    return {'files': response.data, 'total_count': total_count};
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var readFileComment = async function(execution_id, elem_id, conversation_id, comment_id, file_id, key) {
  try {
    const url = `${archiveLocation}/executions/${execution_id}/elements/${elem_id}/conversations/${conversation_id}/comments/${comment_id}/files/${file_id}`;
    let response = await axios.get(url, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var deleteFileComment = async function(execution_id, elem_id, conversation_id, comment_id, file_id, key) {
  try {
    const url = `${archiveLocation}/executions/${execution_id}/elements/${elem_id}/conversations/${conversation_id}/comments/${comment_id}/files/${file_id}`;
    let response = await axios.delete(url, {headers: {'Authorization': key}});
    return;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var writeFileProcedureComment = async function(filename, fileBuffer, procedure_id, version, elem_id, conversation_id, comment_id, key) {
  log.trace(`writeFile filename: ${filename} procedure_id: ${procedure_id} version: ${version} elem_id: ${elem_id} conversation_id: ${conversation_id} comment_id: ${comment_id}`);

  let fileUrl = await upload_file(config.MEDIA_BUCKET, filename, fileBuffer['buffer']);

  let url = `${archiveLocation}/procedures/${procedure_id}/versions/${version}/elements/${elem_id}/conversations/${conversation_id}/comments/${comment_id}/files`;
    
  try {
    var fileMetadata = {'file_name' : filename, 'url': fileUrl};
    let response = await axios.post(url, fileMetadata, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }    
}

var getFilesProcedureComment = async function(procedure_id, version, elem_id, conversation_id, comment_id, offset, limit, key) {
  const params = {};
  if(offset)
    params['offset'] = offset;
  if(limit)
    params['limit'] = limit;

  try {
    const url = `${archiveLocation}/procedures/${procedure_id}/versions/${version}/elements/${elem_id}/conversations/${conversation_id}/comments/${comment_id}/files`;
    
    let response = await axios.get(url, {params: params, headers: {'Authorization': key}});
    let total_count = response['headers']['x-total-count'] ? response['headers']['x-total-count'] : 0;
    return {'files': response.data, 'total_count': total_count};
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var readFileProcedureComment = async function(procedure_id, version, elem_id, conversation_id, comment_id, file_id, key) {
  try {
    const url = `${archiveLocation}/procedures/${procedure_id}/versions/${version}/elements/${elem_id}/conversations/${conversation_id}/comments/${comment_id}/files/${file_id}`;
    let response = await axios.get(url, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var deleteFileProcedureComment = async function(procedure_id, version, elem_id, conversation_id, comment_id, file_id, key) {
  try {
    const url = `${archiveLocation}/procedures/${procedure_id}/versions/${version}/elements/${elem_id}/conversations/${conversation_id}/comments/${comment_id}/files/${file_id}`;
    let response = await axios.delete(url, {headers: {'Authorization': key}});
    return;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var runStep = async function(step, execution_id, elem_id, run_mode, key) {
  if (step) {
    elem_id = step.elem_id;
  }

  try {
    let url = `${executionLocation}/executions/${execution_id}/run`;
    const params = {'run_mode': run_mode, 'elem_id': elem_id};
    let response = await axios.post(url, step, {params: params, headers: {'Authorization': key}});

    log.debug(`runStep status: ${response.status}`);

    if (response.status == 200) {
      return response.data;
    }
    else if (response.status == 202) {
      return {};
    }
    else {
      let msg = `unexpected HTTP response from Execution Service: ${response.status}`
      log.error(msg);
      return Promise.reject(msg);
    }
  } catch (err) {
    // return Promise.reject(transform_axios_error(err));
    log.error(`runStep error: ${JSON.stringify(err)}`);
    if (err['error']) {
      // execution servce returned an error object in "error" field    
      return Promise.reject(err['error']);
    } else {
      return Promise.reject(transform_axios_error(err));
    }      
  }
}

var update_execution_rest = async function(execution_id, execution, key) {
  try {
    const url = `http://localhost:${config.server_port}/${config.api_base_path}/executions/${execution_id}`;
    const response = await axios.patch(url, execution, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }       
}

var runExecution = async function(execution_id, current_step_id, run_mode, key) {
  log.debug(`runExecution execution_id: ${execution_id} run_mode: ${run_mode} current_step_id: ${current_step_id}`);

  let execution = await getExecution(execution_id, key);

  if (execution) {
    if (execution.status != 'IDLE') {
      return Promise.reject(`Cannot execute when execution is not idle. status: ${execution.status}`);
    }

    if (current_step_id === '') {
      if (execution.current_step_id) {
        current_step_id = execution.current_step_id;
      }
    }
  } else {
    return Promise.reject(`execution is not found. execution_id: ${execution_id}`);
  }

  try {
    const venue_status = await getVenueStatus(execution.venue_id, key);
    const test_conductor = venue_status ? venue_status['test_conductor'] : '';
    let res = await runExecution_(execution_id, test_conductor, current_step_id, run_mode, key);

    return res;    
  }
  catch (err) {
    log.warning(`runExecution_ failed. err: ${err}`);

    // TODO: is this the best way to handle error?
    await update_execution_rest(execution_id, {'status': 'IDLE'}, key);
    return Promise.reject(err);
  }  
}

var runExecution_ = async function(execution_id, test_conductor, current_step_id, run_mode, key) {
  let token = parse_token(key);
  let decoded = jwt.verify(token, public_pem, { algorithms: ['RS256'] });
  let username = decoded['username'];

  if (username !== test_conductor) {
    return Promise.reject({'message': `User is not the current test conductor. username: ${username} test_conductor: ${test_conductor}`});
  }

  return await runStep(null, execution_id, current_step_id, run_mode, key);

}

var _get_execution_step = async function(execution_id, elem_id, key) {
  try {
    const url = `${archiveLocation}/executions/${execution_id}/steps/${elem_id}`;
    let response = await axios.get(url, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

// TODO: use await
var getVI_Status_Dict = async function(execution_id, key, procedure){
  var deferred = Q.defer();
  var dictionary = {}
  var contTrue = true;
  var unknown = false
  var stepids = []
  var vi_ids = []
  var status_id = ""

  if(procedure){
    var vi_field = "authoring_user_input"
    var {elems, total_count} = await getProcedureElements(execution_id, "STEP", "VERIFICATION_ITEM_STATUS", 0, 10000, "ASC", null, key)
  } else {
    var vi_field = "execution_user_input"
    var {elems, total_count} = await getExecutionElements(execution_id, "STEP", "VERIFICATION_ITEM_STATUS", 0, 10000, "ASC", null, 
      null, null, null, null, key)  
  }

  return Q.all(elems.map(function(item) {
    status_id = item['elem_id']
    if(item.hasOwnProperty(vi_field)){
      if(item[vi_field].hasOwnProperty('steps')) {
        let steps = item[vi_field]['steps']
        stepids = steps.map(function(step) {return step['elem_id']}) 
      }
          
      if(item[vi_field].hasOwnProperty('vis')) {
        let vis = item[vi_field]['vis'] 
        vi_ids = vis.map(function(vi) {return vi['id']})
      }
    }
    return Q.all(stepids.map(function(item) {
      return _get_execution_step(execution_id, item, key)
      .then(function(body) {
        if(!body['executed']){
          unknown = true
        }
        else if(body['execution']['meta_data']['status'] != "PASS"){
          contTrue = false
        }
        return
      });
    }))
    .then(function(){
      if(contTrue)
        var status = 'PASS';
      else if(unknown)
        var status = 'UNKNOWN'
      else
        var status = 'FAIL'
      for(var i = 0; i < vi_ids.length; i++){
        dictionary[vi_ids[i]] = {"vi_status_step_id" : status_id, "status": status, "vi_id": vi_ids[i]}
      }
    })
  }))

  .then(() => {
    deferred.resolve(dictionary)
  })
  return deferred.promise
}

//authoring_user_input
// TODO: use await
var getProcedureVIs = function(procedure_id, filter, key) {
  var deferred = Q.defer();
  var dictionary = {}
  getVI_Status_Dict(procedure_id, key, true)
  .then(async function(dict) {
    dictionary = dict;
    let {elems, total_count} = await getProcedureElements(procedure_id, "STEP", "VERIFICATION_ITEM", 0, 10000, "ASC", null, key);
    return elems;
  })
  .then((veritems) => {
    veritems = veritems['data']
    var resultArr = []
    for(var i = 0; i < veritems.length; i++){
      if(veritems[i].hasOwnProperty('authoring_user_input') && veritems[i]['authoring_user_input'].hasOwnProperty('vis')){
        for(var j = 0; j < veritems[i]['authoring_user_input']['vis'].length; j++){
          if(!dictionary.hasOwnProperty(veritems[i]['authoring_user_input']['vis'][j]['id']))
            resultArr.push({"vi_id" : veritems[i]['authoring_user_input']['vis'][j]['id'], "vi_status_step_id" : "","status" : "UNKNOWN"})
          else
            resultArr.push(dictionary[veritems[i]['authoring_user_input']['vis'][j]['id']])
        }
      }
    }
    if(filter)
      var resultArr = resultArr.filter(entry => entry['status'] == filter);
    deferred.resolve(resultArr)
  })
  return deferred.promise
}

// TODO: use await
var getVIs = async function(execution_id, filter, key) {
  let {elems, total_count} = await getExecutionElements(execution_id, 'STEP', null, 0, 10000, 'ASC', null, 
    null, null, null, null, key);
  let steps = elems;

  let vis = [];

  let vi_steps = [];
  let vi_status_steps = [];

  let elem_map = {};  

  // hashmap from vi_id to vi's
  let vi_map = {};

  steps.forEach(function (step) {
    elem_map[step.elem_id] = step;
    if (step.step_type == 'VERIFICATION_ITEM') {
      vi_steps.push(step);
    } else if (step.step_type == 'VERIFICATION_ITEM_STATUS') {
      vi_status_steps.push(step);
    }
  });

  vi_steps.forEach(function (vi_step) {
    if (vi_step.execution_user_input && vi_step.execution_user_input.vis) {
      vi_step.execution_user_input.vis.forEach(function (vi) {
        vi_map[vi.vi_name] = vi; 
      });
    }
  });

  // hashmap from vi_id to array of status items
  let vi_status_map = {};
  // initialize vi_status_map
  Object.keys(vi_map).forEach(function (vi_name) {
    vi_status_map[vi_name] = [];
  })

  vi_status_steps.forEach(function (vi_status_step) {
    if (vi_status_step.execution && vi_status_step.execution.meta_data && vi_status_step.execution.meta_data.status) {
      let status = vi_status_step.execution.meta_data.status;

      if (vi_status_step.execution && vi_status_step.execution.results && vi_status_step.execution.results.vis) {
        vi_status_step.execution.results.vis.forEach(function(vi) {
          if (vi_status_map.hasOwnProperty(vi.vi_name)) {
            let status_item = {'vi_status_step_id': vi_status_step.elem_id, 'status': status};
            vi_status_map[vi.vi_name].push(status_item);
          }
        });
      }      
    }
  });

  Object.keys(vi_status_map).forEach(function (vi_name) {
    let status_items = vi_status_map[vi_name];
    let vi = vi_map[vi_name];

    if (status_items.length == 0) {
      vis.push({'vi_name': vi_name, 'vi_id': vi.vi_id, vi_status_step_ids: [], 'status': 'UNKNOWN'});
    } else {
      let num_pass = 0;
      let num_fail = 0;
      let vi_status_step_ids = [];
      status_items.forEach(function (status_item) {
        if (status_item.status == 'PASS') {
          num_pass++;
        } else if (status_item.status == 'FAIL') {
          num_fail++;
        }
        vi_status_step_ids.push(status_item.vi_status_step_id);
      })

      let vi_to_add = null;
      if (num_pass == status_items.length) {
        vi_to_add = {'vi_name': vi_name, 'vi_id': vi.vi_id, vi_status_step_ids: vi_status_step_ids, 'status': 'PASS'};
      } else if (num_fail == status_items.length) {
        vi_to_add = {'vi_name': vi_name, 'vi_id': vi.vi_id, vi_status_step_ids: vi_status_step_ids, 'status': 'FAIL'};
      } else {
        vi_to_add = {'vi_name': vi_name, 'vi_id': vi.vi_id, vi_status_step_ids: vi_status_step_ids, 'status': 'UNKNOWN'};
      }

      if (filter) {
        if (vi_to_add.status == filter) {
          vis.push(vi_to_add);
        }
      } else {
        vis.push(vi_to_add);
      }
    }
  });  

  return vis;
}


var getExecutionElement = async function(execution_id, elem_id, key) {
  try {
    const url = `${archiveLocation}/executions/${execution_id}/elements/${elem_id}`;
    let response = await axios.get(url, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var getProcedureElement_ = async function(procedure_id, elem_id, key) {
  try {
    const url = `${archiveLocation}/procedures/${procedure_id}/elements/${elem_id}`;
    let response = await axios.get(url, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var getStep = async function(execution_id, procedure_id, elem_id, key) {
  let url = '';
  if (execution_id) {
    url = `${archiveLocation}/executions/${execution_id}/steps/${elem_id}`;
  } else if (procedure_id) {
    url = `${archiveLocation}/procedures/${procedure_id}/steps/${elem_id}`;
  } else {
    return Promise.reject('execution_id or procedure_id was not provided');
  }

  try {
    let response = await axios.get(url, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var createVenueGroup = async function(venue_group_input, key) {
  let response = null;
  try {
    const url = `${archiveLocation}/venue_groups`;
    response = await axios.post(url, venue_group_input, {headers: {'Authorization': key}});
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }

  return response.data;
}

var getVenueGroup = async function(venue_group_id, key){
  try {
    const url = `${archiveLocation}/venue_groups/${venue_group_id}`;
    let response = await axios.get(url, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var updateVenueGroup = async function(venue_group_id, venue_group, key) {
  try {
    const url = `${archiveLocation}/venue_groups/${venue_group_id}`;
    await axios.patch(url, venue_group, {headers: {'Authorization': key}});
    return;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var getVenueGroups = async function(params, key) {
  try {
    const url = `${archiveLocation}/venue_groups`;    
    let response = await axios.get(url, {params: params, headers: {'Authorization': key}});
    let total_count = response['headers']['x-total-count'] ? response['headers']['x-total-count'] : 0;
    return {'venue_groups': response.data, 'total_count': total_count};
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var createVenue = async function(venue_input, key) {
  let response = null;
  try {
    const url = `${archiveLocation}/venues`;
    response = await axios.post(url, venue_input, {headers: {'Authorization': key}});
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }

  return response.data;
}

var getVenue = async function(venue_id, key){
  try {
    const url = `${archiveLocation}/venues/${venue_id}`;
    let response = await axios.get(url, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var deleteVenue = async function(venue_id, key) {
  try {
    const venue_status = await getVenueStatus(venue_id, key);
    if (['IN_USE'].includes(venue_status.status)) { 
      return Promise.reject({'message': `Cannot delete venue that is in use`});
    }
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }

  try {
    const url = `${archiveLocation}/venues/${venue_id}`;    
    let response = await axios.get(url, {headers: {'Authorization': key}});
    if (response.status = 200) {
      await axios.delete(url, {headers: {'Authorization': key}});
    }
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var updateVenue = async function(venue_id, venue, key) {
  try {
    const url = `${archiveLocation}/venues/${venue_id}`;
    await axios.patch(url, venue, {headers: {'Authorization': key}});
    return;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var getVenueStatus = async function(venue_id, key) {
  try {
    const url = `${archiveLocation}/venues/${venue_id}/status`;
    const response = await axios.get(url, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var updateVenueStatus = async function(venue_id, venue_status, key) {
  try {
    const url = `${archiveLocation}/venues/${venue_id}/status`;
    await axios.patch(url, venue_status, {headers: {'Authorization': key}});
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}



var getVenues = async function(params, key) {
  try {
    const url = `${archiveLocation}/venues`;    
    let response = await axios.get(url, {params: params, headers: {'Authorization': key}});
    let total_count = response['headers']['x-total-count'] ? response['headers']['x-total-count'] : 0;
    return {'venues': response.data, 'total_count': total_count};
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

// no need to use await?
var updateNonexecutableStepInput = function(execution_id, procedure_id, elem_id, step, key) {     
  if(execution_id) {
    return updateExecutionStep(execution_id, elem_id, step, key);
  } else if (procedure_id) {
    return updateProcedureStep(procedure_id, elem_id, step, key);
  } else {
    return Promise.reject('execution_id or procedure_id was not provided');
  }
}

// no need to use await?
var updateStep = function(execution_id, procedure_id, elem_id, step, key) {

  // remove properties that are managed internally so that they are not changed directly via this API call.  
  sanitizeInputElement(step);

  if(execution_id !== null) {
    return updateExecutionStep(execution_id, elem_id, step, key);
  } else if (procedure_id !== null) {
    return updateProcedureStep(procedure_id, elem_id, step, key);
  } else {
    return Promise.reject('execution_id or procedure_id was not provided');
  }
}

var updateExecutionStep = async function(execution_id, elem_id, step, key) {
  try {
    const url = `${archiveLocation}/executions/${execution_id}/steps/${elem_id}`;
    let response = await axios.patch(url, step, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var updateProcedureStep = async function(procedure_id, elem_id, step, key){
  try {
    const url = `${archiveLocation}/procedures/${procedure_id}/steps/${elem_id}`;
    let response = await axios.patch(url, step, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

// No need to use await?
var updateElement = function(execution_id, procedure_id, elem_id, elem_input, key) {  
  // remove properties that are managed internally so that they are not changed directly via this API call.
  sanitizeInputElement(elem_input);

  if(execution_id !== null) {
    return updateExecutionElement(execution_id, elem_id, elem_input, key);
  } else if (procedure_id !== null) {
    return updateProcedureElement(procedure_id, elem_id, elem_input, key);
  } else {
    return Promise.reject('execution_id or procedure_id was not provided');
  }
}

// No need to use await?
var updateElements = function(execution_id, procedure_id, elems_input, key) {     
  if(execution_id) {
    return updateExecutionElements(execution_id, elems_input, key);
  } else if (procedure_id) {
    return updateProcedureElements(procedure_id, elems_input, key);
  } else {
    return Promise.reject('execution_id or procedure_id was not provided');
  }
}

var updateExecutionElements = async function(execution_id, elems_input, key) {
  try {
    const url = `${archiveLocation}/executions/${execution_id}/elements`;
    let response = await axios.patch(url, elems_input, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var updateProcedureElements = async function(procedure_id, elems_input, key) {
  try {
    const url = `${archiveLocation}/procedures/${procedure_id}/elements`;
    let response = await axios.patch(url, elems_input, {
      headers: {'Authorization': key},
      maxContentLength: 500*1024*1024,
      maxBodyLength: 500*1024*1024
    });
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var updateExecutionElement = async function(execution_id, elem_id, elem_input, key) {
  try {
    const url = `${archiveLocation}/executions/${execution_id}/elements/${elem_id}`;
    let response = await axios.patch(url, elem_input, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var updateProcedureElement = async function(procedure_id, elem_id, elem_input, key){
  try {
    const url = `${archiveLocation}/procedures/${procedure_id}/elements/${elem_id}`;
    let response = await axios.patch(url, elem_input, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var modifyElement = async function(execution_id, elem_id, key) {
  try {
    const url = `${archiveLocation}/executions/${execution_id}/elements/${elem_id}/modify`;
    let response = await axios.post(url, {}, {headers: {'Authorization': key}});
    const data = response.data;
    if (data && data.elem) {
      const enriched = await enrichWithDictionaryConsistency([data.elem], key);
      data.elem = enriched[0];
    }
    return data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }  
}

var justifyElement = async function(execution_id, elem_id, justification_input, key) {
  const elem = await getExecutionElement(execution_id, elem_id, key);
  if (!is_active_redline(elem)) {
    return Promise.reject(`Cannot change status of inactive redline/blueline element.` + 
      ` elem_id: ${elem.elem_id} number: ${elem.number} procedure_modification_status: ${elem.procedure_modification_status}`)
  }

  let decoded = jwt.verify(parse_token(key), public_pem, { algorithms: ['RS256'] });
  let username = decoded['username'];
  let elem_input = {};

  if (justification_input) {
    elem_input['procedure_modification'] = {
      'justification': {
        'time_updated': new Date(),
        'user_name': username
      }
    };

    if (justification_input.hasOwnProperty('modification_type')) {
      elem_input['procedure_modification']['justification']['modification_type'] = 
          justification_input['modification_type'];
    }
    if (justification_input.hasOwnProperty('content')) {
      elem_input['procedure_modification']['justification']['content'] = justification_input['content'];
    }    
  }

  try {
    const url = `${archiveLocation}/executions/${execution_id}/elements/${elem_id}`;
    let response = await axios.patch(url, elem_input, {headers: {'Authorization': key}});
    const enriched = await enrichWithDictionaryConsistency([response.data], key);
    return enriched[0];
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var justifyElements = async function(execution_id, elem_ids, justification_input, key) {
  const elems = await getExecutionSimpleElements(execution_id, key);
  for (const elem of elems) {
    if (elem_ids.includes(elem.elem_id) && !is_active_redline(elem)) {
      return Promise.reject(`Cannot change status of inactive redline/blueline element.` + 
        ` elem_id: ${elem.elem_id} number: ${elem.number} procedure_modification_status: ${elem.procedure_modification_status}`)
    }
  }

  let decoded = jwt.verify(parse_token(key), public_pem, { algorithms: ['RS256'] });
  let username = decoded['username'];  

  let elem_input = {};

  if (justification_input) {
    elem_input['procedure_modification'] = {
      'justification': {
        'time_updated': new Date(),
        'user_name': username
      }
    };

    if (justification_input.hasOwnProperty('modification_type')) {
      elem_input['procedure_modification']['justification']['modification_type'] = 
          justification_input['modification_type'];
    }
    if (justification_input.hasOwnProperty('content')) {
      elem_input['procedure_modification']['justification']['content'] = justification_input['content'];
    }    
  }

  const elems_input = [];
  for (const elem_id of elem_ids) {
    let elem = deepcopy(elem_input);
    elem.elem_id = elem_id;
    elems_input.push(elem);
  }

  try {
    const url = `${archiveLocation}/executions/${execution_id}/elements`;
    let response = await axios.patch(url, elems_input, {headers: {'Authorization': key}});
    return await enrichWithDictionaryConsistency(response.data, key);
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var approveElement = async function(execution_id, elem_id, approval_input, key) {
  const elem = await getExecutionElement(execution_id, elem_id, key);
  if (!is_active_redline(elem)) {
    return Promise.reject(`Cannot change status of inactive redline/blueline element.` + 
      ` elem_id: ${elem.elem_id} number: ${elem.number} procedure_modification_status: ${elem.procedure_modification_status}`)
  }
  
  let decoded = jwt.verify(parse_token(key), public_pem, { algorithms: ['RS256'] });
  let username = decoded['username'];  

  let elem_input = {}

  if (approval_input) {
    elem_input['procedure_modification'] = {
      'approval': {
        'time_updated': new Date(),
        'user_name': username
      }
    };    

    if (approval_input.hasOwnProperty('status')) {
      elem_input['procedure_modification']['approval']['status'] = approval_input['status'];
    }
    if (approval_input.hasOwnProperty('content')) {
      elem_input['procedure_modification']['approval']['content'] = approval_input['content'];
    }    
  }

  try {
    const url = `${archiveLocation}/executions/${execution_id}/elements/${elem_id}`;
    let response = await axios.patch(url, elem_input, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var approveElements = async function(execution_id, elem_ids, approval_input, key) {
  const elems = await getExecutionSimpleElements(execution_id, key);
  for (const elem of elems) {
    if (elem_ids.includes(elem.elem_id) && !is_active_redline(elem)) {
      return Promise.reject(`Cannot change status of inactive redline/blueline element.` + 
        ` elem_id: ${elem.elem_id} number: ${elem.number} procedure_modification_status: ${elem.procedure_modification_status}`)
    }
  }

  let decoded = jwt.verify(parse_token(key), public_pem, { algorithms: ['RS256'] });
  let username = decoded['username'];  

  let elem_input = {}
  if (approval_input) {
    elem_input['procedure_modification'] = {
      'approval': {
        'time_updated': new Date(),
        'user_name': username
      }
    };    

    if (approval_input.hasOwnProperty('status')) {
      elem_input['procedure_modification']['approval']['status'] = approval_input['status'];
    }
    if (approval_input.hasOwnProperty('content')) {
      elem_input['procedure_modification']['approval']['content'] = approval_input['content'];
    }    
  }

  const elems_input = [];
  for (const elem_id of elem_ids) {
    let elem = deepcopy(elem_input);
    elem.elem_id = elem_id;
    elems_input.push(elem);
  }

  try {
    const url = `${archiveLocation}/executions/${execution_id}/elements`;
    let response = await axios.patch(url, elems_input, {headers: {'Authorization': key}});

    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var discardElement = async function(execution_id, elem_id, key) {
  try {
    const elem = await getExecutionElement(execution_id, elem_id, key);
    if (!is_active_redline(elem)) {
      return Promise.reject(`Cannot discard inactive redline/blueline element.` + 
        ` elem_id: ${elem.elem_id} number: ${elem.number} procedure_modification_status: ${elem.procedure_modification_status}`)
    }

    const url = `${archiveLocation}/executions/${execution_id}/elements/${elem_id}/discard`;
    let response = await axios.post(url, {}, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var discardElements = async function(execution_id, discard_input, key) {
  const elems = await getExecutionSimpleElements(execution_id, key);
  const elem_ids = discard_input.elem_ids;
  if (elem_ids) {
    for (const elem of elems) {
      if (elem_ids.includes(elem.elem_id) && !is_active_redline(elem)) {
        return Promise.reject(`Cannot discard inactive redline/blueline element.` + 
          ` elem_id: ${elem.elem_id} number: ${elem.number} procedure_modification_status: ${elem.procedure_modification_status}`)
      }
    }
  }

  try {
    const url = `${archiveLocation}/executions/${execution_id}/elements/discard`;
    let response = await axios.post(url, discard_input, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var getAllSteps  = async function(execution_id, procedure_id, params, key) {
  let url = '';
  if(execution_id) {
    url = `${archiveLocation}/executions/${execution_id}/steps`;
  } else if (procedure_id) {
    url = `${archiveLocation}/procedures/${procedure_id}/steps`;
  } else {
    return Promise.reject('execution_id or procedure_id was not provided');
  }

  try { 
    let response = await axios.get(url, {params: params, headers: {'Authorization': key}});
    let total_count = response['headers']['x-total-count'] ? response['headers']['x-total-count'] : 0;
    return {'elems': response.data, 'total_count': total_count};
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var enrichWithDictionaryConsistency = async function(elems, key) {
  log.info(`enrichWithDictionaryConsistency: called with ${elems.length} elements`);

  // Pull script_id / spec_hash from execution_user_input (execution context) or authoring_user_input (procedure context)
  const getScriptInfo = (elem) => {
    const input = (elem.execution_user_input && elem.execution_user_input.script_id)
      ? elem.execution_user_input
      : (elem.authoring_user_input && elem.authoring_user_input.script_id)
        ? elem.authoring_user_input
        : null;
    return input ? {script_id: input.script_id, spec_hash: input.spec_hash} : null;
  };

  // Single pass: cache script info per element and collect unique script_ids
  const infoByElem = new WeakMap();
  const scriptIdSet = new Set();
  for (const elem of elems) {
    if (elem.step_type !== 'CUSTOM_SCRIPT') continue;
    const info = getScriptInfo(elem);
    log.info(`enrichWithDictionaryConsistency: extracted info=${JSON.stringify(info)} from elem_id=${elem.elem_id || elem.element_id || elem.id}`);
    if (!info) continue;
    infoByElem.set(elem, info);
    scriptIdSet.add(info.script_id);
  }

  if (scriptIdSet.size === 0) {
    log.info('enrichWithDictionaryConsistency: no CUSTOM_SCRIPT steps with script_id, skipping');
    return elems;
  }
  const scriptIds = [...scriptIdSet];

  log.info(`enrichWithDictionaryConsistency: checking ${scriptIds.length} unique script_ids at ${dictionaryLocation}`);

  try {
    const authHeaders = {headers: {'Authorization': key}};
    const [paletteRes, customScriptRes] = await Promise.all([
      axios.post(`${dictionaryLocation}/step_palette/custom/bulk_query`, scriptIds, authHeaders),
      axios.post(`${dictionaryLocation}/custom_scripts/bulk_query`, scriptIds, authHeaders)
    ]);

    log.info(`enrichWithDictionaryConsistency: palette=${paletteRes.data.length}, custom_scripts=${customScriptRes.data.length}`);

    const inPalette = new Set(paletteRes.data.map(p => p.step_id));
    const dictSpecHashByScriptId = new Map(customScriptRes.data.map(s => [s.script_id, s.spec_hash]));
    log.info(`enrichWithDictionaryConsistency: inPalette=${JSON.stringify(Array.from(inPalette))}, dictSpecHashByScriptId=${JSON.stringify(Array.from(dictSpecHashByScriptId))}`);

    return elems.map(elem => {
      const info = infoByElem.get(elem);
      if (!info) return elem;

      log.info(`enrichWithDictionaryConsistency: processing info=${JSON.stringify(info)}`);
      const dictSpecHash = dictSpecHashByScriptId.get(info.script_id);
      log.info(`enrichWithDictionaryConsistency: lookup script_id=${info.script_id} dictSpecHash=${dictSpecHash} hasKey=${dictSpecHashByScriptId.has(info.script_id)}`);
      let consistency_flag;
      if (!info.spec_hash) {
        consistency_flag = 'LEGACY';
      } else if (!dictSpecHashByScriptId.has(info.script_id)) {
        consistency_flag = 'DELETED';
      } else if (info.step_display_name && !inPalette.has(info.script_id)) {
        consistency_flag = 'MISSING_IN_PALLETTE';
      } else if (info.spec_hash && dictSpecHash && info.spec_hash !== dictSpecHash) {
        consistency_flag = 'SPEC_HASH_MISMATCHED';
      } else {
        consistency_flag = 'CONSISTENT';
      }

      log.info(`enrichWithDictionaryConsistency: script_id=${info.script_id} flag=${consistency_flag}`);
      return Object.assign({}, elem, {consistency_flag});
    });
  } catch (err) {
    log.error(`enrichWithDictionaryConsistency: error calling dictionary service: ${err.message || err}`);
    return elems;
  }
}

var getExecutionElements  = async function(execution_id, elem_type, step_type, offset, limit, sort, description, 
  all_elements, comment_filter, ar_comment_filter, dr_comment_filter, key) {
  let params = {};

  if (elem_type != null) params['elem_type'] = elem_type;
  if (step_type != null) params['step_type'] = step_type;
  if (offset != null) params['offset'] = offset;
  if (limit != null) params['limit'] = limit;
  if (sort != null) params['sort'] = sort;
  if (description != null) params['description'] = description;
  if (all_elements != null) params['all_elements'] = all_elements;
  if (comment_filter != null) params['comment_filter'] = comment_filter;
  if (ar_comment_filter != null) params['ar_comment_filter'] = ar_comment_filter;
  if (dr_comment_filter != null) params['dr_comment_filter'] = dr_comment_filter;

  try {
    const url = `${archiveLocation}/executions/${execution_id}/elements`;
    let response = await axios.get(url, {params: params, headers: {'Authorization': key}});
    let total_count = response['headers']['x-total-count'] ? response['headers']['x-total-count'] : 0;

    let elems = await enrichWithDictionaryConsistency(response.data, key);

    return {'elems': elems, 'total_count': total_count};
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var getExecutionSimpleElements  = async function(execution_id, key) {
  try {
    const url = `${archiveLocation}/executions/${execution_id}/simple_elements`;
    let response = await axios.get(url, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var getProcedureElements  = async function(procedure_id, elem_type, step_type, offset, limit, sort, description, key) {
  let params = {};
  if (elem_type != null) params['elem_type'] = elem_type;
  if (step_type != null) params['step_type'] = step_type;
  if (offset != null) params['offset'] = offset;
  if (limit != null) params['limit'] = limit;
  if (sort != null) params['sort'] = sort;
  if (description != null) params['description'] = description;

  try {
    const url = `${archiveLocation}/procedures/${procedure_id}/elements`;
    let response = await axios.get(url, {params: params, headers: {'Authorization': key}});

    let elems = await enrichWithDictionaryConsistency(response.data, key);
    
    let total_count = response['headers']['x-total-count'] ? response['headers']['x-total-count'] : 0;
    return {'elems': elems, 'total_count': total_count};
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var getVersionElements  = async function(procedure_id, version, elem_type, step_type, offset, limit, sort, description, 
  all_elements, comment_filter, key) {
  let params = {};
  if (elem_type != null) params['elem_type'] = elem_type;
  if (step_type != null) params['step_type'] = step_type;
  if (offset != null) params['offset'] = offset;
  if (limit != null) params['limit'] = limit;
  if (sort != null) params['sort'] = sort;
  if (description != null) params['description'] = description;
  if (all_elements != null) params['all_elements'] = all_elements;
  if (comment_filter != null) params['comment_filter'] = comment_filter;
  
  try {
    const url = `${archiveLocation}/procedures/${procedure_id}/versions/${version}/elements`;
    let response = await axios.get(url, {params: params, headers: {'Authorization': key}});
    let total_count = response['headers']['x-total-count'] ? response['headers']['x-total-count'] : 0;

    let elems = await enrichWithDictionaryConsistency(response.data, key);

    return {'elems': elems, 'total_count': total_count};
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var getAllSections  = async function(execution_id, procedure_id, offset, limit, sort, key) {
  let url = '';

  if (execution_id) {
    url = `${archiveLocation}/executions/${execution_id}/sections`;
  } else if (procedure_id) {
    url = `${archiveLocation}/procedures/${procedure_id}/sections`;
  } else {
    return Promise.reject('execution_id or procedure_id was not provided');
  }

  let params = {};
  if (offset != null) params['offset'] = offset;
  if (limit != null) params['limit'] = limit;
  if (sort != null) params['sort'] = sort;

  try {
    let response = await axios.get(url, {params: params, headers: {'Authorization': key}});
    let total_count = response['headers']['x-total-count'] ? response['headers']['x-total-count'] : 0;
    return {'elems': response.data, 'total_count': total_count};
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var getAllParagraphs = async function(execution_id, procedure_id, offset, limit, sort, key) {
  let url = '';

  if (execution_id) {
    url = `${archiveLocation}/executions/${execution_id}/paragraphs`;
  } else if (procedure_id) {
    url = `${archiveLocation}/procedures/${procedure_id}/paragraphs`;
  } else {
    return Promise.reject('execution_id or procedure_id was not provided');
  }

  let params = {};
  if (offset != null) params['offset'] = offset;
  if (limit != null) params['limit'] = limit;
  if (sort != null) params['sort'] = sort;

  try {
    let response = await axios.get(url, {params: params, headers: {'Authorization': key}});
    let total_count = response['headers']['x-total-count'] ? response['headers']['x-total-count'] : 0;
    return {'elems': response.data, 'total_count': total_count};
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }  
}


var getExecution = async function(execution_id, key) {
  try {
    const url = `${archiveLocation}/executions/${execution_id}`;
    let response = await axios.get(url, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var createProcedureVersion = async function(procedure_id, version_meta_data, key) {
  try {
    const url = `${archiveLocation}/procedures/${procedure_id}/versions`;
    let response = await axios.post(url, version_meta_data, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var get_procedure_sections = async function(execution_id, procedure_id, offset, limit, sort, description, key) {
  let url = '';

  if (execution_id) {
    url = `${archiveLocation}/executions/${execution_id}/procedure_sections`;
  } else if (procedure_id) {
    url = `${archiveLocation}/procedures/${procedure_id}/procedure_sections`;
  } else {
    return Promise.reject('execution_id or procedure_id was not provided');
  }

  let params = {};
  if (offset != null) params['offset'] = offset;
  if (limit != null) params['limit'] = limit;
  if (sort != null) params['sort'] = sort;
  if (description != null) params['description'] = description;

  try {
    let response = await axios.get(url, {params: params, headers: {'Authorization': key}});
    let total_count = response['headers']['x-total-count'] ? response['headers']['x-total-count'] : 0;
    return {'elems': response.data, 'total_count': total_count};
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }  
}

var get_procedure_section = async function(execution_id, procedure_id, elem_id, key) {
  let url = '';

  if (execution_id) {
    url = `${archiveLocation}/executions/${execution_id}/procedure_sections/${elem_id}`;
  } else if (procedure_id) {
    url = `${archiveLocation}/procedures/${procedure_id}/procedure_sections/${elem_id}`;
  } else {
    return Promise.reject('execution_id or procedure_id was not provided');
  }

  try {
    let response = await axios.get(url, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }  
}

var get_procedure_section_input = async function(execution_id, procedure_id, elem_id, key) {
  let url = '';

  if (execution_id) {
    url = `${archiveLocation}/executions/${execution_id}/procedure_sections/${elem_id}/input`;
  } else if (procedure_id) {
    url = `${archiveLocation}/procedures/${procedure_id}/procedure_sections/${elem_id}/input`;
  } else {
    return Promise.reject('execution_id or procedure_id was not provided');
  }

  try {
    let response = await axios.get(url, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }  
}

var update_procedure_section = async function(execution_id, procedure_id, elem_id, procedure_section, key){

  sanitizeInputElement(procedure_section);
  let url = '';
  if (execution_id) {
    url = `${archiveLocation}/executions/${execution_id}/procedure_sections/${elem_id}`;
  } else if (procedure_id) {
    url = `${archiveLocation}/procedures/${procedure_id}/procedure_sections/${elem_id}`;
  } else {
    return Promise.reject('execution_id or procedure_id was not provided');
  }  

  try {
    let response = await axios.patch(url, procedure_section, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var update_procedure_section_input = async function(execution_id, procedure_id, elem_id, procedure_section_input, key){
  let url = '';
  if (execution_id) {
    url = `${archiveLocation}/executions/${execution_id}/procedure_sections/${elem_id}/input`;
  } else if (procedure_id) {
    url = `${archiveLocation}/procedures/${procedure_id}/procedure_sections/${elem_id}/input`;
  } else {
    return Promise.reject('execution_id or procedure_id was not provided');
  }  

  try {
    let response = await axios.post(url, procedure_section_input, {headers: {'Authorization': key}});
    return;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var get_procedure_section_structure = async function(execution_id, procedure_id, elem_id, key) {
  let url = '';
  if (execution_id) {
    url = `${archiveLocation}/executions/${execution_id}/procedure_sections/${elem_id}/structure`;
  } else if (procedure_id) {
    url = `${archiveLocation}/procedures/${procedure_id}/procedure_sections/${elem_id}/structure`;
  } else {
    return Promise.reject('execution_id or procedure_id was not provided');
  }
  
  try {
    let response = await axios.get(url, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }  
}

var get_procedure_section_elements = async function(execution_id, procedure_id, elem_id, key) {
  let url = '';
  if (execution_id) {
    url = `${archiveLocation}/executions/${execution_id}/procedure_sections/${elem_id}/elements`;
  } else if (procedure_id) {
    url = `${archiveLocation}/procedures/${procedure_id}/procedure_sections/${elem_id}/elements`;
  } else {
    return Promise.reject('execution_id or procedure_id was not provided');
  }

  try {
    let response = await axios.get(url, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }  
}

/**
 * get the map of selected elements in a procedure section 
 * 
 * @param {Object} reference_elements - reference elements 
 * @return {Object} elem_id to element map 
 */
function getSelectedElementsMap(reference_elements) {
  let elemMap = {};
  
  if (reference_elements) {
    for (let i=0; i < reference_elements.length; i++) {
      let elem = reference_elements[i];
  
      if (elem['elem_type'] && elem['selected']) {
        elemMap[elem.elem_id] = elem; 
      }    
    }
  }

  return elemMap;
}

async function check_procedure_for_import(execution_id, elem_id, key) {
  const procedure_elem = await getExecutionElement(execution_id, elem_id, key);
  const execution_user_input = procedure_elem.execution_user_input;
  const reference_procedure_id = execution_user_input['reference_procedure_id'];
  const reference_procedure_version = execution_user_input['reference_procedure_version'];
  const reference_elements = execution_user_input['elements'];
  const selected_elems_map = getSelectedElementsMap(reference_elements)
  
  if (!reference_procedure_id) {
    return Promise.reject(`Cannot import procedure. procedure_id was not provided. elem_id: ${elem_id}`);
  }

  const {elems, proc_total_count} = await 
    getVersionElements(reference_procedure_id, reference_procedure_version, null, null, 0, 10000, null, null, 
      null, null, key);
  let version_elems_map = {};
  for (const elem of elems) {
    version_elems_map[elem.elem_id] = elem;
  }

  for (const [elem_id, selected_elem] of Object.entries(selected_elems_map)) {
    if (!version_elems_map.hasOwnProperty(elem_id)) {
      return Promise.reject(`Element does not exist in procedure. procedure_id: ${reference_procedure_id} version: ${reference_procedure_version} ` +
        `number: ${selected_elem.number} title: ${selected_elem.title} elem_id: ${selected_elem.elem_id}`);
    }

    const proc_elem = version_elems_map[elem_id];
    if (selected_elem.tag_ids.length !== proc_elem.tag_ids.length) {
      return Promise.reject(`Tag selections are different between selected steps and source procedure. procedure_id: ${reference_procedure_id} version: ${reference_procedure_version} ` +
        `number: ${selected_elem.number} title: ${selected_elem.title} elem_id: ${selected_elem.elem_id}`);
    }

    for (const tag_id of selected_elem.tag_ids) {
      if (!proc_elem.tag_ids.includes(tag_id)) {
        return Promise.reject(`Tag selections are different between selected steps and source procedure. procedure_id: ${reference_procedure_id} version: ${reference_procedure_version} ` +
        `number: ${selected_elem.number} title: ${selected_elem.title} elem_id: ${selected_elem.elem_id}`);
      }
    }
  }
}

var import_procedure_section = async function(execution_id, elem_id, key) {
  await check_procedure_for_import(execution_id, elem_id, key);

  try {
    const url = `${archiveLocation}/executions/${execution_id}/procedure_sections/${elem_id}/import`;
    let response = await axios.post(url, {}, {headers: {'Authorization': key}});
    return await enrichWithDictionaryConsistency(response.data, key);
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var call_procedure_section = async function(execution_id, elem_id, key) {
  await check_procedure_for_import(execution_id, elem_id, key);

  try {
    const call_procedure_elem = await getExecutionElement(execution_id, elem_id, key);

    if (!(call_procedure_elem.execution_user_input && call_procedure_elem.execution_user_input.reference_procedure_id)) {
      return Promise.reject(`Cannot be called. procedure_id was not provided. execution_id: ${execution_id} elem_id: ${elem_id}`);
    }

    if (!(call_procedure_elem.execution_user_input && call_procedure_elem.execution_user_input.callable)) {
      return Promise.reject(`Cannot be called. It should be imported instead. execution_id: ${execution_id} elem_id: ${elem_id}`);
    }

    if (call_procedure_elem.imported) {
      return Promise.reject(`Procedure was already called. execution_id: ${execution_id} elem_id: ${elem_id}`);
    }    
    // suspend current execution
    const current_execution = await _releaseVenueToSuspend(execution_id, true, key);
    await _updateExecutionStatus(execution_id, {status: 'SUSPENDED', comment: ''}, key);

    // create a new execution
    const child_execution = await createExecution({
      venue_id: current_execution.venue_id,
      mode: current_execution.mode,
      delay: current_execution.delay,
      pause_conditions: current_execution.pause_conditions,
      flight_dictionary_version: current_execution.flight_dictionary_version,
      sse_dictionary_version: current_execution.sse_dictionary_version,
      participants: current_execution.participants,
      redline_approvers: current_execution.redline_approvers,
      parent_execution_id: execution_id, 
      parent_procedure_section_id: elem_id,
      description: `Started by ${execution_id} (${call_procedure_elem.number}: ${call_procedure_elem.title})`
      }, 
      key
    );

    // copy procedure section to the new execution
    let run_procedure_elem = null;

    const copy_element_input = {
      elem_ids: [elem_id],
      source_execution_id: execution_id,
      insert_after_id: '-1',
      level: 'CHILD'
    };

    const copy_element_response = await copyElement(child_execution.execution_id, copy_element_input, key);
    if (copy_element_response.elements && copy_element_response.elements.length > 0) {
      run_procedure_elem = copy_element_response.elements[0];
    } else {
      return Promise.reject(`Failed to add run procedure element to new execution. execution_id: ${child_execution.execution_id}`);
    }
    
    // make the copied run procedure element non-callable so that elements can be imported
    await update_procedure_section_input(child_execution.execution_id, null, run_procedure_elem.elem_id, {callable: false}, key)

    // import elements
    await import_procedure_section(child_execution.execution_id, run_procedure_elem.elem_id, key);

    // set imported flag
    await updateElement(execution_id, null, elem_id, {child_execution_id: child_execution.execution_id, imported: true}, key);

    // copy execution state
    await copy_execution_state(execution_id, child_execution.execution_id, key);

    return child_execution;
  } catch (err) {
    log.error(err);
    return Promise.reject(transform_axios_error(err));
  }
}

var updateProcedure = async function(procedure_id, procedure_meta_data, key) {
  try {
    const url = `${archiveLocation}/procedures/${procedure_id}`;
    let response = await axios.patch(url, procedure_meta_data, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var updateVersion = async function(procedure_id, version, version_meta_data, key) {
  try {
    const url = `${archiveLocation}/procedures/${procedure_id}/versions/${version}`;
    let response = await axios.patch(url, version_meta_data, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var updateVersionStatus = async function(procedure_id, version, version_status_input, key) {
  try {
    const url = `${archiveLocation}/procedures/${procedure_id}/versions/${version}/status`;
    let response = await axios.post(url, version_status_input, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var getProcedure = async function(procedure_id, key) {
  try {
    const url = `${archiveLocation}/procedures/${procedure_id}`;
    let response = await axios.get(url, {headers: {'Authorization': key}});
    let data = response.data;

    if (data['deprecated']) {
      data['status'] = "OBSOLETE";
    }
    else if (data.hasOwnProperty('current_released_version') && data['current_released_version'] > 0) {
      data['status'] = "RELEASED";
    }
    else if (data.hasOwnProperty('current_version') && data['current_version'] > 0) {
      data['status'] = "VERSIONED";
    }
    else {
      data['status'] = "WORKING";
    }
    return data
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var deriveVersionStatus = function(version) {
  // version in old style may not have status field. Derive its status.  
  if (!version.hasOwnProperty('status')) {
    if (version['deprecated']) {
      version['status'] = "OBSOLETE";
    } else if (version.hasOwnProperty('time_released') && version['time_released'] != '') {
      version['status'] = "RELEASED";
    }
    else if (version.hasOwnProperty('time_versioned')  && version['time_versioned'] != '') {
      version['status'] = "VERSIONED";
    }
    else {
      version['status'] = "WORKING";
    }
    delete version['deprecated'];
  }
}

var getVersion = async function(procedure_id, version, key) {
  try {
    const url = `${archiveLocation}/procedures/${procedure_id}/versions/${version}`;
    let response = await axios.get(url, {headers: {'Authorization': key}});
    let data = response.data;
    deriveVersionStatus(data);
    return data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var getProcedureOutline = async function(procedure_id, version, tag_ids, key) {
  try {
    const url = `${archiveLocation}/procedures/${procedure_id}/versions/${version}/outline`;
    if (tag_ids) {
      const params = {'tag_ids': tag_ids};
      let response = await axios.get(url, {headers: {'Authorization': key}, params: params});
      return response.data;      
    } else {
      let response = await axios.get(url, {headers: {'Authorization': key}});
      return response.data;        
    }

  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var getExecutionOutline = async function(execution_id, key) {
  try {
    const url = `${archiveLocation}/executions/${execution_id}/outline`;
    let response = await axios.get(url, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var getAttachedFilePaths = function(parent, file_url_set, remove_comments) {
  if (!parent.hasOwnProperty('files')) {
    parent['files'] = [];
  }

  for (const file of parent.files) {
    // decode if the path has been URL encoded (such as %20 for a space)
    // otherwise the file may not be found in file_server.
    file_url_set.add(decode_file_path(file['url']));
  }
  
  if (parent.hasOwnProperty('description')) {
    let file_urls = parent.files.map(file => file.url);

    // fix any file urls that are not in the correct format
    parent.description = parent.description.replace(file_path_search_pattern, file_path_replace_pattern);
    let file_url_matches = get_file_url_matches(parent.description);
    
    for (const file_url_match of file_url_matches) {
      file_url_set.add(decode_file_path(file_url_match));
    }
  }

  if (parent.hasOwnProperty('conversations')) {
    if (remove_comments) {
      parent.conversations = [];
    } else {
      for (const conversation of parent.conversations) {
        if (conversation.hasOwnProperty('comments')) {
          for (const comment of conversation.comments) {
            if (comment.files) {
              let file_urls = comment.files.map(file => file.url);
              for (const file of comment.files) {
                file_url_set.add(decode_file_path(file['url']));
              }
              // fix any file urls that are not in the correct format
              if (comment.content) {
                comment.content = comment.content.replace(file_path_search_pattern, file_path_replace_pattern);
                let file_url_matches = get_file_url_matches(comment.content);
                
                for (const file_url_match of file_url_matches) {
                  file_url_set.add(decode_file_path(file_url_match));
                }
              }
            }
          }
        }
      }
    }
  }
  

  if (parent.hasOwnProperty('children')) {
    let children = parent['children'];
    for (const child of children) {
      getAttachedFilePaths(child, file_url_set, remove_comments);
    }
  }
}


var get_file_url_matches = function(input_text) {
  const url_set = new Set();
  const matches = input_text.match(file_path_match_pattern);

  if (matches) {
    for (const match of matches) {
      // get path starting from media bucket name with no leading slash
      url_set.add(match.substring(18, match.length-1));
    }    
  }

  return url_set.values();
}

/**
  Remote read only attributes from input element that was provided by a client.
  Those attributes can be changed by only Core/Archive/Execution service.
  
* @param {Object} elem - element object
*/
var sanitizeInputElement = function (elem) {

  if (elem) {
    delete elem['parent_id'];
    delete elem['number'];
    delete elem['execution_id'];
    delete elem['procedure_id'];
    delete elem['procedure_title'];
    delete elem['procedure_section_id'];
    delete elem['run_for_score'];
    delete elem['procedure_modification_status'];
    delete elem['elem_type'];
    delete elem['step_type'];
    delete elem['executed'];
    delete elem['executable'];
    delete elem['verifiable'];
    delete elem['children'];
  }

  return elem;
}


/**
  Remove parent_id
  
* @param {Object} elem - element object
*/
var sanitizeElement = function (elem) {
  // do not need idx anymore

  delete elem['parent_id'];  

  if (elem.hasOwnProperty('children')) {
    for (let i = 0; i < elem.children.length; i++) {
      sanitizeElement(elem.children[i]);
    }
  }

  if (elem.hasOwnProperty('run_records')) {
    for (let i = 0; i < elem.run_records.length; i++) {
      sanitizeElement(elem.run_records[i]);
    }
  }

  return elem;
}

/**
 * Returns a promise that will be resolved with true or false
 * 
 * @param {String} bucket 
 * @param {String} key  
 * 
 */
var object_exists = function (bucket, key) {
  log.trace(`object_exists bucket: ${bucket} key: ${key}`);
  return new Promise((resolve, reject) => {
    let params = {
      Bucket: bucket,
      Key: key
    };

    s3_client.headObject(params, (err, meta_data) => {

      if (err) {
        log.trace(`object_exists s3_client.headObject error: ${util.inspect(err)}`);
        resolve(false);
      } else {  
        resolve(true);
      }
    });
  });
}

/**
 * Upload file to file server
 * 
 * @param {String} bucket 
 * @param {String} object_key 
 * @param {} buffer file content 
 */
var upload_file = async function (bucket, filename, buffer) {
  let prefix = (new Date()).toISOString().split('T')[0];
  let foldername = uuid.v4();
  let objectKey = path.join(prefix, foldername, filename);    
  let fileUrl = path.join(config.MEDIA_BUCKET, prefix, foldername, filename);
    
  await upload_to_file_server(bucket, objectKey, buffer);
  
  return fileUrl;
}

/**
 * Upload file to file server
 * 
 * @param {String} bucket 
 * @param {String} object_key 
 * @param {} buffer file content 
 */
var upload_to_file_server = function (bucket, objectKey, buffer) {
  return new Promise((resolve, reject) => {
    let params = {
      Body: buffer,
      Bucket: bucket,
      Key: objectKey,
      ContentType: 'binary'
    };

    s3_client.putObject(params, (err) => {
      if (err) {
        let msg = 'Failed to upload file. reason: {0}'.format(util.inspect(err));
        reject({'message': msg});
      } else {
        let bucket_key = path.join(bucket, objectKey);
        resolve(bucket_key)
      }
    });
  });
}

/**
 * Download file from S3 or minio.
 * Return a promise that will be resolved with the local target path
 * 
 * @param {String} bucket 
 * @param {String} key 
 * @param {String} target_dir 
 */
var download_from_file_server = function (target_dir, bucket, key) {
  return new Promise((resolve, reject) => {
    const target_path = path.join(target_dir, bucket, key);
    const target_path_dirname = path.dirname(target_path);
    fse.ensureDirSync(target_path_dirname);
    const params = { Bucket: bucket, Key: key }
    const s3_stream = s3_client.getObject(params).createReadStream();
    const file_stream = fs.createWriteStream(target_path);
    s3_stream.on('error', reject);
    file_stream.on('error', reject);
    file_stream.on('close', () => { resolve(target_path);});
    s3_stream.pipe(file_stream);
  });
}

var construct_regexp = function (search_for, match_case, whole_word) {
  let regexp = null;
  let search_text_escaped = _.escapeRegExp(search_for);
  if (match_case && whole_word) {
    regexp = new RegExp(`\\b(${search_text_escaped})\\b`, 'g');
  } else if (!match_case && whole_word) {
    regexp = new RegExp(`\\b(${search_text_escaped})\\b`, 'ig');
  } else if (match_case && !whole_word) {
    regexp = new RegExp(`(${search_text_escaped})`, 'g');
  } else if (!match_case && !whole_word) {
    regexp = new RegExp(`(${search_text_escaped})`, 'ig');
  }
  return regexp;
}



var search_with_regex = function (input, regexp) {
  let match_items = [];

  let matches = input.matchAll(regexp);
  
  for (const match of matches) {
    let match_str = match[0]
    
    let start_index = match.index;
    let length = match_str.length;
    
    match_items.push({
      text: match_str,
      start_index: start_index,
      length: length
    });
  }
  
  return match_items;
}

var tokenize_html = async function (input) {
  return await new Promise((resolve, reject) => {
    let tokens = [];
    let s = new Readable({read(size) {
      this.push(input)
      this.push(null)
    }});
    
    let start_index = 0;
    
    let tokenized = s.pipe(tokenize())
    tokenized.pipe(through.obj(function (row, enc, next) {
        // convert stream to string
        let token_str = row[1].toString();
        row[1] = token_str;
        let token = {
          type: row[0],
          value: token_str,
          start_index: start_index
        };
        tokens.push(token);
        start_index += token_str.length;
        next();
    }));
    tokenized.on('error', (err) => {
      reject(err);
    });
    tokenized.on('finish', () => {
      resolve(tokens);
    });
  });
}


var find_matches = async function (input, regexp, is_html) {
  const matches = [];
  
  // Convert non string value to string to be able to use regex
  if (input !== undefined && input !== null) {
    if (!is_string(input)) {
      input = input.toString();
    }    
  } else {
    input = '';
  }

  if (is_html) {
    let tokens = [];
    try {
      tokens = await tokenize_html(input);
    } catch (err) {
      log.warning(err);  
    }
    
    for (const token of tokens) {
      if (token.type === 'text') {
        let match_items = search_with_regex(token.value, regexp);
        for (const match_item of match_items) {
          matches.push({
            text: match_item.text,
            start_index: match_item.start_index + token.start_index,
            length: match_item.length
          });
        }
      }
    }
  } else {
    let match_items = search_with_regex(input, regexp);
    for (const match_item of match_items) {
      matches.push({
        text: match_item.text,
        start_index: match_item.start_index,
        length: match_item.length
      });
    } 
  }

  return matches;
}

var replace_with_regex = function (input, regexp, replace_with) {
  return input.replace(regexp, replace_with);
}

var replace_matches = async function (input, regexp, replace_with, is_html) {
  // Convert non string value to string to be able to use regex
  if (input !== undefined && input !== null) {
    if (!is_string(input)) {
      input = input.toString();
    }    
  } else {
    input = '';
  }
  
  if (is_html) {
    let tokens = [];
    try {
      tokens = await tokenize_html(input);
    } catch (err) {
      log.warning(err);
    }
  
    const texts = [];
  
    for (const token of tokens) {
      if (token.type === 'text') {
        let token_updated = replace_with_regex(token.value, regexp, replace_with);
        texts.push(token_updated);
      } else {
        texts.push(token.value);
      }
    }
    return texts.join('');
  } else {
    return replace_with_regex(input, regexp, replace_with);
  }
}


var searchProcedureVersion = async function (procedure_id, version, search_input, key) {  
  const search_for = search_input.hasOwnProperty('search_for') ? search_input.search_for : null;
  if (search_for === null) {
    return Promise.reject('search_for was not provided');
  }
  
  const match_case = search_input.hasOwnProperty('match_case') ? 
    search_input.match_case : false;
  const match_whole_word = search_input.hasOwnProperty('match_whole_word') ? 
    search_input.match_whole_word : false;
  
  const step_type_filters = search_input.hasOwnProperty('step_type_filters') ? 
    search_input.step_type_filters : [];

  const field_filters = search_input.hasOwnProperty('field_filters') ? 
    search_input.field_filters : [];      

  const start_elem_id = search_input.hasOwnProperty('start_elem_id') ? 
    search_input.start_elem_id.trim() : '';
    
  const end_elem_id = search_input.hasOwnProperty('end_elem_id') ? 
    search_input.end_elem_id.trim() : '';
    
  let in_elem_window = start_elem_id === '';
  
  const step_type_filters_set = new Set(step_type_filters);

  const {elems, total_count} = await 
    getVersionElements(procedure_id, version, null, null, 0, 10000, null, null, 
      null, null, key);
  
  const regexp = construct_regexp(search_for, match_case, match_whole_word); 
  const matches = [];

  const field_path_map = {};
  if (field_filters.length > 0) {
    for (const field_filter of field_filters) {
      Object.assign(field_path_map, authoring_field_map[field_filter]);
    }    
  } else {
    Object.assign(field_path_map, authoring_searchable_field_map);
  }
  for (const elem of elems) {
    if (start_elem_id && start_elem_id === elem.elem_id) {
      in_elem_window = true;
    }
    
    if (!in_elem_window) {
      continue;
    }
    
    let step_type_check = step_type_filters_set.size === 0 || step_type_filters_set.has(elem.step_type); 
    if (step_type_check) {    
      for (const field_path in field_path_map) {
        const field_segs = field_path.split('.');
        const path_and_values = [];
        collectFieldValues(elem, field_segs, 0, '', '', path_and_values);
    
        for (const path_and_value of path_and_values) {
          let input = path_and_value.field_value;
          let field_path_key = path_and_value.field_path;
          let field_full_path = path_and_value.field_full_path;
          if (input !== undefined) {
            let field_info = field_path_map[field_path_key];
            if (!field_info) {
              log.warning(`field_info not found for key: ${field_path_key}`);
            }
            let is_html = field_info && (field_info.is_html === true);
            let replaceable = version === 0 && field_info && (field_info.replaceable === true);
            let match_texts = await find_matches(input, regexp, is_html);
            if (match_texts.length > 0) {
              matches.push({
                elem_id: elem.elem_id,
                number: elem.number,
                title: elem.title,
                elem_type: elem.elem_type,
                step_type: elem.step_type || '',                
                field_path: field_full_path,
                field_text: input instanceof String ? input : input.toString(),
                is_html: is_html,
                replaceable: replaceable,
                match_texts: match_texts.slice(0, 100),     // return upto 100 of match texts
                total_count: match_texts.length
              });
            }
          } else {
            log.warning(`Searched field has no value. field_path: ${field_full_path} type: ${typeof input}`);
          }
        }
      }
    }
    
    if (end_elem_id && end_elem_id === elem.elem_id) {
      in_elem_window = false;
      break;
    }     
  }
    
  const search_result = {
    search_for: search_for,
    match_case: match_case,
    match_whole_word: match_whole_word,
    matches: matches.slice(0, 1000),    // return upto 1000 matches
    total_count: matches.length
  };
  return search_result;
}

var searchExecution = async function (execution_id, search_input, key) {  
  const search_for = search_input.hasOwnProperty('search_for') ? search_input.search_for : null;
  if (search_for === null) {
    return Promise.reject('search_for was not provided');
  }
  
  const match_case = search_input.hasOwnProperty('match_case') ? 
    search_input.match_case : false;
  const match_whole_word = search_input.hasOwnProperty('match_whole_word') ? 
    search_input.match_whole_word : false;
  
  const step_type_filters = search_input.hasOwnProperty('step_type_filters') ? 
    search_input.step_type_filters : [];

  const field_filters = search_input.hasOwnProperty('field_filters') ? 
    search_input.field_filters : [];      

  const start_elem_id = search_input.hasOwnProperty('start_elem_id') ? 
    search_input.start_elem_id.trim() : '';
    
  const end_elem_id = search_input.hasOwnProperty('end_elem_id') ? 
    search_input.end_elem_id.trim() : '';
    
  const status_filters = search_input.hasOwnProperty('status_filters') ? 
    search_input.status_filters : [];
    
  const from_time = search_input.hasOwnProperty('from_time') ? 
    search_input.from_time.trim() : '';
  
  const to_time = search_input.hasOwnProperty('to_time') ? 
    search_input.to_time.trim() : '';        
  
  let in_elem_window = start_elem_id === '';
  
  const step_type_filters_set = new Set(step_type_filters);
  
  const status_filters_set = new Set(status_filters);

  const {elems, total_count} = await
    getExecutionElements(execution_id, null, null, 0, 10000, 'ASC', null, 
      null, null, null, null, key);      
  
  const regexp = construct_regexp(search_for, match_case, match_whole_word); 
  const matches = [];
  
  const field_path_map = {};

  if (field_filters.length > 0) {
    for (const field_filter of field_filters) {
      Object.assign(field_path_map, execution_field_map[field_filter]);
    }    
  } else {
    Object.assign(field_path_map, execution_searchable_field_map);
  }
  
  const field_path_result_map = {};
  Object.assign(field_path_result_map, field_path_map);
  Object.assign(field_path_result_map, searchable_result_field_map);  

  for (const elem of elems) {
    if (start_elem_id && start_elem_id === elem.elem_id) {
      in_elem_window = true;
    }
    
    if (!in_elem_window) {
      continue;
    }

    let step_type_check = step_type_filters_set.size === 0 || step_type_filters_set.has(elem.step_type);    
    let step_status = _.get(elem, 'execution.meta_data.status');
    let status_check = status_filters_set.size === 0 || status_filters_set.has(step_status);

    let step_time_check = true;
    let time_completed = _.get(elem, 'execution.meta_data.time_completed');
    if (from_time) {
      if (time_completed) {
        if (time_completed < from_time) {
          step_time_check = false;          
        }
      } else {
        step_time_check = false;
      }
    }
    if (to_time) {
      if (time_completed) {
        if (time_completed > to_time) {
          step_time_check = false;
        }
      } else {
        step_time_check = false;
      }
    }    
    
    if (step_type_check && status_check && step_time_check) {
      let path_map = elem.executed ? field_path_result_map : field_path_map
      for (const field_path in path_map) {
        const field_segs = field_path.split('.');
        const path_and_values = [];
        collectFieldValues(elem, field_segs, 0, '', '', path_and_values);
    
        for (const path_and_value of path_and_values) {
          let input = path_and_value.field_value;
          let field_path_key = path_and_value.field_path;
          let field_full_path = path_and_value.field_full_path;
          if (input !== undefined) {
            let field_info = path_map[field_path_key];
            if (!field_info) {
              log.warning(`field_info not found for key: ${field_path_key}`);
            }
            let is_html = field_info && (field_info.is_html === true);
            let replaceable = field_info && (field_info.replaceable === true);
            let match_texts = await find_matches(input, regexp, is_html);
            if (match_texts.length > 0) {
              matches.push({
                elem_id: elem.elem_id,
                number: elem.number,
                title: elem.title,
                elem_type: elem.elem_type,
                step_type: elem.step_type || '',
                field_path: field_full_path,
                field_text: input instanceof String ? input : input.toString(),
                is_html: is_html,
                replaceable: false,            // for execution, always return false
                match_texts: match_texts
              });
            }
          } else {
            log.warning(`Searched field has no value. field_path: ${field_full_path} type: ${typeof input}`);
          }
        }
      }
    }
    
    if (end_elem_id && end_elem_id === elem.elem_id) {
      in_elem_window = false;
      break;
    }     
  }
    
  const search_result = {
    search_for: search_for,
    match_case: match_case,
    match_whole_word: match_whole_word,
    matches: matches.slice(0, 1000),    // return upto 1000 matches
    total_count: matches.length
  };
  return search_result;
}

var collectFieldValues = function(obj, field_segs, seg_index, parent_field_path, 
  parent_field_full_path, path_and_values) {
  
  const field_name = field_segs[seg_index];
  const field_value = _.get(obj, field_name);
  if (field_value !== undefined && field_value !== null) {
    if (seg_index >= (field_segs.length-1)) {
      if (Array.isArray(field_value)) {
        for (const [i, field_elem] of field_value.entries()) {
          let field_path = parent_field_path ? 
          `${parent_field_path}.${field_name}` : field_name;  
          let field_full_path = parent_field_full_path ? 
          `${parent_field_full_path}.${field_name}[${i}]` : `${field_name}[${i}]`;          
          
          path_and_values.push({
            field_path: field_path,
            field_full_path: field_full_path,
            field_value: field_elem
          });
        }
      } else {
        let field_path = parent_field_path ? 
          `${parent_field_path}.${field_name}` : field_name;
        let field_full_path = parent_field_full_path ? 
          `${parent_field_full_path}.${field_name}` : field_name;
          
        path_and_values.push({
          field_path: field_path,
          field_full_path: field_full_path,
          field_value: field_value
        });        
      }

    } else {
      if (Array.isArray(field_value)) {
        for (const [i, field_elem] of field_value.entries()) {
          let field_path = parent_field_path ? 
          `${parent_field_path}.${field_name}` : field_name;  
          let field_full_path = parent_field_full_path ? 
          `${parent_field_full_path}.${field_name}[${i}]` : `${field_name}[${i}]`;          
          collectFieldValues(field_elem, field_segs, seg_index + 1, 
            field_path, field_full_path, path_and_values);
        }
      } else {
        let field_path = parent_field_path ? 
        `${parent_field_path}.${field_name}` : field_name;
        let field_full_path = parent_field_full_path ? 
        `${parent_field_full_path}.${field_name}` : field_name;      
        collectFieldValues(field_value, field_segs, seg_index + 1, 
          field_path, field_full_path, path_and_values);
      }      
    }
  }
}

var getFieldRootName = function (field_path_key) {
  const segs = field_path_key.split('.');
  return segs[0];
}

var replaceProcedure = async function (procedure_id, replace_input, key) {
  
  const search_for = replace_input.hasOwnProperty('search_for') ? replace_input.search_for : null;
  if (search_for === null) {
    return Promise.reject('search_for was not provided');
  }
  
  const replace_with = replace_input.hasOwnProperty('replace_with') ? replace_input.replace_with : null;
  if (replace_with === null) {
    return Promise.reject('replace_with was not provided');
  }  
  
  const match_case = replace_input.hasOwnProperty('match_case') ? 
    replace_input.match_case : false;
    
  const match_whole_word = replace_input.hasOwnProperty('match_whole_word') ? 
    replace_input.match_whole_word : false;
  
  const replacements = replace_input.hasOwnProperty('replacements') ? 
    replace_input.replacements : [];
    
  const {elems, total_count} = await 
    getVersionElements(procedure_id, 0, null, null, 0, 10000, null, null, 
      null, null, key);
  const elem_map = {};
  for (const elem of elems) {
    elem_map[elem.elem_id] = elem;
  }

  const regexp = construct_regexp(search_for, match_case, match_whole_word); 
  const to_update_elem_map = {};

  for (const replacement of replacements) {
    const elem_id = replacement.elem_id;
    const number = replacement.number;
    const is_html = replacement.is_html;
    const field_path = replacement.field_path;
    
    const elem = elem_map[elem_id];
    
    if (!elem) {
      return Promise.reject(`element was not found. number: ${number} elem_id: ${elem_id}`);
    }

    // remove array indices to use as a key to field map
    let field_path_key = field_path.replace(regexpFieldPath, '');
    let field_path_root = getFieldRootName(field_path_key);

    // console.log(`Replace a field. number: ${number} elem_id: ${elem_id} field_path: ${field_path} field_path_key: ${field_path_key} field_path_root: ${field_path_root}`);
    if (authoring_searchable_field_map.hasOwnProperty(field_path_key)) {
      let field_info = authoring_searchable_field_map[field_path_key];
      if (field_info.replaceable !== true) {
        return Promise.reject(`Field is not replaceable. number: ${number} elem_id: ${elem_id} field_path: ${field_path} field_path_key: ${field_path_key}`);
      }
    } else {
      return Promise.reject(`Field is not supported for search/replace. number: ${number} elem_id: ${elem_id} field_path: ${field_path} field_path_key: ${field_path_key}`);
    }

    let field_value = _.get(elem, field_path, null);
    if (field_value === null) {
      return Promise.reject(`field was not found. number: ${number} elem_id: ${elem_id} field_path: ${field_path}`);
    }
    
    let update_elem = {
      elem_id: elem_id
    };
    
    if (to_update_elem_map.hasOwnProperty(elem_id)) {
      update_elem = to_update_elem_map[elem_id];
    } else {
      to_update_elem_map[elem_id] = update_elem;
    }

    if (!update_elem.hasOwnProperty(field_path_root)) {
      if (!elem.hasOwnProperty(field_path_root)) {
        return Promise.reject(`field path root was not found. number: ${number} elem_id: ${elem_id} field_path: ${field_path} field_path_root: ${field_path_root}`);
      }
      // need to use the root field to handle array values
      update_elem[field_path_root] = elem[field_path_root];
    } 

    const updated_value = await replace_matches(field_value, regexp, replace_with, is_html);

    // console.log(`field_path: ${field_path} updated_value: ${updated_value}`);
    // console.log('update_elem');
    // console.log(JSON.stringify(update_elem, 0, 2));
    if (is_string(field_value)) {
      _.set(update_elem, field_path, updated_value);
      // console.log('update_elem after');
      // console.log(JSON.stringify(update_elem, 0, 2));
    } else if (typeof field_value === 'number') {
      const updated_number_value = Number(updated_value);
      if (isNaN(updated_number_value)) {
        return Promise.reject(`Replaced value is not a number. number: ${number} elem_id: ${elem_id} field_path: ${field_path} field_value: ${field_value} updated_value: ${updated_value}`);
      }
      _.set(update_elem, field_path, updated_number_value);
    } else if (typeof field_value === 'boolean') {
      if (updated_value.toLowerCase() === 'false') {
        _.set(update_elem, field_path, false);
      } else if (updated_value.toLowerCase() === 'true') {
        _.set(update_elem, field_path, true);
      } else {
        return Promise.reject(`Replaced value is not a boolean. number: ${number} elem_id: ${elem_id} field_path: ${field_path} field_value: ${field_value} updated_value: ${updated_value}`);
      }
    } else {
      return Promise.reject(`Unsupported field type for text replacement. number: ${number} elem_id: ${elem_id} field_path: ${field_path} field_value: ${field_value} type: ${typeof field_value}`);
    }
  }
  const elems_to_update = Object.values(to_update_elem_map);

  const updated_elems = await updateProcedureElements(procedure_id, elems_to_update, key);
  
  const updated_elem_map = {};
  for (const updated_elem of updated_elems) {
    updated_elem_map[updated_elem.elem_id] = updated_elem;
  }
  
  const replacement_outputs = [];
  for (const replacement of replacements) {
    let elem_id = replacement.elem_id;
    let number = replacement.number;
    let field_path = replacement.field_path;
    
    let elem = updated_elem_map[elem_id];
    if (elem) {
      let replacement_output = {
        elem_id: elem_id,
        number: number,
        field_path: field_path,
        field_value: _.get(elem, field_path, '')    // TODO: return null??
      };
      replacement_outputs.push(replacement_output);      
    } else {
      log.warning(`Field was not updated. number: ${number} elem_id: ${elem_id} field_path: ${field_path}`);
    }
  }  

  return replacement_outputs;
}

var exportProcedureVersion = async function(procedure_id, version, key) {
  let procedure_version_data = null;
  let content_dir = null;
  let content_dir_base = null;

  try {
    const url = `${archiveLocation}/procedures/${procedure_id}/versions/${version}/structure`;
    let response = await axios.get(url, {headers: {'Authorization': key}});
    procedure_version_data = response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
  
  sanitizeElement(procedure_version_data);

  let file_url_set = new Set();
  getAttachedFilePaths(procedure_version_data, file_url_set, true);

  let temp_dir_obj = tmp.dirSync({mode: '0750', prefix: 'procedure_'});
  let temp_dir = temp_dir_obj.name;  

  let procedure_version_str = `${procedure_id}-version-${version}`;
  content_dir = path.join(temp_dir, procedure_version_str);
  fs.mkdirSync(content_dir);

  content_dir_base = path.basename(content_dir);

  let messages = [];
  await downloadFiles(file_url_set, content_dir, messages);

  let procedure_version_export_data = {'data': procedure_version_data, 'messages': messages};
  let procedure_version_export_json_path = path.join(content_dir, procedure_version_export_json);
  fs.writeFileSync(procedure_version_export_json_path, JSON.stringify(procedure_version_export_data, 0, 4));

  let content_dir_parent = path.dirname(content_dir);
  let targz_path = path.join(content_dir_parent, content_dir_base + '.tar.gz');

  return await new Promise((resolve, reject) => {
    targz.compress({src: content_dir, dest: targz_path}, 
      function(err) {
        if (err) {
          reject(util.inspect(err));
        } else {
          resolve(targz_path);
        }
        fse.removeSync(content_dir);
      }
    );
  });
}

var downloadFiles = async function(file_url_set, content_dir, messages) {
  for (const file_url of file_url_set) {
    let file_path_segments = file_url.split('/');
    let bucket = file_path_segments[0];
    let key = file_path_segments.splice(1).join('/');
    let exists = await object_exists(bucket, key);
    if (exists == false) {
      let message = 'file attachement was not found: {0}'.format(file_url);
      messages.push({'message': message, 'details': [], 'message_level': 'WARNING'});
    } else {
      try {
        await download_from_file_server(content_dir, bucket, key);
      } catch (err) {
        messages.push({
          'message': 'Failed to download file.', 
          'details': [util.inspect(err)], 
          'message_level': 'WARNING'});
      }
    }
  }
}

var exportExecution = async function(execution_id, key) {
  let execution_data = null;
  let content_dir = null;
  let content_dir_base = null;

  try {
    const url = `${archiveLocation}/executions/${execution_id}/export`;
    let response = await axios.get(url, {headers: {'Authorization': key}});
    execution_data = response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }

  let file_url_set = new Set();

  if (execution_data.elements) {
    for (const element of execution_data.elements) {
      getAttachedFilePaths(element, file_url_set, false);
    }
  }

  let temp_dir_obj = tmp.dirSync({mode: '0750', prefix: 'execution_'});
  let temp_dir = temp_dir_obj.name;

  let execution_str = `${execution_id}`;
  content_dir = path.join(temp_dir, execution_str);
  fs.mkdirSync(content_dir);

  content_dir_base = path.basename(content_dir);    

  let messages = [];

  await downloadFiles(file_url_set, content_dir, messages);

  let execution_export_data = {'data': execution_data, 'messages': messages};
  let execution_export_json_path = path.join(content_dir, execution_export_json);
  fs.writeFileSync(execution_export_json_path, JSON.stringify(execution_export_data, 0, 4));

  let content_dir_parent = path.dirname(content_dir);
  let targz_path = path.join(content_dir_parent, content_dir_base + '.tar.gz');

  return await new Promise((resolve, reject) => {
    targz.compress({src: content_dir, dest: targz_path}, 
      function(err) {
        if (err) {
          reject(util.inspect(err));
        } else {
          resolve(targz_path);
        }
        fse.removeSync(content_dir);
      }
    );
  });
}

var exportProcedureVersions = async function(procedure_id, version, released_only, key) {
  let versions_data = null;
  let content_dir = null;
  let content_dir_base = null;

  try {
    const url = `${archiveLocation}/procedures/${procedure_id}/export_versions`;
    const params = {};
    if (version !== null) {
      params.version = version;
    }
    if (released_only !== null) {
      params.released_only = released_only;
    }    
    let response = await axios.get(url, {params: params, headers: {'Authorization': key}});
    versions_data = response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }

  let file_url_set = new Set();

  if (versions_data.elements) {
    for (const element of versions_data.elements) {
      getAttachedFilePaths(element, file_url_set, false);
    }
  }

  let temp_dir_obj = tmp.dirSync({mode: '0750', prefix: 'procedure_'});
  let temp_dir = temp_dir_obj.name;  

  let procedure_version_str = `${procedure_id}`;
  content_dir = path.join(temp_dir, procedure_version_str);
  fs.mkdirSync(content_dir);

  content_dir_base = path.basename(content_dir);    

  let messages = [];

  await downloadFiles(file_url_set, content_dir, messages);

  let procedure_export_data = {'data': versions_data, 'messages': messages};
  let procedure_export_json_path = path.join(content_dir, procedure_export_json);
  fs.writeFileSync(procedure_export_json_path, JSON.stringify(procedure_export_data, 0, 4));

  let content_dir_parent = path.dirname(content_dir);
  let targz_path = path.join(content_dir_parent, content_dir_base + '.tar.gz');

  return await new Promise((resolve, reject) => {
    targz.compress({src: content_dir, dest: targz_path}, 
      function(err) {
        if (err) {
          reject(util.inspect(err));
        } else {
          resolve(targz_path);
        }
        fse.removeSync(content_dir);
      }
    );
  });
}


var importProcedureVersion = async function(procedure_id, procedure_version_file, key){
  log.debug('importProcedureVersion');
  const targz_name = 'procedure_version.tar.gz';

  // any warning messages during import
  const messages = [];
  
  const procedure_version_data = await prepareImportData('procedure_version.tar.gz', 'imported_procedure_', 
    procedure_version_file, procedure_version_export_json, messages);

  updateImportedProcedureElements(procedure_id, procedure_version_data);

  try {
    const url = `${archiveLocation}/procedures/${procedure_id}/import`;
    await axios.post(url, procedure_version_data, {
      headers: {'Authorization': key},
      maxContentLength: 500*1024*1024,   // 500 MB
      maxBodyLength: 500*1024*1024       // 500 MB
    });
    const procedure_info = await getProcedure(procedure_id, key);
    const version_info = await getVersion(procedure_id, 0, key);
    const version_infos = [version_info];
    return {'procedure_info': procedure_info, 'version_infos': version_infos, 'messages': messages};
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var prepareImportData = async function(targz_name, prefix, input_file, export_json, messages) {
  let temp_dir_obj = tmp.dirSync({mode: '0750', prefix: prefix});
  let temp_dir = temp_dir_obj.name;

  let targz_path = path.join(temp_dir, targz_name);

  let files = await new Promise(function(resolve, reject) {
    fs.writeFile(targz_path, input_file['buffer'], (err) => {
      if (err) {
        let msg = 'Failed to save imported tar gz file. reason: {0}'.format(util.inspect(err));
        reject(msg);
      } else {
        targz.decompress({src: targz_path, dest: temp_dir}, function (err) {
          if (err) {
            let msg = 'Failed to decompress imported tar gz file. reason: {0}'.format(util.inspect(err));
            reject(msg);
          } else {
            recursive_readdir(temp_dir, [targz_name, export_json], function (err, files) {
              if (err) {
                let msg = 'Failed to get files from extracted gzip tar. reason: {0}'.format(util.inspect(err));
                reject(msg);
              } else {
                resolve(files);
              }
            });
          }
        });             
      }
    });    
  });

  for (let i=0; i < files.length; i++) {
    let file = files[i];
    let file_relative_to_base = file.substring(temp_dir.length+1);
    let file_relative_to_base_segments = file_relative_to_base.split('/');

    let key = file_relative_to_base_segments.splice(1).join('/');
    let file_data = null;
    try {
      file_data = await new Promise(function(resolve, reject) {
        fs.readFile(file, function(err, file_data) {     
          if (err) {
            log.error(util.inspect(err));                   
            reject(err);
          } else {
            resolve(file_data);
          }
        });
      })
    } catch (err) {
      messages.push({
        'message': 'Failed to read file.', 
        'details': [util.inspect(err)], 
        'message_level': 'WARNING'});      
    }

    if (file_data != null) {
      try {
        let exists = await object_exists(config.MEDIA_BUCKET, key);
        if (exists) {
          log.info(`File exists in bucket. Skip uploading. bucket: ${config.MEDIA_BUCKET} key: ${key}`);
        } else {
          log.info(`Upload File. key: ${key}`);
          await upload_to_file_server(config.MEDIA_BUCKET, key, file_data);
          log.info(`File uploaded. key: ${key}`);
        }
      } catch (err) {
        messages.push({
          'message': 'Failed to upload file.', 
          'details': [util.inspect(err)], 
          'message_level': 'WARNING'});        
      }
    }
  }

  let export_file = path.join(temp_dir, export_json);
  if (!fs.existsSync(export_file)) {
    let procedure_version_export_file = path.join(temp_dir, procedure_version_export_json);
    let procedure_export_file = path.join(temp_dir, procedure_export_json);
    if (fs.existsSync(procedure_version_export_file)) {
      // NOTE: This applies only to import of procedure
      let msg = `Cannot parse the uploaded file. It is in an old format with only version data.`;
      log.error(msg);
      fse.removeSync(temp_dir);
      return Promise.reject(msg);
    } else if (fs.existsSync(procedure_export_file)) {
      // NOTE: This applies only to import of procedure
      let msg = `Cannot parse the uploaded file. It is in a new format with procedure meta data.`;
      log.error(msg);
      fse.removeSync(temp_dir);
      return Promise.reject(msg);
    }
    else {
      let msg = `Cannot parse the uploaded file. Not found: ${export_json}`;
      log.error(msg);
      fse.removeSync(temp_dir);
      return Promise.reject(msg);
    }
  }
  let import_data = await new Promise(function(resolve, reject) {
    fs.readFile(export_file, 'utf8', function (err, data) {
      if (err) {
        let msg = 'Failed to parse import data file. error: {0}'.format(util.inspect(err));
        log.error(msg);
        fse.removeSync(temp_dir);
        reject(msg);
      } else {
        let import_obj = JSON.parse(data);
        if (import_obj.hasOwnProperty('data')) {
          resolve(import_obj['data']);
        } else {
          let msg = 'Unexpected format of JSON file. No data field.';
          log.error(msg);
          fse.removeSync(temp_dir);
          reject(msg);
        }
      }
    })
  });

  fse.removeSync(temp_dir);
  return Promise.resolve(import_data);
}

var importExecution = async function(execution_file, key) {
  if (!execution_file) {
    return Promise.reject('execution_file was not provided');
  }

  // any warning messages during import
  const messages = [];
  
  const execution_data = await prepareImportData('execution.tar.gz', 'imported_execution_', 
    execution_file, execution_export_json, messages);

  if (execution_data && execution_data.elements) {
    for (const element of execution_data.elements) {
      updateImportedProcedureElements('', element);
    }
  }

  try {
    const url = `${archiveLocation}/executions/import`;
    await axios.post(url, execution_data, {
      headers: {'Authorization': key},
      maxContentLength: 500*1024*1024,       // 500 MB
      maxBodyLength: 500*1024*1024       // 500 MB
    });
    
    const execution_id = execution_data.execution_info && execution_data.execution_info.execution_id ? 
      execution_data.execution_info.execution_id : '';

    if (execution_id) {
      const execution_info = await getExecution(execution_id, key);
      return {'execution_info': execution_info, 'messages': messages};
    } else {
      let message = 'execution data is not in the expected format';
      log.warning(message);
      messages.push({
        'message': message, 
        'details': ['execution_id was not available'], 
        'message_level': 'ERROR'});      
      return {'execution_info': '', 'messages': messages};
    }
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}


var importProcedureVersions = async function(procedure_versions_file, key) {
  if (!procedure_versions_file) {
    return Promise.reject('procedure_versions_file was not provided');
  }

  // any warning messages during import
  const messages = [];
  
  const procedure_data = await prepareImportData('procedure.tar.gz', 'imported_procedure_', 
    procedure_versions_file, procedure_export_json, messages); 

  if (procedure_data && procedure_data.elements) {
    for (const element of procedure_data.elements) {
      updateImportedProcedureElements('', element);
    }
  }

  try {
    const url = `${archiveLocation}/procedures/import`;
    await axios.post(url, procedure_data, {
      headers: {'Authorization': key},
      maxContentLength: 500*1024*1024,       // 500 MB
      maxBodyLength: 500*1024*1024       // 500 MB
    });

    const imported_versions = procedure_data.version_infos.map(version_info => version_info.version);
    
    const procedure_id = procedure_data.procedure_info && procedure_data.procedure_info.procedure_id ? 
      procedure_data.procedure_info.procedure_id : '';

    if (procedure_id) {
      const procedure_info = await getProcedure(procedure_id, key);
      const versions_data = await getVersions(procedure_id, null, null, null, null, null, 'ASC', null, key);
      const version_infos = versions_data.versions.filter(version_info => imported_versions.includes(version_info.version));
      return {'procedure_info': procedure_info, 'version_infos': version_infos, 'messages': messages};
    } else {
      log.warning(`procedure data is not in the expected format`);
      messages.push({
        'message': 'procedure data is not in the expected format', 
        'details': ['procedure_id was not available'], 
        'message_level': 'ERROR'});      
      return {'procedure_info': '', 'version_infos': [], 'messages': messages};
    }
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

/**
 * returns a new string of the file_path by replacing the bucket_name
 * 
 * Example:
 *   input:   /source_bucket_name/dir_name/my%20file.png
 *   output:  /target_bucket_name/dir_name/my%20file.png
 * 
 * @param string file_path  expected in this format. /bucket_name/path/filename 
 */
function replace_bucket_name_in_path(file_path) {
  if (file_path) {
    const segs = file_path.split('/');
    if (segs.length > 1) {
      segs[0] = config.MEDIA_BUCKET;
    }
    return segs.join('/');
  } else {
    return file_path;
  }
}


function decode_file_path(file_path) {
  if (file_path) {
    return decodeURI(file_path);
  } else {
    return file_path;
  }
}


function replace_bucket_name_in_html(input_html) {
  return input_html.replace(file_path_capture_pattern, `src="/file_server/${config.MEDIA_BUCKET}/$2"`)
}

/*
  Update file urls and procedure of imported procedure elements recursively
*/
var updateImportedProcedureElements = function(procedure_id, procedure_version_data) {
  // override procedure_id if importing as working copy
  if (procedure_id && procedure_version_data.hasOwnProperty('elem_id') && procedure_version_data.hasOwnProperty('procedure_id')) {
    procedure_version_data['procedure_id'] = procedure_id;
  }

  // set file urls
  if (procedure_version_data.hasOwnProperty('files') && Array.isArray(procedure_version_data.files)) {
    procedure_version_data.files.forEach(file => {

      file.url = replace_bucket_name_in_path(file.url);
      // old procedure may have procedure_id that should not be there.
      if (file.hasOwnProperty('procedure_id')) {
        delete file['procedure_id'];
      }
    });
  }

  if (procedure_version_data.hasOwnProperty('description')) {
    if (procedure_version_data.description) {
      let description = replace_bucket_name_in_html(procedure_version_data.description);
      
      if (procedure_version_data['description'] != description) {
        log.trace(`source description: ${procedure_version_data['description']}`);
        log.trace(`target description: ${description}`);
        procedure_version_data['description'] = description;
      }
    }
  }
  
  if (procedure_id) {
    // remove any conversations/comments
    if (procedure_version_data.hasOwnProperty('conversations')) {
      procedure_version_data['conversations'] = [];
    }
  } else {
    if (procedure_version_data.hasOwnProperty('conversations')) {
      for (const conversation of procedure_version_data.conversations) {
        if (conversation.comments) {
          for (const comment of conversation.comments) {
            // set file urls
            if (comment.hasOwnProperty('files') && Array.isArray(comment.files)) {
              comment.files.forEach(file => {
                file.url = replace_bucket_name_in_path(file.url);
              });
            }

            if (comment.hasOwnProperty('content')) {
              if (comment.content) {
                let content = replace_bucket_name_in_html(comment.content);

                if (comment['content'] != content) {
                  comment['content'] = content;
                }
              }
            }
          }
        }
      }
    }  
  }

  if (procedure_version_data.hasOwnProperty('children') && Array.isArray(procedure_version_data.children)) {
    procedure_version_data.children.forEach(child => updateImportedProcedureElements(procedure_id, child));
  }
}


var removeVersion = async function(procedure_id, version, key) {
  try {
    const url = `${archiveLocation}/procedures/${procedure_id}/versions/${version.toString()}`;
    await axios.delete(url, {headers: {'Authorization': key}});
    return;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var loadProcedure = async function(procedure_id, procedure_info, key) {
  try {
    const url = `${archiveLocation}/procedures/${procedure_id}/load`;
    await axios.post(url, procedure_info, {headers: {'Authorization': key}});
    return;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var removeProcedure = async function(procedure_id, key) {
  try {
    const url = `${archiveLocation}/procedures/${procedure_id}`;
    await axios.delete(url, {headers: {'Authorization': key}});
    return;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var moveProcedureElement = async function(procedure_id, move_element_input, key) {
  try {
    const url = `${archiveLocation}/procedures/${procedure_id}/elements/move`;

    let response = await axios.post(url, move_element_input, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var copyProcedureElement = async function(procedure_id, copy_element_input, key) {
  try {
    const url = `${archiveLocation}/procedures/${procedure_id}/elements/copy`;

    let response = await axios.post(url, copy_element_input, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var getProcedures = async function(offset, limit, title, description, author, versioned, procedure_type, hazardous, label, released, 
  obsolete, sort, sort_by, procedure_id, institutional_id, key) {

  let params = {}
  if (offset)
    params['offset'] = offset;
  if (limit)
    params['limit'] = limit;
  if (title)
    params['title'] = title;
  if (description)
    params['description'] = description;  
  if (author)
    params['author'] = author;
  if (procedure_id)
    params['procedure_id'] = procedure_id;
  if (institutional_id)
    params['institutional_id'] = institutional_id;
  if (versioned != undefined)
    params['versioned'] = versioned;
  if (procedure_type != undefined)
    params['procedure_type'] = procedure_type;
  if (hazardous != undefined)
    params['hazardous'] = hazardous;
  if (label != undefined)
    params['label'] = label;
  if (released != undefined)
    params['released'] = released;
  if (obsolete != undefined)
    params['obsolete'] = obsolete;
  if (sort)
    params['sort'] = sort;
  if (sort_by)
    params['sort_by'] = sort_by;

  try {
    const url = `${archiveLocation}/procedures`;   
    let response = await axios.get(url, {params: params, headers: {'Authorization': key}});
    let total_count = response['headers']['x-total-count'] ? response['headers']['x-total-count'] : 0;

    for (let i=0; i < response['data'].length; i++) {
      if (response['data'][i]['obsolete']) {
        response['data'][i]['status'] = "OBSOLETE";
      } else if (response['data'][i].hasOwnProperty('time_released')  && response['data'][i]['time_released'] != '') {
        response['data'][i]['status'] = "RELEASED";
      }
      else if (response['data'][i].hasOwnProperty('time_versioned')  && response['data'][i]['time_versioned'] != '') {
        response['data'][i]['status'] = "VERSIONED";
      }
      else {
        response['data'][i]['status'] = "WORKING";
      }
    }

    return {'procedures': response.data, 'total_count': total_count};
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}


var getVersions = async function(procedure_id, offset, limit, version_description, version_author, status, sort, institutional_release_id, key){
  let params = {}
  if (offset)
    params['offset'] = offset;
  if (limit)
    params['limit'] = limit;
  if (version_description)
    params['version_description'] = version_description;
  if (version_author)
    params['version_author'] = version_author;
  if (status != undefined)
    params['status'] = status;
  if (sort)
    params['sort'] = sort;
  if (institutional_release_id)
    params['institutional_release_id'] = institutional_release_id;

  try {
    const url = `${archiveLocation}/procedures/${procedure_id}/versions`; 
    let response = await axios.get(url, {params: params, headers: {'Authorization': key}});
    let total_count = response['headers']['x-total-count'] ? response['headers']['x-total-count'] : 0;

    const versions = response['data'];
    for (const version of versions) {
      deriveVersionStatus(version);
    }

    return {'versions': versions, 'total_count': total_count};
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var getStructure = async function(procedure_id, offset, limit, sort, version, key) {
  let url = '';
  if (version) {
    url = `${archiveLocation}/procedures/${procedure_id}/versions/${version.toString()}/structure`;
  } else {
    url = `${archiveLocation}/procedures/${procedure_id}/structure`;
  }

  let params = {}
  if (offset)
    params['offset'] = offset;
  if (limit)
    params['limit'] = limit;
  if (sort)
    params['sort'] = sort;
  
  try {
    let response = await axios.get(url, {params: params, headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var getExecutionStatus = async function(execution_id, key) {
  try {
    const url = `${archiveLocation}/executions/${execution_id}/status`;
    const response = await axios.get(url, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var removeExecution = async function(execution_id, key) {

  try {
    const url = `${archiveLocation}/executions/${execution_id}`;    
    let response = await axios.delete(url, {headers: {'Authorization': key}});
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var getAllExecutions = async function(params, key) {
  try {
    const url = `${archiveLocation}/executions`;    
    let response = await axios.get(url, {params: params, headers: {'Authorization': key}});
    let total_count = response['headers']['x-total-count'] ? response['headers']['x-total-count'] : 0;
    return {'executions': response.data, 'total_count': total_count};
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}


var createExecution = async function(execution_input, key) {

  let token = parse_token(key);
  let decoded = jwt.verify(token, public_pem, { algorithms: ['RS256'] });
  let username = decoded['username'];

  execution_input['test_conductors'] = [username];
  
  let venue_id = execution_input['venue_id'];

  let execution_id = null;

  let response = null;
  try {
    const url = `${archiveLocation}/venues/${venue_id}`;
    response = await axios.get(url, {headers: {'Authorization': key}});
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }

  let venue_info = response.data;
  
  try {
    const url = `${archiveLocation}/executions`;    
    response = await axios.post(url, execution_input, {headers: {'Authorization': key}});
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }  
  let execution_info = response.data;
  execution_id = execution_info['execution_id'];

  try {
    const url = `${executionLocation}/executions/${execution_id}`;    
    response = await axios.put(url, venue_info, {headers: {'Authorization': key}});
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }

  try {
    const url = `${archiveLocation}/venues/${venue_id}/status`;
    const data = {
      'status': 'IN_USE', 
      'started_on': execution_info['time_started'], 
      'test_conductor': username, 
      'execution_id': execution_id
    };
    response = await axios.patch(url, data, {headers: {'Authorization': key}});
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
  return execution_info;
}

var addExecutionConversation = async function(execution_id, elem_id, conversation, key) {
  try {
    const url = `${archiveLocation}/executions/${execution_id}/elements/${elem_id}/conversations`;  
    let response = await axios.post(url, conversation, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var getExecutionConversations = async function(execution_id, elem_id, offset, limit, key) {
  let params = {}
  if (offset)
    params['offset'] = offset;
  if (limit)
    params['limit'] = limit;
  
  try {
    const url = `${archiveLocation}/executions/${execution_id}/elements/${elem_id}/conversations`;  
    let response = await axios.get(url, {params: params, headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var getExecutionConversation = async function(execution_id, elem_id, conversation_id, key) {
  try {
    const url = `${archiveLocation}/executions/${execution_id}/elements/${elem_id}/conversations/${conversation_id}`;  
    let response = await axios.get(url, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var updateExecutionConversation = async function(execution_id, elem_id, conversation_id, conversation, key) {
  try {
    const url = `${archiveLocation}/executions/${execution_id}/elements/${elem_id}/conversations/${conversation_id}`;  
    let response = await axios.patch(url, conversation, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var deleteExecutionConversation = async function(execution_id, elem_id, conversation_id, key) {
  try {
    const url = `${archiveLocation}/executions/${execution_id}/elements/${elem_id}/conversations/${conversation_id}`;  
    let response = await axios.delete(url, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var addExecutionComment = async function(execution_id, elem_id, conversation_id, comment, key) {
  try {
    const url = `${archiveLocation}/executions/${execution_id}/elements/${elem_id}/conversations/${conversation_id}/comments`;  
    let response = await axios.post(url, comment, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var getExecutionComments = async function(execution_id, elem_id, conversation_id, offset, limit, key) {
  let params = {}
  if (offset)
    params['offset'] = offset;
  if (limit)
    params['limit'] = limit;
  
  try {
    const url = `${archiveLocation}/executions/${execution_id}/elements/${elem_id}/conversations/${conversation_id}/comments`;  
    let response = await axios.get(url, {params: params, headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var getExecutionComment = async function(execution_id, elem_id, conversation_id, comment_id, key) {
  try {
    const url = `${archiveLocation}/executions/${execution_id}/elements/${elem_id}/conversations/${conversation_id}/comments/${comment_id}`;  
    let response = await axios.get(url, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var updateExecutionComment = async function(execution_id, elem_id, conversation_id, comment_id, comment, key) {
  try {
    const url = `${archiveLocation}/executions/${execution_id}/elements/${elem_id}/conversations/${conversation_id}/comments/${comment_id}`;  
    let response = await axios.patch(url, comment, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var deleteExecutionComment = async function(execution_id, elem_id, conversation_id, comment_id, key) {
  try {
    const url = `${archiveLocation}/executions/${execution_id}/elements/${elem_id}/conversations/${conversation_id}/comments/${comment_id}`;  
    let response = await axios.delete(url, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var addProcedureConversation = async function(procedure_id, version, elem_id, conversation, key) {
  try {
    const url = `${archiveLocation}/procedures/${procedure_id}/versions/${version}/elements/${elem_id}/conversations`;  
    let response = await axios.post(url, conversation, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var getProcedureConversations = async function(procedure_id, version, elem_id, offset, limit, key) {
  let params = {}
  if (offset)
    params['offset'] = offset;
  if (limit)
    params['limit'] = limit;
  
  try {
    const url = `${archiveLocation}/procedures/${procedure_id}/versions/${version}/elements/${elem_id}/conversations`;  
    let response = await axios.get(url, {params: params, headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var getProcedureConversation = async function(procedure_id, version, elem_id, conversation_id, key) {
  try {
    const url = `${archiveLocation}/procedures/${procedure_id}/versions/${version}/elements/${elem_id}/conversations/${conversation_id}`;  
    let response = await axios.get(url, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var updateProcedureConversation = async function(procedure_id, version, elem_id, conversation_id, conversation, key) {
  try {
    const url = `${archiveLocation}/procedures/${procedure_id}/versions/${version}/elements/${elem_id}/conversations/${conversation_id}`;  
    let response = await axios.patch(url, conversation, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var deleteProcedureConversation = async function(procedure_id, version, elem_id, conversation_id, key) {
  try {
    const url = `${archiveLocation}/procedures/${procedure_id}/versions/${version}/elements/${elem_id}/conversations/${conversation_id}`;  
    let response = await axios.delete(url, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var addProcedureComment = async function(procedure_id, version, elem_id, conversation_id, comment, key) {
  try {
    const url = `${archiveLocation}/procedures/${procedure_id}/versions/${version}/elements/${elem_id}/conversations/${conversation_id}/comments`;  
    let response = await axios.post(url, comment, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var getProcedureComments = async function(procedure_id, version, elem_id, conversation_id, offset, limit, key) {
  let params = {}
  if (offset)
    params['offset'] = offset;
  if (limit)
    params['limit'] = limit;
  
  try {
    const url = `${archiveLocation}/procedures/${procedure_id}/versions/${version}/elements/${elem_id}/conversations/${conversation_id}/comments`;  
    let response = await axios.get(url, {params: params, headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var getProcedureComment = async function(procedure_id, version, elem_id, conversation_id, comment_id, key) {
  try {
    const url = `${archiveLocation}/procedures/${procedure_id}/versions/${version}/elements/${elem_id}/conversations/${conversation_id}/comments/${comment_id}`;  
    let response = await axios.get(url, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var updateProcedureComment = async function(procedure_id, version, elem_id, conversation_id, comment_id, comment, key) {
  try {
    const url = `${archiveLocation}/procedures/${procedure_id}/versions/${version}/elements/${elem_id}/conversations/${conversation_id}/comments/${comment_id}`;  
    let response = await axios.patch(url, comment, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var deleteProcedureComment = async function(procedure_id, version, elem_id, conversation_id, comment_id, key) {
  try {
    const url = `${archiveLocation}/procedures/${procedure_id}/versions/${version}/elements/${elem_id}/conversations/${conversation_id}/comments/${comment_id}`;  
    let response = await axios.delete(url, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}


var moveElement = async function(execution_id, move_element_input, key) {
  try {
    const url = `${archiveLocation}/executions/${execution_id}/elements/move`;
    let response = await axios.post(url, move_element_input, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var copyElement = async function(execution_id, copy_element_input, key) {
  try {
    const url = `${archiveLocation}/executions/${execution_id}/elements/copy`;
    let response = await axios.post(url, copy_element_input, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var as_run = async function(execution_id, key) {
  try {
    const url = `${archiveLocation}/executions/${execution_id}/as_run`;
    let response = await axios.get(url, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var history_execution = async function(execution_id, offset, limit, sort, key) {
  const params = {};
  if(offset)
    params['offset'] = offset;
  if(limit)
    params['limit'] = limit; 
  if(sort)
    params['sort'] = sort;
           
  try {
    const url = `${archiveLocation}/executions/${execution_id}/history`;    
    let response = await axios.get(url, {params: params, headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}


var createProcedure = async function(procedure, key) {
  var token = parse_token(key);
  let decoded = jwt.verify(token, public_pem, { algorithms: ['RS256'] });
  let username = decoded['username'];
  procedure['author'] = username;

  try {
    const url = `${archiveLocation}/procedures`;    
    let response = await axios.post(url, procedure, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var createProcedureLabel = async function(procedure_label, key) {
  try {
    const url = `${archiveLocation}/procedures/labels`;    
    let response = await axios.post(url, procedure_label, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    console.log('error in archive', err);
    return Promise.reject(transform_axios_error(err));
  }
}

var getProcedureLabels = async function(offset, limit, sort, name, description, key) {

  let params = {}
  if (offset)
    params['offset'] = offset;
  if (limit)
    params['limit'] = limit;
  if (sort)
    params['sort'] = sort;
  if (name)
    params['name'] = name;
  if (description)
    params['description'] = description;  

  try {
    const url = `${archiveLocation}/procedures/labels`;   
    let response = await axios.get(url, {params: params, headers: {'Authorization': key}});
    let total_count = response['headers']['x-total-count'] ? response['headers']['x-total-count'] : 0;

    return {'procedure_labels': response.data, 'total_count': total_count};
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var removeProcedureLabel = async function(label_id, key) {
  try {
    const url = `${archiveLocation}/procedures/labels/${label_id}`;
    await axios.delete(url, {headers: {'Authorization': key}});
    return;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var _updateExecutionStatus = async function(execution_id, execution_status, key) {
  try {
    const url = `${archiveLocation}/executions/${execution_id}/status`;    
    let response = await axios.post(url, execution_status, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var _isOpenStatus = function(status) {
  const closed_index = EXEC_STATUSES.indexOf('CLOSED');
  const index = EXEC_STATUSES.indexOf(status);

  return (index > -1) && (index < closed_index);
}

var _isCompleteStatus = function(status) {
  const closed_index = EXEC_STATUSES.indexOf('CLOSED');
  const index = EXEC_STATUSES.indexOf(status);

  return (index > -1) && (index >= closed_index);
}

var updateExecutionStatus = async function(execution_id, execution_status, key) {
  const execution = await getExecution(execution_id, key);
  const venue_id = execution['venue_id'];
  const current_status = execution['status'];
  const new_status = execution_status['status'];

  if (_isCompleteStatus(current_status) && _isOpenStatus(new_status)) {
    return Promise.reject(`Execution has been closed (${execution_id}, ${current_status}). Cannot transition back to ${new_status}`);
  }

  if (_isOpenStatus(current_status) && new_status == 'CLOSED') {
    try {
      log.debug(`Closing execution. halt_execution. execution_id: ${execution_id}`);
      await halt_execution(execution_id, key);
    } catch (err) {
      log.error(`Closing execution. halt_execution. execution_id: ${execution_id} details: ${util.inspect(err)}`);
    }
    
    try {
      log.debug(`Closing execution. remove_break_points. execution_id: ${execution_id}`);
      await remove_break_points(execution_id, key);
    } catch (err) {
      log.error(`Closing execution. remove_break_points. execution_id: ${execution_id} details: ${util.inspect(err)}`);
    }
    
    try {
      log.debug(`Closing execution. refresh_execution. execution_id: ${execution_id}`);
      await refresh_execution(execution_id, key);
    } catch (err) {
      log.error(`Closing execution. refresh_execution. execution_id: ${execution_id} details: ${util.inspect(err)}`);
    }    
    
    const venue_info = await getVenue(venue_id, key);
    const venue_name = venue_info.name;
    const venue_status = venue_info.venue_status;

    if (venue_status === undefined) {
      return Promise.reject(`Venue status was not found. venue name: ${venue_info.name} venue_id: ${venue_info.venue_id}`);
    }

    const venue_execution_id = venue_status['execution_id'];

    let to_release_venue = false;
    // Release the venue only if it is used by the current execution
    if (venue_execution_id === execution_id) {
      to_release_venue = true;
    } else {
      log.warning(`Venue is not in use by this execution and won't be released. venue: ${venue_name} execution_id: ${execution_id} venue_execution_id: ${venue_execution_id}`);
    }
    
    if (to_release_venue) {
      try {
        let venue_status = {'status': 'AVAILABLE', 'execution_id' : '', 'test_conductor' : ''};
        await updateVenueStatus(venue_id, venue_status, key);
      } catch (err) {
        log.error(`Error when releasing a venue. execution_id: ${execution_id} venue_id: ${venue_id} details: ${util.inspect(err)}`);
      }
    }
  } else if (new_status == 'SUSPENDED') {
    try {
      await _releaseVenueToSuspend(execution_id, false, key);
    } catch (err) {
      log.error(`Error when releasing a venue. execution_id: ${execution_id} details: ${util.inspect(err)}`);
    }        
  }
  
  return await _updateExecutionStatus(execution_id, execution_status, key);
}

var _releaseVenueToSuspend = async function(execution_id, force, key) {
  const execution = await getExecution(execution_id, key);
  const venue_id = execution['venue_id'];
  let to_release_venue = false;

  if (execution.status === 'SUSPENDED') {
    // allow suspending it again
    log.warning(`Trying to suspend execution again. execution_id: ${execution_id}`);
  }
  else if (execution.status !== 'IDLE') {
    if (!force) {
      return Promise.reject(`Cannot suspend execution that is not idle. execution_id: ${execution_id} status: ${execution.status}`);
    }
  }

  // Release the venue only if it is used by the current execution
  const venue_info = await getVenue(venue_id, key);
  const venue_name = venue_info.name;
  const venue_status = venue_info.venue_status;
  const venue_execution_id = venue_status['execution_id'];

  if (venue_execution_id === execution_id) {
    to_release_venue = true;
  } else {
    log.warning(`Venue is not in use by this execution and won't be released. _releaseVenueToSuspend venue: ${venue_name} execution_id: ${execution_id} venue_execution_id: ${venue_execution_id}`);
  }

  if (to_release_venue) {
    let venue_status = {'status': 'AVAILABLE', 'execution_id' : '', 'test_conductor' : '', 'started_on': ''};
    await updateVenueStatus(venue_id, venue_status, key);
  }
  return execution;
}

var updateExecution = async function(execution_id, execution_meta_data, key) {
  log.debug(`updateExecution execution_id: ${execution_id}`, execution_meta_data);
  try {
    const url = `${archiveLocation}/executions/${execution_id}`;
    const response = await axios.patch(url, execution_meta_data, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var setExecutionBoundary = async function(execution_id, elem_id, key) {
  try {
    const url = `${archiveLocation}/executions/${execution_id}/boundary_elem`;
    const params = {'elem_id': elem_id};
    const response = await axios.post(url, {}, {params: params, headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var halt_execution = async function(execution_id, key) {
  try {
    log.info(`halt_execution execution`, {execution_id: execution_id});
    const url = `${executionLocation}/executions/${execution_id}/halt`;
    // use timeout in case execution server is not responding
    const response = await axios.post(url, {}, {headers: {'Authorization': key}, timeout: 5000});
  } catch (err) {
    if (err.response && err.response.status === 404) {
      // This may happen when an execution is closed.
      log.info(`No step to cancel in execution service. execution_id: ${execution_id}`);
    } else {
      log.warning(`Error when halting execution service. execution_id: ${execution_id}`, {data: err});
    }
  }
 
  let execution = {};
  log.debug(`halt_execution. Set the status to IDLE.`, {execution_id: execution_id});
  try {
    execution = await updateExecution(execution_id, {'status': 'IDLE'}, key);
  } catch (err) {
    log.warning('halt_execution. Failed to set execution status to IDLE', {execution_id: execution_id, data: err});
  }

  return execution;
}

var pause_execution = async function(execution_id, key) {

  let execution = await getExecution(execution_id, key);
  // pause only when execution is in RUNNING status
  if (execution.status == 'RUNNING') {
    execution = await updateExecution(execution_id, {'status': 'PAUSED'}, key);
  }
  return execution;
}

var continue_execution = async function(execution_id, key){
  let token = parse_token(key);
  let decoded = jwt.verify(token, public_pem, { algorithms: ['RS256'] });
  let username = decoded['username'];

  let venue_info = null;
  
  const execution_info = await getExecution(execution_id, key);
  const venue_id = execution_info['venue_id'];  
  const venue_status = await getVenueStatus(venue_id, key);
  const test_conductor = venue_status ? venue_status['test_conductor'] : '';

  if(username !== test_conductor) {
    return Promise.reject({
      message: `Only the test conductor can continue execution. username: ${username} test_conductor: ${test_conductor}`, 
      http_code_at_source: 403
    });
  }

  try {
    const url = `${archiveLocation}/venues/${venue_id}`;
    const response = await axios.get(url, {headers: {'Authorization': key}});
    venue_info = response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }  

  try {
    const url = `${executionLocation}/executions/${execution_id}`;
    const response = await axios.put(url, venue_info, {headers: {'Authorization': key}});
    venue_info = response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }    
}

var wait_switch_timeout = async function (execution_id) {
  const {switch_wait_secs} = await get_switch_wait(execution_id);
  log.debug(`switch_wait_secs: ${switch_wait_secs}`);
  if (switch_wait_secs > 0) {
    const key = `${EXECUTION_SWITCH_WAIT_FLAG}:${execution_id}`;
    const time_stemp = `${new Date()}`;
    redis.set(key, time_stemp, 'EX', config.EXECUTION_SWITCH_WAIT_SEC);
  
    let value = await redis.get(key);
    while (value) {
      log.debug(`wait key: ${key}`);
      await sleep_miliseconds(500);
      value = await redis.get(key);
    }
  }
}

var set_switch_wait = async function(execution_id, switch_wait_input) {
  const key = `${EXECUTION_SWITCH_WAIT}:${execution_id}`;
  await redis.set(key, `${switch_wait_input.switch_wait_secs}`);
  return await get_switch_wait(execution_id);
}

var get_switch_wait = async function(execution_id) {
  const key = `${EXECUTION_SWITCH_WAIT}:${execution_id}`;
  const switch_wait_secs_str = await redis.get(key);
  let switch_wait_secs = parseInt(switch_wait_secs_str);
  switch_wait_secs = isNaN(switch_wait_secs) ? config.EXECUTION_SWITCH_WAIT_SEC : switch_wait_secs;
  return {switch_wait_secs: switch_wait_secs};
}

var get_switch_wait_flag = async function(execution_id) {
  const key = `${EXECUTION_SWITCH_WAIT_FLAG}:${execution_id}`;
  let switch_wait_flag = await redis.get(key);
  switch_wait_flag = switch_wait_flag ? switch_wait_flag : '';
  return {switch_wait_flag: switch_wait_flag};
}

var delete_switch_wait_flag = async function(execution_id) {
  const key = `${EXECUTION_SWITCH_WAIT_FLAG}:${execution_id}`;
  await redis.del(key);
  return await get_switch_wait_flag(execution_id);
}



var delete_element = async function(execution_id, procedure_id, elem_id, key){
  let url = '';
  if(execution_id) {
    url = `${archiveLocation}/executions/${execution_id}/elements/${elem_id}`;
  }
  else if (procedure_id) {
    url = `${archiveLocation}/procedures/${procedure_id}/elements/${elem_id}`;
  }
  else {
    return Promise.reject('execution_id or procedure_id was not provided');
  } 

  try {
    let response = await axios.delete(url, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var replace_element = async function(procedure_id, elem_id, replace_element_input, key) {
  let url = `${archiveLocation}/procedures/${procedure_id}/elements/${elem_id}/replace`;
  try {
    let response = await axios.post(url, replace_element_input, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var get_step_input = async function(execution_id, procedure_id, elem_id, key) {
  let url = '';

  if(execution_id) {
    url = `${archiveLocation}/executions/${execution_id}/steps/${elem_id}/input`;
  }
  else if (procedure_id) {
    url = `${archiveLocation}/procedures/${procedure_id}/steps/${elem_id}/input`;
  }
  else {
    return Promise.reject('execution_id or procedure_id was not provided');
  }  

  try {
    let response = await axios.get(url, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

/*
 * For non-executable steps, do not use "input" end point of archive that will keep track of history of inputs.
 * Instead set input directly in the step definition by patching the step itself.
 */
var update_step_input_nonexecutable = async function(execution_id, procedure_id, elem_id, user_input, key){
  let url = '';
  let data = {};

  if(execution_id) {
    url = `${archiveLocation}/executions/${execution_id}/steps/${elem_id}`;
    data = {"execution_user_input": user_input};
  }
  else if (procedure_id) {
    url = `${archiveLocation}/procedures/${procedure_id}/steps/${elem_id}`;
    data = {"authoring_user_input": user_input};
  }
  else {
    return Promise.reject('execution_id or procedure_id was not provided');
  }   

  try {
    let response = await axios.patch(url, data, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var update_step_input = async function(execution_id, procedure_id, elem_id, user_input, key) {
  let url = '';

  if(execution_id) {
    url = `${archiveLocation}/executions/${execution_id}/steps/${elem_id}/input`;
  }
  else if (procedure_id) {
    url = `${archiveLocation}/procedures/${procedure_id}/steps/${elem_id}/input`;
  }
  else {
    return Promise.reject('execution_id or procedure_id was not provided');
  }   


  try {
    let response = await axios.post(url, user_input, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var get_step_result = async function(execution_id, elem_id, key) {
  try {
    const url = `${archiveLocation}/executions/${execution_id}/steps/${elem_id}/result`;
    let response = await axios.get(url, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var update_step_result = async function(execution_id, elem_id, result, key) {
  try {
    const url = `${archiveLocation}/executions/${execution_id}/steps/${elem_id}/result`;
    let response = await axios.post(url, result, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var create_new_run = async function(execution_id, elem_id, key) {
  let response = null;

  try {
    const url = `${archiveLocation}/executions/${execution_id}/steps/${elem_id}/new_run`;
    response = await axios.post(url, {}, {headers: {'Authorization': key}});
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }

  try {
    await update_execution_rest(execution_id, {'current_step_id': elem_id}, key);
  } catch (err) {
    log.warning(`Create new run. Failed to update the current_step_id. execution_id: ${execution_id} elem_id: ${elem_id}`);
  }

  return response.data;
}

var override_step = async function(execution_id, elem_id, override_input, key) {
  const step = await getStep(execution_id, null, elem_id, key);
  const step_status = get_step_status(step);

  if (step_status === 'PASS') {
    step.execution.meta_data.status = 'OVERRIDE_FAIL';
  } else if (step_status === 'FAIL') {
    step.execution.meta_data.status = 'OVERRIDE_PASS';
  } else {
    return Promise.reject(`Cannot override status that is not PASS or FAIL. number: ${step.number} status: ${step_status}`);
  }

  // old steps may not have executable flag. Consider them as EXECUTED
  if (step.hasOwnProperty('executable') && step.executable !== 'EXECUTED') {
    return Promise.reject(`Cannot override status of non-executable step. number: ${step.number} executable: ${step.executable}`);
  }  

  step.execution.meta_data.override_justification = override_input.override_justification || '';
  step.execution.meta_data.overridden_by = parse_username(key);
  step.execution.meta_data.time_overridden = new Date();

  return await updateStep(execution_id, null, elem_id, {execution: step.execution}, key);
}

var update_override_step = async function(execution_id, elem_id, override_input, key) {
  const step = await getStep(execution_id, null, elem_id, key);
  const step_status = get_step_status(step);

  if (step_status !== 'OVERRIDE_FAIL' && step_status !== 'OVERRIDE_PASS') {
    return Promise.reject(`Step has not been overriden. Cannot update its meta data. number: ${step.number} status: ${step_status}`);
  }

  step.execution.meta_data.override_justification = override_input.override_justification || '';
  return await updateStep(execution_id, null, elem_id, {execution: step.execution}, key);
}

var discard_override_step = async function(execution_id, elem_id, key) {
  const step = await getStep(execution_id, null, elem_id, key);
  const step_status = get_step_status(step);

  if (step_status === 'OVERRIDE_FAIL') {
    step.execution.meta_data.status = 'PASS';
  } else if (step_status === 'OVERRIDE_PASS') {
    step.execution.meta_data.status = 'FAIL';
  } else {
    return Promise.reject(`Cannot discard override status that was not overriden. number: ${step.number} status: ${step_status}`);
  }

  step.execution.meta_data.override_justification = '';
  step.execution.meta_data.overridden_by = '';
  step.execution.meta_data.time_overridden = '';

  return await updateStep(execution_id, null, elem_id, {execution: step.execution}, key);
}

var sleep_miliseconds = function (msecs) {
  return new Promise(resolve => setTimeout(resolve, msecs));
}

var update_section = async function(execution_id, procedure_id, elem_id, section, key) {
  let url = '';

  if(execution_id) {
    url = `${archiveLocation}/executions/${execution_id}/sections/${elem_id}`;
  }
  else if (procedure_id) {
    url = `${archiveLocation}/procedures/${procedure_id}/sections/${elem_id}`;
  }
  else {
    return Promise.reject('execution_id or procedure_id was not provided.');
  }

  // remove properties that are managed internally so that they are not changed directly via this API call.  
  sanitizeInputElement(section);

  try {
    const response = await axios.patch(url, section, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var get_section = async function(execution_id, procedure_id, elem_id, key) {
  let url = '';

  if(execution_id) {
    url = `${archiveLocation}/executions/${execution_id}/sections/${elem_id}`;
  }
  else if (procedure_id) {
    url = `${archiveLocation}/procedures/${procedure_id}/sections/${elem_id}`;
  }
  else {
    return Promise.reject('execution_id or procedure_id was not provided.');
  }
  
  try {
    const response = await axios.get(url, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var update_paragraph = async function(execution_id, procedure_id, elem_id, paragraph, key) {
  let url = '';

  if(execution_id) {
    url = `${archiveLocation}/executions/${execution_id}/paragraphs/${elem_id}`;
  }
  else if (procedure_id) {
    url = `${archiveLocation}/procedures/${procedure_id}/paragraphs/${elem_id}`;
  }
  else {
    return Promise.reject('execution_id or procedure_id was not provided.');
  }

  // remove properties that are managed internally so that they are not changed directly via this API call.  
  sanitizeInputElement(paragraph);

  try {
    const response = await axios.patch(url, paragraph, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var get_paragraph = async function(execution_id, procedure_id, elem_id, key) {
  let url = '';

  if(execution_id) {
    url = `${archiveLocation}/executions/${execution_id}/paragraphs/${elem_id}`;
  }
  else if (procedure_id) {
    url = `${archiveLocation}/procedures/${procedure_id}/paragraphs/${elem_id}`;
  }
  else {
    return Promise.reject('execution_id or procedure_id was not provided.');
  }

  try {
    const response = await axios.get(url, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

function getLogging() {
  return {'level': log.level.toUpperCase()};
}

function updateLogging(logging_info) {
  log.level = logging_info['level'].toLowerCase();
}

function findLevel(as_run, elem_id) {
  var deferred = Q.defer();
  for(let i = 0; i < as_run.length; i++){
    if(as_run[i]['elem_id'] == elem_id){

      deferred.resolve(as_run);
    }
    else if(as_run[i]['children'] && as_run[i]['children'].length > 0){
      findLevel(as_run[i]['children'], elem_id)
      .then((results) => {
        return results
      })
    }
  }
  return deferred.promise;
}
//Recurse function
// TODO: why do we use promise here?
function NumerTOC(section, elem_id, toc) {
  var deferred = Q.defer();
  for(let i = 0; i < section.length; i++){
    if(section[i]['elem_type'] == "PARAGRAPH")
      continue
    else if (section[i]['children'] && section[i]['children'].length > 0) {
      toc.push({"number" : section[i]['number'], "title" : section[i]['title']})
      NumerTOC(section[i]['children'], elem_id, toc).then((res) => deferred.resolve(res))
    } else {
      toc.push({"number" : section[i]['number'], "title" : section[i]['title']})
      deferred.resolve(toc);
    }
  }
  return deferred.promise;
}

function executeTOC(step, key, as_run){
  log.trace(`executeTOC step: ${JSON.stringify(as_run)}`)
  return findLevel(as_run['children'], step['elem_id'])
  .then((results) => {
    return NumerTOC(results, step['elem_id'], [])
  })
  .then((item) => {
    step['execution']['results']['entries'] = item
    // update only execution
    return updateExecutionStep(step['execution_id'], step['elem_id'], {'execution': step['execution']}, false, key)
  })
}

function executeAnalysis(step, key) {
  if(step['execution_user_input']['analysis_text'])
    step['execution']['results']['analysis_text'] = item['execution_user_input']['analysis_text']
  if(step['execution_user_input']['verification_status'])
    step['execution']['results']['verification_status'] = item['execution_user_input']['verification_status']
  return updateExecutionStep(step['execution_id'], step['elem_id'], step, false, key)
}

function compute_execution_element_(step, elem_map, username) {
  if (step.step_type == 'VERIFICATION_ITEM_STATUS') {
    // update title, number of referenced steps
    if (step.execution_user_input && step.execution_user_input.steps) {
      step.execution_user_input.steps.forEach(function (input_step) {
        if (elem_map.hasOwnProperty(input_step.elem_id)) {
          let elem = elem_map[input_step.elem_id];
          if (elem) {
            input_step['number'] = elem.number;
            input_step['title'] = elem.title;
          } else {
            log.warning(`compute_execution_element_ element was not found in map. ${input_step.elem_id}`);
          }
        }
      });
    }

    // update status for execution element
    let results = extend(true, {}, step.execution_user_input);

    let input_steps = results.steps || [];

    input_steps.forEach(function (input_step) {
      if (elem_map.hasOwnProperty(input_step.elem_id)) {
        let verifying_step = elem_map[input_step.elem_id];
        // step created in an older version may not have 'verifiable' field. Treat it as verifiable.
        if ((!verifying_step.hasOwnProperty('verifiable')) || verifying_step.verifiable) {
          if (verifying_step.execution && verifying_step.execution.meta_data && verifying_step.execution.meta_data.status) {
            input_step['status'] = verifying_step.execution.meta_data.status;
          } else {
            input_step['status'] = 'NONE';
          }
        } else {
          // treat steps that are not verifiable as PASS
          input_step['status'] = 'PASS';
        }        
      } else {
        input_step['status'] = 'NOT_FOUND';
      }
    });

    let pass = true;   
    input_steps.forEach(function (input_step) {
      if ((input_step['status'] != 'PASS') && (input_step['status'] != 'OVERRIDE_PASS')) {
        pass = false;
      }
    });

    let current_time = new Date();

    let execution_data = {
      'meta_data' : {
        'test_conductor': username,         
        'time_started': current_time, 
        'time_updated': current_time,
        'time_completed': current_time, 
        'error' : {}, 
        'status' : pass ? 'PASS' : 'FAIL'
      }, 
      'results': results
    };

    step['execution'] = execution_data;
    // need to set this to support "refresh_execution" that does not use "runExecution".
    step['executed'] = true;
  }

  return step;
}


async function compute_execution_element(execution_id, elem_id, key) {
  log.debug('compute_execution_element');

  let decoded = jwt.verify(parse_token(key), public_pem, { algorithms: ['RS256'] });
  let username = decoded['username'] || '';  

  let {elems, total_count} = await getExecutionElements(execution_id, 'STEP', null, 0, 10000, 'ASC', null, 
    null, null, null, null, key);
  let steps = elems;

  let elem_map = {};

  let target_step = null;

  steps.forEach(function (step) {
    elem_map[step.elem_id] = step;
    if (step.elem_id == elem_id) {
      target_step = step;
    }
  });

  if (target_step == null) {
    return Promise.reject(`element was not found. execution_id: ${execution_id} elem_id: ${elem_id}`);
  }

  target_step = compute_execution_element_(target_step, elem_map, username);
  // TODO: handle error?
  return await updateExecutionElement(execution_id, elem_id, target_step, key);
}

async function compute_procedure_element(procedure_id, elem_id, key) {

  let {elems, total_count} = await getProcedureElements(procedure_id, 'STEP', null, 0, 10000, 'ASC', null, key);
  let steps = elems;

  let elem_map = {};

  let target_step = null;

  steps.forEach(function (step) {
    elem_map[step.elem_id] = step;
    if (step.elem_id == elem_id) {
      target_step = step;
    }
  });

  if (target_step == null) {
    return Promise.reject(`element was not found. procedure_id: ${procedure_id} elem_id: ${elem_id}`);
  }

  target_step = compute_procedure_element_(target_step, elem_map);
  target_step = await updateProcedureElement(procedure_id, elem_id, target_step, key);

  return computed_step;
}

async function refresh_execution(execution_id, key) {

  let decoded = jwt.verify(parse_token(key), public_pem, { algorithms: ['RS256'] });
  let username = decoded['username'] || '';

  let {elems, total_count} = await getExecutionElements(execution_id, 'STEP', null, 0, 10000, 'ASC', null, 
    null, null, null, null, key);
  let steps = elems;

  let elem_map = {};
  let steps_to_compute = [];
  let steps_to_update = [];

  steps.forEach(function (step) {
    elem_map[step.elem_id] = step;
    if (step.step_type == 'VERIFICATION_ITEM_STATUS') {
      steps_to_compute.push(step);
    }
  });

  steps_to_compute.forEach(function (step_to_compute) {
    let computed_step = compute_execution_element_(step_to_compute, elem_map, username);
    steps_to_update.push(computed_step);
  });

  return await updateExecutionElements(execution_id, steps_to_update, key);
}

async function resume_execution(execution_id, resume_input, key) {
  let token = parse_token(key);
  let decoded = jwt.verify(token, public_pem, { algorithms: ['RS256'] });
  let username = decoded['username'];
  
  let venue_id = resume_input['venue_id'];
  let response = null;
  
  if (!venue_id) {
    return Promise.reject(`Venue info was not provided. venue_id: ${venue_id}`);
  }

  let execution_info = await getExecution(execution_id, key);
  if (execution_info.status !== 'SUSPENDED') {
    return Promise.reject(`Cannot resume execution that is not suspended. execution_id: ${execution_id} status: ${execution_info.status}`);
  }
  const venue_info = await getVenue(venue_id, key);

  const venue_status = venue_info.venue_status;
  if (venue_status === undefined) {
    return Promise.reject(`Venue status was not found. venue name: ${venue_info.name} venue_id: ${venue_info.venue_id}`);
  }
  if (venue_status.status !== 'AVAILABLE' || venue_status.execution_id) {
    return Promise.reject(`Cannot resume execution on a venue that is not available. status: ${venue_status.status} execution_id: ${venue_status.execution_id}`);
  }
  
  let test_conductors = [];
  if (execution_info.test_conductors) {
    execution_info.test_conductors.forEach(test_conductor => test_conductors.push(test_conductor));
  } else {
    log.warning(`test conductors were not defined. execution_id: ${execution_id}`);
  }
  
  // add the current user as test conductor if not already the TC last time
  if (!test_conductors.includes(username)) {
    test_conductors.push(username);
  }
  
  const execution_input = {
    test_conductors: test_conductors,
    venue_id: venue_id,
    venue_name: venue_info.name
  };

  // update execution info
  try {
    const url = `${archiveLocation}/executions/${execution_id}`;    
    response = await axios.patch(url, execution_input, {headers: {'Authorization': key}});
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
  
  // update execution status
  execution_info = await _updateExecutionStatus(execution_id, {status: 'IDLE', comment: 'resume execution'}, key);
    
  // register in execution server
  try {
    const url = `${executionLocation}/executions/${execution_id}`;    
    response = await axios.put(url, venue_info, {headers: {'Authorization': key}});
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }

  // update venue status
  try {
    const url = `${archiveLocation}/venues/${venue_id}/status`;
    const data = {
      'status': 'IN_USE',
      'started_on': new Date(), 
      'test_conductor': username, 
      'execution_id': execution_id
    };
    response = await axios.patch(url, data, {headers: {'Authorization': key}});
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }

  return execution_info;
}

async function suspend_resume_execution(execution_id, suspend_resume_input, key) {
  let target_execution_id = suspend_resume_input['target_execution_id'];
  if (!target_execution_id) {
    return Promise.reject(`Target execution id was not provided. target_execution_id: ${target_execution_id}`);
  }

  let execution_info = await getExecution(execution_id, key);
  if (execution_info.status !== 'IDLE') {
    return Promise.reject(`Cannot suspend execution that is not idle. execution_id: ${execution_id} status: ${execution_info.status}`);
  }  

  const venue_id = execution_info.venue_id;
  if (!venue_id) {
    return Promise.reject(`Execution does have have venue info. execution_id: ${execution_id}`);
  }

  let target_execution_info = await getExecution(target_execution_id, key);
  if (target_execution_info.status !== 'SUSPENDED') {
    return Promise.reject(`Cannot resume execution that is not suspended. execution_id: ${target_execution_id} status: ${target_execution_info.status}`);
  }
  
  if (execution_info.venue_id != target_execution_info.venue_id) {
    return Promise.reject(`Executions are not on the same venue. ${execution_id} is on ${execution_info.venue_name} and ${target_execution_id} is on ${target_execution_info.venue_name} `);
  }  

  await _releaseVenueToSuspend(execution_id, true, key);
  await _updateExecutionStatus(execution_id, {status: 'SUSPENDED', comment: ''}, key);
  await updateExecution(target_execution_id, {
      mode: execution_info.mode,
      delay: execution_info.delay,
      pause_conditions: execution_info.pause_conditions,
      participants: execution_info.participants,
      redline_approvers: execution_info.redline_approvers,
    }, 
    key
  );
  await copy_execution_state(execution_id, target_execution_id, key);
  return await resume_execution(target_execution_id, {venue_id: venue_id}, key);
}

async function copy_execution_state(execution_id, target_execution_id, key) {
    // copy switch wait value
    const switch_wait_info = await get_switch_wait(execution_id);
    await set_switch_wait(target_execution_id, switch_wait_info);
    
    // copy state in execution server
    let url = `${executionLocation}/executions/${execution_id}/copy_state`;
    const params = {'target_execution_id': target_execution_id};
    let response = await axios.post(url, {}, {params: params, headers: {'Authorization': key}});
    return response.data;
}

async function remove_break_points(execution_id, key) {

  let decoded = jwt.verify(parse_token(key), public_pem, { algorithms: ['RS256'] });
  let username = decoded['username'] || '';

  let {elems, total_count} = await getExecutionElements(execution_id, null, null, 0, 10000, 'ASC', null, 
    null, null, null, null, key);

  let elems_to_update = elems.map(elem => ({elem_id: elem['elem_id'], break_point: 'NONE'}));

  let elems_updated = await updateExecutionElements(execution_id, elems_to_update, key);

  return elems_updated.map(elem => ({elem_id: elem['elem_id'], break_point: elem['break_point']}));
}

// If vi_map is null or undefined, VI's won't be checked
// If script_map is null or undefined, scripts won't be checked
async function refresh_procedure_element_(elem, elem_map, vi_map, script_map, key) {
  const changed_items = [];
  let user_action_msg = '';

  if (elem.step_type == 'VERIFICATION_ITEM') {
    if (elem.authoring_user_input && elem.authoring_user_input.vis && vi_map) {
      elem.authoring_user_input.vis = check_vis(elem.authoring_user_input.vis, vi_map, changed_items);
    }
  }
  else if (elem.step_type == 'VERIFICATION_ITEM_STATUS') {
    if (elem.authoring_user_input && elem.authoring_user_input.vis && vi_map) {
      elem.authoring_user_input.vis = check_vis(elem.authoring_user_input.vis, vi_map, changed_items);
    }

    const updated_input_steps = [];
    if (elem.authoring_user_input && elem.authoring_user_input.steps) {
      for (const input_step of elem.authoring_user_input.steps) {
        let number = input_step.number;
        let title = input_step.title;
        let item_name = `${number}: ${title}`;

        let elem_ref = elem_map[input_step.elem_id];
        if (elem_ref) {
          updated_input_steps.push(input_step);

          let changed_fields = [];

          if (input_step.number !== elem_ref.number) {
            changed_fields.push({
              field_name: 'number',
              change_type: 'MODIFIED',
              previous_value: input_step.number,
              new_value: elem_ref.number
            });
            input_step.number = elem_ref.number;
          }
          if (input_step.title !== elem_ref.title) {
            changed_fields.push({
              field_name: 'title',
              change_type: 'MODIFIED',
              previous_value: input_step.title,
              new_value: elem_ref.title
            });
            input_step.title = elem_ref.title;
          }

          if (changed_fields.length > 0) {
            changed_items.push({
              item_type: 'STEP',
              item_name: item_name,
              change_type: 'MODIFIED',
              changed_fields: changed_fields
            });
          }
        } else {
          changed_items.push({
            item_type: 'STEP',
            item_name: item_name,
            change_type: 'DELETED',
            changed_fields: []
          });
        }
      }
    }
    elem.authoring_user_input.steps = updated_input_steps;
  } else if (elem.step_type == 'CUSTOM_SCRIPT') {

    let changed_fields = [];
    // flag for change in specification of custom script
    let spec_changed = false;
    // flag for legacy custom script
    let legacy_cs = false;
    if (elem.authoring_user_input && script_map) {
      let input = elem.authoring_user_input;
      log.debug(`script_path: ${input.script_path}`);

      const script_ref0 = script_map[input.script_id];
      const item_name = input.script_path;
      const item_id = input.script_id;

      if (script_ref0) {
        // make a copy of script definition in catalog since it can be changed 
        // to update the step input. This handles the case where the same script is used by more than one script.
        const script_ref = _.cloneDeep(script_ref0);
        
        //// check meta data
        if (input.script_name !== script_ref.script_name) {
          changed_fields.push({
            field_name: 'script_name',
            change_type: 'MODIFIED',
            previous_value: input.script_name,
            new_value: script_ref.script_name
          });
          input.script_name = script_ref.script_name;
        }
  
        if (input.script_path !== script_ref.script_path) {
          changed_fields.push({
            field_name: 'script_path',
            change_type: 'MODIFIED',
            previous_value: input.script_path,
            new_value: script_ref.script_path
          });
          input.script_path = script_ref.script_path;
        }
  
        if (input.hash !== script_ref.hash) {
          changed_fields.push({
            field_name: 'hash',
            change_type: 'MODIFIED',
            previous_value: input.hash,
            new_value: script_ref.hash
          });
          input.hash = script_ref.hash;
        }

        if (input.spec_hash === undefined || input.spec_hash === null || input.spec_hash === '') {
          legacy_cs = true;
          spec_changed = true;
        }

        if (input.spec_hash !== script_ref.spec_hash) {
          changed_fields.push({
            field_name: 'spec_hash',
            change_type: 'MODIFIED',
            previous_value: input.spec_hash,
            new_value: script_ref.spec_hash
          });
          input.spec_hash = script_ref.spec_hash;
          spec_changed = true;
        }
  
        // Note that old custom script steps do not have description field set.
        if (input.description !== script_ref.description) {
          changed_fields.push({
            field_name: 'description',
            change_type: 'MODIFIED',
            previous_value: input.description,
            new_value: script_ref.description
          });
          input.description = script_ref.description;
        }
  
        if (input.status !== script_ref.status) {
          changed_fields.push({
            field_name: 'status',
            change_type: 'MODIFIED',
            previous_value: input.status,
            new_value: script_ref.status
          });
          input.status = script_ref.status;
        }

        //// check inputs
        let step_inputs = input.inputs;
        let catalog_inputs = script_ref.inputs;

        let step_entries = input.entries;
        let catalog_entries = script_ref.entries;

        let step_inputs_length = step_inputs ? step_inputs.length : 0;
        let catalog_inputs_length = catalog_inputs ? catalog_inputs.length : 0;

        if (step_inputs_length != catalog_inputs_length) {
          spec_changed = true;
        }

        if (step_inputs && catalog_inputs) {
          // catalog info has no value. Initialize with default value.
          for (const catalog_input of catalog_inputs) {
            catalog_input.value = catalog_input.hasOwnProperty('default_value') ? catalog_input.default_value : '';
          }
          let nameTypeMap = buildNameTypeFieldMap(catalog_inputs);
          for (const step_input of step_inputs) {
            const field = getMatchingField(step_input, nameTypeMap);
            if (field) {
              field.value = step_input.value;
            } else {
              spec_changed = true;
            }
          }                 
        }

        //// check entries
        let nameTypeMap = {};
        const matchingFields = [];
        // find matching fields to be copied over
        if (step_entries && catalog_entries) {
          // catalog_entries have no value. Initialize with default value.
          for (const catalog_entry of catalog_entries) {
            if (catalog_entry.entry_inputs) {
              for (const entry_input of catalog_entry.entry_inputs) {
                entry_input.value = entry_input.hasOwnProperty('default_value') ? entry_input.default_value : '';
              }
            }
          }
          let step_entry_input_length = step_entries.length > 0 && step_entries[0].entry_inputs ? 
            step_entries[0].entry_inputs.length : 0;
          let catalog_entry_input_length = catalog_entries.length > 0 && catalog_entries[0].entry_inputs ? 
            catalog_entries[0].entry_inputs.length : 0;
          
          if (step_entry_input_length != catalog_entry_input_length) {
            spec_changed = true;
          }
          
          if (catalog_entries.length > 0 && catalog_entries[0].entry_inputs) {
            nameTypeMap = buildNameTypeFieldMap(catalog_entries[0].entry_inputs);
            
            if (step_entries.length > 0) {
              if (step_entries[0].entry_inputs) {
                step_entries[0].entry_inputs.forEach((entry_input) => {
                  let field = getMatchingField(entry_input, nameTypeMap);
                  if (field) {
                    matchingFields.push(field);
                  } else {
                    spec_changed = true;
                  }                        
                });
              }
            }
          }
        }
        
        if (matchingFields.length > 0) {
          // entries from catalog has only one element. 
          // Copy it up to the length of entries of the current step

          for (let i=0; i < step_entries.length; i++) {
            if (catalog_entries.length <= i) {
              catalog_entries.push(_.cloneDeep(catalog_entries[0]));
            }
          }
          // copy values for matching fields
          catalog_entries.forEach((catalog_entry, idx) => {
            const step_entry = step_entries[idx];
            
            const catalogNameTypeMap = buildNameTypeFieldMap(catalog_entry.entry_inputs);
            const stepNameTypeMap = buildNameTypeFieldMap(step_entry.entry_inputs);
            
            catalog_entry.entry_inputs.forEach((entry_input) => {
              const catalogField = getMatchingField(entry_input, catalogNameTypeMap);
              const stepField = getMatchingField(entry_input, stepNameTypeMap);
              if (catalogField && stepField) {
                catalogField.value = stepField.value;
              } else {
                spec_changed = true;
              }
            });
          });
        }

        if (spec_changed && !legacy_cs) {
          // Apply matched inputs and entries with preserved values
          input.inputs = catalog_inputs;
          input.entries = catalog_entries;
          
          // Apply layout, outputs, and output_array from catalog (new catalog is source of truth)
          input.layout = script_ref.layout;
          input.outputs = script_ref.outputs;
          input.output_array = script_ref.output_array;
          
          // Mark element as consistent after auto-update
          elem.consistency_flag = 'CONSISTENT';
          
          changed_fields.push({
            field_name: 'specification',
            change_type: 'MODIFIED',
            previous_value: '',
            new_value: ''
          });
        }

        if (legacy_cs){
          user_action_msg =  'This is a legacy CS step and we can not validate';
        }

        if (changed_fields.length > 0) {
          changed_items.push({
            item_type: 'SCRIPT',
            item_name: item_name,
            item_id: item_id,
            change_type: 'MODIFIED',
            changed_fields: changed_fields
          });
        }
      } else {
        user_action_msg = `Custom script was not found. script_path: ${input.script_path}, script_id: ${input.script_id}`;
      }
    }
  } else if (elem.elem_type == 'PROCEDURE_SECTION') {
    if (elem.authoring_user_input) {
      let reference_procedure_id = elem.authoring_user_input.reference_procedure_id;
      let reference_procedure_version = elem.authoring_user_input.reference_procedure_version;

      // check only non-working version
      if (reference_procedure_id && (reference_procedure_version > 0)) {
        let procedure_info = null;
        let version_info = null;
        try {
          procedure_info = await getProcedure(reference_procedure_id, key);
        } catch (err) {
          // ignore
        }

        if (procedure_info) {
          try {
            version_info = await getVersion(reference_procedure_id, reference_procedure_version, key);
          } catch (err) {
            // ignore
          }

          if (version_info) {
            if (procedure_info.current_version > reference_procedure_version) {
              user_action_msg = `A new procedure version is available. procedure_id: ${reference_procedure_id} ` + 
                `version: ${reference_procedure_version} latest version: ${procedure_info.current_version}`;
            }
          } else {
            user_action_msg = `Procedure version was not found. procedure_id: ${reference_procedure_id} ` + 
              `version: ${reference_procedure_version}`;
          }
        } else {
            user_action_msg = `Procedure was not found. procedure_id: ${reference_procedure_id}`;
        }
      }
    }
  }

  return {changed_items, user_action_msg};
}

function buildNameTypeFieldMap(fields) {
  const nameTypeMap = {};
  if (fields) {
    for (const field of fields) {
      let typeMap = nameTypeMap[field.name];
      if (!typeMap) {
          typeMap = {};
          nameTypeMap[field.name] = typeMap;
      }
      typeMap[field.type] = field;
    }
  }
  return nameTypeMap;
}

function getMatchingField(field, nameTypeMap) {
  const typeMap = nameTypeMap[field.name];
  if (typeMap) {
      const matchingField = typeMap[field.type];
      if (matchingField) {
          return matchingField;
      }
  }
  return null;
}

async function validate_procedure_version(procedure_id, version, validation_input, key) {
  let elem_map = {};
  let vi_map = null;
  let script_map = null;

  const update = validation_input ? validation_input.update : false;
  if ((version !== 0) && update) {
    return Promise.reject(`Cannot validate and update a versioned procedure. procedure_id: ${procedure_id} version: ${version}`);
  }

  const {elems, total_count} = await getVersionElements(procedure_id, version, null, null, 0, 10000, null, null, 
    null, null, key);

  elems.forEach(function (elem) {
    elem_map[elem.elem_id] = elem;
  });

  if (validation_input && validation_input.vis) {
    vi_map = {};
    for (const vi of validation_input.vis) {
      vi_map[vi.vi_id] = vi;
    }
  }

  if (validation_input && validation_input.scripts) {
    script_map = {};
    for (const script of validation_input.scripts) {
      script_map[script.script_id] = script;
    }
  }

  const updated_elements = [];
  const validation_items = [];

  for (const elem of elems) {
    let {changed_items, user_action_msg} = await refresh_procedure_element_(elem, elem_map, vi_map, script_map, key);
    if (changed_items.length > 0 || user_action_msg) {
      let refresh_item = {
        elem_id: elem.elem_id,
        elem_type: elem.elem_type,
        step_type: elem.step_type,
        number: elem.number,
        title: elem.title,
        user_action_msg: user_action_msg,
        changed_items: changed_items
      };
      validation_items.push(refresh_item);
    }

    if (update) {
      if ((changed_items.length > 0) && (!user_action_msg)) {
        updated_elements.push(elem);
      }
    }
  }

  if (update) {
    if (updated_elements.length > 0) {
      await updateProcedureElements(procedure_id, updated_elements, key);
    }
  }

  return {elements: updated_elements, validation_items: validation_items};
}

function check_vis(vis, vi_map, changed_items) {
  const new_vis = [];

  for (const vi of vis) {
    let vi_id = vi.vi_id;
    let vi_name = vi.vi_name;
    let item_name = `${vi_id}: ${vi_name}`;

    let vas = vi.vas ? vi.vas : [];
    let va_map = {};
    for (const va of vas) {
      va_map[va.va_id] = va;
    }
    
    let changed_fields = [];

    let vi_ref = vi_map[vi_id];
    if (vi_ref) {
      new_vis.push(vi);

      if (vi.vi_name !== vi_ref.vi_name) {
        changed_fields.push({
          field_name: 'vi_name',
          change_type: 'MODIFIED',
          previous_value: vi.vi_name,
          new_value: vi_ref.vi_name
        });
        vi.vi_name = vi_ref.vi_name;
      }
      if (vi.vi_owner !== vi_ref.vi_owner) {
        changed_fields.push({
          field_name: 'vi_owner',
          change_type: 'MODIFIED',
          previous_value: vi.vi_owner,
          new_value: vi_ref.vi_owner
        });
        vi.vi_owner = vi_ref.vi_owner;
      }
      if (vi.vi_type !== vi_ref.vi_type) {
        changed_fields.push({
          field_name: 'vi_type',
          change_type: 'MODIFIED',
          previous_value: vi.vi_type,
          new_value: vi_ref.vi_type
        });
        vi.vi_type = vi_ref.vi_type;
      }
      if (vi.vi_text !== vi_ref.vi_text) {
        changed_fields.push({
          field_name: 'vi_text',
          change_type: 'MODIFIED',
          previous_value: vi.vi_text,
          new_value: vi_ref.vi_text
        });
        vi.vi_text = vi_ref.vi_text;
      }

      let vas_ref = (vi_ref && vi_ref.vas) ? vi_ref.vas : [];
      let va_ref_map = {};
      for (const va_ref of vas_ref) {
        va_ref_map[va_ref.va_id] = va_ref;
      }

      let vas_changed = false;
      for (const va of vas) {
        let va_ref = va_ref_map[va.va_id];
        if (va_ref) {
          if (va.va_name !== va_ref.va_name) {
            changed_fields.push({
              field_name: 'va_name',
              change_type: 'MODIFIED',
              previous_value: va.va_name,
              new_value: va_ref.va_name
            });
            vas_changed = true;
          }
          if (va.va_poc !== va_ref.va_poc) {
            changed_fields.push({
              field_name: 'va_poc',
              change_type: 'MODIFIED',
              previous_value: va.va_poc,
              new_value: va_ref.va_poc
            });
            vas_changed = true;
          }
          if (va.vac_id !== va_ref.vac_id) {
            changed_fields.push({
              field_name: 'vac_id',
              change_type: 'MODIFIED',
              previous_value: va.vac_id,
              new_value: va_ref.vac_id
            });
            vas_changed = true;
          }
          if (va.vac_name !== va_ref.vac_name) {
            changed_fields.push({
              field_name: 'vac_name',
              change_type: 'MODIFIED',
              previous_value: va.vac_name,
              new_value: va_ref.vac_name
            });
            vas_changed = true;
          }
        } else {
          changed_fields.push({
            field_name: 'va',
            change_type: 'DELETED',
            previous_value: `${va.va_id}: ${va.va_name}`,
            new_value: ''
          });
          vas_changed = true;
        }
      }

      for (const va_ref of vas_ref) {
        let va = va_map[va_ref.va_id];
        if (va) {
          // checked above
        } else {
          changed_fields.push({
            field_name: 'va',
            change_type: 'ADDED',
            previous_value: '',
            new_value: `${va_ref.va_id}: ${va_ref.va_name}`
          });
          vas_changed = true;
        }
      }
      if (vas_changed) {
        vi.vas = vi_ref.vas;
      }

      if (changed_fields.length > 0) {
        changed_items.push({
          item_type: 'VI',
          item_name: item_name,
          change_type: 'MODIFIED',
          changed_fields: changed_fields
        });
      }
    } else {
      changed_items.push({
        item_type: 'VI',
        item_name: item_name,
        change_type: 'DELETED',
        changed_fields: []
      });
    }
  }
  return new_vis;
}

async function validate_procedure_element(procedure_id, elem_id, validation_input, key) {
  let elem_map = {};
  let vi_map = {};
  let script_map = {};

  const {elems, total_count} = await getProcedureElements(procedure_id, null, null, 0, 10000, 'ASC', null, key);
  elems.forEach(function (elem) {
    elem_map[elem.elem_id] = elem;
  });

  const elem = elem_map[elem_id];

  if (!elem) {
    return Promise.reject(`Element was not found. elem_id: ${elem_id}`);
  }

  const update = validation_input ? validation_input.update : false;

  if (validation_input && validation_input.vis) {
    for (const vi of validation_input.vis) {
      vi_map[vi.vi_id] = vi;
    }
  }

  if (validation_input && validation_input.scripts) {
    for (const script of validation_input.scripts) {
      script_map[script.script_id] = script;
    }
  }

  const updated_elements = [];
  const validation_items = [];

  const {changed_items, user_action_msg} = await refresh_procedure_element_(elem, elem_map, vi_map, script_map, key);
  if (changed_items.length > 0 || user_action_msg) {
    let refresh_item = {
      elem_id: elem.elem_id,
      step_type: elem.step_type,
      number: elem.number,
      title: elem.title,
      user_action_msg: user_action_msg,
      changed_items: changed_items
    };
    validation_items.push(refresh_item);
  }

  if (update) {
    if ((changed_items.length > 0) && (!user_action_msg)) {
      updated_elements.push(elem);
    }

    if (updated_elements.length > 0) {
      await updateProcedureElements(procedure_id, updated_elements, key);
    }
  }
  return {elements: updated_elements, validation_items: validation_items};
}

var procedure_create_tag = async function(procedure_id, tag_input, key) {
  try {
    const url = `${archiveLocation}/procedures/${procedure_id}/tags`;    
    let response = await axios.post(url, tag_input, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var procedure_update_tag = async function(procedure_id, tag_id, tag_input, key) {
  try {
    const url = `${archiveLocation}/procedures/${procedure_id}/tags/${tag_id}`;    
    let response = await axios.patch(url, tag_input, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var procedure_delete_tag = async function(procedure_id, tag_id, key) {
  try {
    const url = `${archiveLocation}/procedures/${procedure_id}/tags/${tag_id}`;    
    let response = await axios.delete(url, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var procedure_element_apply_tag = async function(procedure_id, elem_id, tag_id, key) {
  try {
    const url = `${archiveLocation}/procedures/${procedure_id}/elements/${elem_id}/tags`;    
    let response = await axios.post(url, {}, {headers: {'Authorization': key}, params: {tag_id: tag_id}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

var procedure_element_remove_tag = async function(procedure_id, elem_id, tag_id, key) {
  try {
    const url = `${archiveLocation}/procedures/${procedure_id}/elements/${elem_id}/tags/${tag_id}`;    
    let response = await axios.delete(url, {headers: {'Authorization': key}});
    return response.data;
  } catch (err) {
    return Promise.reject(transform_axios_error(err));
  }
}

function parse_token(key) {
  let token = '';

  let tokens = key.split(' ');
  if (tokens.length > 1) {
    token = tokens[1];
  } else {
    log.warning('authorization header is not in the correct format.');
  }
  return token;
}

function parse_username(authorization_header) {
  let username = '';
  if (authorization_header) {
    let decoded = jwt.verify(parse_token(authorization_header), public_pem, { algorithms: ['RS256'] });
    username = decoded['username'];  
  }
  return username;
}

function is_string(obj) {
  return (Object.prototype.toString.call(obj) === '[object String]');
}


function to_obj_string(obj) {
  if (is_string(obj)) {
    return obj;
  } else {
    return util.inspect(obj);
  }
}


function transform_axios_error(err) {
  let err_new = {
    message: '',
    details: [],
    error_type: '',
    error_source: '',
    http_code_at_source: 0
  };

  if (err.response) {
    if (err.response.status) {
      err_new['http_code_at_source'] = err.response.status;  
    }    
    if (typeof err.response.data == 'string') {
      err_new['message'] = err.response.data;
    } else {
      if (err.response.data) {
        if (err.response.data.hasOwnProperty('message')) {
          err_new['message'] = err.response.data.message;
        }

        if (err.response.data.hasOwnProperty('details') && Array.isArray(err.response.data.details)) {
          err_new['details'] = err.response.data.details;
        }

        if (err.response.data.hasOwnProperty('error_type')) {
          err_new['error_type'] = err.response.data.error_type;
        }

        if (err.response.data.hasOwnProperty('error_source')) {
          err_new['error_source'] = err.response.data.error_source;
        }

        if (err.response.data.hasOwnProperty('http_code_at_source')) {
          // override http code using the code at the source
          err_new['http_code_at_source'] = err.response.data.http_code_at_source;
        }
      }
    }
  } 

  if (!err_new.message) {
      err_new['message'] = err.message;
  }
  if (err_new.details.length == 0 && err.stack) {
      err_new.details.push(err.stack);
  }
  return err_new;
}

function push_error(message, err) {
  if (typeof err == 'string') {
    err = {'message': err};
  }

  let err_json = '';
  try {
    err_json = JSON.stringify(err);
  } catch (ex) {
    // ignore
  }

  if (err_json) {
    // ING-4322
    // Use JSON.parse() instead of extend(), which may introduce
    // circular dependency.
    const err_new = JSON.parse(err_json);
    err_new.message = message;
    if (!err_new.hasOwnProperty('details') || !Array.isArray(err_new.details)) {
      err_new.details = [];
    }

    if (err.message) {
      if (typeof err.message === 'string') {
        err_new.details.push(err.message);
      } else {
        err_new.details.push(util.inspect(err.message));
      }
    }

    if (err_new.details.length === 0) {
      err_new.details.push(util.inspect(err));
    }

    return err_new;
  } else {
    return {message: message, details: [util.inspect(err)]}
  }
}

function get_auth_key(headers) {
  return headers.hasOwnProperty('authorization') ? headers['authorization'] : '';
}

function is_break_point_on(execution) {
  return execution.mode == 'AUTO' && execution.pause_conditions && execution.pause_conditions.on_break_point;
}

function is_closed(execution) {
  return execution.status === 'CLOSED';
}

function get_step_time_started(step) {
  if (step && step.execution && step.execution.meta_data && step.execution.meta_data.time_started) {
    return step.execution.meta_data.time_started;
  }
  return null;
}

function get_step_status(step) {
  if (step && step.execution && step.execution.meta_data && step.execution.meta_data.status) {
    return step.execution.meta_data.status;
  }
  return 'NONE';
}

function get_step_completion_status(step) {
  if (step && step.execution && step.execution.meta_data) {
    if (step.execution.meta_data.status === 'PASS' || 
      step.execution.meta_data.status === 'FAIL' || 
      step.execution.meta_data.status === 'ERROR' ||
      step.execution.meta_data.status === 'OVERRIDE_PASS' ||
      step.execution.meta_data.status === 'OVERRIDE_FAIL') {
      return step.execution.meta_data.status;
    }
  }
  return null;
}

function is_active_redline(elem) {
  if (elem.procedure_modification_status === 'MODIFYING' || 
    elem.procedure_modification_status === 'ADDED' ||
    elem.procedure_modification_status === 'DELETED'
  ) {
    return true;
  } else {
    return false;
  }
}

module.exports.init_file_server = init_file_server
module.exports.createExecution = createExecution
module.exports.getAllExecutions = getAllExecutions
module.exports.getExecution = getExecution
module.exports.updateExecution = updateExecution
module.exports.removeExecution = removeExecution
module.exports.exportExecution = exportExecution
module.exports.importExecution = importExecution

module.exports.updateVenueGroup = updateVenueGroup
module.exports.getVenueGroup = getVenueGroup
module.exports.getVenueGroups = getVenueGroups
module.exports.createVenueGroup = createVenueGroup

module.exports.updateVenue = updateVenue
module.exports.deleteVenue = deleteVenue
module.exports.getVenue = getVenue
module.exports.getVenues = getVenues
module.exports.getVenueStatus = getVenueStatus
module.exports.updateVenueStatus = updateVenueStatus
module.exports.createVenue = createVenue

module.exports.addExecutionConversation = addExecutionConversation
module.exports.getExecutionConversations = getExecutionConversations
module.exports.getExecutionConversation = getExecutionConversation
module.exports.updateExecutionConversation = updateExecutionConversation
module.exports.deleteExecutionConversation = deleteExecutionConversation

module.exports.addExecutionComment = addExecutionComment
module.exports.getExecutionComments = getExecutionComments
module.exports.getExecutionComment = getExecutionComment
module.exports.updateExecutionComment = updateExecutionComment
module.exports.deleteExecutionComment = deleteExecutionComment

module.exports.addProcedureConversation = addProcedureConversation
module.exports.getProcedureConversations = getProcedureConversations
module.exports.getProcedureConversation = getProcedureConversation
module.exports.updateProcedureConversation = updateProcedureConversation
module.exports.deleteProcedureConversation = deleteProcedureConversation

module.exports.addProcedureComment = addProcedureComment
module.exports.getProcedureComments = getProcedureComments
module.exports.getProcedureComment = getProcedureComment
module.exports.updateProcedureComment = updateProcedureComment
module.exports.deleteProcedureComment = deleteProcedureComment

module.exports.createArchiveElement = createArchiveElement
module.exports.getStep = getStep
module.exports.get_step_input = get_step_input
module.exports.get_step_result = get_step_result
module.exports.update_step_result = update_step_result
module.exports.create_new_run = create_new_run

module.exports.override_step = override_step
module.exports.update_override_step = update_override_step
module.exports.discard_override_step = discard_override_step
module.exports.sleep_miliseconds = sleep_miliseconds
module.exports.wait_switch_timeout = wait_switch_timeout
module.exports.set_switch_wait = set_switch_wait
module.exports.get_switch_wait = get_switch_wait
module.exports.get_switch_wait_flag = get_switch_wait_flag
module.exports.delete_switch_wait_flag = delete_switch_wait_flag
module.exports.update_step_input = update_step_input
module.exports.update_step_input_nonexecutable = update_step_input_nonexecutable
module.exports.updateStep = updateStep
module.exports.updateElements = updateElements
module.exports.updateElement = updateElement
module.exports.modifyElement = modifyElement
module.exports.justifyElement = justifyElement
module.exports.justifyElements = justifyElements
module.exports.approveElement = approveElement
module.exports.approveElements = approveElements
module.exports.discardElement = discardElement
module.exports.discardElements = discardElements
module.exports.as_run = as_run
module.exports.history_execution = history_execution
module.exports.getExecutionStatus = getExecutionStatus
module.exports.continue_execution = continue_execution
module.exports.halt_execution = halt_execution
module.exports.pause_execution = pause_execution
module.exports.moveElement = moveElement
module.exports.copyElement = copyElement
module.exports.delete_element = delete_element
module.exports.replace_element = replace_element
module.exports.update_section = update_section
module.exports.get_section = get_section
module.exports.update_paragraph = update_paragraph
module.exports.get_paragraph = get_paragraph
module.exports.updateExecutionStatus = updateExecutionStatus
module.exports.runExecution = runExecution
module.exports.update_execution_rest = update_execution_rest
module.exports.getAllSteps = getAllSteps
module.exports.getExecutionElements = getExecutionElements
module.exports.getExecutionSimpleElements = getExecutionSimpleElements
module.exports.getExecutionElement = getExecutionElement
module.exports.getAllSections = getAllSections
module.exports.getAllParagraphs = getAllParagraphs
module.exports.searchExecution = searchExecution
module.exports.getLogging = getLogging
module.exports.updateLogging = updateLogging
module.exports.writeFile = writeFile
module.exports.readFile = readFile
module.exports.getFiles = getFiles
module.exports.deleteFile = deleteFile
module.exports.readFileExec = readFileExec
module.exports.getAllFilesExec = getAllFilesExec
module.exports.deleteFileExec = deleteFileExec

module.exports.writeFileComment = writeFileComment
module.exports.readFileComment = readFileComment
module.exports.getFilesComment = getFilesComment
module.exports.deleteFileComment = deleteFileComment

module.exports.writeFileProcedureComment = writeFileProcedureComment
module.exports.readFileProcedureComment = readFileProcedureComment
module.exports.getFilesProcedureComment = getFilesProcedureComment
module.exports.deleteFileProcedureComment = deleteFileProcedureComment

module.exports.getVIs = getVIs
module.exports.getProcedureElements = getProcedureElements
module.exports.getVersionElements = getVersionElements
module.exports.createProcedure = createProcedure
module.exports.log = log
module.exports.createProcedureVersion = createProcedureVersion
module.exports.updateProcedure = updateProcedure
module.exports.getProcedure = getProcedure

module.exports.createProcedureLabel = createProcedureLabel
module.exports.getProcedureLabels = getProcedureLabels
module.exports.removeProcedureLabel = removeProcedureLabel

module.exports.getVersion = getVersion
module.exports.exportProcedureVersion = exportProcedureVersion
module.exports.exportProcedureVersions = exportProcedureVersions
module.exports.importProcedureVersion = importProcedureVersion
module.exports.importProcedureVersions = importProcedureVersions
module.exports.searchProcedureVersion = searchProcedureVersion
module.exports.replaceProcedure = replaceProcedure
module.exports.removeVersion = removeVersion
module.exports.loadProcedure = loadProcedure
module.exports.removeProcedure = removeProcedure
module.exports.moveProcedureElement = moveProcedureElement
module.exports.copyProcedureElement = copyProcedureElement
module.exports.getProcedures = getProcedures
module.exports.getVersions = getVersions
module.exports.getStructure = getStructure
module.exports.getProcedureVIs = getProcedureVIs
module.exports.updateVersion = updateVersion 
module.exports.updateVersionStatus = updateVersionStatus
module.exports.update_procedure_section = update_procedure_section
module.exports.update_procedure_section_input = update_procedure_section_input
module.exports.get_procedure_sections = get_procedure_sections
module.exports.get_procedure_section = get_procedure_section
module.exports.get_procedure_section_input = get_procedure_section_input
module.exports.get_procedure_section_structure = get_procedure_section_structure
module.exports.get_procedure_section_elements = get_procedure_section_elements
module.exports.import_procedure_section = import_procedure_section
module.exports.call_procedure_section = call_procedure_section
module.exports.getProcedureOutline = getProcedureOutline
module.exports.getExecutionOutline = getExecutionOutline
module.exports.readProcedureFile = readProcedureFile
module.exports.readProcedureElementFile = readProcedureElementFile

module.exports.getProcedureFiles = getProcedureFiles
module.exports.getProcedureElementFiles = getProcedureElementFiles

module.exports.deleteProcedureFile = deleteProcedureFile
module.exports.deleteProcedureElementFile = deleteProcedureElementFile

module.exports.procedureWriteFile = procedureWriteFile 
module.exports.parse_username = parse_username
module.exports.parse_token = parse_token
module.exports.refresh_execution = refresh_execution
module.exports.validate_procedure_version = validate_procedure_version
module.exports.validate_procedure_element = validate_procedure_element

module.exports.procedure_create_tag = procedure_create_tag
module.exports.procedure_update_tag = procedure_update_tag
module.exports.procedure_delete_tag = procedure_delete_tag
module.exports.procedure_element_apply_tag = procedure_element_apply_tag
module.exports.procedure_element_remove_tag = procedure_element_remove_tag

module.exports.setExecutionBoundary = setExecutionBoundary

module.exports.resume_execution = resume_execution
module.exports.suspend_resume_execution = suspend_resume_execution
module.exports.remove_break_points = remove_break_points

module.exports.compute_execution_element = compute_execution_element
module.exports.compute_procedure_element = compute_procedure_element
module.exports.is_string = is_string
module.exports.to_obj_string = to_obj_string

module.exports.transform_axios_error = transform_axios_error
module.exports.push_error = push_error
module.exports.get_auth_key = get_auth_key
module.exports.is_break_point_on = is_break_point_on
module.exports.is_closed = is_closed
module.exports.get_step_completion_status = get_step_completion_status
module.exports.redis = redis

module.exports.time_references = [
  'CURRENT_TIME',
  'LAST_STEP_START',
  'LAST_STEP_END',
  'LAST_FSW_CMD_STEP_START',
  'LAST_FSW_CMD_STEP_END',
  'LAST_SSE_CMD_STEP_START',
  'LAST_SSE_CMD_STEP_END',
  'LAST_CMD_FILE_STEP_START',
  'LAST_CMD_FILE_STEP_END',
  'LAST_CMD_SCMF_FILE_STEP_START',
  'LAST_CMD_SCMF_FILE_STEP_END',
  'LAST_CUSTOM_SCRIPT_STEP_START',
  'LAST_CUSTOM_SCRIPT_STEP_END',
];