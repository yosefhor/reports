import amqp from "amqplib";
import { config } from "../config";

let channel: amqp.Channel;

export async function connectQueue() {
  const connection = await amqp.connect(config.rabbitUrl);
  channel = await connection.createChannel();
  await channel.assertQueue("reports", { durable: true });
  console.log("✅ Connected to RabbitMQ");
  return channel;
}

export function getChannel() {
  if (!channel) throw new Error("Channel not initialized");
  return channel;
}
