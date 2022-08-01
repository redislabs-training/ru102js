const config = require('better-config');

config.set('../config.json');

const redis = require('../src/daos/impl/redis/redis_client');
const redisSiteStatsDAO = require('../src/daos/impl/redis/sitestats_dao_redis_impl');
const keyGenerator = require('../src/daos/impl/redis/redis_key_generator');

const testSuiteName = 'sitestats_dao_redis_impl';

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
  let before = Math.floor(new Date().getTime() / 1000);

  const meterReading = {
    siteId: 999,
    dateTime: 1562619432,
    whUsed: 22.4,
    whGenerated: 12.3,
    tempC: 23.4,
  };

  await redisSiteStatsDAO.update(meterReading);

  const hashKey = `${testKeyPrefix}:sites:stats:2019-07-08:999`;

  let after = Math.floor(new Date().getTime() / 1000);
  let hash = await client.hgetallAsync(hashKey);

  expect(hash.meterReadingCount).toBe('1');
  expect(hash.maxWhGenerated).toBe(`${meterReading.whGenerated}`);
  expect(hash.minWhGenerated).toBe(`${meterReading.whGenerated}`);
  expect(hash.maxCapacity).toBe(`${meterReading.whGenerated - meterReading.whUsed}`);

  let lastReportingTime = parseInt(hash.lastReportingTime, 10);
  expect(lastReportingTime).toBeGreaterThanOrEqual(before);
  expect(lastReportingTime).toBeLessThanOrEqual(after);

  // Send in a reading with less capacity, expect to get previous
  // maxCapacity back and meterReadingCount of 2.

  const meterReading2 = {
    siteId: 999,
    dateTime: 1562619482,
    whUsed: 24.4,
    whGenerated: 12.1,
    tempC: 24.4,
  };

  before = Math.floor(new Date().getTime() / 1000);
  await redisSiteStatsDAO.update(meterReading2);
  after = Math.floor(new Date().getTime() / 1000);

  hash = await client.hgetallAsync(hashKey);

  expect(hash.meterReadingCount).toBe('2');

  // Looking for value from the previous meterReading.
  expect(hash.maxWhGenerated).toBe(`${meterReading.whGenerated}`);

  // Looking for value from this meterReading.
  expect(hash.minWhGenerated).toBe(`${meterReading2.whGenerated}`);

  // Looking for value from the previous meterReading.
  expect(hash.maxCapacity).toBe(`${meterReading.whGenerated - meterReading.whUsed}`);

  lastReportingTime = parseInt(hash.lastReportingTime, 10);
  expect(lastReportingTime).toBeGreaterThanOrEqual(before);
  expect(lastReportingTime).toBeLessThanOrEqual(after);

  // Send in a reading with more capacity, expect to get updated
  // maxCapacity back and meterReadingCount of 3.

  const meterReading3 = {
    siteId: 999,
    dateTime: 1562619542,
    whUsed: 10.4,
    whGenerated: 22.1,
    tempC: 22.3,
  };

  before = Math.floor(new Date().getTime() / 1000);
  await redisSiteStatsDAO.update(meterReading3);
  after = Math.floor(new Date().getTime() / 1000);

  hash = await client.hgetallAsync(hashKey);

  expect(hash.meterReadingCount).toBe('3');

  // Looking for value from this meterReading.
  expect(hash.maxWhGenerated).toBe(`${meterReading3.whGenerated}`);

  // Looking for value from the previous meterReading.
  expect(hash.minWhGenerated).toBe(`${meterReading2.whGenerated}`);

  // Looking for value from the this meterReading.
  expect(hash.maxCapacity).toBe(`${meterReading3.whGenerated - meterReading3.whUsed}`);

  lastReportingTime = parseInt(hash.lastReportingTime, 10);
  expect(lastReportingTime).toBeGreaterThanOrEqual(before);
  expect(lastReportingTime).toBeLessThanOrEqual(after);
});


test(`${testSuiteName}: findById`, async () => {
  // Create some data.
  const meterReading = {
    siteId: 999,
    dateTime: 1562619432,
    whUsed: 22.4,
    whGenerated: 12.3,
    tempC: 23.4,
  };

  // Used for checking lastReportingTime
  const before = Math.floor(new Date().getTime() / 1000);

  await redisSiteStatsDAO.update(meterReading);

  // Used for checking lastReportingTime
  const after = Math.floor(new Date().getTime() / 1000);

  // Retrieve the data.
  const response = await redisSiteStatsDAO.findById(meterReading.siteId, meterReading.dateTime);

  // Check versus expected results.
  expect(response.meterReadingCount).toBe(1);
  expect(response.maxWhGenerated).toBe(meterReading.whGenerated);
  expect(response.minWhGenerated).toBe(meterReading.whGenerated);
  expect(response.maxCapacity).toBe(meterReading.whGenerated - meterReading.whUsed);
  expect(response.lastReportingTime).toBeGreaterThanOrEqual(before);
  expect(response.lastReportingTime).toBeLessThanOrEqual(after);

  // Check that an expiry was set.
  const ttl = await client.ttlAsync(
    keyGenerator.getSiteStatsKey(
      meterReading.siteId,
      meterReading.dateTime,
    ),
  );

  expect(ttl).toBeGreaterThan(0);
  expect(ttl).toBeLessThanOrEqual(60 * 60 * 24 * 7); // One week in seconds.
});

/* eslint-enable */
