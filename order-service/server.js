import express from "express";
import axios from "axios";
import { connectRabbitMQ, getChannel } from "./rabbitmq.js";
import { startOrderScheduler } from "./orderScheduler.js";
import { createOrder, getOrdersByUser } from "./orderService.js";
import "dotenv/config";

const app = express();
app.use(express.json());

// Initialize RabbitMQ
(async () => {
  try {
    await connectRabbitMQ();
    const channel = getChannel();
    await channel.assertQueue(
      process.env.ORDER_PLACED_QUEUE || "order_placed_queue",
      { durable: true }
    );
    await channel.assertQueue(
      process.env.ORDER_UPDATES_QUEUE || "order_updates_queue",
      { durable: true }
    );
    startOrderScheduler();
  } catch (error) {
    console.error("Failed to initialize:", error.message);
    process.exit(1);
  }
})();

// order placed event
app.post("/order", async (req, res) => {
  try {
    const { userId } = req.body;

    try {
      await axios.get(`${process.env.USER_SERVICE_URL}/user/${userId}`);
    } catch (error) {
      if (error.response?.status === 404) {
        return res.status(400).json({ error: "User does not exist" });
      }
      throw new Error("User service unavailable");
    }

    const order = await createOrder(userId);

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

    res.status(201).json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/orders/:userId", async (req, res) => {
  try {
    const orders = await getOrdersByUser(req.params.userId);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
  console.log(`Order service running on port ${PORT}`);
});
