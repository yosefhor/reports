import { Router } from 'express';
import multer from 'multer';
import { getRabbitChannel } from '../services/rabbit.js';
import { getRedisClient } from '../services/redis.js';
import { randomUUID } from 'crypto';
import { requireAuth, getUsernameFromToken } from '../utils/authentication.js';

const router = Router();
const upload = multer({ limits: { fileSize: 1 * 1024 * 1024 } });

router.post('/upload', requireAuth, upload.single('report'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Missing file' });

        const text = req.file.buffer.toString('utf8');
        if (text.trim().length === 0)
            return res.status(400).json({ error: 'File is empty' });

        const jobId = randomUUID();
        const username = getUsernameFromToken(req);
        const channel = await getRabbitChannel();

        const payload = {
            jobId,
            user: username,
            createdAt: new Date().toISOString(),
            text
        };

        await channel.assertQueue('report_queue');
        channel.sendToQueue('report_queue', Buffer.from(JSON.stringify(payload)));

        res.status(201).json({ jobId, status: 'queued' });
    } catch (err) {
        console.error("Upload error:", err);
        res.status(500).json({ error: 'Internal error' });
    }
});

router.get('/:id', requireAuth, async (req, res) => {
    const username = getUsernameFromToken(req);
    console.log(`username: ${username}`);
    const jobId = req.params.id;

    const redis = await getRedisClient();
    const result = await redis.hGetAll(jobId);

    if (!result || Object.keys(result).length === 0) {
        return res.status(404).json({ error: 'Report not found' });
    }

    res.json(result);
});

export default router;
