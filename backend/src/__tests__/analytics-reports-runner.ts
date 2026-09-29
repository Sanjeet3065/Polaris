import { runAnalyticsReportsTests } from "./analytics-reports-tests";
import { prisma } from "../config/prisma";

runAnalyticsReportsTests()
  .catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
