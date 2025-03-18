import pool from "./db.js";

const DUMMY_PRODUCTS = [
  { product_id: 201, name: "Gaming Chair" },
  { product_id: 202, name: "Mechanical Keyboard" },
  { product_id: 203, name: "HD Webcam" },
  { product_id: 204, name: "Ergonomic Desk" },
  { product_id: 205, name: "Wireless Charger" },
  { product_id: 206, name: "Smartwatch" },
  { product_id: 207, name: "Fitness Tracker" },
  { product_id: 208, name: "Portable Projector" },
  { product_id: 209, name: "Action Camera" },
  { product_id: 210, name: "Drone with Camera" },
];

export async function generateRecommendation(userId) {
  if (!userId) {
    throw new Error("User ID is required");
  }
  const product =
    DUMMY_PRODUCTS[Math.floor(Math.random() * DUMMY_PRODUCTS.length)];
  return {
    userId,
    productId: product.product_id,
    productName: product.name,
    reason: "Based on your recent activity",
  };
}

export async function storeRecommendation(recommendation) {
  if (!recommendation || !recommendation.userId || !recommendation.productId) {
    throw new Error("Invalid recommendation object");
  }
  const userCheck = await pool.query("SELECT id FROM users WHERE id = $1", [
    recommendation.userId,
  ]);
  if (userCheck.rowCount === 0) {
    throw new Error(`User ${recommendation.userId} does not exist`);
  }
  const result = await pool.query(
    `INSERT INTO recommendations (user_id, product_id, reason)
         VALUES ($1, $2, $3)
         RETURNING *`,
    [recommendation.userId, recommendation.productId, recommendation.reason]
  );
  return result.rows[0];
}
