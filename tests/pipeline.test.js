const config = require('better-config');

config.set('../config.json');

const redis = require('../src/daos/impl/redis/redis_client');

const client = redis.getClient();

const testSuiteName = 'pipeline';
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

test(`${testSuiteName}: example command pipeline`, async () => {
  const pipeline = client.batch();
  const testKey = `${testKeyPrefix}:example_pipeline`;
  const testKey2 = `${testKeyPrefix}:example_pipeline_2`;

  pipeline.hset(testKey, 'available', 'true');
  pipeline.expire(testKey, 1000);
  pipeline.sadd(testKey2, 1);

  const responses = await pipeline.execAsync();

  expect(responses).toHaveLength(3);
  expect(responses[0]).toBe(1);
  expect(responses[1]).toBe(1);
  expect(responses[2]).toBe(1);
});

test(`${testSuiteName}: example pipeline with bad command`, async () => {
  const pipeline = client.batch();
  const testKey = `${testKeyPrefix}:example_bad_pipeline`;

  pipeline.set(testKey, 1);
  pipeline.incr(testKey, 99); // Error, wrong number of arguments!
  pipeline.get(testKey);

  const responses = await pipeline.execAsync();

  expect(responses).toHaveLength(3);
  expect(responses[0]).toBe('OK');
  expect(responses[1]).toEqual({
    command: 'INCR',
    args: [
      testKey,
      99,
    ],
    code: 'ERR',
    position: 1,
  });
  expect(responses[2]).toBe('1');
});

/* eslint-enable */
