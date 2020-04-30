const redis = require('redis');

const client = redis.createClient({
  port: 6379,
  host: '127.0.0.1',
  // password: 'password',
});

// Add top level error listner.
client.on('error', (err) => {
  console.log('Error handler invoked:');
  console.log(err);
  client.quit();
});

const key = 'replyErrorTest';

client.set(key, 'test', (err, reply) => {
  if (!err && reply === 'OK') {
    // Set succeeded, try and increment value, error
    // will be handled by top level error listner.
    client.incr(key);
  } else {
    // This code will not be invoked as the set
    // command will succeed.
    console.log(`Error setting ${key}:`);
    console.log(err);
  }
});
