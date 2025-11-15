import dotenv from 'dotenv';
dotenv.config();

import { Worker } from 'node:worker_threads';
import { getRedisClient } from './services/redis.js';
import { getRabbitChannel } from './services/rabbit.js';

const MAX_THREADS = parseInt(process.env.MAX_THREADS || '3', 10);
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES || '3', 10);
const QUEUE = 'report_queue';
const DLQ_QUEUE = process.env.DLQ_QUEUE || 'report_dlq';

const redis = await getRedisClient();
const taskQueue: any[] = [];
const activeWorkers: Worker[] = [];

const channel = await getRabbitChannel();
await channel.assertQueue(QUEUE);
await channel.assertQueue(DLQ_QUEUE);

console.log('Worker started');

channel.consume(QUEUE, async (msg) => {
    if (!msg) return;

    const data = JSON.parse(msg.content.toString());
    data.retries = 0; // סופסוף להוסיף retries
    taskQueue.push(data);
    processQueue();

    channel.ack(msg);
});

function processQueue() {
    while (taskQueue.length > 0 && activeWorkers.length < MAX_THREADS) {
        const task = taskQueue.shift();
        const worker = new Worker('./threads/processReport.js', { workerData: task });

        activeWorkers.push(worker);
        redis.hSet(`report:${task.id}`, { status: 'processing', progress: '0' });

        worker.on('message', async ({ id, result }) => {
            await redis.hSet(`report:${id}`, {
                status: 'done',
                totalWords: result.totalWords,
                uniqueWords: result.uniqueWords,
                progress: '100'
            });
        });

        worker.on('error', async (err) => {
            console.error('Worker error', err);
            if (task.retries < MAX_RETRIES) {
                task.retries++;
                taskQueue.push(task); // ניסיון חוזר
                await redis.hSet(`report:${task.id}`, {
                    status: 'retrying',
                    progress: `${Math.floor((task.retries / MAX_RETRIES) * 100)}`
                });
            } else {
                // שולח ל-DLQ
                await channel.sendToQueue(DLQ_QUEUE, Buffer.from(JSON.stringify(task)));
                await redis.hSet(`report:${task.id}`, { status: 'failed', progress: '100', error: err.message });
            }
        });

        worker.on('exit', () => {
            const index = activeWorkers.indexOf(worker);
            if (index !== -1) activeWorkers.splice(index, 1);
            processQueue();
        });
    }
}
