const redis = require('./redis_client');
const keyGenerator = require('./redis_key_generator');

// Minimum amount of capacity that a site should have to be
// considered as having 'excess capacity'.
const capacityThreshold = 0.2;

/**
 * Takes a flat key/value pairs object representing a Redis hash, and
 * returns a new object whose structure matches that of the site domain
 * object.  Also converts fields whose values are numbers back to
 * numbers as Redis stores all hash key values as strings.
 *
 * @param {Object} siteHash - object containing hash values from Redis
 * @returns {Object} - object containing the values from Redis remapped
 *  to the shape of a site domain object.
 * @private
 */
const remap = (siteHash) => {
  const remappedSiteHash = { ...siteHash };

  remappedSiteHash.id = parseInt(siteHash.id, 10);
  remappedSiteHash.panels = parseInt(siteHash.panels, 10);
  remappedSiteHash.capacity = parseFloat(siteHash.capacity, 10);

  // coordinate is optional.
  if (siteHash.hasOwnProperty('lat') && siteHash.hasOwnProperty('lng')) {
    remappedSiteHash.coordinate = {
      lat: parseFloat(siteHash.lat),
      lng: parseFloat(siteHash.lng),
    };

    // Remove original fields from resulting object.
    delete remappedSiteHash.lat;
    delete remappedSiteHash.lng;
  }

  return remappedSiteHash;
};

/**
 * Takes a site domain object and flattens its structure out into
 * a set of key/value pairs suitable for storage in a Redis hash.
 *
 * @param {Object} site - a site domain object.
 * @returns {Object} - a flattened version of 'site', with no nested
 *  inner objects, suitable for storage in a Redis hash.
 * @private
 */
const flatten = (site) => {
  const flattenedSite = { ...site };

  if (flattenedSite.hasOwnProperty('coordinate')) {
    flattenedSite.lat = flattenedSite.coordinate.lat;
    flattenedSite.lng = flattenedSite.coordinate.lng;
    delete flattenedSite.coordinate;
  }

  return flattenedSite;
};

/**
 * Insert a new site.
 *
 * @param {Object} site - a site object.
 * @returns {Promise} - a Promise, resolving to the string value
 *   for the key of the site Redis.
 */
const insert = async (site) => {
  const client = redis.getClient();

  const siteHashKey = keyGenerator.getSiteHashKey(site.id);

  await client.hmsetAsync(siteHashKey, flatten(site));

  // Co-ordinates are required when using this version of the DAO.
  if (!site.hasOwnProperty('coordinate')) {
    throw new Error('Coordinate required for site geo insert!');
  }

  await client.geoaddAsync(
    keyGenerator.getSiteGeoKey(),
    site.coordinate.lng,
    site.coordinate.lat,
    site.id,
  );

  return siteHashKey;
};

/**
 * Get the site object for a given site ID.
 *
 * @param {number} id - a site ID.
 * @returns {Promise} - a Promise, resolving to a site object.
 */
const findById = async (id) => {
  const client = redis.getClient();
  const siteKey = keyGenerator.getSiteHashKey(id);

  const siteHash = await client.hgetallAsync(siteKey);

  return (siteHash === null ? siteHash : remap(siteHash));
};

/**
 * Get an array of all site objects.
 *
 * @returns {Promise} - a Promise, resolving to an array of site objects.
 */
const findAll = async () => {
  const client = redis.getClient();

  const siteIds = await client.zrangeAsync(keyGenerator.getSiteGeoKey(), 0, -1);
  const sites = [];

  for (const siteId of siteIds) {
    const siteKey = keyGenerator.getSiteHashKey(siteId);

    /* eslint-disable no-await-in-loop */
    const siteHash = await client.hgetallAsync(siteKey);
    /* eslint-enable */

    if (siteHash) {
      // Call remap to remap the flat key/value representation
      // from the Redis hash into the site domain object format.
      sites.push(remap(siteHash));
    }
  }

  return sites;
};

