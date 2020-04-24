const daoLoader = require('./daoloader');

const impl = daoLoader.loadDao('feed');

module.exports = {
  /**
   * Insert a new meter reading into the system.
   * @param {Object} meterReading - a meter reading.
   * @returns {Promise} - Promise, resolves on completion.
   */
  insert: async meterReadings => impl.insert(meterReadings),

  /**
   * Get recent meter readings for all sites.
   * @param {number} limit - the maximum number of readings to return.
   * @returns {Promise} - Promise that resolves to an array of meter reading objects.
   */
  getRecentGlobal: async limit => impl.getRecentGlobal(limit),

  /**
   * Get recent meter readings for a specific solar sites.
   * @param {number} siteId - the ID of the solar site to get readings for.
   * @param {number} limit - the maximum number of readings to return.
   * @returns {Promise} - Promise that resolves to an array of meter reading objects.
   */
  getRecentForSite: async (siteId, limit) => impl.getRecentForSite(siteId, limit),
};
