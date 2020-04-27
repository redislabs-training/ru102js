const config = require('better-config');

config.set('../config.json');

const redis = require('../src/daos/impl/redis/redis_client');

const client = redis.getClient();

const testSuiteName = 'transaction';
const testKeyPrefix = `test:${testSuiteName}`;

/* eslint-disable no-undef */

beforeAll(() => {
  jest.setTimeout(60000);
});

afterEach(async () => {
  const testKeys = await client.keysAsync(`${testKeyPrefix}:*`);

  if (testKeys.length > 0) {
    await client.delAsync(testKeys);
  }
});

afterAll(() => {
  // Release Redis connection.
  client.quit();
});

test(`${testSuiteName}: example transaction`, async () => {
  const transaction = client.multi();
  const testKey = `${testKeyPrefix}:example_transaction`;
  const testKey2 = `${testKeyPrefix}:example_transaction_2`;

  transaction.hset(testKey, 'available', 'true');
  transaction.expire(testKey, 1000);
  transaction.sadd(testKey2, 1);

  const responses = await transaction.execAsync();

  expect(responses).toHaveLength(3);
  expect(responses[0]).toBe(1);
  expect(responses[1]).toBe(1);
  expect(responses[2]).toBe(1);
});

/* eslint-enable */
