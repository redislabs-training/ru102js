const config = require('better-config');

config.set('../config.json');

const redis = require('../src/daos/impl/redis/redis_client');
const redisSiteDAO = require('../src/daos/impl/redis/site_geo_dao_redis_impl');
const redisCapacityDAO = require('../src/daos/impl/redis/capacity_dao_redis_impl');
const keyGenerator = require('../src/daos/impl/redis/redis_key_generator');

const testSuiteName = 'site_geo_dao_redis_impl';

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
    coordinate: {
      lat: 37.739659,
      lng: -122.255689,
    },
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

test(`${testSuiteName}: findAll with empty sites`, async () => {
  const sites = await redisSiteDAO.findAll();
  expect(sites).toEqual([]);
});

test(`${testSuiteName}: findByGeo with results`, async () => {
  const site1 = {
    id: 1,
    capacity: 3.5,
    panels: 3,
    address: '637 Britannia Drive',
    city: 'Vallejo',
    state: 'CA',
    postalCode: '94591',
    coordinate: {
      lat: 38.10476999999999,
      lng: -122.193849,
    },
  };

  const site2 = {
    id: 2,
    capacity: 4.5,
    panels: 3,
    address: '31353 Santa Elena Way',
    city: 'Union City',
    state: 'CA',
    postalCode: '94587',
    coordinate: {
      lat: 37.593981,
      lng: -122.059762,
    },
  };

  const site3 = {
    id: 3,
    capacity: 4.5,
    panels: 3,
    address: '1732 27th Avenue',
    city: 'Oakland',
    state: 'CA',
    postalCode: '94601',
    coordinate: {
      lat: 37.783431,
      lng: -122.228238,
    },
  };

  await Promise.all([
    redisSiteDAO.insert(site1),
    redisSiteDAO.insert(site2),
    redisSiteDAO.insert(site3),
  ]);

  // Find Oakland sites, expect 1.
  let response = await redisSiteDAO.findByGeo(37.804829, -122.272476, 10, 'km');
  expect(response.length).toBe(1);
  expect(response[0].id).toBe(site3.id);

  // Find Vallejo sites, expect 1.
  response = await redisSiteDAO.findByGeo(38.104086, -122.256637, 10, 'km');
  expect(response.length).toBe(1);
  expect(response[0].id).toBe(site1.id);

  // Find Union City sites, expect 1.
  response = await redisSiteDAO.findByGeo(37.596323, -122.081630, 10, 'km');
  expect(response.length).toBe(1);
  expect(response[0].id).toBe(site2.id);

  // Larger Radius should return all 3 sites.
  response = await redisSiteDAO.findByGeo(37.596323, -122.081630, 60, 'km');
  expect(response.length).toBe(3);
  expect(response[0].id).toBe(site2.id);
  expect(response[1].id).toBe(site3.id);
  expect(response[2].id).toBe(site1.id);
});

test(`${testSuiteName}: findByGeo no results`, async () => {
  // This site is not within a 10km radius of Mountain View, CA
  await redisSiteDAO.insert({
    id: 1,
    capacity: 3.5,
    panels: 3,
    address: '637 Britannia Drive',
    city: 'Vallejo',
    state: 'CA',
    postalCode: '94591',
    coordinate: {
      lat: 38.10476999999999,
      lng: -122.193849,
    },
  });

  // Ensure site was inserted.
  let response = await redisSiteDAO.findAll();
  expect(response.length).toBe(1);
  expect(response[0].id).toBe(1);

  response = await redisSiteDAO.findById(1);
  expect(response.id).toBe(1);

  // Do a 10km search around Mountain View, CA.
  response = await redisSiteDAO.findByGeo(37.4134391, -122.1513072, 10, 'km');
  expect(response.length).toBe(0);
});

// This test is for Challenge #5.
test.skip(`${testSuiteName}: findByGeoWithExcessCapacity`, async () => {
  const site1 = {
    id: 1,
    capacity: 4.5,
    panels: 3,
    address: '637 Britannia Drive',
    city: 'Vallejo',
    state: 'CA',
    postalCode: '94591',
    coordinate: {
      lat: 38.10476999999999,
      lng: -122.193849,
    },
  };

  const site2 = {
    id: 2,
    capacity: 4.5,
    panels: 3,
    address: '31353 Santa Elena Way',
    city: 'Union City',
    state: 'CA',
    postalCode: '94587',
    coordinate: {
      lat: 37.593981,
      lng: -122.059762,
    },
  };

  // Add sites.
  await Promise.all([
    redisSiteDAO.insert(site1),
    redisSiteDAO.insert(site2),
  ]);

  // Should find site1 and site2.
  let response = await redisSiteDAO.findByGeo(
    site1.coordinate.lat,
    site1.coordinate.lng,
    60,
    'km',
  );

  expect(response.length).toBe(2);
  expect(response[0].id).toBe(site1.id);
  expect(response[1].id).toBe(site2.id);

  // Now add some meter readings, such that site2 has capacity
  // and site1 does not.
  await Promise.all([
    redisCapacityDAO.update({
      siteId: site1.id,
      dateTime: Math.floor(new Date().getTime() / 1000),
      whUsed: 22,
      whGenerated: 20,
      tempC: 20,
    }),
    redisCapacityDAO.update({
      siteId: site2.id,
      dateTime: Math.floor(new Date().getTime() / 1000),
      whUsed: 12,
      whGenerated: 20,
      tempC: 20,
    }),
  ]);

  // Perform a capacity search, should return only site2.
  response = await redisSiteDAO.findByGeoWithExcessCapacity(
    site1.coordinate.lat,
    site1.coordinate.lng,
    60,
    'km',
  );

  expect(response.length).toBe(1);
  expect(response[0].id).toBe(site2.id);

  // Now make both sites have capacity, but not enough to be
  // considered worth showing as the capacity is below the
  // threshold.
  await Promise.all([
    redisCapacityDAO.update({
      siteId: site1.id,
      dateTime: Math.floor(new Date().getTime() / 1000),
      whUsed: 19.99,
      whGenerated: 20,
      tempC: 20,
    }),
    redisCapacityDAO.update({
      siteId: site2.id,
      dateTime: Math.floor(new Date().getTime() / 1000),
      whUsed: 19.9,
      whGenerated: 20,
      tempC: 20,
    }),
  ]);

  // Perform a capacity search, expect no results even though
  // both sites have some capacity.
  response = await redisSiteDAO.findByGeoWithExcessCapacity(
    site1.coordinate.lat,
    site1.coordinate.lng,
    60,
    'km',
  );

  expect(response.length).toBe(0);
});

/* eslint-enable */
