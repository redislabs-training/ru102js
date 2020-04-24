const redis = require('./redis_client');
const keyGenerator = require('./redis_key_generator');

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
  await client.saddAsync(keyGenerator.getSiteIDsKey(), siteHashKey);

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

/* eslint-disable arrow-body-style */
/**
 * Get an array of all site objects.
 *
 * @returns {Promise} - a Promise, resolving to an array of site objects.
 */
const findAll = async () => {
  // START CHALLENGE #1
  return [];
  // END CHALLENGE #1
};
/* eslint-enable */

/* eslint-disable no-unused-vars */

/**
 * Get an array of sites within a radius of a given coordinate.
 *
 * This will be implemented in week 3.
 *
 * @param {number} lat - Latitude of the coordinate to search from.
 * @param {number} lng - Longitude of the coordinate to search from.
 * @param {number} radius - Radius in which to search.
 * @param {'KM' | 'MI'} radiusUnit - The unit that the value of radius is in.
 * @returns {Promise} - a Promise, resolving to an array of site objects.
 */
const findByGeo = async (lat, lng, radius, radiusUnit) => [];

/**
 * Get an array of sites where capacity exceeds consumption within
 * a radius of a given coordinate.
 *
 * This will be implemented in week 3.
 *
 * @param {number} lat - Latitude of the coordinate to search from.
 * @param {number} lng - Longitude of the coordinate to search from.
 * @param {number} radius - Radius in which to search.
 * @param {'KM' | 'MI'} radiusUnit - The unit that the value of radius is in.
 * @returns {Promise} - a Promise, resolving to an array of site objects.
 */
const findByGeoWithExcessCapacity = async (lat, lng, radius, radiusUnit) => [];

module.exports = {
  insert,
  findById,
  findAll,
  findByGeo,
  findByGeoWithExcessCapacity,
};

/* eslint-enable no-unused-vars */
