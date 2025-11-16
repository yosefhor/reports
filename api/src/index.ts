import express from 'express';
import dotenv from 'dotenv';
import reportRouter from './routes/report.js';
import authRouter from './routes/auth.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { getRedisClient } from './services/redis.js';
import { getRabbitChannel } from './services/rabbit.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/reports', reportRouter);
app.use('/auth', authRouter);

const checkHealthy = async () => {
    try {
        const redis = await getRedisClient();
        await redis.ping();

        const rabbit = await getRabbitChannel();
        await rabbit.assertQueue('report_queue');

        return true;
    } catch (err) {
        console.error("❌ Health check failed:", err);
        return false;
    }
};

app.get('/health', async (_req, res) => {
    const healthy = await checkHealthy();
    if (!healthy) return res.status(500).json({ status: 'error' });
    res.json({ status: 'ok' });
});

const port = process.env.PORT || 3000;

const runServer = async () => {
    const healthy = await checkHealthy();
    if (!healthy) {
        console.error("❌ Cannot start server — Rabbit or Redis unavailable");
        process.exit(1);
    }

    app.listen(port, () => console.log(`✔️ API running on port ${port}`));
};

runServer();
