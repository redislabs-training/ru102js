const metricDao = require('../daos/metric_dao');
const siteStatsDao = require('../daos/sitestats_dao');
const capacityDao = require('../daos/capacity_dao');
const feedDao = require('../daos/feed_dao');

/**
 * Receives an array of meter reading objects and updates the
 * database for these.  Writes to metrics, site stats, capacity
 * and feed DAOs.
 *
 * @param {Array} meterReadings - array of meterreading objects.
 * @returns {Promise} - a promise that resolves when the operation is complete.
 */
const createMeterReadings = async (meterReadings) => {
  for (const meterReading of meterReadings) {
    /* eslint-disable no-await-in-loop */
    await metricDao.insert(meterReading);
    await siteStatsDao.update(meterReading);
    await capacityDao.update(meterReading);
    await feedDao.insert(meterReading);
    /* eslint-enable */
  }
};

/**
 * Retrieve entries from the global meter reading feed, up to the number
 * of entries specified by 'limit'.
 *
 * @param {number} limit - the maximum number of entries to retrieve from the feed.
 * @returns {Promise} - promise that resolves to an array of feed entries.
 */
const getMeterReadings = async limit => feedDao.getRecentGlobal(limit);

/**
 * Retrieve entries from an individual site's meter reading feed, up to the
 * number of entries specified by 'limit'.
 *
 * @param {number} siteId - the numeric ID of the site to retrieve entries for.
 * @param {number} limit - the maximum number of entries to retrieve from the feed.
 * @returns {Promise} - promise that resolves to an array of feed entries.
 */
const getMeterReadingsForSite = async (siteId, limit) => feedDao.getRecentForSite(siteId, limit);

module.exports = {
  createMeterReadings,
  getMeterReadings,
  getMeterReadingsForSite,
};
