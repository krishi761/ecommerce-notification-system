import pg from "pg";
const { Pool } = pg;
import "dotenv/config";

const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

// Create notifications table
(async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      type VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      sent_at TIMESTAMP DEFAULT NOW(),
      read BOOLEAN DEFAULT FALSE
    )
  `);
})();

export default pool;
