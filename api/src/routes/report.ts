import { Router, Request, Response } from 'express';
import { getRabbitChannel } from '../services/rabbit.js';
import { randomUUID } from 'crypto';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Missing report text' });
    }

    const id = randomUUID();
    const channel = await getRabbitChannel();
    const queue = 'report_queue';

    await channel.assertQueue(queue);
    channel.sendToQueue(queue, Buffer.from(JSON.stringify({ id, text })));

    res.status(201).json({ reportId: id, status: 'queued' });
});

export default router;
