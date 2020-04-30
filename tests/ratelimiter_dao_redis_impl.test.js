const config = require('better-config');

config.set('../config.json');

const redis = require('../src/daos/impl/redis/redis_client');
const redisRateLimiterDAO = require('../src/daos/impl/redis/ratelimiter_dao_redis_impl');
const keyGenerator = require('../src/daos/impl/redis/redis_key_generator');

const testSuiteName = 'ratelimiter_dao_redis_impl';

const testKeyPrefix = `test:${testSuiteName}`;

keyGenerator.setPrefix(testKeyPrefix);
const client = redis.getClient();

/* eslint-disable no-undef, no-await-in-loop */

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

const runRateLimiter = async (name, limiterOpts, howMany) => {
  const results = [];

  for (n = 0; n < howMany; n += 1) {
    const remains = await redisRateLimiterDAO.hit(name, limiterOpts);
    results.push(remains);
  }

  return results;
};

test(`${testSuiteName}: hit (fixed window limit not exceeded)`, async () => {
  const results = await runRateLimiter('testresource', {
    interval: 1,
    maxHits: 5,
  }, 5);

  expect(results).toStrictEqual([4, 3, 2, 1, 0]);
});

test(`${testSuiteName}: hit (fixed window limit exceeded)`, async () => {
  const results = await runRateLimiter('testresource2', {
    interval: 1,
    maxHits: 5,
  }, 7);

  expect(results).toStrictEqual([4, 3, 2, 1, 0, -1, -1]);
});

/* eslint-enable */
