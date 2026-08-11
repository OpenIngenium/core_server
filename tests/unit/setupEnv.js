'use strict';

// Keep test output quiet and deterministic. node_funcs.js reads LOG_LEVEL at
// import time to configure winston, so it must be set before any module loads.
if (process.env.LOG_LEVEL === undefined) {
  process.env.LOG_LEVEL = 'critical';
}
