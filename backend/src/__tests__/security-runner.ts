import { runSecurityTests } from "./security-tests";
import { prisma } from "../config/prisma";

runSecurityTests()
  .then(() => {
    console.log("Phase 13 Security Suite executed successfully.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Phase 13 Security Suite failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
