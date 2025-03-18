import amqp from "amqplib";
import axios from "axios";
import { queries } from "./queries.js";
import pool from "./db.js";
import "dotenv/config";

const USER_SERVICE_URL =
  process.env.USER_SERVICE_URL || "http://user-service:3001";

const RABBITMQ_HOST = process.env.RABBITMQ_HOST || "rabbitmq";
const RABBITMQ_USER = process.env.RABBITMQ_USER || "usermq";
const RABBITMQ_PASS = process.env.RABBITMQ_PASS || "passwordmq";
const QUEUES = {
  RECOMMENDATIONS: process.env.RECOMMEND_QUEUE || "recommendations_queue",
  ORDER_UPDATES: process.env.ORDER_UPDATES_QUEUE || "order_updates_queue",
  ORDER_PLACED: process.env.ORDER_PLACED_QUEUE || "order_placed_queue",
};

let channel = null;

async function fetchUserPreferences(userId) {
  try {
    const response = await axios.get(`${USER_SERVICE_URL}/user/${userId}`);
    return response.data.preferences || {};
  } catch (error) {
    console.error("Error fetching user preferences:", error.message);
    return null;
  }
}

async function handleOrderPlaced(data) {
  const { userId, orderId } = data;
  const preferences = await fetchUserPreferences(userId);
  if (!preferences?.orderUpdates) {
    console.log(`User ${userId} has disabled order updates`);
    return;
  }
  const notification = {
    userId,
    type: "orderUpdates",
    content: `Order ${orderId} has been placed successfully!`,
  };

  const result = await pool.query(queries.createNotification, [
    notification.userId,
    notification.type,
    notification.content,
  ]);

  console.log(
    `Created order placed notification ${result.rows[0].id} for user ${userId}`
  );
}

async function handleOrderStatusUpdate(data) {
  const { userId, status, orderId } = data;
  const preferences = await fetchUserPreferences(userId);
  if (!preferences?.orderUpdates) {
    console.log(`User ${userId} has disabled order updates`);
    return;
  }
  const notification = {
    userId,
    type: "orderUpdates",
    content: `Order ${orderId} status updated to ${status}`,
  };

  const result = await pool.query(queries.orderStatusUpdate, [
    notification.userId,
    notification.type,
    notification.content,
  ]);
  console.log(
    `created order update notification ${result.rows[0].id} for user ${data.userId}`
  );
}

async function handleNewRecommendation(data) {
  const { userId, content } = data;
  const preferences = await fetchUserPreferences(userId);
  if (!preferences?.recommendations) {
    console.log(`User ${userId} has disabled recommendations`);
    return;
  }
  const notification = {
    userId,
    type: "recommendation",
    content,
  };
  const result = await pool.query(queries.newRecommendation, [
    notification.userId,
    notification.type,
    notification.content,
  ]);
  console.log(
    `Created recommendation notification ${result.rows[0].id} for user ${data.userId}`
  );
}

async function handleMessage(channel, msg) {
  try {
    const message = JSON.parse(msg.content.toString());
    const { event, data } = message;

    switch (event) {
      case "ORDER_PLACED":
        await handleOrderPlaced(data);
        break;
      case "ORDER_STATUS_UPDATE":
        await handleOrderStatusUpdate(data);
        break;
      case "NEW_RECOMMENDATION":
        await handleNewRecommendation(data);
        break;
      default:
        console.warn(`Unhandled event type: ${event}`);
        channel.nack(msg);
        return;
    }

    channel.ack(msg);
  } catch (error) {
    console.error("Error processing message:", error);
    channel.nack(msg);
  }
}

export async function connectRabbitMQ() {
  try {
    const conn = await amqp.connect({
      hostname: RABBITMQ_HOST,
      username: RABBITMQ_USER,
      password: RABBITMQ_PASS,
    });

    channel = await conn.createChannel();
    await channel.assertQueue(QUEUES.RECOMMENDATIONS, { durable: true });
    await channel.assertQueue(QUEUES.ORDER_UPDATES, { durable: true });
    await channel.assertQueue(QUEUES.ORDER_PLACED, { durable: true });

    channel.consume(QUEUES.ORDER_PLACED, (msg) => handleMessage(channel, msg));
    channel.consume(QUEUES.ORDER_UPDATES, (msg) => handleMessage(channel, msg));
    channel.consume(QUEUES.RECOMMENDATIONS, (msg) =>
      handleMessage(channel, msg)
    );

    console.log("Connected to RabbitMQ");
  } catch (error) {
    console.error("RabbitMQ connection error:", error.message);
    setTimeout(connectRabbitMQ, 5000);
  }
}
