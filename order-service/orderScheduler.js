import cron from "node-cron";
import { updateOrderStatuses } from "./orderService.js";
import { getChannel } from "./rabbitmq.js";

export function startOrderScheduler() {
  cron.schedule("*/30 * * * * *", async () => {
    try {
      const updatedOrders = await updateOrderStatuses();
      const channel = getChannel();

      for (const order of updatedOrders) {
        const message = {
          event: "ORDER_STATUS_UPDATE",
          data: {
            orderId: order.id,
            userId: order.user_id,
            status: order.status,
          },
        };

        channel.sendToQueue(
          process.env.ORDER_UPDATES_QUEUE || "order_updates_queue",
          Buffer.from(JSON.stringify(message)),
          { persistent: true }
        );
      }
    } catch (error) {
      console.error("Scheduler error:", error.message);
    }
  });
}
