import { getChannel } from "./rabbitmq.js";
import { fetchUserPreferences } from "./userService.js";
import {
  generateRecommendation,
  storeRecommendation,
} from "./recommendationService.js";
import "dotenv/config";

const QUEUES = {
  ORDER_PLACED_QUEUE: process.env.ORDER_PLACED_QUEUE || "order_placed_queue",
  RECOMMENDATIONS: process.env.RECOMMEND_QUEUE || "recommendations_queue",
};

export async function startConsuming() {
  try {
    const channel = getChannel();
    await channel.assertQueue(QUEUES.RECOMMENDATIONS, { durable: true });
    await channel.assertQueue(QUEUES.ORDER_PLACED_QUEUE, { durable: true });
    await channel.prefetch(1);

    channel.consume(QUEUES.ORDER_PLACED_QUEUE, processOrder);
  } catch (error) {
    console.error("Error starting consumer:", error.message);
  }
}

async function processOrder(msg) {
  const channel = getChannel();
  try {
    const message = JSON.parse(msg.content.toString());

    if (message.event !== "ORDER_PLACED") {
      throw new Error(`Unhandled event type: ${message.event}`);
    }

    const userId = parseInt(message.data.userId, 10);
    if (isNaN(userId)) {
      throw new Error("Invalid userId in ORDER_PLACED event");
    }

    const preferences = await fetchUserPreferences(userId);
    if (!preferences?.recommendations) {
      console.log(`User ${userId} has disabled recommendations`);
      return channel.ack(msg);
    }

    const recommendation = await generateRecommendation(userId);
    await storeRecommendation(recommendation);
    await publishRecommendation(recommendation);

    console.log(`Generated recommendation for user ${userId}`);
    channel.ack(msg);
  } catch (error) {
    console.error("Error processing order:", error.message);
    channel.nack(msg);
  }
}

export async function publishRecommendation(recommendation) {
  const channel = getChannel();
  const message = {
    event: "NEW_RECOMMENDATION",
    data: {
      userId: recommendation.userId,
      productId: recommendation.productId,
      productName: recommendation.productName,
      content: `Recommended product: ${recommendation.productName} (ID: ${recommendation.productId})`,
    },
  };
  try {
    await channel.assertQueue(QUEUES.RECOMMENDATIONS, { durable: true });
    channel.sendToQueue(
      QUEUES.RECOMMENDATIONS,
      Buffer.from(JSON.stringify(message)),
      { persistent: true }
    );
  } catch (error) {
    console.error("Error publishing recommendation:", error.message);
  }
}
