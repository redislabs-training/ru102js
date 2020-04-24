const config = require('better-config');

config.set('../config.json');

const keyGenerator = require('../src/daos/impl/redis/redis_key_generator');

const testSuiteName = 'redis_key_generator';
const expectedKeyPrefix = 'test';

keyGenerator.setPrefix(expectedKeyPrefix);

/* eslint-disable no-undef */

test(`${testSuiteName}: getSiteHashId`, () => {
  expect(keyGenerator.getSiteHashKey(999)).toBe(`${expectedKeyPrefix}:sites:info:999`);
});

test(`${testSuiteName}: getSiteIDsKey`, () => {
  expect(keyGenerator.getSiteIDsKey()).toBe(`${expectedKeyPrefix}:sites:ids`);
});

test(`${testSuiteName}: getSiteStatsKey`, () => {
  // July 10th 2019 16:00:00 UTC.
  expect(keyGenerator.getSiteStatsKey(999, 1562774400)).toBe(`${expectedKeyPrefix}:sites:stats:2019-07-10:999`);
});

test(`${testSuiteName}: getRateLimiterKey`, () => {
  const name = 'resourcename';
  const interval = 10;
  const maxHits = 12;
  const key = keyGenerator.getRateLimiterKey(name, interval, maxHits);

  // The exact value returned depends on the time of day and
  // checking it could lead to periodic test failure if we
  // calculate the minute of day first then compare with the
  // result of calling getRateLimiterKey.  This test avoids
  // doing this by testing various properties of the returned
  // key to make sure it's the right format.

  const expectedStart = `${expectedKeyPrefix}:limiter:${name}:`;

  expect(key.length).toBeGreaterThan(expectedStart.length);
  expect(key.startsWith(expectedStart)).toBe(true);
  expect(key.endsWith(`:${maxHits}`)).toBe(true);

  const keyParts = key.split(':');

  expect(keyParts.length).toBe(5);
  expect(keyParts[0]).toBe(expectedKeyPrefix);
  expect(keyParts[1]).toBe('limiter');
  expect(keyParts[2]).toBe(name);

  const minuteOfDay = parseInt(keyParts[3], 10);
  expect(minuteOfDay).toBeGreaterThanOrEqual(0);
  expect(minuteOfDay).toBeLessThan(1440);

  expect(keyParts[4]).toBe(`${maxHits}`);
});

test(`${testSuiteName}: getSiteGeoKey`, () => {
  expect(keyGenerator.getSiteGeoKey()).toBe(`${expectedKeyPrefix}:sites:geo`);
});

test(`${testSuiteName}: getCapacityRankingKey`, () => {
  expect(keyGenerator.getCapacityRankingKey()).toBe(`${expectedKeyPrefix}:sites:capacity:ranking`);
});

test(`${testSuiteName}: getTSKey`, () => {
  expect(keyGenerator.getTSKey(99, 'test')).toBe(`${expectedKeyPrefix}:sites:ts:99:test`);
});

test(`${testSuiteName}: getDayMetricKey`, () => {
  // 1562650200 = July 9th 2019 05:30:00 UTC
  expect(keyGenerator.getDayMetricKey(999, 'testing', 1562650200)).toBe(`${expectedKeyPrefix}:metric:testing:2019-07-09:999`);
});

test(`${testSuiteName}: getGlobalFeedKey`, () => {
  expect(keyGenerator.getGlobalFeedKey()).toBe(`${expectedKeyPrefix}:sites:feed`);
});

test(`${testSuiteName}: getFeedKey`, () => {
  expect(keyGenerator.getFeedKey(99)).toBe(`${expectedKeyPrefix}:sites:feed:99`);
});

test(`${testSuiteName}: setPrefix`, () => {
  expect(keyGenerator.getSiteIDsKey()).toBe(`${expectedKeyPrefix}:sites:ids`);
});

test(`${testSuiteName}: getTemporaryKey`, () => {
  const tmpKey = keyGenerator.getTemporaryKey();
  expect(tmpKey.length).toBeGreaterThan(0);
});

/* eslint-enable */
