const config = require('better-config');

config.set('../config.json');

const redis = require('../src/daos/impl/redis/redis_client');
const redisRateLimiterDAO = require('../src/daos/impl/redis/sliding_ratelimiter_dao_redis_impl');
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

const sleep = (milliseconds) => {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
};

const runSlidingWindowTests = async (name, limiterOpts, howMany) => {
  const results = [];

  for (n = 0; n < howMany; n += 1) {
    const remains = await redisRateLimiterDAO.hit(name, limiterOpts);
    results.push(remains);
  }

  return results;
};

// Challenge 7. Remove '.skip' to enable test.
test.skip(`${testSuiteName}: hit (sliding window limit not exceeded)`, async () => {
  const results = await runSlidingWindowTests('testresource', {
    interval: 10000,
    maxHits: 5,
  }, 5);

  expect(results).toStrictEqual([4, 3, 2, 1, 0]);
});

// Challenge 7. Remove '.skip' to enable test.
test.skip(`${testSuiteName}: hit (sliding window limit exceeded)`, async () => {
  let results = await runSlidingWindowTests('testresource2', {
    interval: 10000,
    maxHits: 5,
  }, 6);

  expect(results).toStrictEqual([4, 3, 2, 1, 0, -1]);

  results = await runSlidingWindowTests('testresource3', {
    interval: 10000,
    maxHits: 5,
  }, 8);

  expect(results).toStrictEqual([4, 3, 2, 1, 0, -1, -1, -1]);
});

// Challenge 7. Remove '.skip' to enable test.
test.skip(`${testSuiteName}: hit (sliding window ensure window slides)`, async () => {
  const sliderName = 'testresource4';
  const sliderOpts = {
    interval: 2000,
    maxHits: 5,
  };

  let results = await runSlidingWindowTests(sliderName, sliderOpts, 3);
  expect(results).toStrictEqual([4, 3, 2]);

  sleep(2000);

  // Expect the window to have reset...

  results = await runSlidingWindowTests(sliderName, sliderOpts, 7);
  expect(results).toStrictEqual([4, 3, 2, 1, 0, -1, -1]);
});

/* eslint-enable */
