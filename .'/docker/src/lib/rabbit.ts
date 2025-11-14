import amqp from 'amqplib';
import logger from './logger';


const RABBIT_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';


export let channel: amqp.Channel;
export let connection: amqp.Connection;


export const REPORT_QUEUE = 'report_queue';
export const REPORT_DLQ = 'report_dlq';


export async function connectRabbit() {
connection = await amqp.connect(RABBIT_URL);
channel = await connection.createChannel();


// תור ראשי
await channel.assertQueue(REPORT_QUEUE, { durable: true });
// DLQ
await channel.assertQueue(REPORT_DLQ, { durable: true });


logger.info('RabbitMQ connected');
}


export async function sendToQueue(queue: string, payload: any) {
if (!channel) throw new Error('RabbitMQ channel not initialized');
channel.sendToQueue(queue, Buffer.from(JSON.stringify(payload)), { persistent: true });
}