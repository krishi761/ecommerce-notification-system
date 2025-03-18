import express from "express";
import pool from "./db.js";
import { startConsuming } from "./consumer.js";
import { connectRabbitMQ } from "./rabbitmq.js";
import "dotenv/config";

const app = express();
app.use(express.json());

(async () => {
  try {
    await connectRabbitMQ();
    await startConsuming();
  } catch (error) {
    console.error("Failed to initialize RabbitMQ:", error.message);
    process.exit(1);
  }
})();

// user recommendations
app.get("/recommendations/:user_id", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, 
        product_id AS "productId", 
        reason, 
        user_id AS "userId" 
        FROM recommendations WHERE user_id = $1`,
      [req.params.user_id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`Recommendation service running on port ${PORT}`);
});
