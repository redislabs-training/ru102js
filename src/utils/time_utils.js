const moment = require('moment');

/**
 * Takes a UNIX timestamp in seconds and returns the minute of the day
 * represented by that timestamp, 00:01 = 1, 01:02 = 62 etc.
 *
 * @param {number} timestamp - a UNIX timestamp in seconds.
 * @returns {number} - the minute of the day that the supplied timestamp represents.
 */
const getMinuteOfDay = (timestamp) => {
  const t = (timestamp === undefined ? Math.floor(new Date().getTime() / 1000) : timestamp);
  const ts = moment.unix(t).utc();
  const dayStart = moment.unix(t).utc().startOf('day');

  return ts.diff(dayStart, 'minutes');
};

/**
 * Given a timestamp representing a specific date, and a number representing
 * a minute on that date, return the timestamp for that minute on that date.
 *
 * @param {number} timestamp - UNIX timestamp in seconds for the date to work with.
 * @param {number} minute - the minute of the day to get a timestamp for.
 * @returns {number} - a UNIX timestamp in seconds representing the specified
 *  minute of the day that timestamp falls on.
 */
const getTimestampForMinuteOfDay = (timestamp, minute) => {
  const dayStart = moment.unix(timestamp).utc().startOf('day');

  return dayStart.add(minute, 'minutes').unix();
};

/**
 * Takes a UNIX timestamp in seconds and converts it to a YYYY-MM-DD string.
 * @param {number} timestamp - a UNIX timestamp in seconds.
 * @returns {string} - the YYYY-MM-DD string for the supplied timestamp.
 */
const getDateString = timestamp => moment.unix(timestamp).utc().format('YYYY-MM-DD');

/**
 * Returns the current UNIX timestamp in seconds.
 *
 * @returns {number} - the current UNIX timestamp in seconds.
 */
const getCurrentTimestamp = () => moment().unix();

/**
 * Returns the current UNIX timestamp in milliseconds.
 *
 * @returns {number} - the current UNIX timestamp in milliseconds.
 */
const getCurrentTimestampMillis = () => moment().valueOf();

module.exports = {
  getMinuteOfDay,
  getTimestampForMinuteOfDay,
  getDateString,
  getCurrentTimestamp,
  getCurrentTimestampMillis,
};
