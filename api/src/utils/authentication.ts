import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Request, Response, NextFunction } from 'express';
import { getRedisClient } from '../services/redis.js';

const ACCESS_EXPIRES = "10m";
const REFRESH_EXPIRES = "7d";

const createAccessToken = (userId: string) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: ACCESS_EXPIRES });
};

const createRefreshToken = (userId: string) => {
    return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET!, { expiresIn: REFRESH_EXPIRES });
};

export const register = async (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (!username || !password)
        return res.status(400).json({ error: "Missing fields" });

    const redis = await getRedisClient();
    const exists = await redis.hExists("users", username);

    if (exists) return res.status(409).json({ error: "User already exists" });

    const hashed = await bcrypt.hash(password, 10);
    await redis.hSet("users", username, hashed);

    return res.json({ message: "User registered successfully" });
};


export const login = async (req: Request, res: Response) => {
    const { username, password } = req.body;
    if (!username || !password)
        return res.status(400).json({ error: "Missing fields" });

    const redis = await getRedisClient();
    const hashed = await redis.hGet("users", username);

    if (!hashed) return res.status(404).json({ error: "User not found" });

    const valid = await bcrypt.compare(password, hashed);
    if (!valid) return res.status(403).json({ error: "Invalid credentials" });

    const accessToken = createAccessToken(username);
    const refreshToken = createRefreshToken(username);

    await redis.hSet("refreshTokens", username, refreshToken);

    return res.json({ accessToken, refreshToken });
};


export const refreshToken = async (req: Request, res: Response) => {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: "Missing refresh token" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as any;
        const redis = await getRedisClient();
        const savedToken = await redis.hGet("refreshTokens", decoded.userId);

        if (token !== savedToken) return res.status(401).json({ error: "Invalid refresh token" });

        const accessToken = createAccessToken(decoded.userId);

        return res.json({ accessToken });
    } catch {
        return res.status(403).json({ error: "Invalid or expired refresh token" });
    }
};


export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    if (!header) return res.status(401).json({ error: "Missing token" });

    const token = header.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        (req as any).userId = decoded.userId;
        next();
    } catch {
        return res.status(403).json({ error: "Invalid or expired token" });
    }
};

export const getUsernameFromToken = (req: Request): string | null => {
    const header = req.headers.authorization;
    if (!header) return null;
    const token = header.split(" ")[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        return decoded;
    } catch {
        return null;
    }
};
