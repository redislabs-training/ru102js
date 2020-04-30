const redis = require('redis');
const bluebird = require('bluebird');

// Make all functions in 'redis' available as promisified
// versions whose names end in 'Async'.
bluebird.promisifyAll(redis);

// When using 'await', code needs to be in a function that
// is declared 'async', so our code is wrapped in here and
// called at the bottom of the script.
const runApplication = async () => {
  // Connect to Redis.
  const client = redis.createClient({
    host: 'localhost',
    port: 6379,
    // password: 'password',
  });

  // Run a Redis command.
  const reply = await client.setAsync('hello', 'world');
  console.log(reply); // OK

  const keyValue = await client.getAsync('hello');
  console.log(keyValue); // world

  // Clean up and allow the script to exit.
  client.quit();
};

try {
  runApplication();
} catch (e) {
  console.log(e);
}
