const config = require('better-config');

config.set('../config.json');

const redis = require('../src/daos/impl/redis/redis_client');
const redisCapacityDAO = require('../src/daos/impl/redis/capacity_dao_redis_impl');
const keyGenerator = require('../src/daos/impl/redis/redis_key_generator');

const testSuiteName = 'capacity_dao_redis_impl';

const testKeyPrefix = `test:${testSuiteName}`;

keyGenerator.setPrefix(testKeyPrefix);
const client = redis.getClient();

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

test(`${testSuiteName}: update`, async () => {
  const testReading = {
    siteId: 999,
    dateTime: Math.floor(new Date().getTime() / 1000),
    whUsed: 12,
    whGenerated: 20,
    tempC: 20,
  };

  await redisCapacityDAO.update(testReading);

  const score = await client.zscoreAsync(
    keyGenerator.getCapacityRankingKey(),
    testReading.siteId,
  );

  // Remember score will come back as a string, so ensure it is
  // compared with a string to make the test succeed.
  expect(score).toBe(`${testReading.whGenerated - testReading.whUsed}`);
});

test(`${testSuiteName}: getReport`, async () => {
  const entries = [
    {
      id: 1,
      score: 10,
    },
    {
      id: 2,
      score: 15,
    },
    {
      id: 3,
      score: 30,
    },
    {
      id: 4,
      score: 20,
    },
    {
      id: 5,
      score: 50,
    },
    {
      id: 6,
      score: -4,
    },
  ];

  await Promise.all(
    entries.map(
      site => client.zaddAsync(
        keyGenerator.getCapacityRankingKey(),
        site.score,
        site.id,
      ),
    ),
  );

  const report = await redisCapacityDAO.getReport(2);

  expect(report).toStrictEqual({
    lowestCapacity: [
      {
        siteId: 6,
        capacity: -4,
      },
      {
        siteId: 1,
        capacity: 10,
      },
    ],
    highestCapacity: [
      {
        siteId: 5,
        capacity: 50,
      },
      {
        siteId: 3,
        capacity: 30,
      },
    ],
  });
});

// This test is for Challenge #4.
test.skip(`${testSuiteName}: getRank`, async () => {
  // Create some data
  const entries = [
    {
      id: 1,
      score: 10,
    },
    {
      id: 2,
      score: 15,
    },
    {
      id: 3,
      score: 30,
    },
    {
      id: 4,
      score: 20,
    },
    {
      id: 5,
      score: 50,
    },
  ];

  await Promise.all(
    entries.map(
      site => client.zaddAsync(
        keyGenerator.getCapacityRankingKey(),
        site.score,
        site.id,
      ),
    ),
  );

  let result = await redisCapacityDAO.getRank(1);
  expect(result).toBe(4);

  result = await redisCapacityDAO.getRank(2);
  expect(result).toBe(3);

  result = await redisCapacityDAO.getRank(3);
  expect(result).toBe(1);

  result = await redisCapacityDAO.getRank(4);
  expect(result).toBe(2);

  result = await redisCapacityDAO.getRank(5);
  expect(result).toBe(0);

  // Test invalid member.
  result = await redisCapacityDAO.getRank(6);
  expect(result).toBe(null);
});

/* eslint-enable */
