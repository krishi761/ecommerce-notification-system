import amqp from "amqplib";
import "dotenv/config";

const RABBITMQ_HOST = process.env.RABBITMQ_HOST;
const RABBITMQ_USER = process.env.RABBITMQ_USER || "usermq";
const RABBITMQ_PASS = process.env.RABBITMQ_PASS || "passwordmq";

let channel = null;

export async function connectRabbitMQ() {
  try {
    const conn = await amqp.connect({
      hostname: RABBITMQ_HOST,
      username: RABBITMQ_USER,
      password: RABBITMQ_PASS,
    });

    channel = await conn.createChannel();
    console.log("Connected to RabbitMQ");
    return channel;
  } catch (error) {
    console.error("RabbitMQ connection error:", error.message);
    throw error;
  }
}

export function getChannel() {
  if (!channel) {
    throw new Error("RabbitMQ channel is not initialized");
  }
  return channel;
}
