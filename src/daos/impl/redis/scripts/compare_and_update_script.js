const redis = require('../redis_client');

let sha;

/**
 * Get the Lua source code for the script.
 * @returns {string} - Lua source code for the script.
 * @private
 */
const getSource = () => `
  local key = KEYS[1]
  local field = ARGV[1]
  local value = ARGV[2] 
  local op = ARGV[3]
  local current = redis.call('hget', key, field)
  if (current == false or current == nil) then
    redis.call('hset', key, field, value)
  elseif op == '>' then
    if tonumber(value) > tonumber(current) then
      redis.call('hset', key, field, value)
    end
  elseif op == '<' then
    if tonumber(value) < tonumber(current) then
      redis.call('hset', key, field, value)
    end
  end `;

const load = async () => {
  const client = redis.getClient();

  // Load script on first use...
  if (!sha) {
    sha = await client.scriptAsync('load', getSource());
  }

  return sha;
};

/**
 * Build up an array of parameters that will be passed to
 * evalsha.
 *
 * @param {string} key - Redis key that the script will operate on.
 * @param {string} field - Field name in the hash to use.
 * @param {number} value - Value to set the field to if it passes the
 *   comparison test.
 * @param {string} comparator - '<' or '>' depending on whether the value
 *   should be updated if less or greater than the existing value.
 * @returns {Array} - array of parameters that evalsha can use to execute
 *   the script.
 * @private
 */
const buildEvalshaParams = (key, field, value, comparator) => [
  sha, // Script SHA
  1, // Number of Redis keys
  key,
  field,
  value,
  comparator,
];

const updateIfGreater = (key, field, value) => buildEvalshaParams(key, field, value, '>');

const updateIfLess = (key, field, value) => buildEvalshaParams(key, field, value, '<');

module.exports = {
  /**
   * Load the script into Redis and return its SHA.
   * @returns {string} - The SHA for this script.
   */
  load,

  /**
   * Build up an array of parameters that evalsha will use to run
   * a compare and set if greater operation.
   *
   * @param {string} key - Redis key that the script will operate on.
   * @param {string} field - Field name in the hash to use.
   * @param {number} value - Value to set the field to if it passes the
   *   comparison test.
   * @returns {Array} - array of parameters that evalsha can use to execute
   *   the script.
   */
  updateIfGreater,

  /**
   * Build up an array of parameters that evalsha will use to run
   * a compare and set if less operation.
   *
   * @param {string} key - Redis key that the script will operate on.
   * @param {string} field - Field name in the hash to use.
   * @param {number} value - Value to set the field to if it passes the
   *   comparison test.
   * @returns {Array} - array of parameters that evalsha can use to execute
   *   the script.
   */
  updateIfLess,
};
