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

(async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        status VARCHAR(255) NOT NULL
      )
    `);
  } catch (error) {
    console.error("Database initialization error:", error);
  }
})();

export default pool;
