const config = require('better-config');

config.set('../config.json');

const redis = require('../src/daos/impl/redis/redis_client');

const client = redis.getClient();

const testSuiteName = 'Basic';

const testPlanets = [
  'Mercury',
  'Mercury',
  'Venus',
  'Earth',
  'Earth',
  'Mars',
  'Jupiter',
  'Saturn',
  'Uranus',
  'Neptune',
  'Pluto',
];

/* eslint-disable no-undef */

// Runs before all tests.
beforeAll(() => {
  jest.setTimeout(60000);
});

// Runs before each test.
beforeEach(async () => {
  await client.delAsync('planets');
  await client.delAsync('earth');
});

// Runs after each test.
afterEach(async () => {
  await client.delAsync('planets');
  await client.delAsync('earth');
});

// Runs after all tests have finished.
afterAll(async () => {
  // Release Redis connection.
  client.quit();
});

test(`${testSuiteName}: Test Redis List`, async () => {
  expect(testPlanets.length).toBe(11);

  // Add all test planets to a list in Redis.
  let result = await client.rpushAsync('planets', testPlanets);
  expect(result).toBe(11);

  // Ask Redis what the length of the list is.
  result = await client.llenAsync('planets');
  expect(result).toBe(11);

  // Get the planets from the list.  LRANGE is an O(s+n) command,
  // where s is start offset from the head of the list. Be careful
  // running this with large lists to retrieve the whole list.
  result = await client.lrangeAsync('planets', 0, -1);
  expect(result).toEqual(testPlanets);

  // Remove elements that we know to be duplicates.
  // Note: LREM is an O(n) operation.
  await client.lremAsync('planets', 1, 'Mercury');
  await client.lremAsync('planets', 1, 'Earth');

  // Remove a planet from the end of the list.
  result = await client.rpopAsync('planets');
  expect(result).toBe('Pluto');

  result = await client.llenAsync('planets');
  expect(result).toBe(8);
});

test(`${testSuiteName}: Test Redis Set`, async () => {
  expect(testPlanets.length).toBe(11);

  // Add all test planets to a Redis set.
  await client.saddAsync('planets', testPlanets);

  // Check the cardinality of that set.
  let length = await client.scardAsync('planets');
  expect(length).toBe(9);

  // Read the set back from Redis and compare with a local set.
  const jsSet = new Set(testPlanets);
  const responseArray = await client.smembersAsync('planets');
  const setFromRedis = new Set(responseArray);

  expect(setFromRedis.length).toBe(jsSet.length);

  for (const member of jsSet) {
    expect(setFromRedis.has(member)).toBe(true);
  }

  // Remove Pluto from the set.
  const numRemoved = await client.sremAsync('planets', 'Pluto');
  expect(numRemoved).toBe(1);

  length = await client.scardAsync('planets');
  expect(length).toBe(8);
});

test(`${testSuiteName}: Test Redis Hash`, async () => {
  const earthProps = {
    diameterKM: 12756,
    dayLengthHours: 24,
    meanTempC: 15,
    moonCount: 1,
  };

  // Set the fields one at a time...
  await Promise.all(
    Object.keys(earthProps).map(
      key => client.hsetAsync('earth', key, earthProps[key]),
    ),
  );

  // Get the hash back from Redis.  Note values returned as strings.
  let hash = await client.hgetallAsync('earth');
  expect(hash).toEqual({
    diameterKM: '12756',
    dayLengthHours: '24',
    meanTempC: '15',
    moonCount: '1',
  });

  // If we want numeric values, we will need to convert the strings
  // using parseInt or parseFloat
  let diameter = parseInt(hash.diameterKM, 10);
  expect(diameter).toBe(12756);

  // More efficient, set all properties at once using the object.
  await client.hmsetAsync('earth', earthProps);
  hash = await client.hgetallAsync('earth');

  expect(hash).toEqual({
    diameterKM: '12756',
    dayLengthHours: '24',
    meanTempC: '15',
    moonCount: '1',
  });

  // Test that we can get a single property.
  diameter = await client.hgetAsync('earth', 'diameterKM');
  expect(diameter).toBe('12756');
});

/* eslint-enable */
