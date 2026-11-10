'use strict';

const util = require('util');

// External collaborators must never perform real I/O during unit tests.
jest.mock('aws-sdk', () => require('./mocks/mockAwsSdk'));
jest.mock('async-redis', () => require('./mocks/mockRedis'));
jest.mock('jsonwebtoken', () => ({ verify: jest.fn() }));

const mockRedis = require('./mocks/mockRedis');
const jwt = require('jsonwebtoken');
const node_funcs = require('../../api/node_funcs');

const redisClient = mockRedis.__client;

describe('node_funcs pure and mockable helpers', () => {
  beforeEach(() => {
    mockRedis.__reset();
    jwt.verify.mockReset();
  });

  describe('String.prototype.format', () => {
    it('substitutes indexed placeholders', () => {
      expect('id is {0} and {1}'.format('a', 'b')).toBe('id is a and b');
    });

    it('leaves the string unchanged when there are no placeholders', () => {
      expect('no placeholders'.format('x')).toBe('no placeholders');
    });
  });

  describe('getLogging / updateLogging', () => {
    let originalLevel;
    beforeEach(() => {
      originalLevel = node_funcs.log.level;
    });
    afterEach(() => {
      node_funcs.log.level = originalLevel;
    });

    it('reports the current log level in upper case', () => {
      node_funcs.log.level = 'debug';
      expect(node_funcs.getLogging()).toEqual({ level: 'DEBUG' });
    });

    it('sets the log level in lower case', () => {
      node_funcs.updateLogging({ level: 'INFO' });
      expect(node_funcs.log.level).toBe('info');
      expect(node_funcs.getLogging()).toEqual({ level: 'INFO' });
    });
  });

  describe('sleep_miliseconds', () => {
    it('resolves after the timer elapses', async () => {
      jest.useFakeTimers();
      try {
        const pending = node_funcs.sleep_miliseconds(1000);
        jest.advanceTimersByTime(1000);
        await expect(pending).resolves.toBeUndefined();
      } finally {
        jest.useRealTimers();
      }
    });
  });

  describe('parse_token', () => {
    it('returns the token portion of a bearer header', () => {
      expect(node_funcs.parse_token('Bearer abc.def')).toBe('abc.def');
    });

    it('returns an empty string when the header has no space', () => {
      expect(node_funcs.parse_token('abcdef')).toBe('');
    });
  });

  describe('parse_username', () => {
    it('returns an empty string when no header is provided', () => {
      expect(node_funcs.parse_username('')).toBe('');
      expect(jwt.verify).not.toHaveBeenCalled();
    });

    it('verifies the token and returns the decoded username', () => {
      jwt.verify.mockReturnValue({ username: 'bob' });
      expect(node_funcs.parse_username('Bearer token123')).toBe('bob');
      expect(jwt.verify).toHaveBeenCalledWith('token123', '', { algorithms: ['RS256'] });
    });
  });

  describe('is_string / to_obj_string', () => {
    it('detects strings', () => {
      expect(node_funcs.is_string('x')).toBe(true);
      expect(node_funcs.is_string(5)).toBe(false);
      expect(node_funcs.is_string({})).toBe(false);
    });

    it('returns strings unchanged and inspects non-strings', () => {
      expect(node_funcs.to_obj_string('hello')).toBe('hello');
      expect(node_funcs.to_obj_string({ a: 1 })).toBe(util.inspect({ a: 1 }));
    });
  });

  describe('transform_axios_error', () => {
    it('uses a string response body as the message', () => {
      const result = node_funcs.transform_axios_error({
        response: { status: 502, data: 'upstream boom' },
        message: 'ignored'
      });
      expect(result.message).toBe('upstream boom');
      expect(result.http_code_at_source).toBe(502);
    });

    it('extracts structured fields from an object response body', () => {
      const result = node_funcs.transform_axios_error({
        response: {
          status: 400,
          data: {
            message: 'bad',
            details: ['d1'],
            error_type: 'ValidationError',
            error_source: 'archive',
            http_code_at_source: 409
          }
        },
        message: 'ignored'
      });
      expect(result).toEqual({
        message: 'bad',
        details: ['d1'],
        error_type: 'ValidationError',
        error_source: 'archive',
        http_code_at_source: 409
      });
    });

    it('falls back to err.message and stack when there is no response', () => {
      const err = new Error('network down');
      const result = node_funcs.transform_axios_error(err);
      expect(result.message).toBe('network down');
      expect(result.details).toEqual([err.stack]);
      expect(result.http_code_at_source).toBe(0);
    });
  });

  describe('push_error', () => {
    it('wraps a string error under a new message', () => {
      const result = node_funcs.push_error('outer', 'inner failure');
      expect(result.message).toBe('outer');
      expect(result.details).toContain('inner failure');
    });

    it('preserves existing details from an object error', () => {
      const result = node_funcs.push_error('outer', {
        message: 'inner',
        details: ['a']
      });
      expect(result.message).toBe('outer');
      expect(result.details).toEqual(expect.arrayContaining(['a', 'inner']));
    });

    it('handles non-serializable (circular) errors', () => {
      const circular = {};
      circular.self = circular;
      const result = node_funcs.push_error('outer', circular);
      expect(result.message).toBe('outer');
      expect(result.details).toHaveLength(1);
    });
  });

  describe('get_auth_key', () => {
    it('returns the authorization header when present', () => {
      expect(node_funcs.get_auth_key({ authorization: 'Bearer x' })).toBe('Bearer x');
    });

    it('returns an empty string when absent', () => {
      expect(node_funcs.get_auth_key({})).toBe('');
    });
  });

  describe('execution status predicates', () => {
    it('is_break_point_on requires AUTO mode and an on_break_point condition', () => {
      expect(
        node_funcs.is_break_point_on({
          mode: 'AUTO',
          pause_conditions: { on_break_point: true }
        })
      ).toBe(true);
      expect(node_funcs.is_break_point_on({ mode: 'MANUAL' })).toBeFalsy();
      expect(node_funcs.is_break_point_on({ mode: 'AUTO' })).toBeFalsy();
    });

    it('is_closed checks the CLOSED status', () => {
      expect(node_funcs.is_closed({ status: 'CLOSED' })).toBe(true);
      expect(node_funcs.is_closed({ status: 'RUNNING' })).toBe(false);
    });

    it('get_step_completion_status returns terminal statuses and null otherwise', () => {
      const terminal = ['PASS', 'FAIL', 'ERROR', 'OVERRIDE_PASS', 'OVERRIDE_FAIL'];
      terminal.forEach((status) => {
        expect(
          node_funcs.get_step_completion_status({ execution: { meta_data: { status } } })
        ).toBe(status);
      });
      expect(
        node_funcs.get_step_completion_status({ execution: { meta_data: { status: 'RUNNING' } } })
      ).toBeNull();
      expect(node_funcs.get_step_completion_status({})).toBeNull();
    });
  });

  describe('redis-backed switch wait helpers', () => {
    it('get_switch_wait returns the stored seconds', async () => {
      redisClient.get.mockResolvedValue('5');
      await expect(node_funcs.get_switch_wait('e1')).resolves.toEqual({
        switch_wait_secs: 5
      });
      expect(redisClient.get).toHaveBeenCalledWith('execution-switch-wait:e1');
    });

    it('get_switch_wait defaults to the configured value when unset', async () => {
      redisClient.get.mockResolvedValue(null);
      await expect(node_funcs.get_switch_wait('e1')).resolves.toEqual({
        switch_wait_secs: 10
      });
    });

    it('set_switch_wait stores the value then reads it back', async () => {
      redisClient.set.mockResolvedValue('OK');
      redisClient.get.mockResolvedValue('7');
      const result = await node_funcs.set_switch_wait('e1', { switch_wait_secs: 7 });
      expect(redisClient.set).toHaveBeenCalledWith('execution-switch-wait:e1', '7');
      expect(result).toEqual({ switch_wait_secs: 7 });
    });

    it('get_switch_wait_flag returns the stored flag or empty string', async () => {
      redisClient.get.mockResolvedValueOnce('flagval');
      await expect(node_funcs.get_switch_wait_flag('e1')).resolves.toEqual({
        switch_wait_flag: 'flagval'
      });

      redisClient.get.mockResolvedValueOnce(null);
      await expect(node_funcs.get_switch_wait_flag('e1')).resolves.toEqual({
        switch_wait_flag: ''
      });
    });

    it('delete_switch_wait_flag removes the flag key', async () => {
      redisClient.del.mockResolvedValue(1);
      redisClient.get.mockResolvedValue(null);
      const result = await node_funcs.delete_switch_wait_flag('e1');
      expect(redisClient.del).toHaveBeenCalledWith('execution-switch-wait-flag:e1');
      expect(result).toEqual({ switch_wait_flag: '' });
    });
  });

  describe('time_references', () => {
    it('exposes the supported time reference identifiers', () => {
      expect(Array.isArray(node_funcs.time_references)).toBe(true);
      expect(node_funcs.time_references).toContain('CURRENT_TIME');
    });
  });
});
