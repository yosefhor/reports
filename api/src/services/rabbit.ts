import amqplib, { Channel, Connection } from 'amqplib';

let connection: Connection;
let channel: Channel;

export async function getRabbitChannel(): Promise<Channel> {
    if (!channel) {
        connection = await amqplib.connect(process.env.RABBITMQ_URL as string);
        channel = await connection.createChannel();
        console.log('RabbitMQ connected');
    }
    return channel;
}
