const config = require('better-config');

config.set('../config.json');

const redis = require('../src/daos/impl/redis/redis_client');
const compareAndUpdateScript = require('../src/daos/impl/redis/scripts/compare_and_update_script');

const client = redis.getClient();

const testSuiteName = 'compare_and_update_script';
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

test(`${testSuiteName}: update if greater than`, async () => {
  const testKey = `${testKeyPrefix}:compareAndUpdateScript`;
  const testField = 'testField';

  await compareAndUpdateScript.load();

  // Set the value to 10.
  await client.evalshaAsync(compareAndUpdateScript.updateIfGreater(testKey, testField, 10));

  // Expect the value to be 10.
  let val = await client.hgetAsync(testKey, testField);
  expect(parseInt(val, 10)).toEqual(10);

  // Attempt to set the value to 9.
  await client.evalshaAsync(compareAndUpdateScript.updateIfGreater(testKey, testField, 9));

  // Expect the value to still be 10.
  val = await client.hgetAsync(testKey, testField);
  expect(parseInt(val, 10)).toEqual(10);

  // Set the value to 12.
  await client.evalshaAsync(compareAndUpdateScript.updateIfGreater(testKey, testField, 12));

  // Expect the value to be 12.
  val = await client.hgetAsync(testKey, testField);
  expect(parseInt(val, 10)).toEqual(12);
});

test(`${testSuiteName}: update if less than`, async () => {
  const testKey = `${testKeyPrefix}:compareAndUpdateScript`;
  const testField = 'testField';

  await compareAndUpdateScript.load();

  // Set the value to 10.
  await client.evalshaAsync(compareAndUpdateScript.updateIfLess(testKey, testField, 10));

  // Expect the value to be 10.
  let val = await client.hgetAsync(testKey, testField);
  expect(parseInt(val, 10)).toEqual(10);

  // Set the value to 9.
  await client.evalshaAsync(compareAndUpdateScript.updateIfLess(testKey, testField, 9));

  // Expect the value to be 9.
  val = await client.hgetAsync(testKey, testField);
  expect(parseInt(val, 10)).toEqual(9);

  // Set the value to 12.
  await client.evalshaAsync(compareAndUpdateScript.updateIfLess(testKey, testField, 12));

  // Expect the value to be 9.
  val = await client.hgetAsync(testKey, testField);
  expect(parseInt(val, 10)).toEqual(9);
});

/* eslint-enable */
