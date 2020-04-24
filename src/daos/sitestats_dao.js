const daoLoader = require('./daoloader');

const impl = daoLoader.loadDao('sitestats');

module.exports = {
  /**
   * Gets the site stats for the supplied site ID for the date specified
   * by the timestamp parameter.
   *
   * @param {number} siteId - the site ID to get site stats for.
   * @param {number} timestamp - timestamp for the day to get site stats for.
   * @returns {Promise} - promise that resolves to an object containing the site stat details.
   */
  findById: async (siteId, timestamp) => impl.findById(siteId, timestamp),

  /**
   * Updates the site stats for a specific site with the meter
   * reading data provided.
   *
   * @param {Object} meterReading - a meter reading object.
   * @returns {Promise} - promise that resolves when the operation is complete.
   */
  update: async meterReading => impl.update(meterReading),
};
