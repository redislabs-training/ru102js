const redis = require('./redis_client');
const keyGenerator = require('./redis_key_generator');

/**
 * Transform an array of siteId, capacity tuples to an array
 * of objects.
 * @param {array} arr - array of siteId, capacity tuples
 * @returns {Object[]} - array of Objects
 * @private
 */
const remap = (arr) => {
  const remapped = [];

  for (let n = 0; n < arr.length; n += 2) {
    remapped.push({
      siteId: parseInt(arr[n], 10),
      capacity: parseFloat(arr[n + 1]),
    });
  }

  return remapped;
};

/**
 * Update capacity information with a new meter reading.
 * @param {Object} meterReading - A meter reading.
 * @returns {Promise} - Promise indicating the operation has completed.
 */
const update = async (meterReading) => {
  const client = redis.getClient();
  const currentCapacity = meterReading.whGenerated - meterReading.whUsed;

  await client.zaddAsync(
    keyGenerator.getCapacityRankingKey(),
    currentCapacity,
    meterReading.siteId,
  );
};

/**
 * Get the capacity report for a given solar site.
 * @param {number} limit - Maximum number of entries to be returned.
 * @returns {Promise} - Promise containing capacity report.
 */
const getReport = async (limit) => {
  const client = redis.getClient();
  const capacityRankingKey = keyGenerator.getCapacityRankingKey();
  const pipeline = client.batch();

  pipeline.zrange(capacityRankingKey, 0, limit - 1, 'WITHSCORES');
  pipeline.zrevrange(capacityRankingKey, 0, limit - 1, 'WITHSCORES');

  const results = await pipeline.execAsync();

  return {
    lowestCapacity: remap(results[0]),
    highestCapacity: remap(results[1]),
  };
};

/**
 * Get the capacity rank for a given solar site.
 * @param {number} siteId - A solar site ID.
 * @returns {Promise} - Promise containing rank for siteId as a number.
 */
const getRank = async (siteId) => {
  // START Challenge #4
  const client = redis.getClient();

  const result = await client.zrankAsync(
    keyGenerator.getCapacityRankingKey(),
    `${siteId}`,
  );

  return result;
  // END Challenge #4
};

module.exports = {
  update,
  getReport,
  getRank,
};