/**
 * Get an array of sites within a radius of a given coordinate.
 *
 * @param {number} lat - Latitude of the coordinate to search from.
 * @param {number} lng - Longitude of the coordinate to search from.
 * @param {number} radius - Radius in which to search.
 * @param {'KM' | 'MI'} radiusUnit - The unit that the value of radius is in.
 * @returns {Promise} - a Promise, resolving to an array of site objects.
 */
const findByGeo = async (lat, lng, radius, radiusUnit) => {
  const client = redis.getClient();

  const siteIds = await client.georadiusAsync(
    keyGenerator.getSiteGeoKey(),
    lng,
    lat,
    radius,
    radiusUnit.toLowerCase(),
  );

  const sites = [];

  for (const siteId of siteIds) {
    /* eslint-disable no-await-in-loop */
    const siteKey = keyGenerator.getSiteHashKey(siteId);
    const siteHash = await client.hgetallAsync(siteKey);
    /* eslint-enable */

    if (siteHash) {
      sites.push(remap(siteHash));
    }
  }

  return sites;
};

/**
 * Get an array of sites where capacity exceeds consumption within
 * a radius of a given coordinate.
 *
 * @param {number} lat - Latitude of the coordinate to search from.
 * @param {number} lng - Longitude of the coordinate to search from.
 * @param {number} radius - Radius in which to search.
 * @param {'KM' | 'MI'} radiusUnit - The unit that the value of radius is in.
 * @returns {Promise} - a Promise, resolving to an array of site objects.
 */
const findByGeoWithExcessCapacity = async (lat, lng, radius, radiusUnit) => {
  /* eslint-disable no-unreachable */
  // Challenge #5, remove the next line...
  return [];

  const client = redis.getClient();

  // Create a pipeline to send multiple commands in one round trip.
  const setOperationsPipeline = client.batch();

  // Get sites within the radius and store them in a temporary sorted set.
  const sitesInRadiusSortedSetKey = keyGenerator.getTemporaryKey();

  setOperationsPipeline.georadiusAsync(
    keyGenerator.getSiteGeoKey(),
    lng,
    lat,
    radius,
    radiusUnit.toLowerCase(),
    'STORE',
    sitesInRadiusSortedSetKey,
  );

  // Create a key for a temporary sorted set containing sites that fell
  // within the radius and their current capacities.
  const sitesInRadiusCapacitySortedSetKey = keyGenerator.getTemporaryKey();

  // START Challenge #5
  // END Challenge #5

  // Expire the temporary sorted sets after 30 seconds, so that we
  // don't leave old keys on the server that we no longer need.
  setOperationsPipeline.expire(sitesInRadiusSortedSetKey, 30);
  setOperationsPipeline.expire(sitesInRadiusCapacitySortedSetKey, 30);

  // Execute the set operations commands, we do not need to
  // use the responses.
  await setOperationsPipeline.execAsync();

  // Get sites IDs with enough capacity from the temporary
  // sorted set and store them in siteIds.
  const siteIds = await client.zrangebyscoreAsync(
    sitesInRadiusCapacitySortedSetKey,
    capacityThreshold,
    '+inf',
  );

  // Populate array with site details, use pipeline for efficiency.
  const siteHashPipeline = client.batch();

  for (const siteId of siteIds) {
    const siteKey = keyGenerator.getSiteHashKey(siteId);
    siteHashPipeline.hgetall(siteKey);
  }

  const siteHashes = await siteHashPipeline.execAsync();

  const sitesWithCapacity = [];

  for (const siteHash of siteHashes) {
    // Ensure a result was found before processing it.
    if (siteHash) {
      // Call remap to remap the flat key/value representation
      // from the Redis hash into the site domain object format,
      // and convert any fields that a numerical from the Redis
      // string representations.
      sitesWithCapacity.push(remap(siteHash));
    }
  }

  return sitesWithCapacity;
  /* eslint-enable */
};

module.exports = {
  insert,
  findById,
  findAll,
  findByGeo,
  findByGeoWithExcessCapacity,
};
