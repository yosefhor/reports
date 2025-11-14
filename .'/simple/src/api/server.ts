import express from "express";
import jwt from "jsonwebtoken";
import { publishReport } from "../queue/publisher.js";
import { connectQueue } from "../queue/connection.js";
import { config } from "../config.js";
import { startConsumer } from "../queue/consumer.js";

const app = express();
app.use(express.json());

// יצירת טוקן לבדיקה
app.post("/login", (req, res) => {
  const token = jwt.sign({ user: "testUser" }, config.jwtSecret, { expiresIn: "1h" });
  res.json({ token });
});

// Middleware אימות
function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).send("Missing token");
  try {
    const token = header.split(" ")[1];
    jwt.verify(token, config.jwtSecret);
    next();
  } catch {
    res.status(403).send("Invalid token");
  }
}

// קבלת דו"ח
app.post("/reports", auth, async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).send("Missing text");
  const id = Math.random().toString(36).substring(2, 9);
  await publishReport(id, text);
  res.json({ reportId: id, status: "queued" });
});

// health check
app.get("/health", (_, res) => res.send("OK"));

connectQueue().then(() => {
  startConsumer();
  app.listen(config.port, () => console.log(`🚀 Server running on port ${config.port}`));
});
