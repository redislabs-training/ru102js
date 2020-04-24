const config = require('better-config');
const shortId = require('shortid');
const timeUtils = require('../../../utils/time_utils');

// Prefix that all keys will start with, taken from config.json
let prefix = config.get('dataStores.redis.keyPrefix');

/**
 * Takes a string containing a Redis key name and returns a
 * string containing that key with the application's configurable
 * prefix added to the front.  Prefix is configured in config.json.
 *
 * @param {string} key - a Redis key
 * @returns {string} - a Redis key with the application prefix prepended to
 *  the value of 'key'
 * @private
 */
const getKey = key => `${prefix}:${key}`;

/**
 * Generates a temporary unique key name using a the short string
 * generator module shortid.
 *
 * Used in week 3 geo for temporary set key names.
 *
 * @returns - a temporary key of the form tmp:PPBqWA9
 */
const getTemporaryKey = () => getKey(`tmp:${shortId.generate()}`);

/**
 * Takes a numeric site ID and returns the site information key
 * value for that ID.
 *
 * Key name: prefix:sites:info:[siteId]
 * Redis type stored at this key: hash
 *
 * @param {number} siteId - the numeric ID of a site.
 * @returns - the site information key for the provided site ID.
 */
const getSiteHashKey = siteId => getKey(`sites:info:${siteId}`);

/**
 * Returns the Redis key name used for the set storing all site IDs.
 *
 * Key name: prefix:sites:ids
 * Redis type stored at this key: set
 *
 * @returns - the Redis key name used for the set storing all site IDs.
 */
const getSiteIDsKey = () => getKey('sites:ids');

/**
 * Takes a numeric site ID and a UNIX timestamp, returns the Redis
 * key used to store site stats for that site for the day represented
 * by the timestamp.
 *
 * Key name: prefix:sites:stats:[year-month-day]:[siteId]
 * Redis type stored at this key: sorted set
 *
 * @param {number} siteId - the numeric ID of a site.
 * @param {number} timestamp - UNIX timestamp for the desired day.
 * @returns {string} - the Redis key used to store site stats for that site on the
 *  day represented by the timestamp.
 */
const getSiteStatsKey = (siteId, timestamp) => getKey(`sites:stats:${timeUtils.getDateString(timestamp)}:${siteId}`);

/**
 * Takes a name, interval and maximum number of hits allowed in that interval,
 * returns the Redis key used to store the rate limiter data for those parameters.
 *
 * Key name: prefix:limiter:[name]:[interval]:[maxHits]
 * Redis type stored at this key: string (containing a number)
 *
 * @param {string} name - the unique name of the resource.
 * @param {number} interval - the time period that the rate limiter applies for (mins).
 * @param {number} maxHits - the maximum number of hits on the resource
 *  allowed in the interval.
 * @returns {string} - the Redis key used to store the rate limiter data for the
 *  given parameters.
 */
const getRateLimiterKey = (name, interval, maxHits) => {
  const minuteOfDay = timeUtils.getMinuteOfDay();
  return getKey(`limiter:${name}:${Math.floor(minuteOfDay / interval)}:${maxHits}`);
};

/**
 * Returns the Redis key used to store geo information for sites.
 *
 * Key name: prefix:sites:geo
 * Redis type stored at this key: geo
 *
 * @returns {string} - the Redis key used to store site geo information.
 */
const getSiteGeoKey = () => getKey('sites:geo');

/**
 * Returns the Redis key used for storing site capacity ranking data.
 *
 * Key name: prefix:sites:capacity:ranking
 * Redis type stored at this key: sorted set
 *
 * @returns {string} - the Redis key used for storing site capacity ranking data.
 */
const getCapacityRankingKey = () => getKey('sites:capacity:ranking');

/**
 * Returns the Redis key used for storing RedisTimeSeries metrics
 * for the supplied site ID.
 *
 * Key name: prefix:sites:ts:[siteId]:[unit]
 * Redis type stored at this key: RedisTimeSeries
 *
 * @param {number} siteId - the numeric ID of a solar site
 * @param {string} unit - the metric unit name
 * @returns {string} - the Redis key used for storing RedisTimeSeries metrics
 *  for the supplied site ID.
 */
const getTSKey = (siteId, unit) => getKey(`sites:ts:${siteId}:${unit}`);

/**
 * Returns the Redis key name used to store metrics for the site represented
 * by 'siteId', the metric type represented by 'unit' and the date represented
 * by 'timestamp'.
 *
 * Key name: prefix:metric:[unit]:[year-month-day]:[siteId]
 * Redis type stored at this key: sorted set
 *
 * @param {number} siteId - the numeric site ID of the site to get the key for.
 * @param {*} unit - the name of the measurement unit to get the key for.
 * @param {*} timestamp - UNIX timestamp representing the date to get the key for.
 * @returns {string} - the Redis key used to store metrics for the specified metric
 *  on the specified day for the specified site ID.
 */
const getDayMetricKey = (siteId, unit, timestamp) => getKey(
  `metric:${unit}:${timeUtils.getDateString(timestamp)}:${siteId}`,
);

/**
 * Returns the name of the Redis key used to store the global sites data feed.
 *
 * Key name: prefix:sites:feed
 * Redis type stored at this key: stream
 *
 * @returns {string} - the Redis key used to store the global site data feed.
 */
const getGlobalFeedKey = () => getKey('sites:feed');

/**
 * Returns the name of the Redis key used to store the data feed for the site
 * represented by 'siteId'.
 *
 * Key name: prefix:sites:feed:[siteId]
 * Redis type stored at this key: stream
 *
 * @param {number} siteId - numeric ID of a specific site.
 * @returns {string} - the Redis key used to store the data feed for the
 *  site represented by 'siteId'.
 */
const getFeedKey = siteId => getKey(`sites:feed:${siteId}`);

/**
 * Set the global key prefix, overriding the one set in config.json.
 *
 * This is used by the test suites so that test keys do not overlap
 * with real application keys and can be safely deleted afterwards.
 *
 * @param {*} newPrefix - the new key prefix to use.
 */
const setPrefix = (newPrefix) => {
  prefix = newPrefix;
};

module.exports = {
  getTemporaryKey,
  getSiteHashKey,
  getSiteIDsKey,
  getSiteStatsKey,
  getRateLimiterKey,
  getSiteGeoKey,
  getCapacityRankingKey,
  getTSKey,
  getDayMetricKey,
  getGlobalFeedKey,
  getFeedKey,
  setPrefix,
  getKey,
};
