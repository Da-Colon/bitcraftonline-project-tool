import Redis from "ioredis";

const redis = process.env.REDIS_URL 
  ? new Redis(process.env.REDIS_URL)
  : null;

export const cache = {
  async get<T = any>(key: string): Promise<T | null> {
    if (!redis) return null;
    try {
      const value = await redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error("Cache get error:", error);
      return null;
    }
  },
  
  async set(key: string, value: any, ttl?: number): Promise<void> {
    if (!redis) return;
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await redis.setex(key, ttl, serialized);
      } else {
        await redis.set(key, serialized);
      }
    } catch (error) {
      console.error("Cache set error:", error);
    }
  },
  
  async del(key: string): Promise<void> {
    if (!redis) return;
    try {
      await redis.del(key);
    } catch (error) {
      console.error("Cache delete error:", error);
    }
  },
};
