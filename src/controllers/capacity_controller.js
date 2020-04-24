const capacityDao = require('../daos/capacity_dao');

/**
 * Retrieve the highest / lowest capacity report, containing up to
 * 'limit' entries in each.
 *
 * @param {number} limit - the maximum number of entries to return in each
 *  part of the report.
 * @returns {Promise} - a Promise that resolves to an object containing two
 *  keys, one for the sites with highest capacity and one for the sites with
 *  lowest.  Each array contains report entry objects.
 */
const getCapacityReport = async limit => capacityDao.getReport(limit);

module.exports = {
  getCapacityReport,
};
