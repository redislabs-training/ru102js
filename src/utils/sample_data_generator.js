const moment = require('moment');

const meterReadingsController = require('../controllers/meterreadings_controller');

// Max value we allow temperatures to reach when generating sample data.
const maxTempC = 30;

/**
 * Calculates the max possible watt hours generated in a minute, for a
 * site with the specified capacity.
 *
 * @param {number} capacity - the site capacity.
 * @returns {number} - the max possible watt hours generated this site can
 *  achieve in one minute.
 * @private
 */
const getMaxMinuteWHGenerated = capacity => capacity * 1000 / 24 / 60;

/**
 * Get the initial watt hours used figure for the first minute,
 * based on a site's given maximum capacity.
 *
 * @param {number} maxCapacity - the maximum capacity of the site.
 * @returns {number} - the initial minute watt hour used figure to use.
 * @private
 */
const getInitialMinuteWHUsed = maxCapacity => (
  Math.random() > 0.5 ? maxCapacity + 0.1 : maxCapacity - 0.1
);

/**
 * Gets the next value in a series of values.
 *
 * @param {*} current - the current value.
 * @param {*} max - the maximum allowed value.
 * @returns {number} - the next value.
 * @private
 */
const getNextValueInSeries = (current, max) => {
  const stepSize = 0.1 * max;

  if (Math.random() < 0.5) {
    return current + stepSize;
  }

  if (current - stepSize < 0) {
    return 0;
  }

  return current - stepSize;
};

/**
 * Gets the next value in a series of values.
 *
 * @param {number} max - the maximum allowed value.
 * @returns {number} - the next value.
 * @private
 */
const getNextValue = max => getNextValueInSeries(max, max);

/**
 * Generates historical sample data for each site in the 'sites' array.
 *
 * @param {Array} sites - array of site objects.
 * @param {number} days - how many days to generate data for (1-365 inclusive).
 * @returns {Promise} - a promise that resolves when the data has been generated.
 */
const generateHistorical = async (sites, days) => {
  if (days < 1 || days > 365) {
    throw new Error(`Historical data generation requests must be for 1-365 days, not ${days}.`);
  }

  const generatedMeterReadings = {};
  const minuteDays = days * 3 * 60; // TODO wny not days * 60 * 24?

  for (const site of sites) {
    const maxCapacity = getMaxMinuteWHGenerated(site.capacity);
    let currentCapacity = getNextValue(maxCapacity);
    let currentTemperature = getNextValue(maxTempC);
    let currentUsage = getInitialMinuteWHUsed(maxCapacity);
    let currentTime = moment().subtract(minuteDays, 'minutes');

    generatedMeterReadings[site.id] = [];

    for (let n = 0; n < minuteDays; n += 1) {
      const meterReading = {
        siteId: site.id,
        dateTime: currentTime.unix(),
        whUsed: currentUsage,
        whGenerated: currentCapacity,
        tempC: currentTemperature,
      };

      generatedMeterReadings[site.id].push(meterReading);

      currentTime = currentTime.add(1, 'minutes');
      currentTemperature = getNextValue(currentTemperature);
      currentCapacity = getNextValue(currentCapacity, maxCapacity);
      currentUsage = getNextValue(currentUsage, maxCapacity);
    }
  }

  // Now feed these into the system one minute per site at a time.
  for (let n = 0; n < minuteDays; n += 1) {
    process.stdout.write('.');

    for (const site in generatedMeterReadings) {
      if (generatedMeterReadings.hasOwnProperty(site)) {
        /* eslint-disable no-await-in-loop */
        await meterReadingsController.createMeterReadings([generatedMeterReadings[site][n]]);
        /* eslint-enable */
      }
    }
  }
};

module.exports = {
  generateHistorical,
};
