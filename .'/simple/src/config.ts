import dotenv from "dotenv";
dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  jwtSecret: process.env.JWT_SECRET || "default_secret",
  rabbitUrl: process.env.RABBITMQ_URL || "amqp://localhost"
};
