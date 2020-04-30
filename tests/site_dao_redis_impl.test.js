const config = require('better-config');

config.set('../config.json');

const redis = require('../src/daos/impl/redis/redis_client');
const redisSiteDAO = require('../src/daos/impl/redis/site_dao_redis_impl');
const keyGenerator = require('../src/daos/impl/redis/redis_key_generator');

const testSuiteName = 'site_dao_redis_impl';

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

test(`${testSuiteName}: insert without coordinates`, async () => {
  const site = {
    id: 4,
    capacity: 5.5,
    panels: 4,
    address: '910 Pine St.',
    city: 'Oakland',
    state: 'CA',
    postalCode: '94577',
  };

  const expectedSiteHash = {
    id: '4',
    capacity: '5.5',
    panels: '4',
    address: '910 Pine St.',
    city: 'Oakland',
    state: 'CA',
    postalCode: '94577',
  };

  await redisSiteDAO.insert(site);

  const siteHashKey = keyGenerator.getSiteHashKey(site.id);
  const isMember = await client.sismemberAsync(
    keyGenerator.getSiteIDsKey(),
    siteHashKey,
  );

  expect(isMember).toBe(1);

  const siteFromRedis = await client.hgetallAsync(siteHashKey);

  expect(siteFromRedis).toEqual(expectedSiteHash);
});

test(`${testSuiteName}: insert with coordinates`, async () => {
  const site = {
    id: 4,
    capacity: 5.5,
    panels: 4,
    address: '910 Pine St.',
    city: 'Oakland',
    state: 'CA',
    postalCode: '94577',
    coordinate: {
      lat: 37.739659,
      lng: -122.255689,
    },
  };

  const expectedSiteHash = {
    id: '4',
    capacity: '5.5',
    panels: '4',
    address: '910 Pine St.',
    city: 'Oakland',
    state: 'CA',
    postalCode: '94577',
    lat: '37.739659',
    lng: '-122.255689',
  };

  await redisSiteDAO.insert(site);

  const siteHashKey = keyGenerator.getSiteHashKey(site.id);
  const isMember = await client.sismemberAsync(
    keyGenerator.getSiteIDsKey(),
    siteHashKey,
  );

  expect(isMember).toBe(1);

  const siteFromRedis = await client.hgetallAsync(siteHashKey);

  expect(siteFromRedis).toEqual(expectedSiteHash);
});

test(`${testSuiteName}: findById with existing site`, async () => {
  const site = {
    id: 4,
    capacity: 5.5,
    panels: 4,
    address: '910 Pine St.',
    city: 'Oakland',
    state: 'CA',
    postalCode: '94577',
  };

  await redisSiteDAO.insert(site);
  const siteFromRedis = await redisSiteDAO.findById(site.id);
  expect(siteFromRedis).toEqual(site);
});

test(`${testSuiteName}: findById with existing site with coordinates`, async () => {
  const site = {
    id: 4,
    capacity: 5.5,
    panels: 4,
    address: '910 Pine St.',
    city: 'Oakland',
    state: 'CA',
    postalCode: '94577',
    coordinate: {
      lat: 37.739659,
      lng: -122.255689,
    },
  };

  await redisSiteDAO.insert(site);
  const siteFromRedis = await redisSiteDAO.findById(site.id);

  expect(siteFromRedis).toEqual(site);
});

test(`${testSuiteName}: findById with missing site`, async () => {
  const site = await redisSiteDAO.findById(99);
  expect(site).toBe(null);
});

// This test is for Challenge #1.
test(`${testSuiteName}: findAll with multiple sites`, async () => {
  const sites = [{
    id: 1,
    capacity: 4.5,
    panels: 3,
    address: '123 Willow St.',
    city: 'Oakland',
    state: 'CA',
    postalCode: '94577',
    coordinate: {
      lat: 37.739659,
      lng: -122.255689,
    },
  }, {
    id: 2,
    capacity: 3.0,
    panels: 2,
    address: '456 Maple St.',
    city: 'Oakland',
    state: 'CA',
    postalCode: '94577',
    coordinate: {
      lat: 37.739559,
      lng: -122.256689,
    },
  }, {
    id: 3,
    capacity: 4.0,
    panels: 3,
    address: '789 Oak St.',
    city: 'Oakland',
    state: 'CA',
    postalCode: '94577',
    coordinate: {
      lat: 37.739659,
      lng: -122.255689,
    },
  }];

  /* eslint-disable no-await-in-loop */

  for (const site of sites) {
    await redisSiteDAO.insert(site);
  }

  const sitesFromRedis = await redisSiteDAO.findAll();

  // Workaround due to ordering differences when using a set...
  expect(sitesFromRedis.length).toEqual(sites.length);
  expect(sitesFromRedis).toEqual(expect.arrayContaining(sites));
});

// This test is for Challenge #1.
test(`${testSuiteName}: findAll with empty sites`, async () => {
  const sites = await redisSiteDAO.findAll();
  expect(sites).toEqual([]);
});

/* eslint-enable */
