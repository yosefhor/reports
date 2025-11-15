import { createClient, RedisClientType } from 'redis';
import dotenv from 'dotenv';
dotenv.config();

let redisClient: RedisClientType | null = null;

export const getRedisClient = async (): Promise<RedisClientType> => {
    if (!redisClient) {
        redisClient = createClient({ url: process.env.REDIS_URL });

        redisClient.on('error', (err) => {
            console.error('❌ Redis error:', err);
        });

        await redisClient.connect();
        console.log('✔️ Redis connected');
    }

    return redisClient;
};
