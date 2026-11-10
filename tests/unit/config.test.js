'use strict';

const CONFIG_PATH = '../../config';

describe('config', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  describe('defaults when environment variables are unset', () => {
    let config;
    beforeEach(() => {
      delete process.env.EXECUTION_MONITOR_URL;
      delete process.env.FILE_SERVER_API_HOST;
      delete process.env.FILE_SERVER_ACCESS_KEY;
      delete process.env.FILE_SERVER_SECRET_KEY;
      delete process.env.MEDIA_BUCKET;
      delete process.env.REDIS_HOST;
      delete process.env.REDIS_PORT;
      delete process.env.SERVER_TIMEOUT_SEC;
      delete process.env.PUBLIC_PEM;
      delete process.env.EMS_SECRET;
      config = require(CONFIG_PATH);
    });

    it('uses default execution monitor URL', () => {
      expect(config.EXECUTION_MONITOR_URL).toBe(
        'http://localhost:3000/api/v2/execution_event_publish'
      );
    });

    it('uses static api base path and server port', () => {
      expect(config.api_base_path).toBe('api/v5');
      expect(config.server_port).toBe(8080);
    });

    it('uses default file server settings', () => {
      expect(config.FILE_SERVER_API_HOST).toBe('http://localhost:9000');
      expect(config.FILE_SERVER_ACCESS_KEY).toBe('');
      expect(config.FILE_SERVER_SECRET_KEY).toBe('');
      expect(config.MEDIA_BUCKET).toBe('ingenium-media-test');
    });

    it('uses default redis host and port', () => {
      expect(config.REDIS_HOST).toBe('exec_redis');
      expect(config.REDIS_PORT).toBe(6379);
    });

    it('uses default timeout, pem, and secret', () => {
      expect(config.server_timeout_sec).toBe('290');
      expect(config.public_pem).toBe('');
      expect(config.ems_secret).toBe('');
    });

    it('exposes the static execution switch wait constant', () => {
      expect(config.EXECUTION_SWITCH_WAIT_SEC).toBe(10);
    });
  });

  describe('overrides from environment variables', () => {
    let config;
    beforeEach(() => {
      process.env.EXECUTION_MONITOR_URL = 'http://monitor:1/publish';
      process.env.FILE_SERVER_API_HOST = 'http://files:9';
      process.env.FILE_SERVER_ACCESS_KEY = 'access';
      process.env.FILE_SERVER_SECRET_KEY = 'secret';
      process.env.MEDIA_BUCKET = 'my-bucket';
      process.env.REDIS_HOST = 'redis-host';
      process.env.REDIS_PORT = '6380';
      process.env.SERVER_TIMEOUT_SEC = '120';
      process.env.PUBLIC_PEM = 'PEM';
      process.env.EMS_SECRET = 'ems';
      config = require(CONFIG_PATH);
    });

    it('reads all overridable values from the environment', () => {
      expect(config.EXECUTION_MONITOR_URL).toBe('http://monitor:1/publish');
      expect(config.FILE_SERVER_API_HOST).toBe('http://files:9');
      expect(config.FILE_SERVER_ACCESS_KEY).toBe('access');
      expect(config.FILE_SERVER_SECRET_KEY).toBe('secret');
      expect(config.MEDIA_BUCKET).toBe('my-bucket');
      expect(config.REDIS_HOST).toBe('redis-host');
      expect(config.public_pem).toBe('PEM');
      expect(config.ems_secret).toBe('ems');
      expect(config.server_timeout_sec).toBe('120');
    });

    it('parses REDIS_PORT as an integer', () => {
      expect(config.REDIS_PORT).toBe(6380);
      expect(typeof config.REDIS_PORT).toBe('number');
    });
  });
});
