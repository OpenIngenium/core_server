'use strict';

var app = require('express')();
var http = require('http');
var swaggerTools = require('swagger-tools');
var jsyaml = require('js-yaml');
var fs = require('fs');
var jwt = require('jsonwebtoken');
var bodyParser = require('body-parser');
var config = require('./config');
var node_funcs = require('./api/node_funcs');
var _ = require('lodash');
var winston = require('winston');
var moment = require('moment');
var util = require('util');
var timeout = require('express-timeout-handler');
var interceptor  = require('express-interceptor')
const io = require('socket.io-client');
const uuid = require('node-uuid');

// swaggerRouter configuration
var options = {
  controllers: './api/controllers/',
  useStubs: false//process.env.NODE_ENV === 'development' ? true : false // Conditionally turn on stubs (mock mode)
};

var public_pem = config.public_pem;
var ems_secret = config.ems_secret;

var log = node_funcs.log;

// set timeout
let server_timeout_sec = parseInt(config.server_timeout_sec);
log.info(`server_timeout_sec: ${server_timeout_sec}`);
let timeoutOptions = {
    timeout: 1000*server_timeout_sec,
    onTimeout: function(req, res) {
        res.status(504).send({'message': 'Core service timed out'});
    }
}
app.use(timeout.handler(timeoutOptions));

// Need to override the size limit of body payload of swagger middleware.
// Needs to set before swagger middleware stuff.
// See "https://stackoverflow.com/questions/19917401/error-request-entity-too-large"
app.use(bodyParser.json({limit: "500mb"}));
app.use(bodyParser.urlencoded({limit: "500mb", extended: true, parameterLimit:5000}));

// Log all incoming requests
app.use(function(req, res, next) {
  log.info(`[REQUEST] ${req.method} ${req.url}`);
  next();
});

// connect to execution monitor to publish events
log.debug(`connecting to execution monitor: ${config.EXECUTION_MONITOR_URL}`);

const socket = io(config.EXECUTION_MONITOR_URL, {
  transports: ['websocket'],
  autoConnect: false,
  query: {secret: ems_secret}
});

socket.on('connect_error', function(error) {
  log.debug('Failed to connect to Execution Monitor:' + error);
});

socket.on('connect', function() {
    log.debug('Connected to Execution Monitor to publish:');
});

socket.on('disconnect', function(reason) {
    log.debug(`Disconnected to Execution Monitor. reason: ${reason}`);
});

socket.io.on('reconnect_attempt', function(attemptNumber) {
    log.debug(`reconnect_attempt to Execution Monitor. attemptNumber: ${attemptNumber}`);
});  

socket.io.on('reconnect', function(attemptNumber) {
    log.debug(`reconnected to Execution Monitor. attemptNumber: ${attemptNumber}`);
});    

socket.on('error', function (error) {
    log.debug(`Execution Monitor socket error: ${error}`);
});
// now open the socket
socket.open();

// initialize file_server if needed
node_funcs.init_file_server()
.then((res) => {
  log.info('init_file_server done');
})
.catch((err) => {
  log.error(`init_file_server error: ${err}`);
})

app.use(interceptor(function (req, res) {
  return {
    isInterceptable: function() {
      let check = false;
      let apiPath = req.swagger ? req.swagger.apiPath : null;
      
      if (req.method == 'POST' || req.method == 'PUT' || req.method == 'PATCH' || req.method == 'DELETE') {
        if (apiPath) {
          check = true;
        }
      }
      return check;
    },

    intercept: function(body, send) {
      // send response 
      send(body);

      // Generate logs for API call
      // Log only if the HTTP method (operation) is defined for the end point
      if (req.swagger.operation) {
        let response_data = '';
        if (body) {
          try {
            response_data = JSON.parse(body);
          } catch (error) {
            log.warning(`Error when converting body to json: ${error}`);
            response_data = util.inspect(body);
          }
        }
  
        // send event message
        let msg_id = uuid.v4();
        let msg_time = new Date();

        let swagger_params = {};
        let authorization_header = req.headers['authorization'] || req.headers['Authorization'] || '';
        let user_name = '';

        if (authorization_header.toLowerCase().startsWith('bearer')) {
          try {
            user_name = node_funcs.parse_username(authorization_header);
          } catch (err) {
            log.warning('failed to get user_name from JWT token', util.inspect(err));
          }
        } else if (authorization_header.toLowerCase().startsWith('basic')) {
          user_name = req.params && req.params.user ? req.params.user : '';
        }
  
        let params_keys = Object.keys(req.swagger.params);
        for (let i=0; i < params_keys.length; i++) {
          let key = params_keys[i];
          // exclude uploaded file
          if (key != 'file_content') {
            let parameter_type = req.swagger.params[key]['schema']['in'];
            // exclude body content. This will be captured as req.body below.
            if (parameter_type != 'body') {
              swagger_params[key] = req.swagger.params[key].value;
            }
          }
        }
  
        let execution_id = '';
        let procedure_id = '';
        if (swagger_params.execution_id) {
          execution_id = swagger_params.execution_id;
        } else if (swagger_params.procedure_id) {
          procedure_id = swagger_params.procedure_id;
        }
        let version = swagger_params.version || '0';
  
        let message = req.swagger.operation.description || '';
        let operation_id = req.swagger.operation.operationId || '';

        let elem_id = swagger_params['elem_id'] || '';
  
        if (execution_id) {
          let msg = {
            msg_id: msg_id,
            msg_time: msg_time,
            user_name: user_name,
            execution_id: execution_id,
            event: operation_id,
            params: swagger_params,
            request_body: req.body,
            status_code: res.statusCode,
            response_body: response_data
          }
          socket.emit('execution-event', msg);
        } else if (procedure_id) {
          let msg = {
            msg_id: msg_id,
            msg_time: msg_time,
            user_name: user_name,
            procedure_id: procedure_id,
            version: version,
            event: operation_id,
            params: swagger_params,
            request_body: req.body,
            status_code: res.statusCode,
            response_body: response_data
          }
          socket.emit('procedure-event', msg);
        } else {
          log.trace('No message was generated.');
        }
  
        let log_entry = {
          'user_name': user_name,
          'service': 'core_server',
        }
  
        log_entry['event'] = operation_id;
        if (execution_id) {
          log_entry['execution_id'] = execution_id;
        }
        if (procedure_id) {
          log_entry['procedure_id'] = procedure_id;
        }
        if (elem_id) {
          log_entry['elem_id'] = elem_id;
        }
  
        if (res.statusCode < 200 || res.statusCode >= 400) {
          log_entry['data'] = response_data;
          log.error(message, log_entry);
        } else {
          if (operation_id == 'run_execution' || operation_id == 'update_step_result') {
            let number = response_data['number'] || '';
            let title = response_data['title'] || '';
            message = `${message}.  number: ${number} title: ${title}`;
  
            if (response_data['execution'] && response_data['execution']['meta_data']['status'] == 'ERROR') {
              log_entry['data'] = response_data;
              log.error(message, log_entry);
            } else if (response_data['execution'] && response_data['execution']['meta_data']['status'] == 'FAIL') {
              log_entry['data'] = response_data;
              log.warning(message, log_entry);
            } else {
              log.info(message, log_entry);
            }
          }
          else {
            log.info(message, log_entry);
          }
        }
      }
    }
  }
}));


