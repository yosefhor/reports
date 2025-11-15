import amqplib, { Connection, Channel } from 'amqplib';
import dotenv from 'dotenv';
dotenv.config();

let connection: any | null = null;
let channel: Channel | null = null;

export const getRabbitChannel = async (): Promise<Channel> => {
    if (!connection) {
        connection = await amqplib.connect(process.env.RABBITMQ_URL as string);

        connection.on("error", (err:any) => {
            console.error("❌ RabbitMQ connection error:", err);
            connection = null;
            channel = null;
        });

        connection.on("close", () => {
            console.warn("⚠️ RabbitMQ connection closed");
            connection = null;
            channel = null;
        });

        console.log("✔️ RabbitMQ connected");
    }

    if (!channel) {
        channel = await connection.createChannel();
        console.log("📦 RabbitMQ channel created");
    }

    return channel as Channel;
};
