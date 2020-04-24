const redis = require('./redis_client');
const keyGenerator = require('./redis_key_generator');

/* eslint-disable no-unused-vars */
const globalMaxFeedLength = 10000;
const siteMaxFeedLength = 2440;
/* eslint-enable */

/**
 * Takes an object and returns an array whose elements are alternating
 * keys and values from that object.  Example:
 *
 * { hello: 'world', shoeSize: 13 } -> [ 'hello', 'world', 'shoeSize', 13 ]
 *
 * Used as a helper function for XADD.
 *
 * @param {Object} obj - object to be converted to an array.
 * @returns {Array} - array containing alternating keys and values from 'obj'.
 * @private
 */
const objectToArray = (obj) => {
  const arr = [];

  for (const k in obj) {
    if (obj.hasOwnProperty(k)) {
      arr.push(k);
      arr.push(obj[k]);
    }
  }

  return arr;
};

/**
 * Takes an array and returns an object whose keys and values are taken
 * from alternating elements in the array.  Example:
 *
 * [ 'hello', 'world', 'shoeSize', 13 ] -> { hello: 'world', shoeSize: 13 }
 *
 * Used as a helper function for processing arrays returned by XRANGE / XREVRANGE.
 *
 * @param {Array} arr - array of field names and values to convert to an object.
 * @returns {Object} - object whose keys and values are the field names and values from arr.
 * @private
 */
const arrayToObject = (arr) => {
  const obj = {};

  // arr contains an even number of entries, with alternating
  // field names and values.  An empty set of field name/value
  // pairs is not permitted in Redis Streams.
  for (let n = 0; n < arr.length; n += 2) {
    const k = arr[n];
    const v = arr[n + 1];

    obj[k] = v;
  }

  return obj;
};

/**
 * Take an Object representing a meter reading that was
 * read from a stream, and transform the key values to
 * the appropriate types from strings.
 * @param {Object} streamEntry - An object that was read from a stream.
 * @returns {Object} - A meter reading object.
 * @private
 */
const remap = (streamEntry) => {
  const remappedStreamEntry = { ...streamEntry };

  remappedStreamEntry.siteId = parseInt(streamEntry.siteId, 10);
  remappedStreamEntry.whUsed = parseFloat(streamEntry.whUsed);
  remappedStreamEntry.whGenerated = parseFloat(streamEntry.whGenerated);
  remappedStreamEntry.tempC = parseFloat(streamEntry.tempC);
  remappedStreamEntry.dateTime = parseInt(streamEntry.dateTime, 10);

  return remappedStreamEntry;
};

/**
 * Takes the array of arrays response from a Redis stream
 * XRANGE / XREVRANGE command and unpacks it into an array
 * of meter readings.
 * @param {Array} streamResponse - An array of arrays returned from a Redis stream command.
 * @returns {Array} - An array of meter reading objects.
 * @private
 */
const unpackStreamEntries = (streamResponse) => {
  // Stream entries need to be unpacked as the Redis
  // client returns them as an array of arrays, rather
  // than an array of objects.
  let meterReadings = [];

  if (streamResponse && Array.isArray(streamResponse)) {
    meterReadings = streamResponse.map((entry) => {
      // entry[0] is the stream ID, we don't need that.
      const fieldValueArray = entry[1];

      // Convert the array of field/value pairs to an object.
      const obj = arrayToObject(fieldValueArray);

      // Adjust string values to be correct types before returning.
      return remap(obj);
    });
  }

  return meterReadings;
};

/**
 * Insert a new meter reading into the system.
 * @param {*} meterReading
 * @returns {Promise} - Promise, resolves on completion.
 */
const insert = async (meterReading) => {
  // Unpack meterReading into array of alternating key
  // names and values for addition to the stream.
  /* eslint-disable no-unused-vars */
  const fields = objectToArray(meterReading);
  /* eslint-enable */

  const client = redis.getClient();
  const pipeline = client.batch();

  // START Challenge #6
  // END Challenge #6

  await pipeline.execAsync();
};

/**
 * Get recent meter reading data.
 * @param {string} key - Key name of Redis Stream to read data from.
 * @param {number} limit - the maximum number of readings to return.
 * @returns {Promise} - Promise that resolves to an array of meter reading objects.
 * @private
 */
const getRecent = async (key, limit) => {
  const client = redis.getClient();
  const response = await client.xrevrangeAsync(key, '+', '-', 'COUNT', limit);

  return unpackStreamEntries(response);
};

/**
 * Get recent meter readings for all sites.
 * @param {number} limit - the maximum number of readings to return.
 * @returns {Promise} - Promise that resolves to an array of meter reading objects.
 */
const getRecentGlobal = async limit => getRecent(
  keyGenerator.getGlobalFeedKey(),
  limit,
);

/**
 * Get recent meter readings for a specific solar sites.
 * @param {number} siteId - the ID of the solar site to get readings for.
 * @param {*} limit - the maximum number of readings to return.
 * @returns {Promise} - Promise that resolves to an array of meter reading objects.
 */
const getRecentForSite = async (siteId, limit) => getRecent(
  keyGenerator.getFeedKey(siteId),
  limit,
);

module.exports = {
  insert,
  getRecentGlobal,
  getRecentForSite,
};
