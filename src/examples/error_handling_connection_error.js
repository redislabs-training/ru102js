const redis = require('redis');
const bluebird = require('bluebird');

// Promisify all the functions exported by node_redis.
bluebird.promisifyAll(redis);

const connectionErrorExample = async () => {
  try {
    const client = redis.createClient({
      port: 6379,
      host: '127.0.0.1',
      // password: 'password',
      retry_strategy: (options) => {
        if (options.attempt > 5) {
          return new Error('Retry attempts exhausted.');
        }

        // Try again after a period of time...
        return (options.attempt * 1000);
      },
    });

    client.on('connect', () => {
      console.log('Connected to Redis.');
    });

    client.on('reconnecting', (o) => {
      console.log('Attempting to reconnect to Redis:');
      console.log(o);
    });

    client.on('error', (e) => {
      console.log('Caught error in handler:');
      console.log(e);
    });

    const key = 'connectionTest';

    const response = await client.setAsync(key, 'hello');
    console.log(`SET response: ${response}`);
  } catch (err) {
    console.log('Caught an error:');
    console.log(err);
  }
};

try {
  connectionErrorExample();
} catch (err) {
  console.log('Caught exception:');
  console.log(err);
}
