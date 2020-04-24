const daoLoader = require('./daoloader');

// Week 3, change this from 'site' to 'site_geo'.
const impl = daoLoader.loadDao('site');

module.exports = {
  /**
   * Insert a new site.
   *
   * @param {Object} site - a site object.
   * @returns {Promise} - a Promise, resolving to the string value
   *   for the ID of the site in the database.
   */
  insert: async site => impl.insert(site),

  /**
   * Get the site object for a given site ID.
   *
   * @param {number} id - a site ID.
   * @returns {Promise} - a Promise, resolving to a site object.
   */
  findById: async id => impl.findById(id),

  /**
   * Get an array of all site objects.
   *
   * @returns {Promise} - a Promise, resolving to an array of site objects.
   */
  findAll: async () => impl.findAll(),

  /**
   * Get an array of sites within a radius of a given coordinate.
   *
   * For week 3.
   *
   * @param {number} lat - Latitude of the coordinate to search from.
   * @param {number} lng - Longitude of the coordinate to search from.
   * @param {number} radius - Radius in which to search.
   * @param {'KM' | 'MI'} radiusUnit - The unit that the value of radius is in.
   * @returns {Promise} - a Promise, resolving to an array of site objects.
   */
  findByGeo: async (lat, lng, radius, radiusUnit) => impl.findByGeo(
    lat,
    lng,
    radius,
    radiusUnit,
  ),

  /**
   * Get an array of sites where capacity exceeds consumption within
   * a radius of a given coordinate.
   *
   * For week 3.
   *
   * @param {number} lat - Latitude of the coordinate to search from.
   * @param {number} lng - Longitude of the coordinate to search from.
   * @param {number} radius - Radius in which to search.
   * @param {'KM' | 'MI'} radiusUnit - The unit that the value of radius is in.
   * @returns {Promise} - a Promise, resolving to an array of site objects.
   */
  findByGeoWithExcessCapacity: async (lat, lng, radius, radiusUnit) => (
    impl.findByGeoWithExcessCapacity(
      lat,
      lng,
      radius,
      radiusUnit,
    )
  ),
};
