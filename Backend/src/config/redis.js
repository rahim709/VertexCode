const { createClient } = require('redis');

let redisClient;

function getRedisClient() {
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  redisClient = createClient({
    username: 'default',
    password: process.env.REDIS_PASS,
    socket: {
      host: process.env.REDIS_HOST_ID,
      port: Number(process.env.REDIS_PORT),
    },
  });

  redisClient.on('connect', () => {
    console.log('Redis connected');
  });

  redisClient.on('error', (err) => {
    console.error('Redis error:', err);
  });

  return redisClient;
}

module.exports = getRedisClient;
