const redis = require('./redis_client');
const compareAndUpdateScript = require('./scripts/compare_and_update_script');
const keyGenerator = require('./redis_key_generator');
const timeUtils = require('../../../utils/time_utils');

const weekSeconds = 60 * 60 * 24 * 7;

/**
 * Takes an object containing keys and values from a Redis hash, and
 * performs the required type conversions from string -> number on some
 * of the keysto transform it into a site stat domain object.
 * @param {Object} siteStatsHash - Object whose key/value pairs represent values from a Redis hash.
 * @private
 */
const remap = (siteStatsHash) => {
  const remappedSiteStatsHash = { ...siteStatsHash };

  remappedSiteStatsHash.lastReportingTime = parseInt(siteStatsHash.lastReportingTime, 10);
  remappedSiteStatsHash.meterReadingCount = parseInt(siteStatsHash.meterReadingCount, 10);
  remappedSiteStatsHash.maxWhGenerated = parseFloat(siteStatsHash.maxWhGenerated);
  remappedSiteStatsHash.minWhGenerated = parseFloat(siteStatsHash.minWhGenerated);
  remappedSiteStatsHash.maxCapacity = parseFloat(siteStatsHash.maxCapacity);

  return remappedSiteStatsHash;
};

/**
 * Gets the site stats for the supplied site ID for the date specified
 * by the timestamp parameter.
 *
 * @param {number} siteId - the site ID to get site stats for.
 * @param {number} timestamp - timestamp for the day to get site stats for.
 * @returns {Promise} - promise that resolves to an object containing the
 *   site stat details.
 */
const findById = async (siteId, timestamp) => {
  const client = redis.getClient();

  const response = await client.hgetallAsync(
    keyGenerator.getSiteStatsKey(siteId, timestamp),
  );

  return (response ? remap(response) : response);
};

/* eslint-disable no-unused-vars */
/**
 * Updates the site stats for a specific site with the meter
 * reading data provided.
 *
 * @param {Object} meterReading - a meter reading object.
 * @returns {Promise} - promise that resolves when the operation is complete.
 */
const updateOptimized = async (meterReading) => {
  const client = redis.getClient();
  const key = keyGenerator.getSiteStatsKey(meterReading.siteId, meterReading.dateTime);

  // Load script if needed, uses cached SHA if already loaded.
  await compareAndUpdateScript.load();

  // START Challenge #3
  // END Challenge #3
};
/* eslint-enable */

/* eslint-disable no-unused-vars */
/**
 * Updates the site stats for a specific site with the meter
 * reading data provided.
 *
 * @param {Object} meterReading - a meter reading object.
 * @returns {Promise} - promise that resolves when the operation is complete.
 */
const updateBasic = async (meterReading) => {
  const client = redis.getClient();
  const key = keyGenerator.getSiteStatsKey(
    meterReading.siteId,
    meterReading.dateTime,
  );

  await client.hsetAsync(
    key,
    'lastReportingTime',
    timeUtils.getCurrentTimestamp(),
  );
  await client.hincrbyAsync(key, 'meterReadingCount', 1);
  await client.expireAsync(key, weekSeconds);

  const maxWh = await client.hgetAsync(key, 'maxWhGenerated');
  if (maxWh === null || meterReading.whGenerated > parseFloat(maxWh)) {
    await client.hsetAsync(key, 'maxWhGenerated', meterReading.whGenerated);
  }

  const minWh = await client.hgetAsync(key, 'minWhGenerated');
  if (minWh === null || meterReading.whGenerated < parseFloat(minWh)) {
    await client.hsetAsync(key, 'minWhGenerated', meterReading.whGenerated);
  }

  const maxCapacity = await client.hgetAsync(key, 'maxCapacity');
  const readingCapacity = meterReading.whGenerated - meterReading.whUsed;
  if (maxCapacity === null || readingCapacity > parseFloat(maxCapacity)) {
    await client.hsetAsync(key, 'maxCapacity', readingCapacity);
  }
};
/* eslint-enable */

module.exports = {
  findById,
  update: updateBasic, // updateOptimized
};
