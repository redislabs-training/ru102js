const config = require('better-config');

config.set('../config.json');

const redis = require('../src/daos/impl/redis/redis_client');

const client = redis.getClient();

const testSuiteName = 'Hello';
const testKey = 'hello';

/* eslint-disable no-undef */

beforeAll(() => {
  jest.setTimeout(60000);
});

afterAll(async () => {
  // Delete the key we may have created.
  await client.delAsync(testKey);

  // Release Redis connection.
  client.quit();
});

test(`${testSuiteName}: basic hello world test`, async () => {
  const reply = await client.setAsync(testKey, 'world');
  expect(reply).toBe('OK');

  const keyValue = await client.getAsync(testKey);
  expect(keyValue).toBe('world');
});

/* eslint-enable */
