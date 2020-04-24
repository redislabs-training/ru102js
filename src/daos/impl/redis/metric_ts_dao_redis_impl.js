const redis = require('./redis_client');
const keyGenerator = require('./redis_key_generator');

const metricIntervalSeconds = 60;
const metricsPerDay = metricIntervalSeconds * 24;
const maxMetricRetentionDays = 30;
const daySeconds = 24 * 60 * 60;
const timeSeriesMetricRetention = daySeconds * maxMetricRetentionDays * 1000;

/**
 * Insert a metric into the database for a given solar site ID.
 * This function is used in week 4, and uses RedisTimeSeries to store
 * the metric.
 *
 * @param {number} siteId - a solar site ID.
 * @param {number} metricValue - the value of the metric to store.
 * @param {string} metricName - the name of the metric to store.
 * @param {number} timestamp - a UNIX timestamp.
 * @returns {Promise} - Promise that resolves when the operation is complete.
 * @private
 */
const insertMetric = async (siteId, metricValue, metricName, timestamp) => {
  const client = redis.getClient();

  await client.ts_addAsync(
    keyGenerator.getTSKey(siteId, metricName),
    timestamp * 1000, // Use millseconds
    metricValue,
    'RETENTION',
    timeSeriesMetricRetention,
  );
};

/**
 * Insert a new meter reading into the time series.
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

/**
 * Get recent metrics for a specific solar site on a given date with
 * an optional limit.  This implementation uses RedisTimeSeries.
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

  const client = redis.getClient();

  // End at the provided start point.
  const toMillis = timestamp * 1000;

  // Start as far back as we need to go where limit represents 1 min.
  const fromMillis = toMillis - (limit * 60) * 1000;

  // Get the samples from RedisTimeSeries.
  // We could also use client.send_commandAsync('ts.range')
  // rather than adding the RedisTimeSeries commands
  // to the redis module (see redis_client.js)
  const samples = await client.ts_rangeAsync(
    keyGenerator.getTSKey(siteId, metricUnit),
    fromMillis,
    toMillis,
  );

  // Truncate array if needed.
  if (samples.length > limit) {
    samples.length = limit;
  }

  const measurements = [];

  // Samples is an array of arrays [ timestamp in millis, 'value as string' ]
  for (const sample of samples) {
    measurements.push({
      siteId,
      dateTime: Math.floor(sample[0] / 1000),
      value: parseFloat(sample[1], 10),
      metricUnit,
    });
  }

  return measurements;
};

module.exports = {
  insert,
  getRecent,
};
