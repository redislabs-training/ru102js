const config = require('better-config');

config.set('../config.json');

const redis = require('../src/daos/impl/redis/redis_client');
const redisFeedDAO = require('../src/daos/impl/redis/feed_dao_redis_impl');
const keyGenerator = require('../src/daos/impl/redis/redis_key_generator');

const testSuiteName = 'feed_dao_redis_impl';

const testKeyPrefix = `test:${testSuiteName}`;

keyGenerator.setPrefix(testKeyPrefix);
const client = redis.getClient();

const generateMeterReading = (val, siteId) => ({
  siteId: (siteId || 999),
  dateTime: new Date().getTime(),
  tempC: val,
  whUsed: val,
  whGenerated: val,
});

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

const insertAndReadBackFromStream = async (siteId) => {
  const testMeterReading1 = generateMeterReading(1);
  const testMeterReading2 = generateMeterReading(2, siteId);

  await redisFeedDAO.insert(testMeterReading1);
  await redisFeedDAO.insert(testMeterReading2);

  // Test feed with and without limit.
  let meterReadings = await (siteId
    ? redisFeedDAO.getRecentForSite(siteId, 100)
    : redisFeedDAO.getRecentGlobal(100)
  );

  if (siteId) {
    // Site specific stream.
    expect(meterReadings.length).toBe(1);
    expect(meterReadings[0].siteId).toBe(testMeterReading2.siteId);
    expect(meterReadings[0].tempC).toBe(testMeterReading2.tempC);
    expect(meterReadings[0].whUsed).toBe(testMeterReading2.whUsed);
    expect(meterReadings[0].whGenerated).toBe(testMeterReading2.whGenerated);
  } else {
    // Global stream.
    expect(meterReadings.length).toBe(2);
    expect(meterReadings[0].siteId).toBe(testMeterReading2.siteId);
    expect(meterReadings[0].tempC).toBe(testMeterReading2.tempC);
    expect(meterReadings[0].whUsed).toBe(testMeterReading2.whUsed);
    expect(meterReadings[0].whGenerated).toBe(testMeterReading2.whGenerated);
    expect(meterReadings[1].siteId).toBe(testMeterReading1.siteId);
    expect(meterReadings[1].tempC).toBe(testMeterReading1.tempC);
    expect(meterReadings[1].whUsed).toBe(testMeterReading1.whUsed);
    expect(meterReadings[1].whGenerated).toBe(testMeterReading1.whGenerated);
  }

  meterReadings = await (siteId
    ? redisFeedDAO.getRecentForSite(siteId, 1)
    : redisFeedDAO.getRecentGlobal(1)
  );

  expect(meterReadings.length).toBe(1);
  expect(meterReadings[0].siteId).toBe(testMeterReading2.siteId);
  expect(meterReadings[0].tempC).toBe(testMeterReading2.tempC);
  expect(meterReadings[0].whUsed).toBe(testMeterReading2.whUsed);
  expect(meterReadings[0].whGenerated).toBe(testMeterReading2.whGenerated);
};

// This test is for Challenge #6.
test.skip(`${testSuiteName}: insert and read back from global stream`, async () => {
  await insertAndReadBackFromStream();
});

// This test is for Challenge #6.
test.skip(`${testSuiteName}: read stream for site that does not exist`, async () => {
  const meterReadings = await redisFeedDAO.getRecentForSite(-1, 100);

  expect(meterReadings.length).toBe(0);
});

// This test is for Challenge #6.
test.skip(`${testSuiteName}: insert and read back from site specific stream`, async () => {
  await insertAndReadBackFromStream(998);
});

/* eslint-enable */
