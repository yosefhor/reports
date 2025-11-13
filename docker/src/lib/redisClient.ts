import { createClient } from 'redis';
import logger from './logger';


const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
export const client = createClient({ url: redisUrl });


client.on('error', (err) => logger.error({ err }, 'Redis client error'));


export async function connectRedis() {
if (!client.isOpen) await client.connect();
}


// עזרי סטטוס
export async function createReportRecord(id: string) {
await client.hSet(`report:${id}`, {
status: 'queued',
progress: '0',
retry_count: '0'
});
}


export async function setStatus(id: string, status: string) {
await client.hSet(`report:${id}`, { status });
}


export async function setProgress(id: string, progress: number) {
await client.hSet(`report:${id}`, { progress: progress.toString() });
}


export async function incrementRetry(id: string) {
return await client.hIncrBy(`report:${id}`, 'retry_count', 1);
}


export async function setResult(id: string, result: any) {
await client.hSet(`report:${id}`, {
status: 'completed',
totalWords: result.totalWords?.toString() || '0',
uniqueWords: result.uniqueWords?.toString() || '0',
progress: '100'
});
}


export async function setFailed(id: string, errorMsg?: string) {
await client.hSet(`report:${id}`, { status: 'failed', error: errorMsg || 'failed' });
}


export async function getReport(id: string) {
const data = await client.hGetAll(`report:${id}`);
return Object.keys(data).length ? data : null;