import { runDemoTests } from "./demo-tests";

async function main() {
  try {
    await runDemoTests();
    console.log("✔ Phase 16 SIH Demo Test Suite Completed Successfully.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Phase 16 SIH Demo Test Suite Failed:", err);
    process.exit(1);
  }
}

main();
