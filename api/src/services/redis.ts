import { createClient, RedisClientType } from 'redis';

let redisClient: RedisClientType;

export function getRedisClient(): RedisClientType {
    if (!redisClient) {
        redisClient = createClient({
            url: process.env.REDIS_URL,
        });
        redisClient.on('error', (err) => console.error('Redis Error', err));
        redisClient.connect().then(() => console.log('Redis connected'));
    }
    return redisClient;
}
