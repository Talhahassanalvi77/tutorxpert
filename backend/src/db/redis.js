import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

let redisClient = null;

export async function connectRedis() {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    redisClient.on('error', (err) => console.error('Redis Client Error', err));
    redisClient.on('connect', () => console.log('✅ Redis connected'));

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    console.error('❌ Redis connection failed:', error.message);
    throw error;
  }
}

export function getRedisClient() {
  return redisClient;
}

export async function cacheSet(key, value, ttl = 3600) {
  if (!redisClient) return;
  await redisClient.setEx(key, ttl, JSON.stringify(value));
}

export async function cacheGet(key) {
  if (!redisClient) return null;
  const data = await redisClient.get(key);
  return data ? JSON.parse(data) : null;
}

export async function cacheDelete(key) {
  if (!redisClient) return;
  await redisClient.del(key);
}

export default redisClient;
