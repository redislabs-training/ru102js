const config = require('better-config');

config.set('../config.json');

const redis = require('../src/daos/impl/redis/redis_client');
const updateIfLowestScript = require('../src/daos/impl/redis/scripts/update_if_lowest_script');

const client = redis.getClient();

const testSuiteName = 'update_if_lowest_script';
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

test(`${testSuiteName}: evalsha example`, async () => {
  const key = `${testKeyPrefix}:luatest`;
  const value = 10;

  // Load script and get its SHA back.
  const sha = await updateIfLowestScript.load();

  // Execute script (1 = number of Redis keys).
  const result = await client.evalshaAsync(sha, 1, key, value);

  // Check result.
  expect(result).toBe(1);
});

test(`${testSuiteName}: updateIfLowest example`, async () => {
  const key = `${testKeyPrefix}:luatest`;
  const value = 10;

  // Load script.
  await updateIfLowestScript.load();

  // Execute script using helper function.
  const result = await client.evalshaAsync(
    updateIfLowestScript.updateIfLowest(key, value),
  );

  // Check result.
  expect(result).toBe(1);
});

test(`${testSuiteName}: update if lowest`, async () => {
  const testKey = `${testKeyPrefix}:updateIfLowestScript`;

  // Set the value to 100.
  await client.setAsync(testKey, 100);

  await updateIfLowestScript.load();

  const result = await client.evalshaAsync(
    updateIfLowestScript.updateIfLowest(testKey, 50),
  );

  // Expect the response to be 1 / truthy (value was updated).
  expect(result).toBeTruthy();

  // Expect the stored (string) value to be 50.
  const storedResult = await client.getAsync(testKey);
  expect(parseInt(storedResult, 10)).toEqual(50);
});

test(`${testSuiteName}: update if lowest unchanged`, async () => {
  const testKey = `${testKeyPrefix}:updateIfLowestScript`;

  await client.setAsync(testKey, 100);
  await updateIfLowestScript.load();

  const result = await client.evalshaAsync(
    updateIfLowestScript.updateIfLowest(testKey, 200),
  );

  expect(result).toBeFalsy();

  const storedResult = await client.getAsync(testKey);
  expect(parseInt(storedResult, 10)).toEqual(100);
});

test(`${testSuiteName}: update if lowest with no key`, async () => {
  const testKey = `${testKeyPrefix}:updateIfLowestScript`;

  await updateIfLowestScript.load();

  const result = client.evalshaAsync(updateIfLowestScript.updateIfLowest(testKey, 200));

  expect(result).toBeTruthy();

  const storedResult = await client.getAsync(testKey);
  expect(parseInt(storedResult, 10)).toEqual(200);
});
