import { runAssistantTests } from "./assistant-tests";

async function main() {
  try {
    await runAssistantTests();
    process.exit(0);
  } catch (error) {
    console.error("Assistant tests failed:", error);
    process.exit(1);
  }
}

main();
