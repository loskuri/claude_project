import Redis from 'ioredis';
import { env } from './env.js';

function normalizeRedisUrl(rawUrl: string): string {
  // Docker exposes Redis on the host's `127.0.0.1`, but `localhost` may resolve to `::1`
  // (IPv6) on macOS, which can lead to `ECONNREFUSED ::1:6379`.
  try {
    const u = new URL(rawUrl);
    if (u.hostname === 'localhost') {
      u.hostname = '127.0.0.1';
    }
    return u.toString();
  } catch {
    // If parsing fails for any reason, fall back to the original value.
    return rawUrl;
  }
}

export const redis = new Redis(normalizeRedisUrl(env.REDIS_URL), {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false,
});

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

redis.on('connect', () => {
  if (env.NODE_ENV === 'development') {
    console.log('✅ Redis connected');
  }
});
