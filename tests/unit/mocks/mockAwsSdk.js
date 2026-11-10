'use strict';

// Reusable mock for the `aws-sdk` S3 client used by api/node_funcs.js.
// The S3 constructor always returns the same shared instance so tests can
// program callback behavior and assert calls.

const s3Instance = {
  listBuckets: jest.fn(),
  createBucket: jest.fn(),
  putBucketPolicy: jest.fn(),
  putObject: jest.fn(),
  getObject: jest.fn(),
  deleteObject: jest.fn(),
  listObjectsV2: jest.fn(),
  headBucket: jest.fn()
};

function S3() {
  return s3Instance;
}

function reset() {
  Object.keys(s3Instance).forEach((key) => s3Instance[key].mockReset());
}

module.exports = {
  S3,
  __s3: s3Instance,
  __reset: reset
};
