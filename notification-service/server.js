import "dotenv/config";
import express from "express";
import pool from "./db.js";
import { connectRabbitMQ } from "./consumer.js";
import { queries } from "./queries.js";

const app = express();
app.use(express.json());

// start RabbitMQ consumer
connectRabbitMQ();

// unread notifications
app.get("/notifications/unread/:user_id", async (req, res) => {
  try {
    const result = await pool.query(queries.getUnreadNotifications, [
      req.params.user_id,
    ]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// mark as read
app.post("/notifications/mark-read/:id", async (req, res) => {
  try {
    const result = await pool.query(queries.markAsRead, [req.params.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Notification not found" });
    }
    res.json({ message: "Notification marked as read" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// create notification (manual endpoint)
app.post("/notifications", async (req, res) => {
  try {
    const { user_id, type, content } = req.body;
    const result = await pool.query(queries.createNotification, [
      user_id,
      type,
      content,
    ]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Notification service running on port ${PORT}`);
});
