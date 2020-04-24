const siteDao = require('../daos/site_dao');

/**
 * Creates a new site in the database.
 *
 * @param {Object} site - a site object.
 * @returns {Promise} - a Promise that resolves when the operation is complete.
 */
const createSite = async site => siteDao.insert(site);

/**
 * Retrieve all sites from the database.
 *
 * @returns {Promise} - a Promise that resolves to an array of site objects.
 */
const getSites = async () => siteDao.findAll();

/**
 * Retrieve an individual site from the database.
 *
 * @param {number} siteId - the numeric ID of the site to retrieve.
 * @returns {Promise} - a Promise that resolves to a site object.
 */
const getSite = async siteId => siteDao.findById(siteId);

/**
 * Retrieve sites that are within a specified distance of a coordinate,
 * optionally filtering so that only sites having excess capacity are
 * returned.
 *
 * @param {number} lat - the latitude of the center point to search from.
 * @param {number} lng - the longitude of the center point to search from.
 * @param {number} radius - the geo search radius.
 * @param {string} radiusUnit - the unit that radius is specified in ('MI', 'KM').
 * @param {boolean} onlyExcessCapacity - if true, only sites in range that have
 *  excess capacity are returned.  If false, all sites within range are returned.
 * @returns {Promise} - a Promise that resolves to an array of site objects.
 */
const getSitesNearby = async (lat, lng, radius, radiusUnit, onlyExcessCapacity) => {
  const matchingSites = onlyExcessCapacity
    ? await siteDao.findByGeoWithExcessCapacity(
      lat,
      lng,
      radius,
      radiusUnit,
    )
    : await siteDao.findByGeo(
      lat,
      lng,
      radius,
      radiusUnit,
    );

  return matchingSites;
};

module.exports = {
  createSite,
  getSites,
  getSite,
  getSitesNearby,
};
