const redis = require('redis');
const bluebird = require('bluebird');

// Promisify all the functions exported by node_redis.
bluebird.promisifyAll(redis);

const replyErrorExamples = async () => {
  const client = redis.createClient({
    port: 6379,
    host: '127.0.0.1',
    // password: 'password',
  });

  const key = 'replyErrorTest';

  // No error, this command will work.
  await client.setAsync(key, 'test');

  // Wrong number of arguments for command.
  // Show this without try/catch for unhandled promise rejection...
  try {
    console.log('Calling set with missing parameter.');
    await client.setAsync(key);
  } catch (setErr) {
    console.log(setErr);
  }

  console.log('----------');

  // No error, this command will work.
  await client.setAsync(key, 'test');

  try {
    console.log('Incrementing a key that holds a string value.');
    await client.incrAsync(key);
  } catch (incrErr) {
    console.log(incrErr);
  }

  console.log('----------');

  // Error in pipeline... (transaction produces same behavior).
  try {
    console.log('Bad command as part of a pipeline.');
    const pipeline = client.batch();
    // This command will succeed.
    pipeline.set(key, 'test');

    // This command will fail.
    pipeline.incr(key);

    // This command will succeed.
    pipeline.get(key);

    const results = await pipeline.execAsync();

    console.log('Results:');
    console.log(results);
  } catch (pipelineErr) {
    // The error will not appear here.
    console.log('Caught pipeline error:');
    console.log(pipelineErr);
  }

  console.log('----------');

  client.quit();
};

try {
  replyErrorExamples();
} catch (e) {
  console.log('Caught exception:');
  console.log(e);
}
