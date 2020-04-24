const metricDao = require('../daos/metric_dao');
const timeUtils = require('../utils/time_utils');

/**
 * Retrieve metrics for a specified site ID.
 *
 * @param {number} siteId - the numeric site ID of a solar site.
 * @param {number} limit - the maximum number of metrics to return, if that
 *  many are available.
 * @returns {Promise} - a promise that resolves to an array of two objects,
 *  one for watt hours generated metrics, the other for watt hours used.
 */
const getMetricsForSite = async (siteId, limit) => {
  const currentTimestamp = timeUtils.getCurrentTimestamp();

  const metrics = await Promise.all([
    metricDao.getRecent(siteId, 'whGenerated', currentTimestamp, limit),
    metricDao.getRecent(siteId, 'whUsed', currentTimestamp, limit),
  ]);

  return ([{
    measurements: metrics[0],
    name: 'Watt-Hours Generated',
  }, {
    measurements: metrics[1],
    name: 'Watt-Hours Used',
  }]);
};

module.exports = {
  getMetricsForSite,
};
