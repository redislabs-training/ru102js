const redis = require('redis');

const client = redis.createClient({
  port: 6379,
  host: '127.0.0.1',
  // password: 'password',
});

client.on('ready', () => console.log('Redis client is ready!'));

client.on('end', () => console.log('Redis connection has closed.'));

client.on('reconnecting', (o) => {
  console.log('Redis client is reconnecting!');
  console.log(`Attempt number: ${o.attempt}.`);
  console.log(`Milliseconds since last attempt: ${o.delay}.`);
});
