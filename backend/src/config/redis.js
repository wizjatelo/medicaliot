import Redis from 'ioredis';

let redisClient;

export const initRedis = async () => {
  redisClient = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: null,
  });

  redisClient.on('error', (err) => {
    console.error('Redis error:', err);
  });

  return redisClient;
};

export const getRedis = () => {
  if (!redisClient) {
    throw new Error('Redis not initialized');
  }
  return redisClient;
};

export default redisClient;
