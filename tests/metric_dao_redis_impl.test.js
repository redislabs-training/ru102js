const config = require('better-config');

config.set('../config.json');

const redis = require('../src/daos/impl/redis/redis_client');
const redisMetricDAO = require('../src/daos/impl/redis/metric_dao_redis_impl');
const keyGenerator = require('../src/daos/impl/redis/redis_key_generator');
const timeUtils = require('../src/utils/time_utils');

const testSuiteName = 'metric_dao_redis_impl';

const testKeyPrefix = `test:${testSuiteName}`;

keyGenerator.setPrefix(testKeyPrefix);
const client = redis.getClient();

const sampleReadings = [];

/* eslint-disable no-undef */

beforeAll(() => {
  jest.setTimeout(60000);

  // Create the sample data.
  let time = timeUtils.getCurrentTimestamp();

  for (let n = 0; n < 72 * 60; n += 1) {
    const reading = {
      siteId: 1,
      whUsed: n,
      whGenerated: n,
      tempC: n,
      dateTime: time,
    };

    sampleReadings.push(reading);

    // Set time to one minute earlier.
    time -= 60;
  }
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

// Inserts then retrieves up to limit metrics.
const testInsertAndRetrieve = async (limit) => {
  // Insert all of the sample data.

  /* eslint-disable no-await-in-loop */
  for (const reading of sampleReadings) {
    await redisMetricDAO.insert(reading);
  }
  /* eslint-enable no-await-in-loop */

  // Retrieve up to 'limit' metrics back.
  const measurements = await redisMetricDAO.getRecent(1, 'whGenerated', timeUtils.getCurrentTimestamp(), limit);

  // Make sure we got the right number back.
  expect(measurements.length).toEqual(limit);

  let n = limit;

  for (const measurement of measurements) {
    expect(measurement.value).toEqual(n - 1);
    n -= 1;
  }
};

// This test is for Challenge #2.
test(`${testSuiteName}: test 1 reading`, async () => testInsertAndRetrieve(1));

// This test is for Challenge #2.
test(`${testSuiteName}: test 1 day of readings`, async () => testInsertAndRetrieve(60 * 24));

// This test is for Challenge #2.
test(`${testSuiteName}: test multiple days of readings`, async () => testInsertAndRetrieve(60 * 70));

/* eslint-enable */
