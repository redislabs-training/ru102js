const config = require('better-config');

config.set('../config.json');

const redis = require('../src/daos/impl/redis/redis_client');

const client = redis.getClient();

const testSuiteName = 'streams';
const testKeyPrefix = `test:${testSuiteName}`;

const numberOfSites = 300;
const measurementsPerHour = 60;
const hoursPerDay = 24;
const maxDays = 14;

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

test(`${testSuiteName}: basic stream test`, async () => {
  const streamKey = `${testKeyPrefix}:test:stream`;
  const maxStreamEntries = numberOfSites * measurementsPerHour * hoursPerDay * maxDays;

  const entry = [
    'siteId',
    1,
    'tempC',
    18.0,
  ];

  const streamEntryId = await client.xaddAsync(
    streamKey,
    'MAXLEN',
    '~',
    maxStreamEntries,
    '*',
    ...entry,
  );

  const result = await client.xrevrangeAsync(
    streamKey,
    '+',
    '-',
    'COUNT',
    1,
  );

  expect(result[0][0]).toBe(streamEntryId);
  expect(result[0][1]).toEqual(['siteId', '1', 'tempC', '18']);
});

/* eslint-enable */
