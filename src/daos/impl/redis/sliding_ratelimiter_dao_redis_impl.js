const redis = require('./redis_client');
const keyGenerator = require('./redis_key_generator');
const timeUtils = require('../../../utils/time_utils');

// Challenge 7
const hitSlidingWindow = async (name, opts) => {
  const client = redis.getClient();

  // START Challenge #7
  const key = keyGenerator.getKey(`limiter:${opts.interval}:${name}:${opts.maxHits}`);
  const now = timeUtils.getCurrentTimestampMillis();

  const transaction = client.multi();

  const member = `${now}-${Math.random()}`;

  transaction.zadd(key, now, member);
  transaction.zremrangebyscore(key, 0, now - opts.interval);
  transaction.zcard(key);

  const response = await transaction.execAsync();

  const hits = parseInt(response[2], 10);

  let hitsRemaining;

  if (hits > opts.maxHits) {
    // Too many hits.
    hitsRemaining = -1;
  } else {
    // Return number of hits remaining.
    hitsRemaining = opts.maxHits - hits;
  }

  return hitsRemaining;

  // END Challenge #7
};


module.exports = {
  /**
   * Record a hit against a unique resource that is being
   * rate limited.  Will return 0 when the resource has hit
   * the rate limit.
   * @param {string} name - the unique name of the resource.
   * @param {Object} opts - object containing interval and maxHits details:
   *   {
   *     interval: 1,
   *     maxHits: 5
   *   }
   * @returns {Promise} - Promise that resolves to number of hits remaining,
   *   or 0 if the rate limit has been exceeded..
   */
  hit: hitSlidingWindow,
};
