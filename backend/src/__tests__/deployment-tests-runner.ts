import { runDeploymentTests } from "./deployment-tests";
import { prisma } from "../config/prisma";

async function main() {
  try {
    await runDeploymentTests();
    console.log("✔ Phase 15 Deployment Test Suite Completed Successfully.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Phase 15 Deployment Test Suite Failed:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
