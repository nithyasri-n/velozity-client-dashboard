import cron from "node-cron";
import { prisma } from "../lib/prisma";

export function startOverdueJob() {
  cron.schedule("*/5 * * * *", async () => {
    try {
      const now = new Date();

      const result = await prisma.task.updateMany({
        where: {
          dueDate: {
            lt: now,
          },
          status: {
            not: "DONE",
          },
        },
        data: {
          isOverdue: true,
        },
      });

      console.log(
        `[CRON] Overdue check completed. Updated: ${result.count}`
      );
    } catch (error) {
      console.error("[CRON] Overdue job failed:", error);
    }
  });

  console.log("[CRON] Overdue job started");
}