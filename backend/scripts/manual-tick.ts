import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import { simulatorService } from "../src/simulator/simulator.service";
import { disconnectPrisma } from "../src/config/prisma";

async function runManualTick() {
  console.log("=================================================");
  console.log("POLARIS Simulator: Manual Simulation Cycle CLI");
  console.log("=================================================");

  try {
    const summary = await simulatorService.executeTick(true);
    console.log("✅ Simulation tick executed and persisted successfully!");
    console.log(JSON.stringify(summary, null, 2));
  } catch (error) {
    console.error("❌ Failed to execute manual simulation tick:", error);
    process.exit(1);
  } finally {
    await disconnectPrisma();
  }
}

runManualTick();
