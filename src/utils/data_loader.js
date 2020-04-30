const config = require('better-config');

config.set('../../config.json');

const path = require('path');
const redis = require('../daos/impl/redis/redis_client');

const client = redis.getClient();
const sitesDao = require('../daos/impl/redis/site_dao_redis_impl');
const sitesDaoWithGeo = require('../daos/impl/redis/site_geo_dao_redis_impl');
const dataGenerator = require('./sample_data_generator');

const dataDaysToGenerate = 1;

/**
 * Flush the Redis database, deleting all data.
 *
 * @returns {Promise} - a promise that resolves when the operation is complete.
 */
const flushDB = async () => client.flushdbAsync();

/**
 *
 * @param {string} filename - the name of the file to load data from.
 * @param {boolean} flushDb - whether or not to delete all data from Redis before loading.
 * @returns {Promise} - a promise that resolves when the operation is complete.
 */
const loadData = async (filename, flushDb) => {
  /* eslint-disable global-require, import/no-dynamic-require */
  const sampleData = require(filename);
  /* eslint-enable */

  if (sampleData && flushDb) {
    console.log('Flushing database before loading sample data.');
    await flushDB();
  }

  console.log('Loading data.');

  for (const site of sampleData) {
    /* eslint-disable no-await-in-loop */
    await sitesDao.insert(site);
    await sitesDaoWithGeo.insert(site);
    /* eslint-enable */
  }

  await dataGenerator.generateHistorical(sampleData, dataDaysToGenerate);
};

/**
 * Run the data loader.  Will load the sample data into Redis.
 *
 * @param {Array} params - array of command line arguments.
 */
const runDataLoader = async (params) => {
  if (params.length !== 4 && params.length !== 5) {
    console.error('Usage: npm run load <path_to_json_data_file> [flushdb]');
  } else {
    const filename = params[3];
    let flushDb = false;

    if (params.length === 5 && params[4] === 'flushdb') {
      flushDb = true;
    }

    try {
      await loadData(path.resolve(__dirname, '../../', filename), flushDb);
    } catch (e) {
      console.error(`Error loading ${filename}:`);
      console.error(e);
    }

    client.quit();
    console.log('Data load completed.');
  }
};

runDataLoader(process.argv);
