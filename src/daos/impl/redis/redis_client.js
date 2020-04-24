const redis = require('redis');
const bluebird = require('bluebird');
const config = require('better-config');

// Add extra definitions for RedisTimeSeries commands.
redis.addCommand('ts.add'); // redis.ts_addAsync
redis.addCommand('ts.range'); // redis.ts_rangeAsync

// Promisify all the functions exported by node_redis.
bluebird.promisifyAll(redis);

// Create a client and connect to Redis using configuration
// from config.json.
const client = redis.createClient({
  host: config.get('dataStores.redis.host'),
  port: config.get('dataStores.redis.port'),
});

// This is a catch all basic error handler.
client.on('error', error => console.log(error));

module.exports = {
  /**
   * Get the application's connected Redis client instance.
   *
   * @returns {Object} - a connected node_redis client instance.
   */
  getClient: () => client,
};
