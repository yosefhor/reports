import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import reportRouter from './routes/report.js';
import { getRedisClient } from './services/redis.js';
import { getRabbitChannel } from './services/rabbit.js';

dotenv.config();

const app = express();
app.use(express.json());

app.use('/reports', reportRouter);

app.get('/health', async (_req: Request, res: Response) => {
  try {
    const redisClient = getRedisClient();
    await redisClient.ping();

    const channel = await getRabbitChannel();
    await channel.assertQueue('report_queue');

    res.json({ status: 'ok' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: (err as Error).message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`API server running on port ${port}`);
});