// The Swagger document (require it, build it programmatically, fetch it from a URL, ...)
var spec = fs.readFileSync('./api/swagger/swagger.yaml', 'utf8');//require('./api/swagger/swagger.json');
var swaggerDoc = jsyaml.safeLoad(spec);
// Initialize the Swagger middleware
swaggerTools.initializeMiddleware(swaggerDoc, function (middleware) {
  // Interpret Swagger resources and attach metadata to request - must be first in swagger-tools middleware chain
  app.use(middleware.swaggerMetadata());

  app.use(middleware.swaggerSecurity({
    UserSecurity: function(req, security_defs, required_scopes, cb) {
      log.trace(`apiPath: ${req.swagger.apiPath}`);
      log.trace(`method: ${req.method}`);

      // if the scope is explicitly specified as an empty list, do not check the token (e.g., 'health' end point)
      if (Array.isArray(required_scopes) && (required_scopes.length == 0)) {
        return cb(null);
      }

      let key = '';
      let authorization_header = req.headers['authorization'] || req.headers['Authorization'] || '';
      if (authorization_header.toLowerCase().startsWith('bearer ')) {
        key = authorization_header.substring(7);
      } 

      if (key) {
        let decoded = '';
        try {
          // log.debug(`jwt.verify key: ${key}`);
          decoded = jwt.verify(key, public_pem, {
            algorithms: ['RS256']
          });
        } catch (e) {
          let err = new Error('access denied: ' + e.toString());
          err.statusCode = 403;
          return cb(err);
        }
  
        const scopes = decoded['scopes'];
        req.jwt = decoded;

        const scope_names = scopes.map(scope => scope.hasOwnProperty('scope') ? scope.scope : scope);

        const intersection_scopes = _.intersection(scope_names, required_scopes);

        if (intersection_scopes.length > 0) {
          return cb(null);
        } else {
          req.res.status(403).json({'message': 'user does not have the permission'});
          req.res.end();  
        }
      } else {
        req.res.status(401).json({'message': 'api key was not provided'});
        req.res.end();
      }
    }
  }));

  // Validate Swagger requests
  app.use(middleware.swaggerValidator());

  // Route validated requests to appropriate controller
  app.use(middleware.swaggerRouter(options));

  // Serve the Swagger documents and Swagger UI
  app.use(middleware.swaggerUi());

  // To capture more useful message of the validation error
  app.use(function(err, req, res, next) {
    // If response headers have already been sent, delegate to the default Express error handler.
    // See https://expressjs.com/en/guide/error-handling.html#the-default-error-handler
    if (res.headersSent) {
      return next(err);
    }

    if (err && err.failedValidation) {
      // The format of err varies depending of the type of error. 
      // Convert the entire object a string.
      let message = 'Failed schema validation';
      let details = [JSON.stringify(err)];
      const error_obj = {message: message, details: details};
      res.status(400).send(error_obj);
    } else if (err) {
      return next(err);
    }
    else {
      return next();
    }
  });

  // Start the server
  http.createServer(app).listen(config.server_port, function (err) {
    if(err) {throw err;}
    log.info(`Your server is listening on http://localhost:${config.server_port}`);
    log.info(`Swagger-ui is available on http://localhost:${config.server_port}/docs`);
  });
});
