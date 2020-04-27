const redis = require('redis');

// Create a client and connect to Redis.
const client = redis.createClient({
  host: 'localhost',
  port: 6379,
  // password: 'password',
});

// Run a Redis command, receive results in the callback.
client.set('hello', 'world', (err, reply) => {
  // Check if there was an error.
  if (err) {
    console.log(err);
    client.quit();
  } else {
    console.log(reply); // OK

    // No error from the first command, so run a second.
    client.get('hello', (getErr, getReply) => {
      // Check for error.
      if (getErr) {
        console.log(getErr);
      } else {
        console.log(getReply); // world
      }

      // All done, free up client resources and allow the script to quit.
      client.quit();
    });
  }
});
