import pool from "./db.js";
import { getChannel } from "./rabbitmq.js";

const OrderStatus = {
  PLACED: "placed",
  SHIPPED: "shipped",
  DELIVERED: "delivered",
};

export async function createOrder(userId) {
  const result = await pool.query(
    `INSERT INTO orders (user_id, status)
     VALUES ($1, $2)
     RETURNING id, user_id AS "userId", status `,
    [userId, OrderStatus.PLACED]
  );
  const order = result.rows[0];

  //ORDER_PLACED event
  const channel = getChannel();
  const message = {
    event: "ORDER_PLACED",
    data: {
      orderId: order.id,
      userId: order.userId,
      status: order.status,
    },
  };

  channel.sendToQueue(
    process.env.ORDER_PLACED_QUEUE || "order_placed_queue",
    Buffer.from(JSON.stringify(message)),
    { persistent: true }
  );

  return order;
}

export async function getOrdersByUser(userId) {
  const result = await pool.query(
    `SELECT id, 
     status, 
     user_id AS "userId" 
     FROM orders WHERE user_id = $1`,
    [userId]
  );
  return result.rows;
}

export async function updateOrderStatuses() {
  const result = await pool.query(
    `UPDATE orders
       SET status = CASE
         WHEN status = $1::VARCHAR THEN $2::VARCHAR
         WHEN status = $2::VARCHAR THEN $3::VARCHAR
         ELSE status
       END
       WHERE status != $3::VARCHAR
       RETURNING *`,
    [OrderStatus.PLACED, OrderStatus.SHIPPED, OrderStatus.DELIVERED]
  );
  return result.rows;
}
