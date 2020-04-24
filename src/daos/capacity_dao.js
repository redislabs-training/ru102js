const daoLoader = require('./daoloader');

const impl = daoLoader.loadDao('capacity');

module.exports = {
  /**
   * Update capacity information with a new meter reading.
   * @param {Object} meterReading - A meter reading.
   * @returns {Promise} - Promise indicating the operation has completed.
   */
  update: async meterReading => impl.update(meterReading),

  /**
   * Get the capacity report for a given solar site.
   * @param {number} limit - Maximum number of entries to be returned.
   * @returns {Promise} - Promise containing capacity report.
   */
  getReport: async limit => impl.getReport(limit),

  /**
   * Get the capacity rank for a given solar site.
   * @param {number} siteId - A solar site ID.
   * @returns {Promise} - Promise containing rank for siteId as a number.
   */
  getRank: async siteId => impl.getRank(siteId),
};
