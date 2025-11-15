import amqplib from 'amqplib';
import dotenv from 'dotenv';
dotenv.config();
let connection = null;
let channel = null;
export const getRabbitChannel = async () => {
    if (!connection) {
        connection = await amqplib.connect(process.env.RABBITMQ_URL);
        connection.on("error", (err) => {
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
    return channel;
};
