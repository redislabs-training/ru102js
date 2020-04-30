const redis = require('redis');
const bluebird = require('bluebird');

// Promisify all the functions exported by node_redis.
bluebird.promisifyAll(redis);

// Redis key that the producer and consumer will use to share data.
const key = 'blockingdemo';

const startConsumer = async () => {
  let retryCount = 0;
  let done = false;

  const consumerClient = redis.createClient({
    port: 6379,
    host: '127.0.0.1',
    // password: 'password',
  });

  while (!done) {
    // Block for up to two seconds waiting on new item to
    // be added to the list.

    /* eslint-disable no-await-in-loop */
    const response = await consumerClient.brpopAsync(key, 2);
    /* eslint-enable */

    if (response === null) {
      console.log('consumer: queue was empty.');
      retryCount += 1;

      if (retryCount === 5) {
        done = true;
        console.log('consumer: shutting down.');
        consumerClient.quit();
      }
    } else {
      // Response is an array of keyname, value.  Example:
      // [blockingdemo, 0]
      console.log(`consumer: popped ${response[1]}.`);
      retryCount = 0;
    }
  }
};

const startProducer = async () => {
  let n = 1;

  const producerClient = redis.createClient({
    port: 6379,
    host: '127.0.0.1',
    // password: 'password',
  });

  // Run the producer at one second intervals.
  const producerInterval = setInterval(async () => {
    console.log(`producer: pushing ${n}.`);

    /* eslint-disable no-await-in-loop */
    await producerClient.lpushAsync(key, n);
    /* eslint-enable */

    n += 1;

    // Stop after producing 20 numbers.
    if (n > 20) {
      console.log('producer: shutting down.');
      clearInterval(producerInterval);
      producerClient.quit();
    }
  }, 1000);
};

// Start up both the consumer and producer.
startConsumer();

// Start producer five seconds later.
setTimeout(() => {
  startProducer();
}, 5000);
