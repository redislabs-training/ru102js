const roundTo = require('round-to');
const redis = require('./redis_client');
const keyGenerator = require('./redis_key_generator');
const timeUtils = require('../../../utils/time_utils');

const metricIntervalSeconds = 60;
const metricsPerDay = metricIntervalSeconds * 24;
const maxMetricRetentionDays = 30;
/* eslint-disable no-unused-vars */
// Used in Challenge #2
const metricExpirationSeconds = 60 * 60 * 24 * maxMetricRetentionDays + 1;
/* eslint-enable */
const maxDaysToReturn = 7;
const daySeconds = 24 * 60 * 60;

/* eslint-disable no-unused-vars */
/**
 * Transforms measurement and minute values into the format used for
 * storage in a Redis sorted set.  Will round measurement to 2 decimal
 * places.  Used in Challenge 2.
 * @param {number} measurement - the measurement value to store.
 * @param {number} minuteOfDay - the minute of the day.
 * @returns {string} - String containing <measurement>-<minuteOfDay>.
 * @private
 */
const formatMeasurementMinute = (measurement, minuteOfDay) => `${roundTo(measurement, 2)}:${minuteOfDay}`;
/* eslint-enable */

/**
 * Transforms a string containing : separated measurement value and
 * minute of day into an object having keys containing those values.
 * @param {string} measurementMinute - a string containing <measurement>:<minute>
 * @returns {Object} - object containing measurement and minute values.
 * @private
 */
const extractMeasurementMinute = (measurementMinute) => {
  const arr = measurementMinute.split(':');
  return {
    value: parseFloat(arr[0]),
    minute: parseInt(arr[1], 10),
  };
};

/* eslint-disable no-unused-vars */
/**
 * Insert a metric into the database for a given solar site ID.
 * This function uses a sorted set to store the metric.
 * @param {number} siteId - a solar site ID.
 * @param {number} metricValue - the value of the metric to store.
 * @param {string} metricName - the name of the metric to store.
 * @param {number} timestamp - a UNIX timestamp.
 * @returns {Promise} - Promise that resolves when the operation is complete.
 * @private
 */
const insertMetric = async (siteId, metricValue, metricName, timestamp) => {
  const client = redis.getClient();

  const metricKey = keyGenerator.getDayMetricKey(siteId, metricName, timestamp);
  const minuteOfDay = timeUtils.getMinuteOfDay(timestamp);

  // START Challenge #2
  // END Challenge #2
};
/* eslint-enable */

/**
 * Get a set of metrics for a specific solar site on a given day.
 * @param {number} siteId - the ID of a solar site.
 * @param {string} metricUnit - the name of the metric to get values for.
 * @param {number} timestamp - UNIX timestamp for the date to get values for.
 * @param {number} limit - the maximum number of metrics to return.
 * @returns {Promise} - Promise that resolves to an array of metric objects.
 * @private
 */
const getMeasurementsForDate = async (siteId, metricUnit, timestamp, limit) => {
  const client = redis.getClient();

  // e.g. metrics:whGenerated:2020-01-01:1
  const key = keyGenerator.getDayMetricKey(siteId, metricUnit, timestamp);

  // Array of strings formatted <measurement value>:<minute of day>
  const metrics = await client.zrevrangeAsync(key, 0, limit - 1);

  const formattedMeasurements = [];

  for (let n = 0; n < metrics.length; n += 1) {
    const { value, minute } = extractMeasurementMinute(metrics[n]);

    // Create a measurement object
    const measurement = {
      siteId,
      dateTime: timeUtils.getTimestampForMinuteOfDay(timestamp, minute),
      value,
      metricUnit,
    };

    // Add in reverse order.
    formattedMeasurements.unshift(measurement);
  }

  return formattedMeasurements;
};

/**
 * Insert a new meter reading into the database.
 * @param {Object} meterReading - the meter reading to insert.
 * @returns {Promise} - Promise that resolves when the operation is completed.
 */
const insert = async (meterReading) => {
  await Promise.all([
    insertMetric(meterReading.siteId, meterReading.whGenerated, 'whGenerated', meterReading.dateTime),
    insertMetric(meterReading.siteId, meterReading.whUsed, 'whUsed', meterReading.dateTime),
    insertMetric(meterReading.siteId, meterReading.tempC, 'tempC', meterReading.dateTime),
  ]);
};

/* eslint-disable no-unused-vars */
/**
 * Get recent metrics for a specific solar site on a given date with
 * an optional limit.  This implementation uses a Redis Sorted Set.
 * @param {number} siteId - the ID of the solar site to get metrics for.
 * @param {string} metricUnit - the name of the metric to get.
 * @param {number} timestamp - UNIX timestamp for the date to get metrics for.
 * @param {number} limit - maximum number of metrics to be returned.
 * @returns {Promise} - Promise resolving to an array of measurement objects.
 */
const getRecent = async (siteId, metricUnit, timestamp, limit) => {
  if (limit > (metricsPerDay * maxMetricRetentionDays)) {
    const err = new Error(`Cannot request more than ${maxMetricRetentionDays} days of minute level data.`);
    err.name = 'TooManyMetricsError';

    throw err;
  }

  let currentTimestamp = timestamp;
  let count = limit;
  let iterations = 0;
  const measurements = [];

  do {
    /* eslint-disable no-await-in-loop */
    const dateMeasurements = await getMeasurementsForDate(
      siteId,
      metricUnit,
      currentTimestamp,
      count,
    );
    /* eslint-enable */

    measurements.unshift(...dateMeasurements);
    count -= dateMeasurements.length;
    iterations += 1;
    currentTimestamp -= daySeconds;
  } while (count > 0 && iterations < maxDaysToReturn);

  return measurements;
};
/* eslint-enable */

module.exports = {
  insert,
  getRecent,
};
